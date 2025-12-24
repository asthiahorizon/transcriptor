from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import subprocess
import json
import aiofiles
import httpx
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'transcriptoria-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
SUBSCRIPTION_PRICE_CHF = 10.00
SUBSCRIPTION_CURRENCY = 'chf'

# Infomaniak AI Config
INFOMANIAK_PRODUCT_ID = os.environ.get('INFOMANIAK_PRODUCT_ID', '100602')
INFOMANIAK_API_KEY = os.environ.get('INFOMANIAK_API_KEY')
INFOMANIAK_API_BASE = f"https://api.infomaniak.com/1/ai/{INFOMANIAK_PRODUCT_ID}"

# Admin emails (can be configured)
ADMIN_EMAILS = ['admin@transcriptoria.com', 'admin@asthia.ch']

# File storage paths
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR = ROOT_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="Transcriptor API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    is_admin: bool = False
    is_subscribed: bool = False
    subscription_end: Optional[str] = None
    created_at: str

class UserListResponse(BaseModel):
    id: str
    email: str
    name: str
    is_admin: bool
    is_vip: bool = False
    is_subscribed: bool
    subscription_end: Optional[str]
    created_at: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    created_at: str
    updated_at: str

class SubtitleSegment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    start_time: float
    end_time: float
    original_text: str
    translated_text: Optional[str] = ""

class SubtitleUpdate(BaseModel):
    segments: List[SubtitleSegment]

class SubtitleSettings(BaseModel):
    font_family: str = "Arial"
    font_size: int = 24
    font_color: str = "#FFFFFF"
    background_color: str = "#000000"
    background_opacity: float = 0.7
    position: str = "bottom"

class VideoResponse(BaseModel):
    id: str
    project_id: str
    filename: str
    original_filename: str
    duration: Optional[float] = None
    status: str
    progress: int = 0
    source_language: Optional[str] = None
    target_language: Optional[str] = None
    subtitle_settings: Optional[dict] = None
    created_at: str
    updated_at: str

class TranslateRequest(BaseModel):
    target_language: str

class CheckoutRequest(BaseModel):
    origin_url: str

class CheckoutResponse(BaseModel):
    url: str
    session_id: str

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(optional_security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        return user
    except:
        return None

def is_admin(user: dict) -> bool:
    return user.get('is_admin', False) or user.get('email') in ADMIN_EMAILS

def is_vip(user: dict) -> bool:
    return user.get('is_vip', False)

def has_active_subscription(user: dict) -> bool:
    """Check if user has a paid active subscription (not VIP/admin bypass)"""
    if not user.get('is_subscribed'):
        return False
    if is_vip(user):
        return False  # VIP is not a paid subscription
    sub_end = user.get('subscription_end')
    if not sub_end:
        return False
    try:
        end_date = datetime.fromisoformat(sub_end.replace('Z', '+00:00'))
        return datetime.now(timezone.utc) < end_date
    except:
        return False

def has_access(user: dict) -> bool:
    """Check if user has access (admin, VIP, or active subscription)"""
    if is_admin(user):
        return True
    if is_vip(user):
        return True
    return has_active_subscription(user)

def is_subscribed(user: dict) -> bool:
    """Legacy function - returns True if user has any form of access"""
    return has_access(user)

async def require_subscription(user: dict = Depends(get_current_user)) -> dict:
    if not is_subscribed(user):
        raise HTTPException(status_code=403, detail="Active subscription required")
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà enregistré")
    
    user_id = str(uuid.uuid4())
    is_admin_user = user_data.email in ADMIN_EMAILS
    
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "is_admin": is_admin_user,
        "is_subscribed": is_admin_user,  # Admins auto-subscribed
        "subscription_end": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token(user_id)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "is_admin": is_admin_user,
            "is_subscribed": is_admin_user
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    
    token = create_token(user["id"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "is_admin": user.get("is_admin", False),
            "is_subscribed": is_subscribed(user)
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        is_admin=user.get("is_admin", False),
        is_subscribed=is_subscribed(user),
        subscription_end=user.get("subscription_end"),
        created_at=user["created_at"]
    )

# ============ ADMIN ROUTES ============

@api_router.get("/admin/users", response_model=List[UserListResponse])
async def get_all_users(user: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(1000)
    return [UserListResponse(
        id=u["id"],
        email=u["email"],
        name=u["name"],
        is_admin=u.get("is_admin", False),
        is_vip=u.get("is_vip", False),
        is_subscribed=has_active_subscription(u),  # Only True for paid subscriptions
        subscription_end=u.get("subscription_end"),
        created_at=u["created_at"]
    ) for u in users]

@api_router.post("/admin/users/{user_id}/toggle-admin")
async def toggle_admin(user_id: str, admin: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_admin_status = not target_user.get("is_admin", False)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_admin": new_admin_status}}
    )
    return {"message": f"Admin status set to {new_admin_status}"}

@api_router.post("/admin/users/{user_id}/grant-subscription")
async def grant_subscription(user_id: str, days: int = 30, admin: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    end_date = datetime.now(timezone.utc) + timedelta(days=days)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "is_subscribed": True,
            "subscription_end": end_date.isoformat()
        }}
    )
    return {"message": f"Subscription granted until {end_date.isoformat()}"}

@api_router.post("/admin/users/{user_id}/set-vip")
async def set_vip(user_id: str, admin: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # VIP = unlimited subscription (no end date)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "is_subscribed": True,
            "is_vip": True,
            "subscription_end": None
        }}
    )
    return {"message": "User set as VIP"}

@api_router.post("/admin/users/{user_id}/remove-vip")
async def remove_vip(user_id: str, admin: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "is_vip": False,
            "is_subscribed": False,
            "subscription_end": None
        }}
    )
    return {"message": "VIP status removed"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deleting yourself
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Delete user's projects and videos
    user_projects = await db.projects.find({"user_id": user_id}).to_list(1000)
    for project in user_projects:
        await db.videos.delete_many({"project_id": project["id"]})
    await db.projects.delete_many({"user_id": user_id})
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    return {"message": "User deleted"}

# ============ STRIPE SUBSCRIPTION ROUTES ============

@api_router.post("/subscription/checkout", response_model=CheckoutResponse)
async def create_subscription_checkout(request: CheckoutRequest, http_request: Request, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    origin = request.origin_url
    success_url = f"{origin}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing"
    
    webhook_url = f"{str(http_request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=SUBSCRIPTION_PRICE_CHF,
        currency=SUBSCRIPTION_CURRENCY,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "user_email": user["email"],
            "type": "subscription"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["id"],
        "user_email": user["email"],
        "amount": SUBSCRIPTION_PRICE_CHF,
        "currency": SUBSCRIPTION_CURRENCY,
        "status": "pending",
        "payment_status": "initiated",
        "type": "subscription",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)
    
    return CheckoutResponse(url=session.url, session_id=session.session_id)

@api_router.get("/subscription/status/{session_id}")
async def get_subscription_status(session_id: str, http_request: Request, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    webhook_url = f"{str(http_request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction and user if paid
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if transaction and transaction.get("payment_status") != "paid" and status.payment_status == "paid":
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": "completed",
                "payment_status": "paid",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Grant subscription to user (30 days)
        end_date = datetime.now(timezone.utc) + timedelta(days=30)
        await db.users.update_one(
            {"id": transaction["user_id"]},
            {"$set": {
                "is_subscribed": True,
                "subscription_end": end_date.isoformat()
            }}
        )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": event.session_id},
                {"$set": {
                    "status": "completed",
                    "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Grant subscription
            if event.metadata.get("type") == "subscription":
                user_id = event.metadata.get("user_id")
                if user_id:
                    end_date = datetime.now(timezone.utc) + timedelta(days=30)
                    await db.users.update_one(
                        {"id": user_id},
                        {"$set": {
                            "is_subscribed": True,
                            "subscription_end": end_date.isoformat()
                        }}
                    )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ============ PROJECT ROUTES ============

@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(project_data: ProjectCreate, user: dict = Depends(require_subscription)):
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    project = {
        "id": project_id,
        "user_id": user["id"],
        "name": project_data.name,
        "description": project_data.description or "",
        "created_at": now,
        "updated_at": now
    }
    await db.projects.insert_one(project)
    return ProjectResponse(**project)

@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(user: dict = Depends(require_subscription)):
    projects = await db.projects.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ProjectResponse(**p) for p in projects]

@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, user: dict = Depends(require_subscription)):
    project = await db.projects.find_one({"id": project_id, "user_id": user["id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(**project)

@api_router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, update_data: ProjectUpdate, user: dict = Depends(require_subscription)):
    project = await db.projects.find_one({"id": project_id, "user_id": user["id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if update_data.name is not None:
        update_fields["name"] = update_data.name
    if update_data.description is not None:
        update_fields["description"] = update_data.description
    
    await db.projects.update_one({"id": project_id}, {"$set": update_fields})
    updated = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return ProjectResponse(**updated)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(require_subscription)):
    project = await db.projects.find_one({"id": project_id, "user_id": user["id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.projects.delete_one({"id": project_id})
    await db.videos.delete_many({"project_id": project_id})
    return {"message": "Project deleted"}

# ============ VIDEO ROUTES ============

@api_router.post("/projects/{project_id}/videos", response_model=VideoResponse)
async def upload_video(
    project_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(require_subscription)
):
    project = await db.projects.find_one({"id": project_id, "user_id": user["id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    video_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    filename = f"{video_id}{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    now = datetime.now(timezone.utc).isoformat()
    video = {
        "id": video_id,
        "project_id": project_id,
        "user_id": user["id"],
        "filename": filename,
        "original_filename": file.filename,
        "file_path": str(file_path),
        "duration": None,
        "status": "uploaded",
        "progress": 0,
        "source_language": None,
        "target_language": None,
        "segments": [],
        "subtitle_settings": {
            "font_family": "Arial",
            "font_size": 24,
            "font_color": "#FFFFFF",
            "background_color": "#000000",
            "background_opacity": 0.7,
            "position": "bottom"
        },
        "created_at": now,
        "updated_at": now
    }
    await db.videos.insert_one(video)
    
    background_tasks.add_task(get_video_duration, video_id, str(file_path))
    
    return VideoResponse(
        id=video_id,
        project_id=project_id,
        filename=filename,
        original_filename=file.filename,
        duration=None,
        status="uploaded",
        progress=0,
        source_language=None,
        target_language=None,
        subtitle_settings=video["subtitle_settings"],
        created_at=now,
        updated_at=now
    )

async def get_video_duration(video_id: str, file_path: str):
    try:
        cmd = ['/usr/bin/ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'json', file_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        data = json.loads(result.stdout)
        duration = float(data['format']['duration'])
        await db.videos.update_one({"id": video_id}, {"$set": {"duration": duration}})
    except Exception as e:
        logger.error(f"Error getting video duration: {e}")

@api_router.get("/projects/{project_id}/videos", response_model=List[VideoResponse])
async def get_project_videos(project_id: str, user: dict = Depends(require_subscription)):
    project = await db.projects.find_one({"id": project_id, "user_id": user["id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    videos = await db.videos.find({"project_id": project_id}, {"_id": 0}).to_list(100)
    return [VideoResponse(
        id=v["id"],
        project_id=v["project_id"],
        filename=v["filename"],
        original_filename=v["original_filename"],
        duration=v.get("duration"),
        status=v["status"],
        progress=v.get("progress", 0),
        source_language=v.get("source_language"),
        target_language=v.get("target_language"),
        subtitle_settings=v.get("subtitle_settings"),
        created_at=v["created_at"],
        updated_at=v["updated_at"]
    ) for v in videos]

@api_router.get("/videos/{video_id}", response_model=dict)
async def get_video(video_id: str, user: dict = Depends(require_subscription)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str, user: dict = Depends(require_subscription)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    file_path = Path(video["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    await db.videos.delete_one({"id": video_id})
    return {"message": "Video deleted"}

# ============ TRANSCRIPTION ROUTES ============

@api_router.post("/videos/{video_id}/transcribe", response_model=dict)
async def transcribe_video(video_id: str, background_tasks: BackgroundTasks, user: dict = Depends(require_subscription)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    await db.videos.update_one(
        {"id": video_id},
        {"$set": {"status": "transcribing", "progress": 0, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    background_tasks.add_task(process_transcription, video_id, video["file_path"])
    
    return {"message": "Transcription started", "status": "transcribing"}

async def process_transcription(video_id: str, file_path: str):
    """Process video transcription using Infomaniak AI API"""
    try:
        if not INFOMANIAK_API_KEY:
            raise ValueError("INFOMANIAK_API_KEY not configured")
        
        # Update progress
        await db.videos.update_one({"id": video_id}, {"$set": {"progress": 10}})
        
        # Extract audio from video
        audio_path = file_path.rsplit('.', 1)[0] + '.mp3'
        cmd = ['/usr/bin/ffmpeg', '-y', '-i', file_path, '-vn', '-acodec', 'libmp3lame', '-q:a', '4', audio_path]
        subprocess.run(cmd, capture_output=True, check=True)
        
        await db.videos.update_one({"id": video_id}, {"$set": {"progress": 20}})
        
        # Submit transcription to Infomaniak
        async with httpx.AsyncClient(timeout=300.0) as client:
            headers = {
                "Authorization": f"Bearer {INFOMANIAK_API_KEY}"
            }
            
            # Read audio file
            with open(audio_path, 'rb') as f:
                files = {
                    'file': (Path(audio_path).name, f, 'audio/mpeg'),
                }
                data = {
                    'model': 'whisper',
                    'response_format': 'verbose_json',
                    'timestamp_granularities[]': 'segment'
                }
                
                # Submit transcription request
                response = await client.post(
                    f"{INFOMANIAK_API_BASE}/openai/audio/transcriptions",
                    headers=headers,
                    files=files,
                    data=data
                )
                
                if response.status_code != 200:
                    raise Exception(f"Infomaniak API error: {response.text}")
                
                result = response.json()
                batch_id = result.get('batch_id')
                
                if not batch_id:
                    raise Exception("No batch_id returned from Infomaniak")
        
        await db.videos.update_one({"id": video_id}, {"$set": {"progress": 40}})
        logger.info(f"Transcription submitted for video {video_id}, batch_id: {batch_id}")
        
        # Poll for results
        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = {"Authorization": f"Bearer {INFOMANIAK_API_KEY}"}
            max_attempts = 60  # 5 minutes max
            
            for attempt in range(max_attempts):
                await asyncio.sleep(5)  # Wait 5 seconds between polls
                
                # Check status
                status_response = await client.get(
                    f"{INFOMANIAK_API_BASE}/results/{batch_id}",
                    headers=headers
                )
                
                if status_response.status_code != 200:
                    continue
                
                status_data = status_response.json()
                status = status_data.get('data', {}).get('status', '')
                
                progress = min(40 + (attempt * 1), 80)
                await db.videos.update_one({"id": video_id}, {"$set": {"progress": progress}})
                
                if status == 'done':
                    # Download results
                    download_response = await client.get(
                        f"{INFOMANIAK_API_BASE}/results/{batch_id}/download",
                        headers=headers
                    )
                    
                    if download_response.status_code == 200:
                        transcription_result = download_response.json()
                        break
                elif status == 'error':
                    raise Exception(f"Transcription failed: {status_data}")
            else:
                raise Exception("Transcription timed out")
        
        await db.videos.update_one({"id": video_id}, {"$set": {"progress": 85}})
        
        # Process segments from Infomaniak response
        segments = []
        response_segments = transcription_result.get('segments', [])
        
        for seg in response_segments:
            start = seg.get('start', 0)
            end = seg.get('end', 0)
            text = seg.get('text', '').strip()
            
            if text:
                segments.append({
                    "id": str(uuid.uuid4()),
                    "start_time": start,
                    "end_time": end,
                    "original_text": text,
                    "translated_text": ""
                })
        
        source_language = transcription_result.get('language', 'en')
        
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {
                "status": "transcribed",
                "progress": 100,
                "segments": segments,
                "source_language": source_language,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        Path(audio_path).unlink(missing_ok=True)
        logger.info(f"Transcription completed for video {video_id}")
        
    except Exception as e:
        logger.error(f"Transcription error for video {video_id}: {e}")
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {"status": "error", "progress": 0, "error": str(e), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )

# ============ TRANSLATION ROUTES ============

@api_router.post("/videos/{video_id}/translate", response_model=dict)
async def translate_subtitles(
    video_id: str,
    request: TranslateRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(require_subscription)
):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if not video.get("segments"):
        raise HTTPException(status_code=400, detail="No transcription available")
    
    await db.videos.update_one(
        {"id": video_id},
        {"$set": {
            "status": "translating",
            "progress": 0,
            "target_language": request.target_language,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    background_tasks.add_task(process_translation, video_id, video["segments"], request.target_language)
    
    return {"message": "Translation started", "status": "translating"}

async def process_translation(video_id: str, segments: List[dict], target_language: str):
    """Process subtitle translation using Infomaniak AI API"""
    try:
        if not INFOMANIAK_API_KEY:
            raise ValueError("INFOMANIAK_API_KEY not configured")
        
        language_names = {
            'fr': 'French', 'en': 'English', 'de': 'German', 'es': 'Spanish',
            'it': 'Italian', 'pt': 'Portuguese', 'zh': 'Chinese', 'ja': 'Japanese',
            'ko': 'Korean', 'ar': 'Arabic', 'hi': 'Hindi', 'ru': 'Russian',
            'nl': 'Dutch', 'pl': 'Polish', 'tr': 'Turkish', 'vi': 'Vietnamese',
            'th': 'Thai', 'sv': 'Swedish', 'da': 'Danish', 'fi': 'Finnish',
            'no': 'Norwegian', 'cs': 'Czech', 'el': 'Greek', 'he': 'Hebrew',
            'id': 'Indonesian', 'ms': 'Malay', 'ro': 'Romanian', 'uk': 'Ukrainian',
            'hu': 'Hungarian', 'bg': 'Bulgarian', 'hr': 'Croatian', 'sk': 'Slovak'
        }
        target_lang_name = language_names.get(target_language, target_language)
        
        translated_segments = []
        total = len(segments)
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = {
                "Authorization": f"Bearer {INFOMANIAK_API_KEY}",
                "Content-Type": "application/json"
            }
            
            for i, seg in enumerate(segments):
                try:
                    payload = {
                        "model": "llama3",
                        "messages": [
                            {
                                "role": "system",
                                "content": f"You are a professional subtitle translator. Translate the following text to {target_lang_name}. Keep the translation natural and suitable for subtitles (concise). Only respond with the translation, nothing else."
                            },
                            {
                                "role": "user",
                                "content": seg["original_text"]
                            }
                        ],
                        "max_tokens": 500,
                        "temperature": 0.3
                    }
                    
                    response = await client.post(
                        f"{INFOMANIAK_API_BASE}/openai/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        translation = result.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
                        translated_segments.append({
                            **seg,
                            "translated_text": translation
                        })
                    else:
                        logger.error(f"Translation API error: {response.text}")
                        translated_segments.append({
                            **seg,
                            "translated_text": seg["original_text"]
                        })
                        
                except Exception as e:
                    logger.error(f"Translation error for segment: {e}")
                    translated_segments.append({
                        **seg,
                        "translated_text": seg["original_text"]
                    })
                
                # Update progress
                progress = int(((i + 1) / total) * 100)
                await db.videos.update_one({"id": video_id}, {"$set": {"progress": progress}})
        
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {
                "status": "translated",
                "progress": 100,
                "segments": translated_segments,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Translation completed for video {video_id}")
        
    except Exception as e:
        logger.error(f"Translation error for video {video_id}: {e}")
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {"status": "error", "progress": 0, "error": str(e), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )

# ============ SUBTITLE EDITING ROUTES ============

@api_router.put("/videos/{video_id}/subtitles", response_model=dict)
async def update_subtitles(video_id: str, update_data: SubtitleUpdate, user: dict = Depends(require_subscription)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    segments = [s.model_dump() for s in update_data.segments]
    
    await db.videos.update_one(
        {"id": video_id},
        {"$set": {
            "segments": segments,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Subtitles updated", "segments": segments}

@api_router.put("/videos/{video_id}/settings", response_model=dict)
async def update_subtitle_settings(video_id: str, settings: SubtitleSettings, user: dict = Depends(require_subscription)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    await db.videos.update_one(
        {"id": video_id},
        {"$set": {
            "subtitle_settings": settings.model_dump(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Settings updated", "settings": settings.model_dump()}

# ============ VIDEO EXPORT ROUTES ============

@api_router.post("/videos/{video_id}/export", response_model=dict)
async def export_video(video_id: str, background_tasks: BackgroundTasks, user: dict = Depends(require_subscription)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if not video.get("segments"):
        raise HTTPException(status_code=400, detail="No subtitles available")
    
    await db.videos.update_one(
        {"id": video_id},
        {"$set": {"status": "rendering", "progress": 0, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    background_tasks.add_task(process_video_export, video_id, video)
    
    return {"message": "Export started", "status": "rendering"}

async def process_video_export(video_id: str, video: dict):
    try:
        segments = video.get("segments", [])
        settings = video.get("subtitle_settings", {})
        file_path = video["file_path"]
        
        await db.videos.update_one({"id": video_id}, {"$set": {"progress": 10}})
        
        # Generate SRT file
        srt_content = generate_srt(segments)
        srt_path = str(OUTPUT_DIR / f"{video_id}.srt")
        
        async with aiofiles.open(srt_path, 'w', encoding='utf-8') as f:
            await f.write(srt_content)
        
        await db.videos.update_one({"id": video_id}, {"$set": {"progress": 30}})
        
        output_path = str(OUTPUT_DIR / f"{video_id}_subtitled.mp4")
        
        font_size = settings.get("font_size", 24)
        subtitle_filter = f"subtitles={srt_path}:force_style='FontSize={font_size},Outline=1,Shadow=0,MarginV=30'"
        
        cmd = [
            '/usr/bin/ffmpeg', '-y', '-i', file_path,
            '-vf', subtitle_filter,
            '-c:a', 'copy',
            '-progress', 'pipe:1',
            output_path
        ]
        
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Monitor progress
        while True:
            line = process.stdout.readline()
            if not line and process.poll() is not None:
                break
            if 'out_time_ms=' in line:
                try:
                    time_ms = int(line.split('=')[1])
                    duration_ms = video.get('duration', 0) * 1000000
                    if duration_ms > 0:
                        progress = min(30 + int((time_ms / duration_ms) * 60), 90)
                        await db.videos.update_one({"id": video_id}, {"$set": {"progress": progress}})
                except:
                    pass
        
        process.wait()
        
        if process.returncode != 0:
            stderr = process.stderr.read()
            raise Exception(f"FFmpeg error: {stderr}")
        
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {
                "status": "completed",
                "progress": 100,
                "output_path": output_path,
                "output_filename": f"{video_id}_subtitled.mp4",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Video export completed for {video_id}")
        
    except Exception as e:
        logger.error(f"Export error for video {video_id}: {e}")
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {"status": "error", "progress": 0, "error": str(e), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )

def generate_srt(segments: List[dict]) -> str:
    srt_lines = []
    for i, seg in enumerate(segments, 1):
        start = format_srt_time(seg["start_time"])
        end = format_srt_time(seg["end_time"])
        text = seg.get("translated_text") or seg.get("original_text", "")
        srt_lines.append(f"{i}")
        srt_lines.append(f"{start} --> {end}")
        srt_lines.append(text)
        srt_lines.append("")
    return "\n".join(srt_lines)

def format_srt_time(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

@api_router.get("/videos/{video_id}/download")
async def download_video(video_id: str, user: dict = Depends(require_subscription)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video.get("status") != "completed" or not video.get("output_path"):
        raise HTTPException(status_code=400, detail="Video not ready for download")
    
    return FileResponse(
        video["output_path"],
        media_type="video/mp4",
        filename=f"subtitled_{video['original_filename']}"
    )

# ============ FILE SERVING ============

@api_router.get("/files/uploads/{filename}")
async def serve_upload(filename: str, user: dict = Depends(get_optional_user)):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(file_path))

@api_router.get("/files/outputs/{filename}")
async def serve_output(filename: str, user: dict = Depends(get_optional_user)):
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(file_path))

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "TranscriptorIA API", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import asyncio
import subprocess
import json
import aiofiles
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'cinescript-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# File storage paths
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR = ROOT_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="CineScript API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

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
    position: str = "bottom"  # bottom, top, middle

class VideoResponse(BaseModel):
    id: str
    project_id: str
    filename: str
    original_filename: str
    duration: Optional[float] = None
    status: str  # uploaded, transcribing, transcribed, translating, translated, rendering, completed
    source_language: Optional[str] = None
    target_language: Optional[str] = None
    subtitle_settings: Optional[dict] = None
    created_at: str
    updated_at: str

class TranslateRequest(BaseModel):
    target_language: str

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

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token(user_id)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        created_at=user["created_at"]
    )

# ============ PROJECT ROUTES ============

@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(project_data: ProjectCreate, user: dict = Depends(get_current_user)):
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
async def get_projects(user: dict = Depends(get_current_user)):
    projects = await db.projects.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ProjectResponse(**p) for p in projects]

@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id, "user_id": user["id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(**project)

@api_router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, update_data: ProjectUpdate, user: dict = Depends(get_current_user)):
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
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
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
    user: dict = Depends(get_current_user)
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
    
    # Get video duration in background
    background_tasks.add_task(get_video_duration, video_id, str(file_path))
    
    return VideoResponse(
        id=video_id,
        project_id=project_id,
        filename=filename,
        original_filename=file.filename,
        duration=None,
        status="uploaded",
        source_language=None,
        target_language=None,
        subtitle_settings=video["subtitle_settings"],
        created_at=now,
        updated_at=now
    )

async def get_video_duration(video_id: str, file_path: str):
    try:
        cmd = ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'json', file_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        data = json.loads(result.stdout)
        duration = float(data['format']['duration'])
        await db.videos.update_one({"id": video_id}, {"$set": {"duration": duration}})
    except Exception as e:
        logger.error(f"Error getting video duration: {e}")

@api_router.get("/projects/{project_id}/videos", response_model=List[VideoResponse])
async def get_project_videos(project_id: str, user: dict = Depends(get_current_user)):
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
        source_language=v.get("source_language"),
        target_language=v.get("target_language"),
        subtitle_settings=v.get("subtitle_settings"),
        created_at=v["created_at"],
        updated_at=v["updated_at"]
    ) for v in videos]

@api_router.get("/videos/{video_id}", response_model=dict)
async def get_video(video_id: str, user: dict = Depends(get_current_user)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str, user: dict = Depends(get_current_user)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Delete file
    file_path = Path(video["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    await db.videos.delete_one({"id": video_id})
    return {"message": "Video deleted"}

# ============ TRANSCRIPTION ROUTES ============

@api_router.post("/videos/{video_id}/transcribe", response_model=dict)
async def transcribe_video(video_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    await db.videos.update_one({"id": video_id}, {"$set": {"status": "transcribing", "updated_at": datetime.now(timezone.utc).isoformat()}})
    
    background_tasks.add_task(process_transcription, video_id, video["file_path"])
    
    return {"message": "Transcription started", "status": "transcribing"}

async def process_transcription(video_id: str, file_path: str):
    try:
        from emergentintegrations.llm.openai import OpenAISpeechToText
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise ValueError("EMERGENT_LLM_KEY not configured")
        
        stt = OpenAISpeechToText(api_key=api_key)
        
        # Extract audio from video
        audio_path = file_path.rsplit('.', 1)[0] + '.mp3'
        cmd = ['ffmpeg', '-y', '-i', file_path, '-vn', '-acodec', 'libmp3lame', '-q:a', '4', audio_path]
        subprocess.run(cmd, capture_output=True, check=True)
        
        # Transcribe with timestamps
        with open(audio_path, 'rb') as audio_file:
            response = await stt.transcribe(
                file=audio_file,
                model="whisper-1",
                response_format="verbose_json",
                timestamp_granularities=["segment"]
            )
        
        # Process segments
        segments = []
        if hasattr(response, 'segments') and response.segments:
            for seg in response.segments:
                segments.append({
                    "id": str(uuid.uuid4()),
                    "start_time": seg.start,
                    "end_time": seg.end,
                    "original_text": seg.text.strip(),
                    "translated_text": ""
                })
        
        # Detect language
        source_language = getattr(response, 'language', 'en')
        
        # Update video with segments
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {
                "status": "transcribed",
                "segments": segments,
                "source_language": source_language,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Clean up audio file
        Path(audio_path).unlink(missing_ok=True)
        
        logger.info(f"Transcription completed for video {video_id}")
        
    except Exception as e:
        logger.error(f"Transcription error for video {video_id}: {e}")
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {"status": "error", "error": str(e), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )

# ============ TRANSLATION ROUTES ============

@api_router.post("/videos/{video_id}/translate", response_model=dict)
async def translate_subtitles(
    video_id: str,
    request: TranslateRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
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
            "target_language": request.target_language,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    background_tasks.add_task(process_translation, video_id, video["segments"], request.target_language)
    
    return {"message": "Translation started", "status": "translating"}

async def process_translation(video_id: str, segments: List[dict], target_language: str):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise ValueError("EMERGENT_LLM_KEY not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"translation-{video_id}",
            system_message=f"You are a professional subtitle translator. Translate the following text to {target_language}. Keep the translation natural and suitable for subtitles (concise). Only respond with the translation, nothing else."
        ).with_model("openai", "gpt-5.1")
        
        translated_segments = []
        for seg in segments:
            try:
                message = UserMessage(text=seg["original_text"])
                translation = await chat.send_message(message)
                translated_segments.append({
                    **seg,
                    "translated_text": translation.strip()
                })
            except Exception as e:
                logger.error(f"Translation error for segment: {e}")
                translated_segments.append({
                    **seg,
                    "translated_text": seg["original_text"]
                })
        
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {
                "status": "translated",
                "segments": translated_segments,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Translation completed for video {video_id}")
        
    except Exception as e:
        logger.error(f"Translation error for video {video_id}: {e}")
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {"status": "error", "error": str(e), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )

# ============ SUBTITLE EDITING ROUTES ============

@api_router.put("/videos/{video_id}/subtitles", response_model=dict)
async def update_subtitles(video_id: str, update_data: SubtitleUpdate, user: dict = Depends(get_current_user)):
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
async def update_subtitle_settings(video_id: str, settings: SubtitleSettings, user: dict = Depends(get_current_user)):
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
async def export_video(video_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if not video.get("segments"):
        raise HTTPException(status_code=400, detail="No subtitles available")
    
    await db.videos.update_one(
        {"id": video_id},
        {"$set": {"status": "rendering", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    background_tasks.add_task(process_video_export, video_id, video)
    
    return {"message": "Export started", "status": "rendering"}

async def process_video_export(video_id: str, video: dict):
    try:
        segments = video.get("segments", [])
        settings = video.get("subtitle_settings", {})
        file_path = video["file_path"]
        
        # Generate SRT file
        srt_content = generate_srt(segments)
        srt_path = str(OUTPUT_DIR / f"{video_id}.srt")
        
        async with aiofiles.open(srt_path, 'w', encoding='utf-8') as f:
            await f.write(srt_content)
        
        # Output video path
        output_path = str(OUTPUT_DIR / f"{video_id}_subtitled.mp4")
        
        # Build FFmpeg subtitle filter
        font_size = settings.get("font_size", 24)
        font_color = settings.get("font_color", "#FFFFFF").replace("#", "")
        bg_color = settings.get("background_color", "#000000").replace("#", "")
        bg_opacity = settings.get("background_opacity", 0.7)
        position = settings.get("position", "bottom")
        
        # Calculate y position
        if position == "top":
            margin_v = 30
        elif position == "middle":
            margin_v = "(h-text_h)/2"
        else:
            margin_v = "h-text_h-30"
        
        # FFmpeg command with subtitle styling
        subtitle_filter = f"subtitles={srt_path}:force_style='FontSize={font_size},PrimaryColour=&H{font_color}&,BackColour=&H{bg_color}&,Outline=1,Shadow=0,MarginV=30'"
        
        cmd = [
            'ffmpeg', '-y', '-i', file_path,
            '-vf', subtitle_filter,
            '-c:a', 'copy',
            output_path
        ]
        
        process = subprocess.run(cmd, capture_output=True, text=True)
        
        if process.returncode != 0:
            raise Exception(f"FFmpeg error: {process.stderr}")
        
        # Update video with output path
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {
                "status": "completed",
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
            {"$set": {"status": "error", "error": str(e), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )

def generate_srt(segments: List[dict]) -> str:
    """Generate SRT subtitle file content"""
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
    """Format seconds to SRT time format (HH:MM:SS,mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

@api_router.get("/videos/{video_id}/download")
async def download_video(video_id: str, user: dict = Depends(get_current_user)):
    video = await db.videos.find_one({"id": video_id, "user_id": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video.get("status") != "completed" or not video.get("output_path"):
        raise HTTPException(status_code=400, detail="Video not ready for download")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        video["output_path"],
        media_type="video/mp4",
        filename=f"subtitled_{video['original_filename']}"
    )

# ============ FILE SERVING ============

@api_router.get("/files/uploads/{filename}")
async def serve_upload(filename: str):
    from fastapi.responses import FileResponse
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(file_path))

@api_router.get("/files/outputs/{filename}")
async def serve_output(filename: str):
    from fastapi.responses import FileResponse
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(file_path))

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "CineScript API", "status": "running"}

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

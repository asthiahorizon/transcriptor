# CineScript - Video Transcription & Subtitling App

## Original Problem Statement
Application web permettant de:
- Transcrire des vidéos automatiquement
- Traduire les transcriptions dans d'autres langues
- Éditer les sous-titres avec les segments et timecodes
- Exporter les vidéos avec sous-titres incrustés
- Gestion de projets et comptes utilisateurs

## User Choices
- **Transcription**: OpenAI Whisper
- **Translation**: OpenAI GPT (gpt-5.1)
- **Authentication**: JWT (email/password)
- **File Size**: No limit
- **Design**: Glassmorphism clair et moderne (pas de timeline en bas)
- **API Key**: Emergent LLM Key (universal key)

## Architecture

### Backend (FastAPI)
- **Authentication**: JWT-based with bcrypt password hashing
- **Database**: MongoDB with Motor async driver
- **Video Processing**: FFmpeg for audio extraction and subtitle burning
- **AI Services**: emergentintegrations library for OpenAI Whisper & GPT

### Frontend (React)
- **UI Framework**: Shadcn/UI components
- **Styling**: Tailwind CSS with glassmorphism theme
- **State Management**: React Context for auth
- **Routing**: React Router v7

### Design Theme
- **Style**: Light glassmorphism (liquid glass)
- **Background**: Pastel gradient (purple/pink/white)
- **Cards**: Frosted glass effect with backdrop-filter blur
- **Colors**: Indigo (#6366F1) primary, Purple (#8B5CF6) secondary
- **Typography**: Plus Jakarta Sans (headings), Inter (body)

### Key Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create project
- `POST /api/projects/{id}/videos` - Upload video
- `POST /api/videos/{id}/transcribe` - Start transcription
- `POST /api/videos/{id}/translate` - Start translation
- `PUT /api/videos/{id}/subtitles` - Update subtitles
- `PUT /api/videos/{id}/settings` - Update subtitle settings
- `POST /api/videos/{id}/export` - Export video with subtitles

## Completed Tasks
1. ✅ User authentication (register/login/logout)
2. ✅ Project CRUD operations
3. ✅ Video upload with FFmpeg duration detection
4. ✅ Transcription with OpenAI Whisper (segments with timecode)
5. ✅ Translation with OpenAI GPT
6. ✅ Subtitle editing interface (original + translated)
7. ✅ Subtitle settings (font size, color, background, position)
8. ✅ Video export with FFmpeg subtitle burning
9. ✅ Glassmorphism light design (no timeline at bottom)
10. ✅ Video player with subtitle overlay preview

## Next Tasks
1. Add SRT/VTT subtitle file export
2. Add batch video upload
3. Real-time progress tracking for long operations
4. Keyboard shortcuts for video playback
5. Undo/redo for subtitle editing

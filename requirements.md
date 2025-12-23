# CineScript - Video Transcription & Subtitling App

## Original Problem Statement
Application web permettant de:
- Transcrire des vidéos automatiquement
- Traduire les transcriptions dans d'autres langues
- Éditer les sous-titres sur une timeline
- Exporter les vidéos avec sous-titres incrustés
- Gestion de projets et comptes utilisateurs

## User Choices
- **Transcription**: OpenAI Whisper
- **Translation**: OpenAI GPT (gpt-5.1)
- **Authentication**: JWT (email/password)
- **File Size**: No limit
- **API Key**: Emergent LLM Key (universal key)

## Architecture

### Backend (FastAPI)
- **Authentication**: JWT-based with bcrypt password hashing
- **Database**: MongoDB with Motor async driver
- **Video Processing**: FFmpeg for audio extraction and subtitle burning
- **AI Services**: emergentintegrations library for OpenAI Whisper & GPT

### Frontend (React)
- **UI Framework**: Shadcn/UI components
- **Styling**: Tailwind CSS with custom theme
- **State Management**: React Context for auth
- **Routing**: React Router v7

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
- `GET /api/videos/{id}/download` - Download exported video

## Completed Tasks
1. ✅ User authentication (register/login/logout)
2. ✅ Project CRUD operations
3. ✅ Video upload with FFmpeg duration detection
4. ✅ Transcription with OpenAI Whisper (verbose_json format with timestamps)
5. ✅ Translation with OpenAI GPT
6. ✅ Subtitle editing interface with timeline
7. ✅ Subtitle settings (font size, color, background, position)
8. ✅ Video export with FFmpeg subtitle burning
9. ✅ Professional UI with "Neon Darkroom" theme
10. ✅ Video player with subtitle overlay preview

## Next Tasks
1. Add support for batch video upload
2. Add SRT/VTT subtitle file export
3. Implement real-time progress tracking for long operations
4. Add undo/redo for subtitle editing
5. Add keyboard shortcuts for video playback
6. Implement collaborative editing (multiple users)
7. Add support for more output formats
8. Implement video thumbnail generation

## Tech Stack
- FastAPI + MongoDB + Motor
- React 19 + Tailwind CSS + Shadcn/UI
- OpenAI Whisper (transcription)
- OpenAI GPT-5.1 (translation)
- FFmpeg (video processing)
- JWT (authentication)

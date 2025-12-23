# TranscriptorIA - Application de Transcription et Sous-titrage Vidéo

## Problème Original
Application web permettant de:
- Transcrire des vidéos automatiquement avec IA privée (Infomaniak)
- Traduire les transcriptions dans d'autres langues
- Éditer les sous-titres avec segments et timecodes
- Exporter les vidéos avec sous-titres incrustés
- Gestion de projets et comptes utilisateurs

## Choix Utilisateur
- **Transcription**: OpenAI Whisper
- **Traduction**: OpenAI GPT (gpt-5.1)
- **Authentification**: JWT (email/mot de passe)
- **Taille fichier**: Pas de limite
- **Design**: Glassmorphism clair et moderne (style liquid glass)
- **Nom**: TranscriptorIA
- **Footer**: Asthia Horizon Sàrl
- **Confidentialité**: Message sur l'IA privée Infomaniak

## Architecture

### Backend (FastAPI)
- **Authentification**: JWT avec bcrypt
- **Base de données**: MongoDB avec Motor async
- **Traitement vidéo**: FFmpeg pour extraction audio et incrustation sous-titres
- **Services IA**: emergentintegrations pour OpenAI Whisper & GPT

### Frontend (React)
- **Framework UI**: Shadcn/UI
- **Styling**: Tailwind CSS avec thème glassmorphism
- **Gestion d'état**: React Context pour auth
- **Routing**: React Router v7

### Design
- **Style**: Glassmorphism clair (liquid glass)
- **Fond**: Dégradé pastel (violet/rose/blanc)
- **Cartes**: Effet verre avec backdrop-filter blur
- **Couleurs**: Indigo (#6366F1), Violet (#8B5CF6)
- **Police**: Plus Jakarta Sans (titres), Inter (corps)
- **Langue UI**: Français

## Fonctionnalités Implémentées
1. ✅ Authentification (inscription/connexion/déconnexion)
2. ✅ CRUD projets
3. ✅ Upload vidéo avec détection durée FFmpeg
4. ✅ Transcription OpenAI Whisper (segments + timecodes)
5. ✅ Traduction OpenAI GPT
6. ✅ Éditeur sous-titres (original + traduction)
7. ✅ Paramètres sous-titres (taille, couleur, fond, position)
8. ✅ Export vidéo avec sous-titres FFmpeg
9. ✅ Design glassmorphism clair
10. ✅ Pastilles de langue (source/traduction)
11. ✅ Scroll auto vers segment actif
12. ✅ Textarea auto-resize pour traductions
13. ✅ Boutons Générer ET Télécharger toujours visibles
14. ✅ Message confidentialité IA privée Infomaniak
15. ✅ Footer "Asthia Horizon Sàrl"
16. ✅ UI en français

## Prochaines Étapes
1. Export fichiers SRT/VTT séparément
2. Barre de progression en temps réel
3. Raccourcis clavier
4. Undo/redo édition sous-titres

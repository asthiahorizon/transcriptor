import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, Loader2, 
  Sparkles, Languages, Download, Save, Settings, Globe
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Slider } from '../components/ui/slider';
import { Progress } from '../components/ui/progress';
import LanguageSelector from '../components/LanguageSelector';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LANGUAGES = [
  // Europe
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'Anglais' },
  { code: 'de', name: 'Allemand' },
  { code: 'es', name: 'Espagnol' },
  { code: 'it', name: 'Italien' },
  { code: 'pt', name: 'Portugais' },
  { code: 'nl', name: 'Néerlandais' },
  { code: 'pl', name: 'Polonais' },
  { code: 'ro', name: 'Roumain' },
  { code: 'hu', name: 'Hongrois' },
  { code: 'cs', name: 'Tchèque' },
  { code: 'sk', name: 'Slovaque' },
  { code: 'bg', name: 'Bulgare' },
  { code: 'hr', name: 'Croate' },
  { code: 'sl', name: 'Slovène' },
  { code: 'sr', name: 'Serbe' },
  { code: 'uk', name: 'Ukrainien' },
  { code: 'ru', name: 'Russe' },
  { code: 'el', name: 'Grec' },
  { code: 'da', name: 'Danois' },
  { code: 'sv', name: 'Suédois' },
  { code: 'no', name: 'Norvégien' },
  { code: 'fi', name: 'Finnois' },
  { code: 'et', name: 'Estonien' },
  { code: 'lv', name: 'Letton' },
  { code: 'lt', name: 'Lituanien' },
  { code: 'is', name: 'Islandais' },
  { code: 'ga', name: 'Irlandais' },
  { code: 'cy', name: 'Gallois' },
  { code: 'mt', name: 'Maltais' },
  { code: 'sq', name: 'Albanais' },
  { code: 'mk', name: 'Macédonien' },
  { code: 'bs', name: 'Bosnien' },
  // Asie
  { code: 'zh', name: 'Chinois (Simplifié)' },
  { code: 'zh-TW', name: 'Chinois (Traditionnel)' },
  { code: 'ja', name: 'Japonais' },
  { code: 'ko', name: 'Coréen' },
  { code: 'vi', name: 'Vietnamien' },
  { code: 'th', name: 'Thaï' },
  { code: 'id', name: 'Indonésien' },
  { code: 'ms', name: 'Malais' },
  { code: 'tl', name: 'Tagalog (Philippines)' },
  { code: 'my', name: 'Birman' },
  { code: 'km', name: 'Khmer' },
  { code: 'lo', name: 'Lao' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamoul' },
  { code: 'te', name: 'Télougou' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Pendjabi' },
  { code: 'ur', name: 'Ourdou' },
  { code: 'ne', name: 'Népalais' },
  { code: 'si', name: 'Cinghalais' },
  // Moyen-Orient & Afrique du Nord
  { code: 'ar', name: 'Arabe' },
  { code: 'he', name: 'Hébreu' },
  { code: 'fa', name: 'Persan' },
  { code: 'tr', name: 'Turc' },
  { code: 'ku', name: 'Kurde' },
  // Afrique
  { code: 'sw', name: 'Swahili' },
  { code: 'am', name: 'Amharique' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'ig', name: 'Igbo' },
  { code: 'ha', name: 'Haoussa' },
  { code: 'zu', name: 'Zoulou' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'af', name: 'Afrikaans' },
  // Amériques
  { code: 'pt-BR', name: 'Portugais (Brésil)' },
  { code: 'es-MX', name: 'Espagnol (Mexique)' },
  { code: 'ht', name: 'Créole haïtien' },
  // Autres
  { code: 'ka', name: 'Géorgien' },
  { code: 'hy', name: 'Arménien' },
  { code: 'az', name: 'Azéri' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'uz', name: 'Ouzbek' },
  { code: 'mn', name: 'Mongol' },
  { code: 'eo', name: 'Espéranto' },
  { code: 'la', name: 'Latin' },
];

const LANGUAGE_NAMES = LANGUAGES.reduce((acc, lang) => {
  acc[lang.code] = lang.name;
  return acc;
}, {});

const LanguageBadge = ({ code, type, label }) => {
  if (!code) return null;
  const colors = {
    source: 'bg-blue-100 text-blue-700 border-blue-200',
    target: 'bg-purple-100 text-purple-700 border-purple-200'
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colors[type]}`}>
      <Globe className="w-3 h-3" />
      <span className="text-slate-500">{label}:</span>
      {LANGUAGE_NAMES[code] || code.toUpperCase()}
    </span>
  );
};

export default function EditorPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const segmentRefs = useRef({});
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [segments, setSegments] = useState([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('fr');
  const [showSettings, setShowSettings] = useState(false);
  const [subtitleSettings, setSubtitleSettings] = useState({
    font_family: 'Arial',
    font_size: 24,
    font_color: '#FFFFFF',
    background_color: '#000000',
    background_opacity: 0.7,
    position: 'bottom'
  });
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);

  useEffect(() => {
    fetchVideo();
    const interval = setInterval(() => {
      // Only fetch if not editing and no local changes
      if (!isEditing && !hasLocalChanges && !hasSettingsChanges) {
        fetchVideo();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [videoId, isEditing, hasLocalChanges, hasSettingsChanges]);

  useEffect(() => {
    // Only update segments from server if no local changes
    if (video?.segments && !hasLocalChanges) {
      setSegments(video.segments);
    }
    // Only update settings if no settings changes
    if (video?.subtitle_settings && !hasSettingsChanges) {
      setSubtitleSettings(video.subtitle_settings);
    }
  }, [video, hasLocalChanges, hasSettingsChanges]);

  // Removed auto-scroll - we want video and segment side by side

  const fetchVideo = async () => {
    try {
      const response = await axios.get(`${API}/videos/${videoId}`);
      setVideo(response.data);
      if (loading) setLoading(false);
    } catch (error) {
      if (loading) {
        toast.error('Erreur de chargement de la vidéo');
        navigate('/dashboard');
      }
    }
  };

  const handleTranscribe = async () => {
    try {
      await axios.post(`${API}/videos/${videoId}/transcribe`);
      toast.success('Transcription démarrée !');
      fetchVideo();
    } catch (error) {
      toast.error('Erreur lors du démarrage de la transcription');
    }
  };

  const handleTranslate = async () => {
    try {
      await axios.post(`${API}/videos/${videoId}/translate`, {
        target_language: targetLanguage
      });
      toast.success('Traduction démarrée !');
      fetchVideo();
    } catch (error) {
      toast.error('Erreur lors du démarrage de la traduction');
    }
  };

  const handleExport = async () => {
    try {
      await axios.post(`${API}/videos/${videoId}/export`);
      toast.success('Génération démarrée !');
      fetchVideo();
    } catch (error) {
      toast.error('Erreur lors du démarrage de l\'export');
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/videos/${videoId}/download`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `subtitled_${video?.original_filename || 'video.mp4'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Téléchargement démarré !');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleSaveSubtitles = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/videos/${videoId}/subtitles`, { segments });
      toast.success('Sous-titres sauvegardés !');
      setHasLocalChanges(false);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API}/videos/${videoId}/settings`, subtitleSettings);
      toast.success('Paramètres sauvegardés !');
      setHasSettingsChanges(false);
      setShowSettings(false);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const updateSubtitleSetting = (field, value) => {
    setSubtitleSettings(prev => ({ ...prev, [field]: value }));
    setHasSettingsChanges(true);
  };

  const updateSegment = (index, field, value) => {
    const updated = [...segments];
    updated[index] = { ...updated[index], [field]: value };
    setSegments(updated);
    setHasLocalChanges(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      const activeIndex = segments.findIndex(
        seg => time >= seg.start_time && time < seg.end_time
      );
      
      if (activeIndex >= 0 && activeIndex !== activeSegmentIndex) {
        setActiveSegmentIndex(activeIndex);
        
        // Scroll segment into view within the container
        if (segmentRefs.current[activeIndex]) {
          const container = document.getElementById('segments-container');
          const segment = segmentRefs.current[activeIndex];
          if (container && segment) {
            const containerRect = container.getBoundingClientRect();
            const segmentRect = segment.getBoundingClientRect();
            
            // Check if segment is outside visible area
            if (segmentRect.top < containerRect.top || segmentRect.bottom > containerRect.bottom) {
              segment.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      } else if (activeIndex < 0) {
        setActiveSegmentIndex(null);
      }
    }
  };

  const handleSeek = (time) => {
    if (videoRef.current && !isNaN(time) && time >= 0) {
      // Don't check duration limit as it might not be available yet
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      
      // Ensure video is paused at the new position to show the frame
      if (!isPlaying) {
        videoRef.current.pause();
      }
    }
  };

  const handleProgressClick = (e) => {
    // Use video's duration directly if state duration is not set
    const videoDuration = duration || videoRef.current?.duration;
    if (!videoDuration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(percent * videoDuration, videoDuration));
    handleSeek(newTime);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const getStatusInfo = (status) => {
    const statusInfo = {
      uploaded: { color: 'text-slate-500', bg: 'bg-slate-100', label: 'Prêt à transcrire' },
      transcribing: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Transcription...' },
      transcribed: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Transcrit' },
      translating: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Traduction...' },
      translated: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Traduit' },
      rendering: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Génération...' },
      completed: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Prêt' },
      error: { color: 'text-red-600', bg: 'bg-red-100', label: 'Erreur' }
    };
    return statusInfo[status] || statusInfo.uploaded;
  };

  const handleTextareaResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Generate video URL with auth token
  const token = localStorage.getItem('token');
  const videoUrl = `${API}/files/uploads/${video?.filename}?token=${token}`;
  const isProcessing = ['transcribing', 'translating', 'rendering'].includes(video?.status);
  const statusInfo = getStatusInfo(video?.status);
  const activeSegment = activeSegmentIndex !== null ? segments[activeSegmentIndex] : null;
  const canExport = ['transcribed', 'translated', 'completed'].includes(video?.status) && segments.length > 0;
  const canDownload = video?.status === 'completed';
  const progress = video?.progress || 0;

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 -z-10" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="glass sticky top-0 z-50 px-6 py-3 border-b border-white/20">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="font-semibold text-slate-800 truncate max-w-md">{video?.original_filename}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                  {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
                  {statusInfo.label}
                </span>
                {video?.source_language && <LanguageBadge code={video.source_language} type="source" label="Source" />}
                {video?.target_language && <LanguageBadge code={video.target_language} type="target" label="Traduction" />}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSelector />
            
            <button
              onClick={() => setShowSettings(true)}
              className="btn-ghost py-2 px-4 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Paramètres
            </button>
            
            <button
              onClick={handleSaveSubtitles}
              disabled={saving || segments.length === 0}
              className={`py-2 px-4 flex items-center gap-2 rounded-xl font-medium transition-all ${
                hasLocalChanges 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                  : 'btn-ghost'
              }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {hasLocalChanges ? 'Sauvegarder *' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar for Processing */}
      {isProcessing && progress > 0 && (
        <div className="glass px-6 py-3 border-b border-white/20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">
                    {video?.status === 'transcribing' && 'Transcription en cours...'}
                    {video?.status === 'translating' && 'Traduction en cours...'}
                    {video?.status === 'rendering' && 'Génération de la vidéo...'}
                  </span>
                  <span className="text-sm text-slate-500">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Side by Side Layout */}
      <div className="flex gap-6 p-6 max-w-7xl mx-auto h-[calc(100vh-180px)]">
        {/* Left: Video Player - Sticky */}
        <div className="w-1/2 flex flex-col">
          <div className="sticky top-24 space-y-4">
            {/* Video Container */}
            <div className="glass-card overflow-hidden">
              <div className="relative bg-slate-900 aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="max-w-full max-h-full"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={(e) => {
                    setDuration(e.target.duration);
                    // Force update current time display
                    setCurrentTime(e.target.currentTime);
                  }}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onSeeked={() => {
                    // Update segment when seeking
                    if (videoRef.current) {
                      const time = videoRef.current.currentTime;
                      const activeIndex = segments.findIndex(
                        seg => time >= seg.start_time && time < seg.end_time
                      );
                      setActiveSegmentIndex(activeIndex >= 0 ? activeIndex : null);
                    }
                  }}
                />
              
              {/* Subtitle Overlay */}
              {activeSegment && (
                <div 
                  className="absolute left-0 right-0 px-4 py-2 text-center"
                  style={{
                    bottom: subtitleSettings.position === 'bottom' ? '60px' : 'auto',
                    top: subtitleSettings.position === 'top' ? '20px' : 'auto',
                  }}
                >
                  <span
                    className="px-4 py-2 rounded-lg"
                    style={{
                      fontSize: `${subtitleSettings.font_size}px`,
                      color: subtitleSettings.font_color,
                      backgroundColor: `${subtitleSettings.background_color}${Math.round(subtitleSettings.background_opacity * 255).toString(16).padStart(2, '0')}`,
                    }}
                  >
                    {activeSegment.translated_text || activeSegment.original_text}
                  </span>
                </div>
              )}
              </div>
            </div>
            
            {/* Video Controls */}
            <div className="p-4 space-y-3 bg-white glass-card">
              {/* Progress Bar - Click to seek */}
              <div 
                className="relative h-3 bg-slate-200 rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  const videoDuration = duration || videoRef.current?.duration || 0;
                  if (videoDuration > 0) {
                    const newTime = percent * videoDuration;
                    handleSeek(newTime);
                  }
                }}
              >
                {/* Progress fill */}
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
                {/* Thumb */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full shadow-lg transition-transform group-hover:scale-125"
                  style={{ left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 8px)` }}
                />
                {/* Segment markers */}
                {segments.map((seg, idx) => (
                  <div
                    key={idx}
                    className={`absolute top-0 h-full ${activeSegmentIndex === idx ? 'bg-indigo-300/50' : 'bg-slate-300/30'}`}
                    style={{
                      left: `${duration > 0 ? (seg.start_time / duration) * 100 : 0}%`,
                      width: `${duration > 0 ? ((seg.end_time - seg.start_time) / duration) * 100 : 0}%`
                    }}
                  />
                ))}
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-slate-500" /> : <Volume2 className="w-5 h-5 text-slate-500" />}
                </button>
                
                <span className="text-sm font-mono text-slate-500">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            {video?.status === 'uploaded' && (
              <button
                onClick={handleTranscribe}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold flex items-center gap-2 flex-1 justify-center py-4 rounded-xl shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                Transcrire la vidéo
              </button>
            )}
            
            {['transcribed', 'translated', 'completed'].includes(video?.status) && (
              <>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="w-40 bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <button
                  onClick={handleTranslate}
                  disabled={isProcessing}
                  className="btn-secondary flex items-center gap-2 py-3 px-6 disabled:opacity-50"
                >
                  <Languages className="w-5 h-5" />
                  Traduire
                </button>
                
                {canExport && (
                  <button
                    onClick={handleExport}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold flex items-center gap-2 py-3 px-6 rounded-xl shadow-lg disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    Générer la vidéo
                  </button>
                )}
                
                {canDownload && (
                  <button
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold flex items-center gap-2 py-3 px-6 rounded-xl shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Télécharger
                  </button>
                )}
              </>
            )}
          </div>
          </div>
        </div>

        {/* Right: Segments Editor - Scrollable with active segment highlighted */}
        <div className="w-1/2 flex flex-col glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-white/50 flex-shrink-0">
            <h2 className="font-bold text-lg text-slate-800">
              Sous-titres
            </h2>
            <p className="text-sm text-slate-500">
              {segments.length} segments
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3" id="segments-container">
            {segments.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="font-medium">Aucun sous-titre</p>
                <p className="text-sm">Transcrivez la vidéo pour générer les sous-titres</p>
              </div>
            ) : (
              segments.map((segment, index) => (
                <div
                  key={segment.id}
                  ref={el => segmentRefs.current[index] = el}
                  className={`segment-card p-4 cursor-pointer transition-all ${activeSegmentIndex === index ? 'active ring-2 ring-indigo-500 shadow-lg' : ''}`}
                  onClick={() => {
                    handleSeek(segment.start_time);
                    setActiveSegmentIndex(index);
                  }}
                >
                  {/* Timecode */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md">
                      {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                    </span>
                  </div>
                  
                  {/* Original Text */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Original</label>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {segment.original_text}
                    </p>
                  </div>
                  
                  {/* Translated Text */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Traduction</label>
                    <textarea
                      value={segment.translated_text || ''}
                      onChange={(e) => {
                        updateSegment(index, 'translated_text', e.target.value);
                        handleTextareaResize(e);
                      }}
                      onFocus={(e) => {
                        setIsEditing(true);
                        handleTextareaResize(e);
                      }}
                      onBlur={() => setIsEditing(false)}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 overflow-hidden"
                      rows={1}
                      placeholder="Entrez la traduction..."
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-4 text-center">
        <p className="text-sm text-slate-400">© 2024 Asthia Horizon Sàrl</p>
      </footer>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-white border border-slate-200 shadow-xl rounded-2xl sm:max-w-md fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Paramètres des sous-titres
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Font Size */}
            <div className="space-y-2">
              <label className="ui-label">Taille de police: {subtitleSettings.font_size}px</label>
              <Slider
                value={[subtitleSettings.font_size]}
                onValueChange={([v]) => setSubtitleSettings({ ...subtitleSettings, font_size: v })}
                min={12}
                max={48}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Font Color */}
            <div className="space-y-2">
              <label className="ui-label">Couleur du texte</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={subtitleSettings.font_color}
                  onChange={(e) => setSubtitleSettings({ ...subtitleSettings, font_color: e.target.value })}
                  className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200"
                />
                <input
                  type="text"
                  value={subtitleSettings.font_color}
                  onChange={(e) => setSubtitleSettings({ ...subtitleSettings, font_color: e.target.value })}
                  className="input flex-1"
                />
              </div>
            </div>
            
            {/* Background Color */}
            <div className="space-y-2">
              <label className="ui-label">Couleur de fond</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={subtitleSettings.background_color}
                  onChange={(e) => setSubtitleSettings({ ...subtitleSettings, background_color: e.target.value })}
                  className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200"
                />
                <input
                  type="text"
                  value={subtitleSettings.background_color}
                  onChange={(e) => setSubtitleSettings({ ...subtitleSettings, background_color: e.target.value })}
                  className="input flex-1"
                />
              </div>
            </div>
            
            {/* Background Opacity */}
            <div className="space-y-2">
              <label className="ui-label">Opacité du fond: {Math.round(subtitleSettings.background_opacity * 100)}%</label>
              <Slider
                value={[subtitleSettings.background_opacity * 100]}
                onValueChange={([v]) => setSubtitleSettings({ ...subtitleSettings, background_opacity: v / 100 })}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
            
            {/* Position */}
            <div className="space-y-2">
              <label className="ui-label">Position</label>
              <Select 
                value={subtitleSettings.position} 
                onValueChange={(v) => setSubtitleSettings({ ...subtitleSettings, position: v })}
              >
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="bottom">Bas</SelectItem>
                  <SelectItem value="top">Haut</SelectItem>
                  <SelectItem value="middle">Milieu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Preview */}
            <div className="p-6 bg-slate-800 rounded-xl text-center">
              <span
                className="px-4 py-2 rounded-lg"
                style={{
                  fontSize: `${Math.min(subtitleSettings.font_size, 20)}px`,
                  color: subtitleSettings.font_color,
                  backgroundColor: `${subtitleSettings.background_color}${Math.round(subtitleSettings.background_opacity * 255).toString(16).padStart(2, '0')}`,
                }}
              >
                Aperçu du sous-titre
              </span>
            </div>
            
            <button
              onClick={handleSaveSettings}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg"
            >
              Sauvegarder
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, Loader2, 
  Sparkles, Languages, Download, Save, Settings
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ru', name: 'Russian' },
];

export default function EditorPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [segments, setSegments] = useState([]);
  const [activeSegment, setActiveSegment] = useState(null);
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

  useEffect(() => {
    fetchVideo();
    const interval = setInterval(fetchVideo, 5000);
    return () => clearInterval(interval);
  }, [videoId]);

  useEffect(() => {
    if (video?.segments) {
      setSegments(video.segments);
    }
    if (video?.subtitle_settings) {
      setSubtitleSettings(video.subtitle_settings);
    }
  }, [video]);

  const fetchVideo = async () => {
    try {
      const response = await axios.get(`${API}/videos/${videoId}`);
      setVideo(response.data);
      if (loading) setLoading(false);
    } catch (error) {
      if (loading) {
        toast.error('Failed to load video');
        navigate('/dashboard');
      }
    }
  };

  const handleTranscribe = async () => {
    try {
      await axios.post(`${API}/videos/${videoId}/transcribe`);
      toast.success('Transcription started!');
      fetchVideo();
    } catch (error) {
      toast.error('Failed to start transcription');
    }
  };

  const handleTranslate = async () => {
    try {
      await axios.post(`${API}/videos/${videoId}/translate`, {
        target_language: targetLanguage
      });
      toast.success('Translation started!');
      fetchVideo();
    } catch (error) {
      toast.error('Failed to start translation');
    }
  };

  const handleExport = async () => {
    try {
      await axios.post(`${API}/videos/${videoId}/export`);
      toast.success('Export started! This may take a few minutes.');
      fetchVideo();
    } catch (error) {
      toast.error('Failed to start export');
    }
  };

  const handleDownload = () => {
    window.open(`${API}/videos/${videoId}/download`, '_blank');
  };

  const handleSaveSubtitles = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/videos/${videoId}/subtitles`, { segments });
      toast.success('Subtitles saved!');
    } catch (error) {
      toast.error('Failed to save subtitles');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API}/videos/${videoId}/settings`, subtitleSettings);
      toast.success('Settings saved!');
      setShowSettings(false);
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const updateSegment = (index, field, value) => {
    const updated = [...segments];
    updated[index] = { ...updated[index], [field]: value };
    setSegments(updated);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      const active = segments.find(
        seg => videoRef.current.currentTime >= seg.start_time && 
               videoRef.current.currentTime < seg.end_time
      );
      setActiveSegment(active || null);
    }
  };

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
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
      uploaded: { color: 'text-slate-500', bg: 'bg-slate-100', label: 'Ready to transcribe' },
      transcribing: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Transcribing...' },
      transcribed: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Transcribed' },
      translating: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Translating...' },
      translated: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Translated' },
      rendering: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Rendering...' },
      completed: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Ready to download' },
      error: { color: 'text-red-600', bg: 'bg-red-100', label: 'Error' }
    };
    return statusInfo[status] || statusInfo.uploaded;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const videoUrl = `${API}/files/uploads/${video?.filename}`;
  const isProcessing = ['transcribing', 'translating', 'rendering'].includes(video?.status);
  const statusInfo = getStatusInfo(video?.status);

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
              data-testid="back-to-dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="font-semibold text-slate-800 truncate max-w-md">{video?.original_filename}</h1>
              <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
                {statusInfo.label}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="btn-ghost py-2 px-4 flex items-center gap-2"
              data-testid="settings-btn"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            
            <button
              onClick={handleSaveSubtitles}
              disabled={saving || segments.length === 0}
              className="btn-ghost py-2 px-4 flex items-center gap-2"
              data-testid="save-btn"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            
            {video?.status === 'completed' && (
              <button
                onClick={handleDownload}
                className="btn-primary py-2 px-4 flex items-center gap-2"
                data-testid="download-btn"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex gap-6 p-6 max-w-7xl mx-auto">
        {/* Left: Video Player */}
        <div className="flex-1 space-y-4">
          {/* Video Container */}
          <div className="glass-card overflow-hidden">
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                src={videoUrl}
                className="max-w-full max-h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onEnded={() => setIsPlaying(false)}
                data-testid="video-player"
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
            
            {/* Video Controls */}
            <div className="p-4 space-y-3">
              {/* Progress Bar */}
              <div 
                className="h-2 bg-slate-200 rounded-full cursor-pointer overflow-hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  handleSeek(percent * duration);
                }}
              >
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow"
                  data-testid="play-pause-btn"
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
          <div className="flex gap-3">
            {video?.status === 'uploaded' && (
              <button
                onClick={handleTranscribe}
                className="btn-primary flex items-center gap-2 flex-1 justify-center py-4"
                data-testid="transcribe-btn"
              >
                <Sparkles className="w-5 h-5" />
                Transcribe Video
              </button>
            )}
            
            {['transcribed', 'translated'].includes(video?.status) && (
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
                  className="btn-secondary flex items-center gap-2 py-3 px-6"
                  data-testid="translate-btn"
                >
                  <Languages className="w-5 h-5" />
                  Translate
                </button>
                
                <button
                  onClick={handleExport}
                  className="btn-primary flex items-center gap-2 py-3 px-6"
                  data-testid="export-btn"
                >
                  <Download className="w-5 h-5" />
                  Export Video
                </button>
              </>
            )}
            
            {isProcessing && (
              <div className="flex items-center gap-3 text-purple-600 bg-purple-50 px-6 py-3 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Processing... Please wait</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Segments Editor */}
        <div className="w-[400px] flex flex-col glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Subtitles
            </h2>
            <p className="text-sm text-slate-500">
              {segments.length} segments
              {video?.source_language && ` • ${video.source_language.toUpperCase()}`}
              {video?.target_language && ` → ${video.target_language.toUpperCase()}`}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {segments.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="font-medium">No subtitles yet</p>
                <p className="text-sm">Transcribe the video to generate subtitles</p>
              </div>
            ) : (
              segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className={`segment-card p-4 cursor-pointer ${activeSegment?.id === segment.id ? 'active' : ''}`}
                  onClick={() => handleSeek(segment.start_time)}
                  data-testid={`segment-${index}`}
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
                    <p className="text-sm text-slate-600 mt-1">
                      {segment.original_text}
                    </p>
                  </div>
                  
                  {/* Translated Text */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Translation</label>
                    <textarea
                      value={segment.translated_text || ''}
                      onChange={(e) => updateSegment(index, 'translated_text', e.target.value)}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      rows={2}
                      placeholder="Enter translation..."
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`translation-input-${index}`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="glass-card border-0 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Subtitle Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Font Size */}
            <div className="space-y-2">
              <label className="ui-label">Font Size: {subtitleSettings.font_size}px</label>
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
              <label className="ui-label">Font Color</label>
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
              <label className="ui-label">Background Color</label>
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
              <label className="ui-label">Background Opacity: {Math.round(subtitleSettings.background_opacity * 100)}%</label>
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
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
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
                Preview subtitle text
              </span>
            </div>
            
            <button
              onClick={handleSaveSettings}
              className="btn-primary w-full"
              data-testid="save-settings-btn"
            >
              Save Settings
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

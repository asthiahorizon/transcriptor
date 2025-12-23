import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, Loader2, 
  Sparkles, Languages, Download, Save, Settings, Clock,
  ChevronDown, Check
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
  const timelineRef = useRef(null);
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
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
      
      // Find active segment
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

  const getStatusColor = (status) => {
    const colors = {
      uploaded: 'text-[#A1A1AA]',
      transcribing: 'text-[#6E44FF]',
      transcribed: 'text-[#D0FF00]',
      translating: 'text-[#6E44FF]',
      translated: 'text-[#D0FF00]',
      rendering: 'text-[#6E44FF]',
      completed: 'text-[#D0FF00]',
      error: 'text-[#FF4D4D]'
    };
    return colors[status] || 'text-[#A1A1AA]';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D0FF00]" />
      </div>
    );
  }

  const videoUrl = `${API}/files/uploads/${video?.filename}`;
  const isProcessing = ['transcribing', 'translating', 'rendering'].includes(video?.status);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <header className="glass px-6 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/10 rounded-sm transition-colors"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold truncate max-w-md">{video?.original_filename}</h1>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${getStatusColor(video?.status)}`}>
                {video?.status?.toUpperCase()}
              </span>
              {isProcessing && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="btn-ghost flex items-center gap-2 py-2"
            data-testid="settings-btn"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          
          <button
            onClick={handleSaveSubtitles}
            disabled={saving || segments.length === 0}
            className="btn-ghost flex items-center gap-2 py-2"
            data-testid="save-btn"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          
          {video?.status === 'completed' && (
            <button
              onClick={handleDownload}
              className="btn-primary flex items-center gap-2 py-2"
              data-testid="download-btn"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Player */}
        <div className="w-1/2 p-6 flex flex-col">
          <div className="relative bg-black rounded-sm overflow-hidden flex-1 flex items-center justify-center">
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
                  className="px-3 py-1 font-mono"
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
          <div className="mt-4 space-y-2">
            {/* Progress Bar */}
            <div 
              className="h-2 bg-[#27272A] rounded-full cursor-pointer overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                handleSeek(percent * duration);
              }}
            >
              <div 
                className="h-full bg-[#D0FF00]"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 bg-[#D0FF00] rounded-sm flex items-center justify-center text-black hover:bg-[#B8E600] transition-colors"
                  data-testid="play-pause-btn"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/10 rounded-sm transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                
                <span className="text-sm font-mono text-[#A1A1AA]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {video?.status === 'uploaded' && (
              <button
                onClick={handleTranscribe}
                className="btn-secondary flex items-center gap-2 flex-1"
                data-testid="transcribe-btn"
              >
                <Sparkles className="w-5 h-5" />
                Transcribe Video
              </button>
            )}
            
            {['transcribed', 'translated'].includes(video?.status) && (
              <>
                <div className="flex items-center gap-2 flex-1">
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="bg-[#121212] border-[#27272A] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-[#27272A]">
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-[#27272A]">
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <button
                    onClick={handleTranslate}
                    className="btn-secondary flex items-center gap-2"
                    data-testid="translate-btn"
                  >
                    <Languages className="w-5 h-5" />
                    Translate
                  </button>
                </div>
                
                <button
                  onClick={handleExport}
                  className="btn-primary flex items-center gap-2"
                  data-testid="export-btn"
                >
                  <Download className="w-5 h-5" />
                  Export Video
                </button>
              </>
            )}
            
            {isProcessing && (
              <div className="flex items-center gap-3 text-[#6E44FF]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing... Please wait</span>
              </div>
            )}
          </div>
        </div>

        {/* Transcript Editor */}
        <div className="w-1/2 border-l border-[#27272A] flex flex-col">
          <div className="px-6 py-4 border-b border-[#27272A]">
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
              SUBTITLES
            </h2>
            <p className="text-sm text-[#A1A1AA]">
              {segments.length} segments • {video?.source_language?.toUpperCase() || 'Unknown'} 
              {video?.target_language && ` → ${video.target_language.toUpperCase()}`}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {segments.length === 0 ? (
              <div className="text-center py-12 text-[#52525B]">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <p>No subtitles yet</p>
                <p className="text-sm">Transcribe the video to generate subtitles</p>
              </div>
            ) : (
              segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className={`p-4 rounded-sm border transition-colors cursor-pointer ${
                    activeSegment?.id === segment.id 
                      ? 'bg-[#6E44FF]/20 border-[#6E44FF]' 
                      : 'bg-[#0A0A0A] border-[#27272A] hover:border-[#3F3F46]'
                  }`}
                  onClick={() => handleSeek(segment.start_time)}
                  data-testid={`segment-${index}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-[#D0FF00]">
                      {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                    </span>
                  </div>
                  
                  {/* Original Text */}
                  <div className="mb-3">
                    <label className="ui-label text-xs mb-1 block">Original</label>
                    <p className="text-sm text-[#A1A1AA] font-mono">
                      {segment.original_text}
                    </p>
                  </div>
                  
                  {/* Translated Text */}
                  <div>
                    <label className="ui-label text-xs mb-1 block">Translation</label>
                    <textarea
                      value={segment.translated_text || ''}
                      onChange={(e) => updateSegment(index, 'translated_text', e.target.value)}
                      className="w-full bg-transparent border-none text-white font-mono text-sm resize-none focus:outline-none"
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

      {/* Timeline */}
      <div className="h-24 border-t border-[#27272A] bg-[#0A0A0A]">
        <div 
          ref={timelineRef}
          className="relative h-full overflow-x-auto"
          onClick={(e) => {
            if (timelineRef.current && duration) {
              const rect = timelineRef.current.getBoundingClientRect();
              const percent = (e.clientX - rect.left + timelineRef.current.scrollLeft) / (duration * 50);
              handleSeek(Math.min(percent * duration, duration));
            }
          }}
        >
          <div 
            className="relative h-full"
            style={{ width: `${Math.max(duration * 50, 800)}px` }}
          >
            {/* Time markers */}
            <div className="absolute top-0 left-0 right-0 h-6 border-b border-[#27272A]">
              {Array.from({ length: Math.ceil(duration / 10) + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 text-xs text-[#52525B] font-mono"
                  style={{ left: `${i * 10 * 50}px` }}
                >
                  {formatTime(i * 10)}
                </div>
              ))}
            </div>
            
            {/* Segments */}
            <div className="absolute top-8 left-0 right-0 bottom-2">
              {segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className={`absolute top-1 bottom-1 rounded-sm cursor-pointer transition-colors ${
                    activeSegment?.id === segment.id 
                      ? 'bg-[#D0FF00]/80 border-[#D0FF00]' 
                      : 'bg-[#6E44FF]/60 border-[#6E44FF] hover:bg-[#6E44FF]/80'
                  } border`}
                  style={{
                    left: `${segment.start_time * 50}px`,
                    width: `${(segment.end_time - segment.start_time) * 50}px`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeek(segment.start_time);
                  }}
                  data-testid={`timeline-segment-${index}`}
                />
              ))}
            </div>
            
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#D0FF00] shadow-[0_0_10px_#D0FF00] z-10 pointer-events-none"
              style={{ left: `${currentTime * 50}px` }}
            />
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-[#0A0A0A] border-[#27272A] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              SUBTITLE SETTINGS
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
                  className="w-12 h-10 rounded-sm cursor-pointer"
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
                  className="w-12 h-10 rounded-sm cursor-pointer"
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
                <SelectTrigger className="bg-[#121212] border-[#27272A] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-[#27272A]">
                  <SelectItem value="bottom" className="text-white">Bottom</SelectItem>
                  <SelectItem value="top" className="text-white">Top</SelectItem>
                  <SelectItem value="middle" className="text-white">Middle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Preview */}
            <div className="p-4 bg-black rounded-sm text-center">
              <span
                className="px-3 py-1 font-mono"
                style={{
                  fontSize: `${Math.min(subtitleSettings.font_size, 24)}px`,
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

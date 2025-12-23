import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Plus, LogOut, Subtitles, FolderOpen, Video, Trash2, 
  Upload, X, Loader2, Play, Clock, Languages
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [projectVideos, setProjectVideos] = useState({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
      
      // Fetch videos for each project
      for (const project of response.data) {
        fetchProjectVideos(project.id);
      }
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectVideos = async (projectId) => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}/videos`);
      setProjectVideos(prev => ({
        ...prev,
        [projectId]: response.data
      }));
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    try {
      const response = await axios.post(`${API}/projects`, {
        name: newProjectName,
        description: newProjectDesc
      });
      setProjects([response.data, ...projects]);
      setShowNewProject(false);
      setNewProjectName('');
      setNewProjectDesc('');
      toast.success('Project created!');
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await axios.delete(`${API}/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
      toast.success('Project deleted');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedProject) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post(
        `${API}/projects/${selectedProject.id}/videos`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      setProjectVideos(prev => ({
        ...prev,
        [selectedProject.id]: [...(prev[selectedProject.id] || []), response.data]
      }));
      
      setShowUpload(false);
      toast.success('Video uploaded! Redirecting to editor...');
      
      // Navigate to editor
      navigate(`/editor/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      uploaded: 'status-uploaded',
      transcribing: 'status-transcribing',
      transcribed: 'status-transcribed',
      translating: 'status-translating',
      translated: 'status-translated',
      rendering: 'status-rendering',
      completed: 'status-completed',
      error: 'status-error'
    };
    return statusMap[status] || 'status-uploaded';
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-8 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D0FF00] rounded-sm flex items-center justify-center">
              <Subtitles className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              CINESCRIPT
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-[#A1A1AA]">
              Welcome, <span className="text-white font-medium">{user?.name}</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-8">
        {/* Title & Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
              MY PROJECTS
            </h1>
            <p className="text-[#A1A1AA]">Manage your video transcription projects</p>
          </div>
          
          <button
            onClick={() => setShowNewProject(true)}
            className="btn-primary flex items-center gap-2"
            data-testid="new-project-btn"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#D0FF00]" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 card p-12">
            <FolderOpen className="w-16 h-16 text-[#52525B] mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No projects yet</h3>
            <p className="text-[#A1A1AA] mb-6">Create your first project to get started</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="btn-primary"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card p-6 group relative"
                data-testid={`project-card-${project.id}`}
              >
                {/* Delete Button */}
                <button
                  onClick={() => deleteProject(project.id)}
                  className="absolute top-4 right-4 p-2 rounded-sm bg-[#FF4D4D]/10 text-[#FF4D4D] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FF4D4D]/20"
                  data-testid={`delete-project-${project.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Project Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#6E44FF]/20 rounded-sm flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-6 h-6 text-[#6E44FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{project.name}</h3>
                    <p className="text-sm text-[#A1A1AA] truncate">
                      {project.description || 'No description'}
                    </p>
                  </div>
                </div>

                {/* Videos List */}
                <div className="space-y-2 mb-4">
                  {(projectVideos[project.id] || []).slice(0, 3).map((video) => (
                    <button
                      key={video.id}
                      onClick={() => navigate(`/editor/${video.id}`)}
                      className="w-full flex items-center gap-3 p-3 bg-[#121212] rounded-sm hover:bg-[#1A1A1A] transition-colors text-left"
                      data-testid={`video-item-${video.id}`}
                    >
                      <div className="w-8 h-8 bg-[#D0FF00]/10 rounded-sm flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-[#D0FF00]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{video.original_filename}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`status-badge ${getStatusBadge(video.status)}`}>
                            {video.status}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-[#52525B] font-mono">
                        {formatDuration(video.duration)}
                      </span>
                    </button>
                  ))}
                  
                  {(projectVideos[project.id]?.length || 0) === 0 && (
                    <p className="text-sm text-[#52525B] text-center py-4">
                      No videos yet
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[#27272A]">
                  <span className="text-xs text-[#52525B]">
                    Created {formatDate(project.created_at)}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowUpload(true);
                    }}
                    className="flex items-center gap-2 text-sm text-[#D0FF00] hover:underline"
                    data-testid={`upload-video-${project.id}`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Video
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="bg-[#0A0A0A] border-[#27272A] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              NEW PROJECT
            </DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Create a new video transcription project
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="ui-label">Project Name</label>
              <input
                type="text"
                className="input w-full"
                placeholder="My Video Project"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                data-testid="project-name-input"
              />
            </div>
            
            <div className="space-y-2">
              <label className="ui-label">Description (Optional)</label>
              <textarea
                className="input w-full h-24 resize-none"
                placeholder="Describe your project..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                data-testid="project-desc-input"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowNewProject(false)}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                className="btn-primary flex-1"
                data-testid="create-project-btn"
              >
                Create Project
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="bg-[#0A0A0A] border-[#27272A] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              UPLOAD VIDEO
            </DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Upload a video to {selectedProject?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <label className="block">
              <div className="border-2 border-dashed border-[#27272A] rounded-sm p-12 text-center hover:border-[#D0FF00]/50 transition-colors cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#D0FF00] animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 mx-auto mb-4 text-[#52525B]" />
                )}
                <p className="font-medium mb-1">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-[#52525B]">
                  MP4, MOV, AVI, MKV (Max: No limit)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleFileUpload}
                disabled={uploading}
                data-testid="video-file-input"
              />
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

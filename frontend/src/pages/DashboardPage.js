import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Plus, LogOut, Subtitles, FolderOpen, Video, Trash2, 
  Upload, Loader2, Clock
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
    <div className="min-h-screen relative">
      {/* Background Decorations */}
      <div className="fixed top-0 left-0 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="glass sticky top-0 z-50 px-8 py-4 border-b border-white/20">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Subtitles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              CineScript
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-slate-500">
              Welcome, <span className="text-slate-700 font-medium">{user?.name}</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-8 max-w-7xl mx-auto relative z-10">
        {/* Title & Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              My Projects
            </h1>
            <p className="text-slate-500">Manage your video transcription projects</p>
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
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 glass-card p-12">
            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No projects yet</h3>
            <p className="text-slate-500 mb-6">Create your first project to get started</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="btn-primary"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="glass-card p-6 group relative animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`project-card-${project.id}`}
              >
                {/* Delete Button */}
                <button
                  onClick={() => deleteProject(project.id)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                  data-testid={`delete-project-${project.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Project Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-slate-800 truncate">{project.name}</h3>
                    <p className="text-sm text-slate-500 truncate">
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
                      className="w-full flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-colors text-left border border-slate-100"
                      data-testid={`video-item-${video.id}`}
                    >
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{video.original_filename}</p>
                        <span className={`status-badge ${getStatusBadge(video.status)}`}>
                          {video.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatDuration(video.duration)}
                      </span>
                    </button>
                  ))}
                  
                  {(projectVideos[project.id]?.length || 0) === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No videos yet
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(project.created_at)}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowUpload(true);
                    }}
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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
        <DialogContent className="glass-card border-0 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              New Project
            </DialogTitle>
            <DialogDescription className="text-slate-500">
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
        <DialogContent className="glass-card border-0 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Upload Video
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Upload a video to {selectedProject?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <label className="block">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                )}
                <p className="font-medium text-slate-700 mb-1">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-slate-400">
                  MP4, MOV, AVI, MKV
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

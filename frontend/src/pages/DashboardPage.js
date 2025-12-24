import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Plus, LogOut, Subtitles, FolderOpen, Video, Trash2, 
  Upload, Loader2, Clock, Globe, Edit, Shield, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LANGUAGE_NAMES = {
  en: 'Anglais', fr: 'Français', es: 'Espagnol', de: 'Allemand',
  it: 'Italien', pt: 'Portugais', zh: 'Chinois', ja: 'Japonais',
  ko: 'Coréen', ar: 'Arabe', hi: 'Hindi', ru: 'Russe',
};

const LanguageBadge = ({ code, type }) => {
  if (!code) return null;
  const colors = {
    source: 'bg-blue-100 text-blue-700 border-blue-200',
    target: 'bg-purple-100 text-purple-700 border-purple-200'
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[type]}`}>
      <Globe className="w-3 h-3" />
      {LANGUAGE_NAMES[code] || code.toUpperCase()}
    </span>
  );
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [projectVideos, setProjectVideos] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

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
      toast.error(t('errorLoadingProjects'));
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
      toast.error(t('enterProjectName'));
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
      toast.success(t('projectCreated'));
    } catch (error) {
      toast.error(t('errorCreatingProject'));
    }
  };

  const updateProject = async () => {
    if (!editProjectName.trim()) {
      toast.error(t('enterProjectName'));
      return;
    }

    try {
      const response = await axios.put(`${API}/projects/${editingProject.id}`, {
        name: editProjectName,
        description: editProjectDesc
      });
      setProjects(projects.map(p => p.id === editingProject.id ? response.data : p));
      setShowEditProject(false);
      setEditingProject(null);
      toast.success(t('projectUpdated'));
    } catch (error) {
      toast.error(t('errorUpdatingProject'));
    }
  };

  const openEditProject = (project) => {
    setEditingProject(project);
    setEditProjectName(project.name);
    setEditProjectDesc(project.description || '');
    setShowEditProject(true);
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm(t('confirmDeleteProject'))) return;
    
    try {
      await axios.delete(`${API}/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
      toast.success(t('projectDeleted'));
    } catch (error) {
      toast.error(t('errorDeletingProject'));
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
      toast.success(t('videoUploaded'));
      navigate(`/editor/${response.data.id}`);
    } catch (error) {
      toast.error(t('errorUploading'));
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
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
      uploaded: { class: 'bg-slate-100 text-slate-600', label: t('uploaded') },
      transcribing: { class: 'bg-purple-100 text-purple-600', label: t('transcribing') },
      transcribed: { class: 'bg-emerald-100 text-emerald-600', label: t('transcribed') },
      translating: { class: 'bg-purple-100 text-purple-600', label: t('translating') },
      translated: { class: 'bg-emerald-100 text-emerald-600', label: t('translated') },
      rendering: { class: 'bg-purple-100 text-purple-600', label: t('rendering') },
      completed: { class: 'bg-emerald-100 text-emerald-600', label: t('completed') },
      error: { class: 'bg-red-100 text-red-600', label: t('error') }
    };
    const info = statusMap[status] || statusMap.uploaded;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.class}`}>{info.label}</span>;
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
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
              Transcriptor
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            {user?.is_admin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
              >
                <Shield className="w-5 h-5" />
                {t('admin')}
              </button>
            )}
            <LanguageSelector />
            <span className="text-slate-500">
              {t('hello')}, <span className="text-slate-700 font-medium">{user?.name}</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
              {t('logout')}
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
              {t('myProjects')}
            </h1>
            <p className="text-slate-500">{t('manageProjects')}</p>
          </div>
          
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow flex items-center gap-2"
            data-testid="new-project-btn"
          >
            <Plus className="w-5 h-5" />
            {t('newProject')}
          </button>
        </div>

        {/* Search */}
        <div className="glass-card p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchProject')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 glass-card p-12">
            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">{t('noProjects')}</h3>
            <p className="text-slate-500 mb-6">{t('createFirstProject')}</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-5 py-3 rounded-xl shadow-lg"
            >
              {t('createProject')}
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects
              .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((project, index) => (
              <div
                key={project.id}
                className="glass-card p-6 group relative animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`project-card-${project.id}`}
              >
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditProject(project)}
                    className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors"
                    data-testid={`edit-project-${project.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    data-testid={`delete-project-${project.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Project Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-slate-800 truncate">{project.name}</h3>
                    <p className="text-sm text-slate-500 truncate">
                      {project.description || t('noDescription')}
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
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {getStatusBadge(video.status)}
                          {video.source_language && <LanguageBadge code={video.source_language} type="source" />}
                          {video.target_language && <LanguageBadge code={video.target_language} type="target" />}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatDuration(video.duration)}
                      </span>
                    </button>
                  ))}
                  
                  {(projectVideos[project.id]?.length || 0) === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      Aucune vidéo
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
                    Uploader
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-4 text-center">
        <p className="text-sm text-slate-400">© 2024 Asthia Horizon Sàrl</p>
      </footer>

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="bg-white border border-slate-200 shadow-xl rounded-2xl sm:max-w-md fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Nouveau Projet
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Créez un nouveau projet de transcription vidéo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="ui-label">Nom du projet</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Mon Projet Vidéo"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="ui-label">Description (optionnel)</label>
              <textarea
                className="input w-full h-24 resize-none"
                placeholder="Décrivez votre projet..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowNewProject(false)}
                className="btn-ghost flex-1"
              >
                Annuler
              </button>
              <button
                onClick={createProject}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg"
              >
                Créer
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditProject} onOpenChange={setShowEditProject}>
        <DialogContent className="bg-white border border-slate-200 shadow-xl rounded-2xl sm:max-w-md fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Modifier le Projet
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Modifiez les informations du projet
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="ui-label">Nom du projet</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Mon Projet Vidéo"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="ui-label">Description (optionnel)</label>
              <textarea
                className="input w-full h-24 resize-none"
                placeholder="Décrivez votre projet..."
                value={editProjectDesc}
                onChange={(e) => setEditProjectDesc(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowEditProject(false)}
                className="btn-ghost flex-1"
              >
                Annuler
              </button>
              <button
                onClick={updateProject}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="bg-white border border-slate-200 shadow-xl rounded-2xl sm:max-w-md fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Uploader une vidéo
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Ajouter une vidéo à {selectedProject?.name}
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
                  {uploading ? 'Upload en cours...' : 'Cliquez pour uploader'}
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
              />
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

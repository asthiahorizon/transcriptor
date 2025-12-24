import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Subtitles, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Bienvenue !');
      } else {
        if (!formData.name.trim()) {
          toast.error('Veuillez entrer votre nom');
          setLoading(false);
          return;
        }
        await register(formData.email, formData.password, formData.name);
        toast.success('Compte créé avec succès !');
      }
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Une erreur est survenue';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />

      <div className="w-full max-w-md glass-card p-8 animate-fade-in relative z-10">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Subtitles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Transcriptor
          </span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {isLogin ? 'Bienvenue' : 'Créer un compte'}
          </h1>
          <p className="text-slate-500">
            {isLogin 
              ? 'Entrez vos identifiants pour accéder à vos projets' 
              : 'Commencez à créer des vidéos sous-titrées'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <label className="ui-label">Nom complet</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  className="input w-full pl-12"
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="name-input"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="ui-label">Adresse email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                className="input w-full pl-12"
                placeholder="vous@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="email-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="ui-label">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                className="input w-full pl-12"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                data-testid="password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow flex items-center justify-center gap-2"
            data-testid="submit-btn"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isLogin ? 'Se connecter' : 'Créer le compte'
            )}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-slate-500 mt-6">
          {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
            data-testid="toggle-auth-btn"
          >
            {isLogin ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  );
}

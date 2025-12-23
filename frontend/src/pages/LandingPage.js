import { useNavigate } from 'react-router-dom';
import { Subtitles, Languages, Download, Sparkles, ArrowRight, Shield, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/pricing');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-200/20 rounded-full blur-3xl" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 lg:px-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Subtitles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            TranscriptorIA
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow flex items-center gap-2"
            >
              Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth')}
                className="text-slate-600 font-medium hover:text-slate-800 transition-colors"
              >
                Se connecter
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow flex items-center gap-2"
              >
                S'abonner
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-8 lg:px-16 pt-16 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            {/* Privacy Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">IA Privée - Vos données restent confidentielles</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <span className="text-slate-800">Transcrivez & Traduisez</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Vos Vidéos
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Transformez vos vidéos avec une transcription IA et des sous-titres professionnels. 
              Uploadez, transcrivez, traduisez et exportez en toute simplicité.
            </p>

            {/* Privacy Notice */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200 mb-10">
              <Lock className="w-5 h-5 text-indigo-600" />
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">100% Privé</span> — Propulsé par Infomaniak AI, aucune donnée n'est envoyée ou analysée à l'extérieur.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                data-testid="hero-get-started-btn"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow flex items-center gap-2"
              >
                Voir les tarifs
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">1. Uploadez & Transcrivez</h3>
              <p className="text-slate-600 leading-relaxed">
                Uploadez votre vidéo et laissez notre IA extraire chaque mot avec des timestamps précis.
              </p>
            </div>

            <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                <Languages className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">2. Traduisez & Éditez</h3>
              <p className="text-slate-600 leading-relaxed">
                Traduisez les sous-titres dans n'importe quelle langue et éditez le texte facilement.
              </p>
            </div>

            <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <Download className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">3. Exportez la Vidéo</h3>
              <p className="text-slate-600 leading-relaxed">
                Personnalisez les styles et exportez votre vidéo avec les sous-titres incrustés.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 lg:px-16 py-8 border-t border-slate-200/50">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Subtitles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-700">TranscriptorIA</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2024 Asthia Horizon Sàrl. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

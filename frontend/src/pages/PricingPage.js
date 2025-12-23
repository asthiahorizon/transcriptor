import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Subtitles, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PricingPage() {
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isSubscribed()) {
      navigate('/dashboard');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/subscription/checkout`, {
        origin_url: window.location.origin
      });
      
      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Erreur lors de la création de la session de paiement');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 lg:px-16">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Subtitles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            TranscriptorIA
          </span>
        </div>
        
        <div className="w-20" />
      </nav>

      {/* Pricing Section */}
      <section className="relative z-10 px-8 lg:px-16 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Tarification Simple
            </h1>
            <p className="text-xl text-slate-600">
              Un seul plan, toutes les fonctionnalités
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto">
            <div className="glass-card p-8 relative overflow-hidden">
              {/* Popular Badge */}
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-white text-xs font-semibold">
                Recommandé
              </div>

              <h2 className="text-2xl font-bold text-slate-800 mb-2">Pro</h2>
              <p className="text-slate-500 mb-6">Accès complet à TranscriptorIA</p>

              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-extrabold text-slate-800">10</span>
                <span className="text-2xl font-bold text-slate-800">CHF</span>
                <span className="text-slate-500">/ mois</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">Transcription illimitée</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">Traduction dans 12+ langues</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">Export vidéo avec sous-titres</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">Projets illimités</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">IA 100% privée (Infomaniak)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">Support prioritaire</span>
                </li>
              </ul>

              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSubscribed() ? (
                  'Accéder au Dashboard'
                ) : user ? (
                  'S\'abonner maintenant'
                ) : (
                  'Créer un compte'
                )}
              </button>

              {!user && (
                <p className="text-center text-sm text-slate-500 mt-4">
                  Déjà un compte ?{' '}
                  <button
                    onClick={() => navigate('/auth')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Se connecter
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* FAQ or Additional Info */}
          <div className="text-center mt-12">
            <p className="text-slate-500">
              Paiement sécurisé via Stripe • Annulation possible à tout moment
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 lg:px-16 py-8 border-t border-slate-200/50">
        <div className="text-center">
          <p className="text-sm text-slate-500">
            © 2024 Asthia Horizon Sàrl. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Subtitles, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId) => {
    const maxAttempts = 10;
    
    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/subscription/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
        await refreshUser();
        toast.success('Abonnement activé avec succès !');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else if (response.data.status === 'expired') {
        setStatus('expired');
      } else {
        // Still pending, continue polling
        setAttempts(prev => prev + 1);
        setTimeout(() => pollPaymentStatus(sessionId), 2000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setAttempts(prev => prev + 1);
      setTimeout(() => pollPaymentStatus(sessionId), 2000);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />

      <div className="glass-card p-12 max-w-md mx-4 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Subtitles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            TranscriptorIA
          </span>
        </div>

        {status === 'checking' && (
          <>
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Vérification du paiement...
            </h1>
            <p className="text-slate-500">
              Veuillez patienter pendant que nous confirmons votre paiement.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Paiement réussi !
            </h1>
            <p className="text-slate-500 mb-6">
              Votre abonnement est maintenant actif. Redirection vers le dashboard...
            </p>
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          </>
        )}

        {status === 'expired' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⏱️</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Session expirée
            </h1>
            <p className="text-slate-500 mb-6">
              La session de paiement a expiré. Veuillez réessayer.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
            >
              Retour aux tarifs
            </button>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Vérification en cours
            </h1>
            <p className="text-slate-500 mb-6">
              Le paiement est en cours de traitement. Vous recevrez un email de confirmation.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
            >
              Aller au Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Erreur
            </h1>
            <p className="text-slate-500 mb-6">
              Une erreur est survenue. Veuillez réessayer.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
            >
              Retour aux tarifs
            </button>
          </>
        )}
      </div>
    </div>
  );
}

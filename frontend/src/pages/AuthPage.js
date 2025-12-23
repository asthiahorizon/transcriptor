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
        toast.success('Welcome back!');
      } else {
        if (!formData.name.trim()) {
          toast.error('Please enter your name');
          setLoading(false);
          return;
        }
        await register(formData.email, formData.password, formData.name);
        toast.success('Account created successfully!');
      }
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'An error occurred';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#D0FF00] rounded-sm flex items-center justify-center">
              <Subtitles className="w-7 h-7 text-black" />
            </div>
            <span className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              CINESCRIPT
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
            </h1>
            <p className="text-[#A1A1AA]">
              {isLogin 
                ? 'Enter your credentials to access your projects' 
                : 'Start creating subtitled videos today'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="ui-label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525B]" />
                  <input
                    type="text"
                    className="input w-full pl-12"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="name-input"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="ui-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525B]" />
                <input
                  type="email"
                  className="input w-full pl-12"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ui-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525B]" />
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
              className="btn-primary w-full flex items-center justify-center gap-2"
              data-testid="submit-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-[#A1A1AA]">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#D0FF00] hover:underline font-medium"
              data-testid="toggle-auth-btn"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6E44FF]/20 to-[#D0FF00]/10" />
        <img
          src="https://images.unsplash.com/photo-1639192361244-98775fed5c51?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
          alt="Creative studio"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              PROFESSIONAL<br />SUBTITLES
            </h2>
            <p className="text-[#A1A1AA] max-w-md">
              AI-powered transcription and translation for creators who demand excellence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

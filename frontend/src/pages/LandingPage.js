import { useNavigate } from 'react-router-dom';
import { Play, Subtitles, Languages, Download, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
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
            CineScript
          </span>
        </div>
        
        <button
          data-testid="nav-get-started-btn"
          onClick={handleGetStarted}
          className="btn-primary flex items-center gap-2"
        >
          {user ? 'Dashboard' : 'Get Started'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-8 lg:px-16 pt-16 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">AI-Powered Transcription</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <span className="text-slate-800">Transcribe & Translate</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Your Videos
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Transform your videos with AI-powered transcription and professional subtitles. 
              Upload, transcribe, translate, and export seamlessly.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                data-testid="hero-get-started-btn"
                onClick={handleGetStarted}
                className="btn-primary text-lg px-8 py-4 flex items-center gap-2"
              >
                Start Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="btn-ghost text-lg px-8 py-4 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-20" style={{ animationDelay: '0.2s' }}>
            {/* Step 1 */}
            <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">1. Upload & Transcribe</h3>
              <p className="text-slate-600 leading-relaxed">
                Upload your video and let our AI extract every word with precise timestamps.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                <Languages className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">2. Translate & Edit</h3>
              <p className="text-slate-600 leading-relaxed">
                Translate subtitles to any language and edit text with our intuitive editor.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <Download className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">3. Export Video</h3>
              <p className="text-slate-600 leading-relaxed">
                Customize styles and export your video with burned-in subtitles.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-16 mt-20">
            <div className="text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">50+</p>
              <p className="text-slate-500 mt-1">Languages</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">99%</p>
              <p className="text-slate-500 mt-1">Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">2x</p>
              <p className="text-slate-500 mt-1">Faster</p>
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
            <span className="font-semibold text-slate-700">CineScript</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2024 CineScript. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

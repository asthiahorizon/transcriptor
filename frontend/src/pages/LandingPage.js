import { useNavigate } from 'react-router-dom';
import { Play, Subtitles, Languages, Download, Sparkles, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Hero Glow Background */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      
      {/* Noise Overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 lg:px-16">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#D0FF00] rounded-sm flex items-center justify-center">
            <Subtitles className="w-6 h-6 text-black" />
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            CINESCRIPT
          </span>
        </div>
        
        <button
          data-testid="nav-get-started-btn"
          onClick={handleGetStarted}
          className="btn-primary"
        >
          {user ? 'Dashboard' : 'Get Started'}
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-8 lg:px-16 pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <p className="ui-label text-[#D0FF00]">AI-Powered Video Transcription</p>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                TRANSCRIBE.<br />
                <span className="text-[#6E44FF]">TRANSLATE.</span><br />
                SUBTITLE.
              </h1>
            </div>
            
            <p className="text-lg text-[#A1A1AA] max-w-lg leading-relaxed">
              Transform your videos with AI-powered transcription and professional subtitles. 
              Upload, transcribe, translate, and export—all in one seamless workflow.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                data-testid="hero-get-started-btn"
                onClick={handleGetStarted}
                className="btn-primary flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Start Free
              </button>
              <button className="btn-ghost flex items-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-12 pt-8 border-t border-[#27272A]">
              <div>
                <p className="text-3xl font-bold text-[#D0FF00]">50+</p>
                <p className="text-sm text-[#A1A1AA]">Languages</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#D0FF00]">99%</p>
                <p className="text-sm text-[#A1A1AA]">Accuracy</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#D0FF00]">2x</p>
                <p className="text-sm text-[#A1A1AA]">Faster</p>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative aspect-video rounded-sm overflow-hidden border border-[#27272A] bg-[#0A0A0A]">
              <img
                src="https://images.unsplash.com/photo-1649456674221-12b66d8a6fa8?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                alt="Professional video editing"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
              
              {/* Floating UI Elements */}
              <div className="absolute bottom-4 left-4 right-4 glass rounded-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-[#D0FF00] rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-[#A1A1AA]">00:02:34 / 00:05:00</span>
                </div>
                <div className="h-1 bg-[#27272A] rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-[#D0FF00]" />
                </div>
                <p className="mt-3 text-sm font-mono text-center">
                  "The future of video content creation is here..."
                </p>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#6E44FF] opacity-20 blur-3xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#D0FF00] opacity-10 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-8 lg:px-16 py-24 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="ui-label text-[#6E44FF] mb-4">How It Works</p>
            <h2 className="text-4xl lg:text-5xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              THREE SIMPLE STEPS
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card p-8 group hover:border-[#D0FF00]/50 transition-all duration-300">
              <div className="w-16 h-16 bg-[#D0FF00]/10 rounded-sm flex items-center justify-center mb-6 group-hover:bg-[#D0FF00]/20 transition-colors">
                <Sparkles className="w-8 h-8 text-[#D0FF00]" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Upload & Transcribe</h3>
              <p className="text-[#A1A1AA]">
                Upload your video and let our AI-powered engine extract every word with precise timestamps.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card p-8 group hover:border-[#6E44FF]/50 transition-all duration-300">
              <div className="w-16 h-16 bg-[#6E44FF]/10 rounded-sm flex items-center justify-center mb-6 group-hover:bg-[#6E44FF]/20 transition-colors">
                <Languages className="w-8 h-8 text-[#6E44FF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Translate & Edit</h3>
              <p className="text-[#A1A1AA]">
                Translate subtitles to any language. Edit text and timing with our intuitive timeline editor.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card p-8 group hover:border-[#D0FF00]/50 transition-all duration-300">
              <div className="w-16 h-16 bg-[#D0FF00]/10 rounded-sm flex items-center justify-center mb-6 group-hover:bg-[#D0FF00]/20 transition-colors">
                <Download className="w-8 h-8 text-[#D0FF00]" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Export Video</h3>
              <p className="text-[#A1A1AA]">
                Customize subtitle styles and export your video with burned-in subtitles ready to share.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-8 lg:px-16 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
            READY TO CREATE?
          </h2>
          <p className="text-lg text-[#A1A1AA] mb-8">
            Join thousands of creators using CineScript to reach global audiences.
          </p>
          <button
            data-testid="cta-get-started-btn"
            onClick={handleGetStarted}
            className="btn-primary text-lg px-8 py-4"
          >
            Start Creating Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 lg:px-16 py-8 border-t border-[#27272A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D0FF00] rounded-sm flex items-center justify-center">
              <Subtitles className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold">CINESCRIPT</span>
          </div>
          <p className="text-sm text-[#52525B]">
            © 2024 CineScript. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

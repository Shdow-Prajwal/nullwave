import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Database,
  Music,
  Activity,
  Layers,
  Sliders,
  Compass,
  CheckCircle2,
  User,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { UserDbRecord } from '../services/vectorDb/userDbService';

interface LandingPageProps {
  currentUser: UserDbRecord | null;
  onLaunchMainApp: () => void;
  onCreateAndLaunchUser: (username: string, email?: string) => void;
  onOpenArchitecture: () => void;
  dominantVibe?: string;
  catalogLength?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onLaunchMainApp,
  onCreateAndLaunchUser,
  onOpenArchitecture,
  dominantVibe = 'Calibrated Acoustic Profile',
  catalogLength = 39,
}) => {
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [inputError, setInputError] = useState('');

  const handleStartClick = () => {
    if (currentUser) {
      // Returning user - quick launch directly
      onLaunchMainApp();
    } else {
      // First-time visit - prompt for user's name
      setIsOnboardingModalOpen(true);
    }
  };

  const handleSubmitOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setInputError('Please enter your name to proceed');
      return;
    }
    setInputError('');
    onCreateAndLaunchUser(nameInput.trim(), emailInput.trim() || undefined);
    setIsOnboardingModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#140D0F] text-[#F6EBDD] flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#FF7F4D]/30 selection:text-[#F6EBDD]">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[550px] bg-gradient-to-b from-[#FF7F4D]/25 via-[#E88C98]/12 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] bg-emerald-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-fuchsia-600/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Top Simple Glass Nav */}
      <header className="relative z-20 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 ring-1 ring-white/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">VectorVibe</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25">
                pgvector 8D
              </span>
            </div>
            <p className="text-[11px] text-white/50 -mt-0.5">PostgreSQL Acoustic Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenArchitecture}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Schema &amp; DDL</span>
          </button>

          {currentUser ? (
            <button
              onClick={onLaunchMainApp}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all shadow-md shadow-white/10 flex items-center gap-2"
            >
              <span>Continue as {currentUser.username}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setIsOnboardingModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-xs transition-all"
            >
              Get Started
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 sm:py-20 flex-1 flex flex-col items-center justify-center text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.03] border border-white/10 text-violet-300 shadow-inner mb-6">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>High-Dimensional Audio Discovery &middot; Real Studio Audio</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] max-w-4xl">
          Music tuned to your exact{' '}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            acoustic vector.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed">
          Experience intelligent recommendation powered by a normalized PostgreSQL schema,
          8-dimensional feature embeddings, and real-time pgvector KNN search across 1.2M+ Spotify tracks.
        </p>

        {/* Personalized Returning User Card or First-Time CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 w-full max-w-md">
          {currentUser ? (
            <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 backdrop-blur-xl flex flex-col gap-3 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-base text-white shadow-md">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <span>Welcome back, {currentUser.username}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">
                        Saved in DB
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50">{dominantVibe}</p>
                  </div>
                </div>

                <span className="font-mono text-[10px] text-white/40">User #{currentUser.user_id}</span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={onLaunchMainApp}
                  className="flex-1 py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs transition-all hover:bg-white/90 shadow-lg shadow-white/10 flex items-center justify-center gap-2"
                >
                  <span>Quick Launch Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsOnboardingModalOpen(true)}
                  className="py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors"
                  title="Create another user profile"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <button
                type="button"
                onClick={handleStartClick}
                className="cosmic-button px-8 py-3.5 min-h-[52px] text-sm text-white font-semibold shadow-xl w-full sm:w-auto"
              >
                <div className="points_wrapper">
                  <i className="point"></i>
                  <i className="point"></i>
                  <i className="point"></i>
                  <i className="point"></i>
                </div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>Enter Vector Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>

              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <span>First time? Clicking will ask for your name to save your profile</span>
                <span>&middot;</span>
                <button
                  onClick={onOpenArchitecture}
                  className="text-violet-400 hover:text-violet-300 underline underline-offset-4"
                >
                  Inspect DDL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
          <div className="p-5 rounded-2xl glass">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300 mb-3">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">8D Vector Space</h3>
            <p className="text-xs text-white/60 mt-1">
              Energy, danceability, valence, BPM, vibe, acoustic harmonics, and instrumentalness.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 mb-3">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">PostgreSQL &amp; pgvector</h3>
            <p className="text-xs text-white/60 mt-1">
              Normalized schema with users, audio_features, performs, tracks, and IVFFlat/HNSW indexes.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 mb-3">
              <Music className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Curated Audio Cache</h3>
            <p className="text-xs text-white/60 mt-1">
              {catalogLength} verified tracks in memory cache with 30s studio audio preview streaming.
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-20 max-w-7xl mx-auto w-full px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
        <div className="flex items-center gap-2">
          <span>VectorVibe Studio</span>
          <span>&middot;</span>
          <span>PostgreSQL + pgvector Architecture</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onOpenArchitecture} className="hover:text-white transition-colors">
            Database Architecture
          </button>
          <span>&middot;</span>
          <span>1.2M+ Kaggle Dataset</span>
        </div>
      </footer>

      {/* First-Time User Onboarding Modal */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl p-6 text-zinc-100 ring-1 ring-white/5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Welcome to VectorVibe</h3>
                <p className="text-xs text-white/50">Create your PostgreSQL user record</p>
              </div>
            </div>

            <p className="text-xs text-white/70 mb-5 leading-relaxed">
              Before entering, please enter your name. Your 8D acoustic taste vector will be initialized
              and persisted to the <code className="text-violet-300 font-mono">users</code> database table.
            </p>

            <form onSubmit={handleSubmitOnboarding} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80 block">
                  Your Name / Username <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Miles Davis, Elena, Alex"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (inputError) setInputError('');
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-500/80 transition-colors"
                />
                {inputError && <p className="text-[11px] text-rose-400">{inputError}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80 block">
                  Email Address <span className="text-white/40 text-[10px]">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. miles@vectorvibe.studio"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-500/80 transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-white text-[#0b0b10] text-xs font-semibold hover:bg-white/90 transition-all shadow-md shadow-white/10 flex items-center gap-1.5"
                >
                  <span>Start Exploring</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

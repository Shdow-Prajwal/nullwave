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
  ChevronDown,
  Users,
  Check,
  UserPlus,
  ShieldCheck,
  Search,
  X,
  Play,
  Heart,
} from 'lucide-react';
import { UserDbRecord } from '../services/vectorDb/userDbService';

interface LandingPageProps {
  currentUser: UserDbRecord | null;
  allUsers?: UserDbRecord[];
  onSelectUser?: (userId: number) => void;
  onLaunchMainApp: () => void;
  onCreateAndLaunchUser: (username: string, email?: string) => void;
  onOpenArchitecture: () => void;
  dominantVibe?: string;
  catalogLength?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  allUsers = [],
  onSelectUser,
  onLaunchMainApp,
  onCreateAndLaunchUser,
  onOpenArchitecture,
  dominantVibe = 'Calibrated Acoustic Profile',
  catalogLength = 39,
}) => {
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isAllUsersModalOpen, setIsAllUsersModalOpen] = useState(false);
  const [isTopNavDropdownOpen, setIsTopNavDropdownOpen] = useState(false);
  const [showInlineUserSwitcher, setShowInlineUserSwitcher] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [inputError, setInputError] = useState('');

  const handleStartClick = () => {
    if (currentUser) {
      onLaunchMainApp();
    } else if (allUsers.length > 0) {
      setIsAllUsersModalOpen(true);
    } else {
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

  const handleSwitchUserAndLaunch = (userId: number) => {
    if (onSelectUser) {
      onSelectUser(userId);
    }
    setIsAllUsersModalOpen(false);
    setIsTopNavDropdownOpen(false);
    onLaunchMainApp();
  };

  const handleSelectUserOnly = (userId: number) => {
    if (onSelectUser) {
      onSelectUser(userId);
    }
    setIsTopNavDropdownOpen(false);
  };

  // Filtered users for search in modal
  const filteredUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      String(u.user_id).includes(userSearchQuery)
  );

  return (
    <div className="min-h-screen bg-[#140D0F] text-[#F6EBDD] flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#FF7F4D]/30 selection:text-[#F6EBDD]">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[550px] bg-gradient-to-b from-[#FF7F4D]/25 via-[#E88C98]/12 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] bg-emerald-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-fuchsia-600/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Top Glass Nav */}
      <header className="relative z-30 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
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
          {/* Architecture DDL button */}
          <button
            type="button"
            onClick={onOpenArchitecture}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Schema &amp; DDL</span>
          </button>

          {/* All Users button in Header */}
          {allUsers.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTopNavDropdownOpen(!isTopNavDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-medium transition-all"
                title="Switch active user or view all profiles"
              >
                <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
                  {(currentUser?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[90px] truncate">{currentUser?.username || 'Select User'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-violet-500/20 text-violet-300">
                  {allUsers.length}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-white/50 transition-transform ${
                    isTopNavDropdownOpen ? 'rotate-180 text-violet-300' : ''
                  }`}
                />
              </button>

              {/* Header Quick User Dropdown */}
              {isTopNavDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsTopNavDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#120E15]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-50 text-xs text-white ring-1 ring-white/10 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-2 border-b border-white/10 flex items-center justify-between text-[11px] text-white/60">
                      <span>PostgreSQL Profiles</span>
                      <span className="font-mono text-violet-300">{allUsers.length} users</span>
                    </div>

                    <div className="max-h-48 overflow-y-auto py-1 space-y-1 custom-scrollbar">
                      {allUsers.map((u) => {
                        const isSelected = u.user_id === currentUser?.user_id;
                        return (
                          <button
                            key={u.user_id}
                            type="button"
                            onClick={() => handleSelectUserOnly(u.user_id)}
                            className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                              isSelected
                                ? 'bg-violet-600/25 border border-violet-500/40 text-white'
                                : 'hover:bg-white/[0.06] text-white/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium truncate flex items-center gap-1">
                                  <span>{u.username}</span>
                                  <span className="text-[9px] font-mono text-white/40">
                                    #{u.user_id}
                                  </span>
                                </div>
                                <div className="text-[9px] text-white/40 truncate">{u.email}</div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-1 border-t border-white/10 flex items-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsTopNavDropdownOpen(false);
                          setIsAllUsersModalOpen(true);
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white text-center transition-colors"
                      >
                        View Full Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsTopNavDropdownOpen(false);
                          setIsOnboardingModalOpen(true);
                        }}
                        className="py-1.5 px-2 rounded-lg bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/30 text-[11px] text-violet-200 transition-colors flex items-center gap-1"
                        title="Create new user profile"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quick Launch CTA */}
          {currentUser ? (
            <button
              type="button"
              onClick={onLaunchMainApp}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all shadow-md shadow-white/10 flex items-center gap-2"
            >
              <span>Continue as {currentUser.username}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsOnboardingModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-xs transition-all"
            >
              Get Started
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10 sm:py-16 flex-1 flex flex-col items-center justify-center text-center">
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

        {/* Personalized Returning User Card & Multi-User Switcher */}
        <div className="mt-10 flex flex-col items-center gap-4 w-full max-w-xl">
          {currentUser ? (
            <div className="w-full p-5 rounded-3xl bg-white/[0.04] border border-white/10 ring-1 ring-white/5 backdrop-blur-2xl flex flex-col gap-4 text-left shadow-2xl">
              {/* Top card row: Avatar + Current User Identity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-violet-500/25 ring-2 ring-white/20">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>Welcome back, {currentUser.username}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                        Saved in DB
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mt-0.5">{dominantVibe}</p>
                    <p className="text-[11px] text-white/40">{currentUser.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-1 rounded-lg">
                    User #{currentUser.user_id}
                  </span>
                  <p className="text-[10px] text-white/40 mt-1">
                    {allUsers.length} total profile{allUsers.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              {/* Main Action Buttons: Launch Studio + Switch Profile */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={onLaunchMainApp}
                  className="flex-1 py-3 px-5 rounded-xl bg-white text-black font-semibold text-xs transition-all hover:bg-white/90 shadow-lg shadow-white/10 flex items-center justify-center gap-2"
                >
                  <span>Launch Studio as {currentUser.username}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Option to see all users / switch profiles */}
                <button
                  type="button"
                  onClick={() => setIsAllUsersModalOpen(true)}
                  className="py-3 px-4 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-200 text-xs font-medium transition-all flex items-center justify-center gap-2"
                  title="See all profiles saved in PostgreSQL"
                >
                  <Users className="w-4 h-4 text-violet-300" />
                  <span>See All Users ({allUsers.length})</span>
                </button>

                {/* Create another user button */}
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(true)}
                  className="py-3 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  title="Create another user profile"
                >
                  <UserPlus className="w-4 h-4 text-white/70" />
                  <span className="hidden sm:inline">Add</span>
                </button>
              </div>

              {/* Inline Quick Profile Switcher (When there are multiple users) */}
              {allUsers.length > 1 && (
                <div className="pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-white/50 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-violet-400" />
                      <span>Switch active profile directly:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowInlineUserSwitcher(!showInlineUserSwitcher)}
                      className="text-[10px] text-violet-300 hover:text-white underline underline-offset-2"
                    >
                      {showInlineUserSwitcher ? 'Collapse' : 'Show All'}
                    </button>
                  </div>

                  {/* Horizontal quick avatar chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {allUsers.slice(0, showInlineUserSwitcher ? allUsers.length : 5).map((u) => {
                      const isSelected = u.user_id === currentUser.user_id;
                      return (
                        <button
                          key={u.user_id}
                          type="button"
                          onClick={() => handleSelectUserOnly(u.user_id)}
                          className={`flex items-center gap-2 py-1.5 px-3 rounded-xl transition-all shrink-0 text-xs ${
                            isSelected
                              ? 'bg-violet-600/30 border border-violet-400/50 text-white shadow-sm'
                              : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium max-w-[100px] truncate">{u.username}</span>
                          {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                        </button>
                      );
                    })}

                    {allUsers.length > 5 && !showInlineUserSwitcher && (
                      <button
                        type="button"
                        onClick={() => setIsAllUsersModalOpen(true)}
                        className="py-1.5 px-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-[11px] text-violet-300 shrink-0"
                      >
                        +{allUsers.length - 5} more
                      </button>
                    )}
                  </div>
                </div>
              )}
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

              {allUsers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAllUsersModalOpen(true)}
                  className="text-xs text-violet-300 hover:text-white flex items-center gap-1.5 transition-colors mt-2"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Choose from {allUsers.length} existing database profiles</span>
                </button>
              )}

              <div className="flex items-center gap-2 text-[11px] text-white/50 mt-1">
                <span>First time? Clicking will ask for your name to save your profile</span>
                <span>&middot;</span>
                <button
                  type="button"
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
          <span>&middot;</span>
          <span className="text-violet-400 font-mono">{allUsers.length} DB Users</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsAllUsersModalOpen(true)}
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Switch Profiles</span>
          </button>
          <span>&middot;</span>
          <button
            type="button"
            onClick={onOpenArchitecture}
            className="hover:text-white transition-colors"
          >
            Database Architecture
          </button>
          <span>&middot;</span>
          <span>1.2M+ Kaggle Dataset</span>
        </div>
      </footer>

      {/* 
        MODAL 1: "See All Users" Modal in the Splash Page
        Allows the user to view all database users, inspect their profiles,
        switch active user, and launch the studio directly!
      */}
      {isAllUsersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-[#0e0d16] border border-white/10 rounded-3xl shadow-2xl p-6 text-zinc-100 ring-1 ring-white/5 relative flex flex-col max-h-[88vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white">All Database Profiles</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {allUsers.length} Total Users
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    Switch active user session or launch the studio under any profile
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAllUsersModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
                title="Close user selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Filter & Add New User button */}
            <div className="py-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or DB ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-500/60 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAllUsersModalOpen(false);
                  setIsOnboardingModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/40 text-violet-200 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New User</span>
              </button>
            </div>

            {/* Users List / Grid */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar py-2">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-xs">
                  No users found matching &quot;{userSearchQuery}&quot;
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.user_id === currentUser?.user_id;
                  const letter = (u.username || 'U').charAt(0).toUpperCase();

                  // Created date format
                  let dateStr = 'Active';
                  if (u.created_at) {
                    try {
                      dateStr = new Date(u.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    } catch {
                      dateStr = 'Active';
                    }
                  }

                  return (
                    <div
                      key={u.user_id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-violet-600/15 border-violet-500/40 ring-1 ring-violet-500/20'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-sm text-white shadow-md shrink-0">
                          {letter}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white truncate">
                              {u.username}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/10 text-white/70">
                              #{u.user_id}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                <span>Active</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/50 truncate mt-0.5">{u.email}</div>
                          <div className="text-[10px] text-white/40 mt-1">
                            Joined {dateStr} &middot; PostgreSQL Table public.users
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleSelectUserOnly(u.user_id)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-colors"
                          >
                            Select
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSwitchUserAndLaunch(u.user_id)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                            isCurrent
                              ? 'bg-white text-black hover:bg-white/90 shadow-white/10'
                              : 'bg-violet-600 text-white hover:bg-violet-500 shadow-violet-600/30'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isCurrent ? 'Launch Studio' : 'Switch & Launch'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom action bar */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-white/40">
                Data stored in PostgreSQL <code className="text-violet-300 font-mono">users</code> table
              </span>
              <button
                type="button"
                onClick={() => setIsAllUsersModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: First-Time User Onboarding / Add User Modal */}
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
                <h3 className="text-base font-semibold text-white">Add New PostgreSQL User</h3>
                <p className="text-xs text-white/50">Insert record into public.users table</p>
              </div>
            </div>

            <p className="text-xs text-white/70 mb-5 leading-relaxed">
              Enter a username for the new profile. An 8D acoustic taste vector will be initialized
              and linked to your PostgreSQL database.
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
                  <span>Create &amp; Launch</span>
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

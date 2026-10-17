import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  User,
  Activity,
  Settings,
  Database,
  LogOut,
  Sparkles,
  Sliders,
  Plus,
  X,
  Users,
  Check,
  Heart,
  ListMusic,
  ShieldCheck,
  Disc3,
} from 'lucide-react';
import { UserDbRecord } from '../services/vectorDb/userDbService';
import { UserTasteProfile } from '../types/music';

interface UserHeaderMenuProps {
  user: UserDbRecord;
  tasteProfile: UserTasteProfile;
  allUsers?: UserDbRecord[];
  onSwitchUser?: (userId: number) => void;
  likedSongsCount?: number;
  playlistsCount?: number;
  onOpenTasteProfileModal: () => void;
  onOpenUserDetailsModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenNewUserPrompt: () => void;
  onGoToLandingPage: () => void;
}

export const UserHeaderMenu: React.FC<UserHeaderMenuProps> = ({
  user,
  tasteProfile,
  allUsers = [],
  onSwitchUser,
  likedSongsCount = 0,
  playlistsCount = 0,
  onOpenTasteProfileModal,
  onOpenUserDetailsModal,
  onOpenSettingsModal,
  onOpenNewUserPrompt,
  onGoToLandingPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const firstLetter = (user.username || 'U').charAt(0).toUpperCase();

  // Format created date nicely
  const formattedDate = React.useMemo(() => {
    if (!user.created_at) return 'Recently';
    try {
      const d = new Date(user.created_at);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  }, [user.created_at]);

  return (
    <div className="relative w-full flex flex-col items-center" ref={menuRef}>
      {/* 
        Sidebar Trigger Button (Bottom of 88px Sidebar)
        Clean & compact: shows avatar and username, NO taste profile text here
        Clicking opens the panel sideways to the right!
      */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all duration-200 group relative focus:outline-none ${
          isOpen
            ? 'bg-violet-600/30 border border-violet-400/50 shadow-lg shadow-violet-500/20'
            : 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={`User: @${user.username} (Click to open sideways profile)`}
      >
        {/* Avatar with initial and status dot */}
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-violet-600/30 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
            {firstLetter}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#120E15]"
            title="Active database session"
          />
        </div>

        {/* Compact username and subtle sideways indicator */}
        <div className="flex items-center gap-0.5 mt-1 max-w-[52px]">
          <span className="text-[10px] font-medium text-white/80 group-hover:text-white truncate">
            {user.username}
          </span>
          <ChevronRight
            className={`w-3 h-3 text-white/40 group-hover:text-white shrink-0 transition-transform duration-200 ${
              isOpen ? 'translate-x-0.5 text-violet-300' : ''
            }`}
          />
        </div>
      </button>

      {/* 
        Sideways User Info Flyout Panel
        Positioned fixed to the right of the sidebar: left-[96px] bottom-4
        Guaranteed to stay within screen boundaries with max-h-[calc(100vh-2rem)]
      */}
      {isOpen && (
        <>
          {/* Backdrop to close when clicking outside */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-label="User Profile Details"
            className="fixed left-[96px] bottom-4 z-50 w-84 sm:w-92 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl bg-[#120e17] border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] p-5 ring-1 ring-white/15 animate-in fade-in slide-in-from-left-4 duration-200 text-xs custom-scrollbar flex flex-col gap-4 text-white"
          >
            {/* Header: Title and Close button */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                    User Session Info
                  </h3>
                  <p className="text-[10px] text-white/40">PostgreSQL Identity Context</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
                title="Close sideways panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* User Main Identity Card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 flex items-start gap-3.5">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-violet-500/25 ring-2 ring-white/20">
                  {firstLetter}
                </div>
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#120e17]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-white truncate">
                    {user.username}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                    User #{user.user_id}
                  </span>
                </div>

                <div className="text-[11px] text-white/50 truncate mt-0.5">{user.email}</div>

                <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1.5">
                  <span className="flex items-center gap-1 text-emerald-300/80">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Active in DB</span>
                  </span>
                  <span>&middot;</span>
                  <span>Joined {formattedDate}</span>
                </div>
              </div>
            </div>

            {/* User Acoustic Fingerprint / Dominant Vibe (Shown here in detail) */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-transparent border border-violet-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[11px] font-semibold text-violet-200">
                    Acoustic Taste Profile
                  </span>
                </div>
                <span className="text-[9px] font-mono text-violet-300/70 bg-violet-500/20 px-1.5 py-0.2 rounded">
                  8D Vector
                </span>
              </div>
              <p className="text-xs font-medium text-white/90">
                {tasteProfile.dominantVibeDescription || '8-Dimensional Calibrated Taste'}
              </p>

              {/* Quick dimension pill indicators */}
              <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-white/5 text-[10px]">
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/[0.03]">
                  <span className="text-white/50">Energy</span>
                  <span className="font-mono text-violet-300 font-medium">
                    {Math.round((user.taste_vector?.[1] ?? 0.78) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/[0.03]">
                  <span className="text-white/50">Dance</span>
                  <span className="font-mono text-emerald-300 font-medium">
                    {Math.round((user.taste_vector?.[0] ?? 0.82) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/[0.03]">
                  <span className="text-white/50">Valence</span>
                  <span className="font-mono text-amber-300 font-medium">
                    {Math.round((user.taste_vector?.[2] ?? 0.65) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/[0.03]">
                  <span className="text-white/50">Acoustic</span>
                  <span className="font-mono text-indigo-300 font-medium">
                    {Math.round((user.taste_vector?.[5] ?? 0.10) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="flex items-center justify-center text-rose-400 mb-1">
                  <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                </div>
                <div className="font-bold text-sm text-white">{likedSongsCount}</div>
                <div className="text-[9px] text-white/40">Liked Songs</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="flex items-center justify-center text-indigo-400 mb-1">
                  <ListMusic className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-sm text-white">{playlistsCount}</div>
                <div className="text-[9px] text-white/40">Playlists</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="flex items-center justify-center text-emerald-400 mb-1">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-sm text-white">#users</div>
                <div className="text-[9px] text-white/40">Table Link</div>
              </div>
            </div>

            {/* All Profiles / Fast Switcher Section */}
            {allUsers && allUsers.length > 1 && (
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Users className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[11px] font-semibold text-white">
                      Switch User ({allUsers.length} in DB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenNewUserPrompt();
                    }}
                    className="text-[10px] text-violet-300 hover:text-violet-200 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {allUsers.map((u) => {
                    const isActive = u.user_id === user.user_id;
                    const letter = (u.username || 'U').charAt(0).toUpperCase();

                    return (
                      <button
                        key={u.user_id}
                        type="button"
                        onClick={() => {
                          if (!isActive && onSwitchUser) {
                            onSwitchUser(u.user_id);
                          }
                        }}
                        className={`w-full p-2 rounded-xl flex items-center justify-between transition-all text-left ${
                          isActive
                            ? 'bg-violet-600/20 border border-violet-500/40 text-white'
                            : 'hover:bg-white/[0.06] text-white/70 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                            {letter}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate flex items-center gap-1">
                              <span>{u.username}</span>
                              <span className="text-[9px] font-mono text-white/40">
                                #{u.user_id}
                              </span>
                            </div>
                            <div className="text-[9px] text-white/40 truncate">{u.email}</div>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/40 hover:text-violet-300 shrink-0">
                            Switch
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Items List */}
            <div className="space-y-1 pt-1 border-t border-white/5">
              {/* Option 1: Taste Profile */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenTasteProfileModal();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-center gap-2.5 text-left transition-colors text-white group"
              >
                <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-300 shrink-0 group-hover:bg-violet-500/25">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white flex items-center gap-1">
                    <span>8D Acoustic Taste Matrix</span>
                    <span className="text-[9px] font-mono text-violet-300 bg-violet-500/20 px-1 rounded">
                      Radar
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50">8-axis geometry &amp; audio sliders</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white" />
              </button>

              {/* Option 2: User Details */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenUserDetailsModal();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-center gap-2.5 text-left transition-colors text-white group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-300 shrink-0 group-hover:bg-emerald-500/25">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white flex items-center gap-1">
                    <span>Inspect Database Entity</span>
                    <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/20 px-1 rounded">
                      SQL
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50">PostgreSQL row &amp; audit log</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white" />
              </button>

              {/* Option 3: Settings */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettingsModal();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-center gap-2.5 text-left transition-colors text-white group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 shrink-0 group-hover:bg-indigo-500/25">
                  <Settings className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white">Engine Settings</div>
                  <p className="text-[10px] text-white/50">
                    Vector distance metrics &amp; HNSW config
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white" />
              </button>

              {/* Option 4: Create New User */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenNewUserPrompt();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-center gap-2.5 text-left transition-colors text-white group"
              >
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white/70 shrink-0 group-hover:text-white">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white">Create New User Profile</div>
                  <p className="text-[10px] text-white/50">Insert row into public.users</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white" />
              </button>

              {/* Option 5: Return to Landing Page */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onGoToLandingPage();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-center gap-2.5 text-left transition-colors text-white/80 hover:text-white group border-t border-white/5 mt-1"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-300 shrink-0 group-hover:bg-amber-500/25">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white">Return to Splash Page</div>
                  <p className="text-[10px] text-white/50">Switch user or view welcome overview</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

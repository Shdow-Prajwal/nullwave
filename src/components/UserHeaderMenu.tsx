import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  User,
  Activity,
  Settings,
  Database,
  LogOut,
  Sparkles,
  Sliders,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { UserDbRecord } from '../services/vectorDb/userDbService';
import { UserTasteProfile } from '../types/music';

interface UserHeaderMenuProps {
  user: UserDbRecord;
  tasteProfile: UserTasteProfile;
  onOpenTasteProfileModal: () => void;
  onOpenUserDetailsModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenNewUserPrompt: () => void;
  onGoToLandingPage: () => void;
}

export const UserHeaderMenu: React.FC<UserHeaderMenuProps> = ({
  user,
  tasteProfile,
  onOpenTasteProfileModal,
  onOpenUserDetailsModal,
  onOpenSettingsModal,
  onOpenNewUserPrompt,
  onGoToLandingPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstLetter = (user.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Top-Right User Data Card with Taste Profile Underneath */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-end text-right group p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Open User & Taste Profile Menu"
      >
        {/* Top line: Avatar + Username + Chevron */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 border border-violet-400/30 flex items-center justify-center font-bold text-xs text-white shadow-sm shadow-violet-500/20">
            {firstLetter}
          </div>

          <span className="text-xs font-semibold text-white tracking-tight group-hover:text-violet-200 transition-colors max-w-[110px] truncate">
            {user.username}
          </span>

          <ChevronDown
            className={`w-3.5 h-3.5 text-white/50 group-hover:text-white transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-violet-300' : ''
            }`}
          />
        </div>

        {/* Taste Profile Directly Underneath User Data */}
        <div className="flex items-center gap-1.5 mt-0.5 max-w-[140px] truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[10px] text-violet-300 font-medium truncate">
            Taste: {tasteProfile.dominantVibeDescription || '8D Calibrated'}
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0f0f18]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-white/5 text-xs">
          {/* User Status Bar */}
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 mb-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-xs truncate">@{user.username}</span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                DB ID #{user.user_id}
              </span>
            </div>
            <div className="text-[11px] text-white/50 truncate mt-0.5">{user.email}</div>
          </div>

          {/* Option 1: Taste Profile */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenTasteProfileModal();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-start gap-2.5 text-left transition-colors text-white group"
          >
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-300 shrink-0 mt-0.5 group-hover:bg-violet-500/25">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-white flex items-center gap-1">
                <span>Taste Profile</span>
                <span className="text-[9px] font-mono text-violet-300 bg-violet-500/20 px-1 rounded">8D</span>
              </div>
              <p className="text-[10px] text-white/50 mt-0.5">
                8-axis geometry &amp; audio sliders
              </p>
            </div>
          </button>

          {/* Option 2: User Details */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenUserDetailsModal();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-start gap-2.5 text-left transition-colors text-white group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5 group-hover:bg-emerald-500/25">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-white">User Details</div>
              <p className="text-[10px] text-white/50 mt-0.5">
                PostgreSQL row &amp; SQL transaction log
              </p>
            </div>
          </button>

          {/* Option 3: Settings */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenSettingsModal();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-start gap-2.5 text-left transition-colors text-white group"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5 group-hover:bg-indigo-500/25">
              <Settings className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-white">Settings</div>
              <p className="text-[10px] text-white/50 mt-0.5">
                Vector metrics, HNSW index &amp; preferences
              </p>
            </div>
          </button>

          <div className="my-1 border-t border-white/5" />

          {/* Option 4: Switch / New User */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenNewUserPrompt();
            }}
            className="w-full p-2 rounded-lg hover:bg-white/[0.04] flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[11px]"
          >
            <Plus className="w-3.5 h-3.5 text-white/50" />
            <span>Create New User Record</span>
          </button>

          {/* Option 5: Return to Landing Page */}
          <button
            onClick={() => {
              setIsOpen(false);
              onGoToLandingPage();
            }}
            className="w-full p-2 rounded-lg hover:bg-white/[0.04] flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[11px]"
          >
            <LogOut className="w-3.5 h-3.5 text-white/50" />
            <span>Return to Landing Page</span>
          </button>
        </div>
      )}
    </div>
  );
};

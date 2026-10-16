import React, { useState } from 'react';
import {
  X,
  Settings,
  Database,
  Sliders,
  Volume2,
  Users,
  LogOut,
  RefreshCw,
  Compass,
  Check,
  Plus,
} from 'lucide-react';
import { VectorDistanceMetric } from '../services/vectorDb/types';
import { UserDbRecord, userDbService } from '../services/vectorDb/userDbService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vectorMetric: VectorDistanceMetric;
  onChangeMetric: (metric: VectorDistanceMetric) => void;
  currentUser: UserDbRecord | null;
  onSwitchUser: (userId: number) => void;
  onOpenNewUserPrompt: () => void;
  onGoToLandingPage: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  vectorMetric,
  onChangeMetric,
  currentUser,
  onSwitchUser,
  onOpenNewUserPrompt,
  onGoToLandingPage,
}) => {
  if (!isOpen) return null;

  const allUsers = userDbService.getAllUsers();
  const [indexType, setIndexType] = useState<'HNSW' | 'IVFFLAT'>('HNSW');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[90vh] bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">System &amp; Database Settings</h2>
              <p className="text-xs text-white/50">Configure pgvector engine &amp; session parameters</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Vector Distance Metric */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-violet-400" />
                <span>Vector Distance Metric</span>
              </label>
              <span className="font-mono text-white/50 text-[10px]">pgvector operators</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cosine' as const, label: 'Cosine (<=>)', desc: 'Normalized angular similarity' },
                { id: 'l2' as const, label: 'L2 Euclidean (<->)', desc: 'Absolute coordinate distance' },
                { id: 'inner_product' as const, label: 'Inner Product (<#>)', desc: 'Dot product optimization' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onChangeMetric(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    vectorMetric === m.id
                      ? 'bg-violet-600/20 border-violet-500/50 text-white shadow-sm ring-1 ring-violet-500/30'
                      : 'bg-white/[0.02] border-white/5 text-white/70 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="font-medium text-white mb-0.5">{m.label}</div>
                  <div className="text-[10px] text-white/50">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* pgvector Index Optimization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>ANN Index Type</span>
              </label>
              <span className="font-mono text-white/50 text-[10px]">Approximate Nearest Neighbor</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIndexType('HNSW')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  indexType === 'HNSW'
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                    : 'bg-white/[0.02] border-white/5 text-white/70 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <div className="font-medium text-white mb-0.5">HNSW (Hierarchical Graph)</div>
                <div className="text-[10px] text-white/50">M=16, ef_construction=64 · &lt;2ms queries</div>
              </button>

              <button
                onClick={() => setIndexType('IVFFLAT')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  indexType === 'IVFFLAT'
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                    : 'bg-white/[0.02] border-white/5 text-white/70 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <div className="font-medium text-white mb-0.5">IVFFlat (Inverted File)</div>
                <div className="text-[10px] text-white/50">Lists=100 · Lower memory footprint</div>
              </button>
            </div>
          </div>

          {/* User Account Switcher */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Database User Profiles ({allUsers.length})</span>
              </label>

              <button
                onClick={() => {
                  onClose();
                  onOpenNewUserPrompt();
                }}
                className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>New Profile</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {allUsers.map((u) => {
                const isCurrent = currentUser?.user_id === u.user_id;
                return (
                  <div
                    key={u.user_id}
                    onClick={() => {
                      if (!isCurrent) onSwitchUser(u.user_id);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-violet-950/30 border-violet-500/30 text-white'
                        : 'bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-violet-600/30 border border-violet-500/30 flex items-center justify-center font-bold text-xs text-white">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-xs text-white flex items-center gap-1.5">
                          <span>{u.username}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/50">{u.email}</div>
                      </div>
                    </div>

                    {isCurrent && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <button
              onClick={() => {
                onClose();
                onGoToLandingPage();
              }}
              className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-white/60" />
              <span>Return to Splash / Landing Page</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-[#0b0b10] text-xs font-semibold hover:bg-white/90 transition-colors shadow-sm"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};

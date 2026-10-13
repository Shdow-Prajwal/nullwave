import React from 'react';
import {
  X,
  Sparkles,
  RotateCcw,
  Activity,
  CheckCircle2,
  Database,
  BarChart3,
  Sliders,
} from 'lucide-react';
import { UserTasteProfile, MusicVector } from '../types/music';
import { VectorRadarChart } from './VectorRadarChart';
import {
  VECTOR_DIMENSION_KEYS,
  VECTOR_DIMENSIONS_META,
  normalizedToBpm,
  musicVectorToArray,
  arrayToMusicVector,
  vectorToPgVectorString,
} from '../services/vectorDb/vectorMath';
import { UserDbRecord } from '../services/vectorDb/userDbService';

interface TasteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDbRecord | null;
  tasteProfile: UserTasteProfile;
  onUpdateTasteVector: (newVector: MusicVector) => void;
  onResetTasteVector: () => void;
}

export const TasteProfileModal: React.FC<TasteProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  tasteProfile,
  onUpdateTasteVector,
  onResetTasteVector,
}) => {
  if (!isOpen) return null;

  const currentVector = tasteProfile.tasteVector;

  const handleSliderChange = (dimensionKey: keyof MusicVector, value: number) => {
    const updated = {
      ...currentVector,
      [dimensionKey]: value,
    };
    onUpdateTasteVector(updated);
  };

  const vectorArray = musicVectorToArray(currentVector);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  Acoustic Taste Profile
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-500/15 text-violet-300 border border-violet-500/25">
                  users.taste_vector
                </span>
              </div>
              <p className="text-xs text-white/50">
                {user ? `Profile for @${user.username} (User #${user.user_id})` : 'Active Taste Vector'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetTasteVector}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="Reset to default coordinates"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Banner with DB Sync Status */}
          <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="text-xs font-semibold text-white">
                  Synchronized with Relational Database
                </p>
                <p className="text-[11px] text-white/60">
                  Changes to these sliders immediately update <code className="text-violet-300 font-mono">users.taste_vector VECTOR(8)</code>
                </p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded bg-black/40 border border-white/10 font-mono text-[11px] text-violet-300 truncate max-w-xs">
              {vectorToPgVectorString(vectorArray)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Radar Chart & Dominant Vibe */}
            <div className="lg:col-span-5 p-5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/70">8-Axis Acoustic Radar</span>
                <span className="text-[10px] font-mono text-violet-300 px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
                  {tasteProfile.dominantVibeDescription}
                </span>
              </div>

              <div className="py-2 flex items-center justify-center">
                <VectorRadarChart
                  primaryVector={currentVector}
                  primaryLabel="Current User Taste"
                  primaryColor="#8B5CF6"
                  size={260}
                />
              </div>

              <div className="w-full pt-3 border-t border-white/5 text-[11px] text-white/50 text-center">
                Reflects your calibrated acoustic preferences in 8-dimensional space.
              </div>
            </div>

            {/* Right: Interactive 8D Sliders */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Acoustic Dimension Coordinates</span>
                </h3>
                <span className="text-[11px] text-white/50">Auto-persists on slide</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VECTOR_DIMENSION_KEYS.map((key) => {
                  const meta = VECTOR_DIMENSIONS_META[key];
                  const val = currentVector[key];
                  const display =
                    key === 'beatsBpmNormalized'
                      ? `${normalizedToBpm(val)} BPM`
                      : `${Math.round(val * 100)}%`;

                  return (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-white/80">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: meta.color }}
                          />
                          <span>{meta.label}</span>
                        </span>
                        <span className="font-mono text-xs text-white/90">{display}</span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={val}
                        onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg cursor-pointer"
                        style={{ accentColor: meta.color }}
                      />

                      <div className="flex justify-between text-[9px] text-white/40">
                        <span>{meta.lowLabel}</span>
                        <span>{meta.highLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>All modifications are active and queryable via pgvector KNN</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-[#0b0b10] text-xs font-semibold hover:bg-white/90 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

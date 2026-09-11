import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Wand2,
  Compass,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Check,
  Zap,
} from 'lucide-react';
import { MusicGenre, MusicVector } from '../types/music';
import {
  VECTOR_DIMENSION_KEYS,
  VECTOR_DIMENSIONS_META,
  normalizedToBpm,
  bpmToNormalized,
} from '../services/vectorDb/vectorMath';

export interface VectorTunerProps {
  targetVector: MusicVector;
  onApplyVector: (updated: MusicVector, genre: string, blendRatio: number) => void;
  selectedGenre: string;
  blendHistoryRatio: number; // 0.0 (sliders only) to 1.0 (history only)
  userHistoryVector?: MusicVector;
}

export const PRESET_VIBES: {
  name: string;
  genre: MusicGenre;
  icon: string;
  vector: MusicVector;
}[] = [
  {
    name: 'Late Night Outrun',
    genre: 'Synthwave',
    icon: '🚗',
    vector: {
      danceability: 0.82,
      energy: 0.8,
      valence: 0.65,
      beatsBpmNormalized: bpmToNormalized(120),
      vibeChillToHype: 0.75,
      acousticness: 0.08,
      instrumentalness: 0.85,
      moodHarmonics: 0.45,
    },
  },
  {
    name: 'Lo-Fi Study Session',
    genre: 'Lo-Fi Chill',
    icon: '☕',
    vector: {
      danceability: 0.48,
      energy: 0.32,
      valence: 0.52,
      beatsBpmNormalized: bpmToNormalized(80),
      vibeChillToHype: 0.15,
      acousticness: 0.72,
      instrumentalness: 0.88,
      moodHarmonics: 0.65,
    },
  },
  {
    name: 'Euphoric Summer Disco',
    genre: 'Nu-Disco / Pop',
    icon: '☀️',
    vector: {
      danceability: 0.94,
      energy: 0.88,
      valence: 0.92,
      beatsBpmNormalized: bpmToNormalized(124),
      vibeChillToHype: 0.85,
      acousticness: 0.15,
      instrumentalness: 0.2,
      moodHarmonics: 0.28,
    },
  },
  {
    name: 'Cyber Rave Velocity',
    genre: 'Cyber Techno',
    icon: '⚡',
    vector: {
      danceability: 0.9,
      energy: 0.96,
      valence: 0.3,
      beatsBpmNormalized: bpmToNormalized(135),
      vibeChillToHype: 0.95,
      acousticness: 0.02,
      instrumentalness: 0.95,
      moodHarmonics: 0.75,
    },
  },
  {
    name: 'Introspective Ambient',
    genre: 'Cinematic Ambient',
    icon: '🌌',
    vector: {
      danceability: 0.18,
      energy: 0.24,
      valence: 0.38,
      beatsBpmNormalized: bpmToNormalized(65),
      vibeChillToHype: 0.08,
      acousticness: 0.55,
      instrumentalness: 0.96,
      moodHarmonics: 0.85,
    },
  },
];

export const GENRES: string[] = [
  'All',
  'Synthwave',
  'Lo-Fi Chill',
  'Nu-Disco / Pop',
  'Indie Folk',
  'Cyber Techno',
  'Neo-Soul / R&B',
  'Cinematic Ambient',
  'Alt Rock',
];

export const VectorTuner: React.FC<VectorTunerProps> = ({
  targetVector,
  onApplyVector,
  selectedGenre,
  blendHistoryRatio,
}) => {
  // Collapsible state (can be toggled open/closed)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Draft states so user can adjust multiple sliders without triggering queries until clicking "SET"
  const [draftVector, setDraftVector] = useState<MusicVector>(targetVector);
  const [draftGenre, setDraftGenre] = useState<string>(selectedGenre);
  const [draftBlend, setDraftBlend] = useState<number>(blendHistoryRatio);

  // Auto-apply mode toggle (defaults to false so the user can use the explicit Set button)
  const [autoApply, setAutoApply] = useState<boolean>(false);

  // Feedback state after clicking "Set"
  const [justApplied, setJustApplied] = useState<boolean>(false);

  // Sync draft states when external target changes (e.g. from station or preset click outside)
  useEffect(() => {
    setDraftVector(targetVector);
  }, [targetVector]);

  useEffect(() => {
    setDraftGenre(selectedGenre);
  }, [selectedGenre]);

  useEffect(() => {
    setDraftBlend(blendHistoryRatio);
  }, [blendHistoryRatio]);

  // Check if draft differs from committed
  const hasChanges =
    JSON.stringify(draftVector) !== JSON.stringify(targetVector) ||
    draftGenre !== selectedGenre ||
    Math.abs(draftBlend - blendHistoryRatio) > 0.01;

  const handleDimensionChange = (key: keyof MusicVector, value: number) => {
    const updated = {
      ...draftVector,
      [key]: value,
    };
    setDraftVector(updated);
    if (autoApply) {
      onApplyVector(updated, draftGenre, draftBlend);
    }
  };

  const handleGenreChange = (g: string) => {
    setDraftGenre(g);
    if (autoApply) {
      onApplyVector(draftVector, g, draftBlend);
    }
  };

  const handleBlendChange = (val: number) => {
    setDraftBlend(val);
    if (autoApply) {
      onApplyVector(draftVector, draftGenre, val);
    }
  };

  const handleApply = () => {
    onApplyVector(draftVector, draftGenre, draftBlend);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);
  };

  const handlePresetSelect = (preset: (typeof PRESET_VIBES)[0]) => {
    setDraftVector(preset.vector);
    setDraftGenre(preset.genre);
    onApplyVector(preset.vector, preset.genre, draftBlend);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 1800);
  };

  const handleReset = () => {
    const defaultVec: MusicVector = {
      danceability: 0.75,
      energy: 0.65,
      valence: 0.6,
      beatsBpmNormalized: bpmToNormalized(115),
      vibeChillToHype: 0.6,
      acousticness: 0.25,
      instrumentalness: 0.5,
      moodHarmonics: 0.45,
    };
    setDraftVector(defaultVec);
    setDraftGenre('All');
    setDraftBlend(0.25);
    onApplyVector(defaultVec, 'All', 0.25);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 1500);
  };

  return (
    <div
      id="vector-query-tuner"
      className="rounded-3xl p-5 md:p-6 bg-[#12141A] border border-[#232733] shadow-2xl transition-all duration-300 relative overflow-hidden"
    >
      {/* Top Header bar with Collapse toggle & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#232733]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl bg-[#181B22] border border-[#2B303E] text-neutral-300 hover:text-white hover:border-[#FF6B6B] transition-all flex items-center gap-2 group"
            title={isCollapsed ? 'Expand vector tuner' : 'Collapse vector tuner'}
          >
            <Sliders className="w-4 h-4 text-[#FF6B6B] group-hover:scale-110 transition-transform" />
            <span className="font-display uppercase tracking-wider text-xs font-bold text-white">
              Vector Tuner
            </span>
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
            )}
          </button>

          {/* Pending Changes / Status Pill */}
          {hasChanges ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/40 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B]" />
              Changes Pending
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono text-neutral-400 bg-[#181B22] border border-[#232733]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Synced to pgvector
            </span>
          )}
        </div>

        {/* Action Controls & Primary SET Button */}
        <div className="flex items-center gap-2">
          {/* Auto-apply toggle */}
          <button
            onClick={() => setAutoApply(!autoApply)}
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono border transition-all ${
              autoApply
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-[#181B22] border-[#232733] text-neutral-400 hover:text-neutral-200'
            }`}
            title="When active, slider adjustments query pgvector immediately"
          >
            <Zap className={`w-3 h-3 ${autoApply ? 'text-emerald-400' : 'text-neutral-500'}`} />
            <span>Live: {autoApply ? 'ON' : 'OFF'}</span>
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-neutral-400 hover:text-white bg-[#181B22] hover:bg-[#20242e] transition-all border border-[#232733]"
            title="Reset to default acoustic vector"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* PRIMARY SET & REFRESH BUTTON */}
          <button
            id="set-vector-refresh-btn"
            onClick={handleApply}
            disabled={!hasChanges && !justApplied}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all shadow-lg ${
              justApplied
                ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                : hasChanges
                ? 'bg-[#FF6B6B] hover:bg-[#ff8080] text-black shadow-[#FF6B6B]/30 hover:scale-[1.02] cursor-pointer'
                : 'bg-[#232733] text-neutral-400 border border-[#2B303E] cursor-default'
            }`}
            title="Refresh recommendations with current vector sliders"
          >
            {justApplied ? (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>Recommendations Refreshed!</span>
              </>
            ) : (
              <>
                <RefreshCw
                  className={`w-4 h-4 ${hasChanges ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '3s' }}
                />
                <span>Set &amp; Refresh Recommendations</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsed Summary Strip */}
      {isCollapsed ? (
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-neutral-300">
            <span className="text-neutral-500">Active Vector:</span>
            <span className="px-2 py-0.5 rounded bg-[#181B22] border border-[#232733] text-[#FF6B6B]">
              {normalizedToBpm(targetVector.beatsBpmNormalized)} BPM
            </span>
            <span className="px-2 py-0.5 rounded bg-[#181B22] border border-[#232733]">
              Dance: {Math.round(targetVector.danceability * 100)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-[#181B22] border border-[#232733]">
              Energy: {Math.round(targetVector.energy * 100)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-[#181B22] border border-[#232733]">
              Valence: {Math.round(targetVector.valence * 100)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-[#181B22] border border-[#232733]">
              Genre: {selectedGenre}
            </span>
          </div>

          <button
            onClick={() => setIsCollapsed(false)}
            className="text-[#FF6B6B] hover:text-white text-xs font-mono underline underline-offset-4"
          >
            Expand Sliders &amp; Presets →
          </button>
        </div>
      ) : (
        <div className="pt-5 space-y-6">
          {/* Preset Vibe Buttons */}
          <div>
            <div className="text-[11px] font-bold font-display uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-[#FF6B6B]" />
              <span>Instant Station Presets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {PRESET_VIBES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-3 rounded-2xl text-left bg-[#161820] border border-[#232733] hover:border-[#FF6B6B]/60 hover:bg-[#1C202B] transition-all group flex flex-col justify-between"
                >
                  <div className="text-xl mb-1.5">{preset.icon}</div>
                  <div className="text-xs font-bold font-display tracking-tight text-neutral-200 group-hover:text-white line-clamp-1">
                    {preset.name}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 line-clamp-1 mt-0.5">
                    {preset.genre} · {normalizedToBpm(preset.vector.beatsBpmNormalized)} BPM
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Personalization Blend Control */}
          <div className="p-4 rounded-2xl bg-[#161820] border border-[#232733]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#06B6D4]" />
                <span className="text-xs font-display uppercase font-bold text-neutral-200">
                  Personalized Taste Blend
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-[#06B6D4]">
                {Math.round(draftBlend * 100)}% History Synthesis
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-neutral-400">Manual Sliders</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={draftBlend}
                onChange={(e) => handleBlendChange(parseFloat(e.target.value))}
                className="flex-1 accent-[#06B6D4] h-2 bg-[#232733] rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-neutral-400">Listening History</span>
            </div>
            <p className="text-[11px] font-mono text-neutral-500 mt-2">
              Interpolates query vector with your time-weighted listening centroid in pgvector space.
            </p>
          </div>

          {/* Genre Filter Pills */}
          <div>
            <div className="text-[11px] font-bold font-display uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Genre Constraint</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreChange(genre)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition-all ${
                    draftGenre === genre
                      ? 'bg-[#FF6B6B] text-black font-bold shadow-md'
                      : 'bg-[#181B22] text-neutral-400 hover:text-neutral-200 hover:bg-[#20242e] border border-[#232733]'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* 8-Dimensional Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-[#232733]">
            {VECTOR_DIMENSION_KEYS.map((key) => {
              const meta = VECTOR_DIMENSIONS_META[key];
              const rawVal = draftVector[key];
              const displayVal =
                key === 'beatsBpmNormalized'
                  ? `${normalizedToBpm(rawVal)} BPM`
                  : `${Math.round(rawVal * 100)}%`;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="font-display uppercase tracking-wider text-xs">
                        {meta.label}
                      </span>
                    </span>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#0C0E12] border border-[#232733] text-neutral-300">
                      {displayVal}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={rawVal}
                    onChange={(e) => handleDimensionChange(key, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[#232733] rounded-lg cursor-pointer transition-all"
                    style={{
                      accentColor: meta.color,
                    }}
                  />

                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>{meta.lowLabel}</span>
                    <span>{meta.highLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar inside Tuner with Quick SET trigger if changes pending */}
          {hasChanges && (
            <div className="p-3.5 rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
              <div className="text-xs text-neutral-300 font-mono">
                You have unsaved vector changes. Click <strong className="text-white">Set</strong> to run KNN matching.
              </div>
              <button
                onClick={handleApply}
                className="px-4 py-1.5 rounded-xl bg-[#FF6B6B] hover:bg-[#ff8080] text-black font-bold text-xs font-display uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                Apply &amp; Refresh Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

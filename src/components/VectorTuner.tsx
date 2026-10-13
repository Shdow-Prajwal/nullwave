import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Wand2,
  Compass,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
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
  onChangeVector: (updated: MusicVector) => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  blendHistoryRatio: number; // 0.0 (sliders only) to 1.0 (history only)
  onChangeBlendRatio: (ratio: number) => void;
  userHistoryVector?: MusicVector;
  isDbSynced?: boolean;
  activeUsername?: string;
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
  onChangeVector,
  selectedGenre,
  onSelectGenre,
  blendHistoryRatio,
  onChangeBlendRatio,
  isDbSynced = true,
  activeUsername,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleDimensionChange = (key: keyof MusicVector, value: number) => {
    onChangeVector({
      ...targetVector,
      [key]: value,
    });
  };

  const handlePresetSelect = (preset: (typeof PRESET_VIBES)[0]) => {
    onChangeVector(preset.vector);
    onSelectGenre(preset.genre);
  };

  const handleReset = () => {
    onChangeVector({
      danceability: 0.75,
      energy: 0.65,
      valence: 0.6,
      beatsBpmNormalized: bpmToNormalized(115),
      vibeChillToHype: 0.6,
      acousticness: 0.25,
      instrumentalness: 0.5,
      moodHarmonics: 0.45,
    });
    onSelectGenre('All');
    onChangeBlendRatio(0.25);
  };

  // Find if current vector closely matches any preset
  const matchedPreset = PRESET_VIBES.find((p) => p.genre === selectedGenre);

  return (
    <div
      id="vector-query-tuner"
      className="rounded-2xl backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 shadow-2xl transition-all duration-300 overflow-hidden"
    >
      {/* ── Collapsible Header Bar ── */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-indigo-300 shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                Acoustic Vector Tuner
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
                8D Embeddings
              </span>
              {isDbSynced && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>DB Connected{activeUsername ? `: @${activeUsername}` : ''}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-white/60 truncate">
              {isExpanded
                ? 'Adjust 8-dimensional target weights; updates users.taste_vector in real time'
                : `${normalizedToBpm(targetVector.beatsBpmNormalized)} BPM · ${selectedGenre} · ${Math.round(blendHistoryRatio * 100)}% History Blend`}
            </p>
          </div>
        </div>

        {/* Right Header Actions: Reset & Collapse Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {isExpanded && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
              title="Reset vector sliders"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse Vector Tuner' : 'Expand Vector Tuner'}
          >
            <span className="font-medium">{isExpanded ? 'Collapse' : 'Tune Acoustics'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-white/70" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-white/70" />
            )}
          </button>
        </div>
      </div>

      {/* ── Compact Summary Strip when Collapsed ── */}
      {!isExpanded && (
        <div className="px-4 py-3 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/50 text-[11px]">Active Profile:</span>
            <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium text-xs">
              {matchedPreset ? `${matchedPreset.icon} ${matchedPreset.name}` : selectedGenre}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-white/70 font-mono text-[11px]">
              {normalizedToBpm(targetVector.beatsBpmNormalized)} BPM
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-white/70 font-mono text-[11px]">
              Energy {Math.round(targetVector.energy * 100)}%
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-white/70 font-mono text-[11px]">
              Valence {Math.round(targetVector.valence * 100)}%
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-white/70 font-mono text-[11px]">
              Dance {Math.round(targetVector.danceability * 100)}%
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(true)}
            className="text-indigo-400 hover:text-indigo-300 text-xs font-medium underline underline-offset-4"
          >
            Adjust Sliders &rarr;
          </button>
        </div>
      )}

      {/* ── Expanded Controls Body ── */}
      {isExpanded && (
        <div className="p-5 md:p-6 space-y-6">
          {/* Preset Vibe Quick-Buttons in Glass Cards */}
          <div>
            <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Instant Vibe Presets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {PRESET_VIBES.map((preset) => {
                const isSelected = selectedGenre === preset.genre;
                return (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-3 rounded-xl text-left border transition-all duration-200 group relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border-violet-500/40 ring-1 ring-violet-500/30'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="text-xl mb-1.5 transform transition-transform group-hover:scale-110">
                      {preset.icon}
                    </div>
                    <div className="text-xs font-medium text-white line-clamp-1">
                      {preset.name}
                    </div>
                    <div className="text-[11px] text-white/50 line-clamp-1 mt-0.5">
                      {preset.genre} · {normalizedToBpm(preset.vector.beatsBpmNormalized)} BPM
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personalization Taste Blend Control */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 ring-1 ring-white/5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-white">
                  Personalized Taste Blend
                </span>
              </div>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                {Math.round(blendHistoryRatio * 100)}% History Centroid
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/50">Manual Sliders</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={blendHistoryRatio}
                onChange={(e) => onChangeBlendRatio(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] text-white/50">Listening History</span>
            </div>
            <p className="text-[11px] text-white/50 mt-2">
              Blends target slider coordinates with your time-weighted listening centroid in pgvector space.
            </p>
          </div>

          {/* Genre Filter Pills */}
          <div>
            <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Genre Filter</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => onSelectGenre(genre)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedGenre === genre
                      ? 'bg-white text-[#0b0b10] font-semibold shadow-lg shadow-white/10'
                      : 'bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/5'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* 8-Dimensional Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-1">
            {VECTOR_DIMENSION_KEYS.map((key) => {
              const meta = VECTOR_DIMENSIONS_META[key];
              const rawVal = targetVector[key];
              const displayVal =
                key === 'beatsBpmNormalized'
                  ? `${normalizedToBpm(rawVal)} BPM`
                  : `${Math.round(rawVal * 100)}%`;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white/90 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shadow-sm"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span>{meta.label}</span>
                    </span>
                    <span className="font-mono text-xs font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-white/80">
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
                    className="w-full h-1.5 bg-white/10 rounded-lg cursor-pointer transition-all"
                    style={{
                      accentColor: meta.color,
                    }}
                  />

                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>{meta.lowLabel}</span>
                    <span>{meta.highLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Relational DB Sync & SQL Preview */}
          <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-white/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-emerald-300 font-medium">
                Live PostgreSQL Sync:
              </span>
              <span className="text-white/70">
                {activeUsername ? `@${activeUsername} taste_vector` : 'users.taste_vector'}
              </span>
            </div>
            <div className="text-violet-300/80 truncate max-w-md bg-white/[0.02] px-2.5 py-1 rounded-md border border-white/5 text-[10px]">
              UPDATE users SET taste_vector = '[...]'::vector WHERE user_id = {activeUsername ? `@${activeUsername}` : '1'};
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

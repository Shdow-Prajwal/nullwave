import React from 'react';
import {
  Activity,
  BarChart3,
  Clock,
  Heart,
  Music,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { HistoryRecord, Song, UserTasteProfile } from '../types/music';
import { VectorRadarChart } from './VectorRadarChart';
import { VECTOR_DIMENSION_KEYS, VECTOR_DIMENSIONS_META, normalizedToBpm } from '../services/vectorDb/vectorMath';
import { GENRE_THEMES } from '../data/mockCatalog';

interface DashboardViewProps {
  tasteProfile: UserTasteProfile;
  history: HistoryRecord[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onToggleLike: (songId: string) => void;
  onClearHistory: () => void;
  onSimulateListen: (song: Song) => void;
  allSongs: Song[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasteProfile,
  history,
  currentSong,
  isPlaying,
  onPlaySong,
  onToggleLike,
  onClearHistory,
  onSimulateListen,
  allSongs,
}) => {
  const { tasteVector, moodTrend, genreAffinity, dominantVibeDescription } = tasteProfile;

  return (
    <div id="personalized-music-dashboard" className="space-y-6">
      {/* Top Hero Banner: Personalized Taste Overview */}
      <div className="relative rounded-2xl p-6 sm:p-8 backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synthesized Acoustic Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Personalized Music &amp; Mood Dashboard
            </h1>
            <p className="text-sm text-white/70 leading-relaxed">
              Your taste vector is dynamically calculated from your listening history using
              exponential time decay and engagement weights in pgvector space.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-white/50">Current Dominant Vibe:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-white bg-white/5 border border-white/10">
                {dominantVibeDescription}
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center min-w-[100px]">
              <div className="text-xs text-white/50 mb-1 flex items-center justify-center gap-1">
                <Music className="w-3.5 h-3.5 text-violet-400" />
                <span>Plays</span>
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-white">
                {tasteProfile.totalPlays}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center min-w-[100px]">
              <div className="text-xs text-white/50 mb-1 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Minutes</span>
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-white">
                {tasteProfile.totalListeningMinutes}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center min-w-[100px]">
              <div className="text-xs text-white/50 mb-1 flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Favorites</span>
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-white">
                {tasteProfile.likedSongIds.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar Chart + Mood & Dimension Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 8-Axis Vector Radar Chart */}
        <div className="lg:col-span-5 rounded-2xl p-6 backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/25">
                <Activity className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-semibold text-white">Taste Vector Geometry</h2>
            </div>
            <span className="text-[11px] font-mono text-white/50 px-2 py-0.5 rounded bg-white/5 border border-white/10">
              8-DIM
            </span>
          </div>

          <div className="py-2 flex items-center justify-center">
            <VectorRadarChart
              primaryVector={tasteVector}
              secondaryVector={currentSong?.vector}
              primaryLabel="My History Vector"
              secondaryLabel={currentSong ? currentSong.title : undefined}
              primaryColor="#8B5CF6"
              secondaryColor="#06B6D4"
              size={290}
            />
          </div>

          <p className="text-[11px] text-white/50 text-center mt-3 max-w-xs">
            Coordinates represent your synthesized acoustic fingerprint in vector space.
          </p>
        </div>

        {/* Right Column: Mood Index Gauges & Dimension Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mood Index Gauges */}
          <div className="rounded-2xl p-6 backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5">
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-semibold text-white">Core Mood Indices</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Happiness / Valence Gauge */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                  <span>Valence (Happiness)</span>
                  <span className="font-mono font-medium text-emerald-400">
                    {Math.round(moodTrend.avgValence * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden my-2">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-700"
                    style={{ width: `${moodTrend.avgValence * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-white/40">
                  {moodTrend.avgValence > 0.6
                    ? 'Upbeat & Joyful'
                    : moodTrend.avgValence > 0.4
                    ? 'Reflective & Balanced'
                    : 'Moody & Melancholic'}
                </div>
              </div>

              {/* Energy Intensity Gauge */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                  <span>Energy &amp; Entropy</span>
                  <span className="font-mono font-medium text-amber-400">
                    {Math.round(moodTrend.avgEnergy * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden my-2">
                  <div
                    className="h-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${moodTrend.avgEnergy * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-white/40">
                  {moodTrend.avgEnergy > 0.7
                    ? 'High Octane'
                    : moodTrend.avgEnergy > 0.4
                    ? 'Moderate Drive'
                    : 'Chill & Low-Key'}
                </div>
              </div>

              {/* Danceability / Rhythm Gauge */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                  <span>Rhythm &amp; Groove</span>
                  <span className="font-mono font-medium text-violet-400">
                    {Math.round(moodTrend.avgDanceability * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden my-2">
                  <div
                    className="h-full bg-violet-400 transition-all duration-700"
                    style={{ width: `${moodTrend.avgDanceability * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-white/40">
                  {moodTrend.avgDanceability > 0.7
                    ? 'Dancefloor Oriented'
                    : 'Listening & Ambient'}
                </div>
              </div>
            </div>
          </div>

          {/* 8-Dimensional Metric Fingerprint Breakdown */}
          <div className="rounded-2xl p-6 backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-semibold text-white">
                  Acoustic Vector Dimensions
                </h2>
              </div>
              <span className="text-xs text-white/50">Centroid Values</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VECTOR_DIMENSION_KEYS.map((key) => {
                const meta = VECTOR_DIMENSIONS_META[key];
                const val = tasteVector[key];
                const display =
                  key === 'beatsBpmNormalized'
                    ? `${normalizedToBpm(val)} BPM`
                    : `${Math.round(val * 100)}%`;

                return (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-2 font-medium text-white/80">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span>{meta.label}</span>
                      </span>
                      <span className="font-mono text-xs text-white/90">{display}</span>
                    </div>

                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${Math.max(4, val * 100)}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Genre Affinity Distribution & Recent Listening History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Genre Affinities */}
        <div className="lg:col-span-4 rounded-2xl p-6 backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <span>Genre Affinities</span>
          </h2>

          <div className="space-y-3">
            {(Array.isArray(genreAffinity)
              ? genreAffinity
              : Object.entries(genreAffinity || {}).map(([genre, pct]) => ({
                  genre: genre as any,
                  affinityPercent: typeof pct === 'number' ? (pct > 1 ? pct / 100 : pct) : 0,
                }))
            ).map((item) => {
              const theme = GENRE_THEMES[item.genre as keyof typeof GENRE_THEMES] || GENRE_THEMES.Synthwave;
              return (
                <div key={item.genre} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white/80">{item.genre}</span>
                    <span className="font-mono text-white/60">
                      {Math.round(item.affinityPercent * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${item.affinityPercent * 100}%`,
                        backgroundColor: theme.primary,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/5">
            <span className="text-xs text-white/50 block mb-2">Simulate Listen Session:</span>
            <div className="flex flex-wrap gap-1.5">
              {allSongs.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSimulateListen(s)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white transition-colors"
                >
                  +{s.title.slice(0, 12)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Listening History List */}
        <div className="lg:col-span-8 rounded-2xl p-6 backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Recent Listening History</h2>
              <span className="text-xs text-white/40 font-mono">({history.length})</span>
            </div>

            <button
              onClick={onClearHistory}
              className="text-xs text-white/50 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs">
              No listening history yet. Play songs to build your acoustic profile!
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto pr-1">
              {history.map((record) => {
                const isThisPlaying = isPlaying && currentSong?.id === record.song.id;
                return (
                  <div
                    key={record.id}
                    className="py-2.5 flex items-center justify-between gap-3 group hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => onPlaySong(record.song)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isThisPlaying
                            ? 'bg-violet-600 text-white'
                            : 'bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white'
                        }`}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {record.song.title}
                        </p>
                        <p className="text-[11px] text-white/50 truncate">
                          {record.song.artist} · {record.song.genre}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="font-mono text-[11px] text-white/40 hidden sm:inline">
                        {new Date(record.listenedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      <button
                        onClick={() => onToggleLike(record.song.id)}
                        className="text-white/40 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            record.userLiked ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
      <div className="relative rounded-3xl p-6 sm:p-8 bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synthesized Acoustic Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Personalized Music & Mood Dashboard
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Your taste vector is dynamically calculated from your listening history using
              exponential time decay and engagement weights.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-neutral-400">Current Dominant Vibe:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-neutral-800 border border-neutral-700">
                {dominantVibeDescription}
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-center min-w-[100px]">
              <div className="text-xs text-neutral-400 mb-1 flex items-center justify-center gap-1">
                <Music className="w-3.5 h-3.5 text-pink-400" />
                <span>Plays</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {tasteProfile.totalPlays}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-center min-w-[100px]">
              <div className="text-xs text-neutral-400 mb-1 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Minutes</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {tasteProfile.totalListeningMinutes}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-center min-w-[100px]">
              <div className="text-xs text-neutral-400 mb-1 flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Favorites</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {tasteProfile.likedSongIds.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar Chart + Mood & Dimension Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 8-Axis Vector Radar Chart */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-xl flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <Activity className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">Taste Vector Geometry</h2>
            </div>
            <span className="text-[11px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
              8-DIM
            </span>
          </div>

          <div className="py-2 flex items-center justify-center">
            <VectorRadarChart
              primaryVector={tasteVector}
              secondaryVector={currentSong?.vector}
              primaryLabel="My History Vector"
              secondaryLabel={currentSong ? currentSong.title : undefined}
              primaryColor="#EC4899"
              secondaryColor="#06B6D4"
              size={290}
            />
          </div>

          <p className="text-[11px] text-neutral-400 text-center mt-3 max-w-xs">
            Coordinates represent your synthesized acoustic fingerprint in vector space.
          </p>
        </div>

        {/* Right Column: Mood Index Gauges & Dimension Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mood Index Gauges */}
          <div className="rounded-3xl p-6 bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">Core Mood Indices</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Happiness / Valence Gauge */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>Valence (Happiness)</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {Math.round(moodTrend.avgValence * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-neutral-800 overflow-hidden my-2">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${moodTrend.avgValence * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-neutral-500">
                  {moodTrend.avgValence > 0.6
                    ? 'Upbeat & Joyful preference'
                    : moodTrend.avgValence > 0.4
                    ? 'Reflective & Balanced'
                    : 'Moody & Melancholic'}
                </div>
              </div>

              {/* Energy Intensity Gauge */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>Energy & Entropy</span>
                  <span className="font-mono font-bold text-amber-400">
                    {Math.round(moodTrend.avgEnergy * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-neutral-800 overflow-hidden my-2">
                  <div
                    className="h-full bg-amber-500 transition-all duration-700"
                    style={{ width: `${moodTrend.avgEnergy * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-neutral-500">
                  {moodTrend.avgEnergy > 0.7
                    ? 'High intensity & drive'
                    : moodTrend.avgEnergy > 0.4
                    ? 'Medium dynamic pacing'
                    : 'Calm & Restful'}
                </div>
              </div>

              {/* Danceability Rhythm Gauge */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>Danceability</span>
                  <span className="font-mono font-bold text-pink-400">
                    {Math.round(moodTrend.avgDanceability * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-neutral-800 overflow-hidden my-2">
                  <div
                    className="h-full bg-pink-500 transition-all duration-700"
                    style={{ width: `${moodTrend.avgDanceability * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-neutral-500">
                  {moodTrend.avgDanceability > 0.7
                    ? 'Rhythmically infectious'
                    : moodTrend.avgDanceability > 0.4
                    ? 'Moderate groove'
                    : 'Flow & Ambient'}
                </div>
              </div>
            </div>
          </div>

          {/* 8-Dimension Vector Fingerprint List */}
          <div className="rounded-3xl p-6 bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-200">
                Vector Dimension Breakdown
              </h3>
              <span className="text-xs text-neutral-400">Normalized [0.0 - 1.0]</span>
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
                    className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        {meta.label}
                      </span>
                      <span className="font-mono text-xs font-semibold text-neutral-200">
                        {display}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${val * 100}%`,
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

      {/* Genre Affinity Breakdown */}
      <div className="rounded-3xl p-6 bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <BarChart3 className="w-4 h-4" />
          </span>
          <h2 className="text-base font-bold text-white">Genre Affinity Distribution</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(genreAffinity).map(([genre, percent]) => {
            const theme = GENRE_THEMES[genre as keyof typeof GENRE_THEMES];
            return (
              <div
                key={genre}
                className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-200 line-clamp-1">
                    {genre}
                  </span>
                  <span className="font-mono text-xs text-neutral-400">{percent}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: theme?.primary || '#A855F7',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Listening History Timeline */}
      <div className="rounded-3xl p-6 bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Recent Listening Stream ({history.length} sessions)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Listening to a track updates your taste vector in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Simulate Listen from catalog */}
            <button
              onClick={() => {
                const randomSong = allSongs[Math.floor(Math.random() * allSongs.length)]!;
                onSimulateListen(randomSong);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Listen</span>
            </button>

            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-rose-400 bg-neutral-950/80 hover:bg-rose-500/10 border border-neutral-800 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset History</span>
              </button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-xs">
            No history recorded yet. Play or simulate tracks to start generating your taste vector!
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60">
            {history.map((record) => {
              const song = record.song;
              const isThisPlaying = currentSong?.id === song.id && isPlaying;
              const timeAgo = new Date(record.listenedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={record.id}
                  className="py-3 flex items-center justify-between gap-4 group hover:bg-neutral-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Play / Pause button */}
                    <button
                      onClick={() => onPlaySong(song)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isThisPlaying
                          ? 'bg-rose-500 text-white'
                          : 'bg-neutral-800 group-hover:bg-neutral-700 text-neutral-300'
                      }`}
                      aria-label="Play track"
                    >
                      {isThisPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="font-medium text-sm text-neutral-200 line-clamp-1 group-hover:text-white">
                        {song.title}
                      </div>
                      <div className="text-xs text-neutral-400 line-clamp-1">
                        {song.artist} · <span className="text-neutral-500">{song.genre}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right metadata & Like */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-block font-mono text-[11px] text-neutral-400">
                      {record.completionPercent}% played
                    </span>

                    <span className="text-[11px] text-neutral-500">{timeAgo}</span>

                    <button
                      onClick={() => onToggleLike(song.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        record.userLiked
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                      aria-label="Favorite"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          record.userLiked ? 'fill-current text-rose-500' : ''
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
  );
};

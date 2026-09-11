import React from 'react';
import { Heart, Play, Pause, Activity, Disc, Sparkles, Music, Radio } from 'lucide-react';
import { Song, RecommendationResult } from '../types/music';
import { GENRE_THEMES } from '../data/mockCatalog';

interface SongCardProps {
  song: Song;
  recommendation?: RecommendationResult;
  isPlaying: boolean;
  isCurrentSong: boolean;
  isLiked: boolean;
  onPlayToggle: (song: Song) => void;
  onLikeToggle: (songId: string) => void;
  onInspectVector: (song: Song) => void;
  onOpenSpotify?: (song: Song) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  recommendation,
  isPlaying,
  isCurrentSong,
  isLiked,
  onPlayToggle,
  onLikeToggle,
  onInspectVector,
  onOpenSpotify,
}) => {
  const genreTheme = GENRE_THEMES[song.genre] || GENRE_THEMES.Synthwave;
  const matchPercent = recommendation ? Math.round(recommendation.similarityScore * 100) : null;
  const isRealPreview = !!song.previewUrl;

  return (
    <div
      id={`song-card-${song.id}`}
      className={`group relative rounded-2xl p-4 bg-neutral-900/70 border backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${
        isCurrentSong
          ? `${genreTheme.cardBorder} shadow-lg shadow-black/50 ring-1 ring-white/15`
          : 'border-neutral-800/80 hover:border-neutral-700/80 hover:bg-neutral-900/90'
      }`}
    >
      <div>
        {/* Top Header: Genre Tag & Match Score */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${genreTheme.badgeBg}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: genreTheme.primary }}
            />
            {song.genre}
          </span>

          {matchPercent !== null ? (
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                matchPercent >= 90
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : matchPercent >= 75
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{matchPercent}% Match</span>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
              {isRealPreview ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5" />
                  Preview
                </span>
              ) : (
                <span>{song.releaseYear}</span>
              )}
            </span>
          )}
        </div>

        {/* Real Album Cover Artwork & Play Overlay */}
        <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-950 border border-neutral-800/80">
          {song.coverImage ? (
            <img
              src={song.coverImage}
              alt={song.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-tr ${song.coverGradient} opacity-90 transition-transform duration-500 group-hover:scale-105 flex items-center justify-center`}
            >
              <Disc
                className={`w-20 h-20 text-white/20 transition-all duration-700 ${
                  isCurrentSong && isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '6s' }}
              />
            </div>
          )}

          {/* Quick Play/Pause Center Button Overlay */}
          <button
            onClick={() => onPlayToggle(song)}
            className={`absolute inset-0 m-auto w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl backdrop-blur-md ${
              isCurrentSong && isPlaying
                ? 'bg-rose-500 text-white scale-100 opacity-100 ring-4 ring-rose-500/30'
                : 'bg-neutral-950/80 text-white opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-white hover:text-neutral-950'
            }`}
            aria-label={isCurrentSong && isPlaying ? 'Pause' : 'Play'}
          >
            {isCurrentSong && isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* BPM Badge & Release Year in corners */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-sm text-[11px] font-mono text-neutral-300 border border-neutral-800">
            {song.bpm} BPM
          </div>

          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-mono text-neutral-300 border border-neutral-700/60">
            {song.releaseYear}
          </div>
        </div>

        {/* Title, Artist, and Album */}
        <div>
          <h3
            className={`font-semibold text-base leading-snug line-clamp-1 transition-colors ${
              isCurrentSong ? 'text-white' : 'text-neutral-200 group-hover:text-white'
            }`}
            title={song.title}
          >
            {song.title}
          </h3>
          <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{song.artist}</p>
          <p className="text-[11px] text-neutral-500 line-clamp-1 italic">{song.album}</p>
        </div>

        {/* Vector Match Reason (if recommendation present) */}
        {recommendation && (
          <div className="mt-2.5 p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-[11px] text-neutral-400 flex items-start gap-1.5">
            <Activity className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-tight">{recommendation.matchReason}</span>
          </div>
        )}

        {/* Mini 4-Dimension Vector Metric Bars */}
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-neutral-800/60 text-[10px]">
          <div>
            <div className="flex justify-between text-neutral-400 mb-0.5">
              <span>DNC</span>
              <span className="font-mono text-neutral-300">
                {Math.round(song.vector.danceability * 100)}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-pink-500 transition-all duration-500"
                style={{ width: `${song.vector.danceability * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-neutral-400 mb-0.5">
              <span>NRG</span>
              <span className="font-mono text-neutral-300">
                {Math.round(song.vector.energy * 100)}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${song.vector.energy * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-neutral-400 mb-0.5">
              <span>VAL</span>
              <span className="font-mono text-neutral-300">
                {Math.round(song.vector.valence * 100)}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${song.vector.valence * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-neutral-400 mb-0.5">
              <span>VIBE</span>
              <span className="font-mono text-neutral-300">
                {Math.round(song.vector.vibeChillToHype * 100)}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${song.vector.vibeChillToHype * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer: Like Button & Vector Inspector & Spotify */}
      <div className="flex items-center justify-between mt-4 pt-2 border-t border-neutral-800/80">
        <button
          onClick={() => onLikeToggle(song.id)}
          className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs ${
            isLiked
              ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
          aria-label={isLiked ? 'Unlike track' : 'Like track'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
          <span>{isLiked ? 'Favorited' : 'Like'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          {onOpenSpotify && (
            <button
              onClick={() => onOpenSpotify(song)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-[#1DB954] hover:bg-[#1DB954]/10 transition-colors"
              title="Spotify details"
            >
              <Music className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onInspectVector(song)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors flex items-center gap-1"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Vector</span>
          </button>
        </div>
      </div>
    </div>
  );
};

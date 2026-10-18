import React, { useState } from 'react';
import {
  Search,
  Music,
  Play,
  Pause,
  Plus,
  ExternalLink,
  Sparkles,
  Loader2,
  Disc,
  Activity,
  Heart,
} from 'lucide-react';
import { Song } from '../types/music';
import { spotifySearchService, SpotifySearchResultItem } from '../services/spotifySearchService';
import { audioSynthesizer } from '../services/audioSynthesizer';

interface RealSongSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSongToCatalog: (song: Song) => void;
  onPlaySong: (song: Song) => void;
  onToggleLike: (songId: string, song?: Song) => void;
  likedSongIds: Set<string>;
  currentPlayingSong: Song | null;
  isPlaying: boolean;
}

const POPULAR_SEARCH_SUGGESTIONS = [
  'Daft Punk',
  'The Weeknd',
  'Dua Lipa',
  'Taylor Swift',
  'Arctic Monkeys',
  'Tame Impala',
  'Kendrick Lamar',
  'Billie Eilish',
  'Radiohead',
  'Kavinsky',
];

export const RealSongSearchModal: React.FC<RealSongSearchModalProps> = ({
  isOpen,
  onClose,
  onAddSongToCatalog,
  onPlaySong,
  onToggleLike,
  likedSongIds,
  currentPlayingSong,
  isPlaying,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SpotifySearchResultItem[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setQuery(searchTerm);
    try {
      const items = await spotifySearchService.searchTracks(searchTerm, 8);
      setResults(items);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const handleAddTrack = (item: SpotifySearchResultItem) => {
    const newSong = spotifySearchService.convertToSong(item);
    onAddSongToCatalog(newSong);
    setAddedIds((prev) => new Set([...prev, item.id]));
  };

  return (
    <div
      id="real-song-search-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 search-modal-backdrop"
    >
      <div className="relative w-full max-w-2xl search-modal-panel aura-surface rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Search Any Real Song
              </h2>
              <p className="text-xs text-neutral-400">
                Live search millions of tracks via Spotify & Apple Music API
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search Input and Suggestions */}
        <div className="p-5 border-b border-neutral-800/80 space-y-3 bg-neutral-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search song title or artist (e.g., 'Cruel Summer', 'One More Time')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/60"
            />
            <button
              onClick={() => handleSearch(query)}
              disabled={loading || !query.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-neutral-500 text-[11px] shrink-0 font-medium">Try:</span>
            {POPULAR_SEARCH_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleSearch(tag)}
                className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-[11px] whitespace-nowrap transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading && (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-500" />
              <p className="text-xs">Searching global catalogue & audio previews...</p>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-12 text-center text-neutral-500 space-y-2">
              <Disc className="w-10 h-10 mx-auto text-neutral-700" />
              <p className="text-xs">
                Type an artist or song name above to find real studio tracks and previews.
              </p>
            </div>
          )}

          {!loading &&
            results.map((item) => {
              const isAdded = addedIds.has(item.id);
              const song = spotifySearchService.convertToSong(item);
              const isLiked = likedSongIds.has(song.id);
              const isThisPlaying = currentPlayingSong?.id === song.id && isPlaying;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Cover Art / Play Button */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 group/cover">
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                          <Music className="w-5 h-5 text-neutral-500" />
                        </div>
                      )}

                      <button
                        onClick={() => onPlaySong(song)}
                        className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                          isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'
                        }`}
                        title="Play audio preview"
                      >
                        {isThisPlaying ? (
                          <Pause className="w-5 h-5 text-rose-400 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white truncate group-hover:text-rose-300 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-neutral-400 truncate">
                        {item.artist} · <span className="text-neutral-500">{item.album}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-neutral-400">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                          {item.genre}
                        </span>
                        <span>{item.releaseYear}</span>
                        <span>·</span>
                        <span className="text-cyan-400">{item.bpm} BPM</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onToggleLike(song.id, song)}
                      className={`p-2 rounded-xl border transition-colors ${
                        isLiked
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-rose-300 hover:border-rose-500/40'
                      }`}
                      title={isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleAddTrack(item)}
                      disabled={isAdded}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-white hover:text-rose-300 border border-neutral-700'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-rose-400" />
                          <span>Add to DB</span>
                        </>
                      )}
                    </button>

                    <a
                      href={item.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-[#1DB954]/20 border border-neutral-800 hover:border-[#1DB954]/40 text-neutral-400 hover:text-[#1DB954] transition-colors"
                      title="Open in Spotify"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Tracks are automatically embedded into pgvector with 8D acoustic features</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

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

interface RealSongSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSongToCatalog: (song: Song) => void;
  onPlaySong: (song: Song) => void;
  onToggleLike: (songId: string, song?: Song) => void;
  likedSongIds: Set<string>;
  currentPlayingSong: Song | null;
  isPlaying: boolean;
  likedSongIds: Set<string>;
  onToggleLike: (songId: string, song?: Song) => void;
  likedSongIds: Set<string>;
  onToggleLike: (songId: string, song?: Song) => void;
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
  likedSongIds,
  onToggleLike,
  likedSongIds,
  onToggleLike,
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
      const items = await spotifySearchService.searchTracks(searchTerm, 12);
      const items = await spotifySearchService.searchTracks(searchTerm, 12);
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Search &amp; Preview Songs
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Instant Preview &amp; Like
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Listen to 30s studio previews and like any track directly without having to add it to your 50-song catalog
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

        {/* Feature Hint Banner */}
        <div className="px-5 py-2.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
            <span>
              <strong>Direct Liking Enabled:</strong> Click the heart on any track to save it to your Liked Songs playlist &amp; auto-recalculate your taste vector without bloating your catalog.
            </span>
          </div>
        </div>

        {/* Feature Hint Banner */}
        <div className="px-5 py-2.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
            <span>
              <strong>Direct Liking Enabled:</strong> Click the heart on any track to save it to your Liked Songs playlist &amp; auto-recalculate your taste vector without bloating your catalog.
            </span>
          </div>
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
              <p className="text-xs">Searching global catalogue &amp; audio previews...</p>
              <p className="text-xs">Searching global catalogue &amp; audio previews...</p>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-12 text-center text-neutral-500 space-y-2">
              <Disc className="w-10 h-10 mx-auto text-neutral-700" />
              <p className="text-xs">
                Type an artist or song name above to find studio tracks, play 30s previews, and like tracks.
                Type an artist or song name above to find studio tracks, play 30s previews, and like tracks.
              </p>
            </div>
          )}

          {!loading &&
            results.map((item) => {
              const isAdded = addedIds.has(item.id);
              const song = spotifySearchService.convertToSong(item);
              const isLiked = likedSongIds.has(song.id);
              const isThisPlaying = currentPlayingSong?.id === song.id && isPlaying;
              const isLiked = likedSongIds.has(item.id) || likedSongIds.has(song.id);
              const isLiked = likedSongIds.has(item.id) || likedSongIds.has(song.id);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                    isThisPlaying
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/30'
                      : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                    isThisPlaying
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/30'
                      : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Cover Art / Audio Preview Play Button */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 group/cover shadow-md">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Cover Art / Audio Preview Play Button */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 group/cover shadow-md">
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
                        title={isThisPlaying ? 'Pause preview' : 'Play 30s studio preview'}
                        title={isThisPlaying ? 'Pause preview' : 'Play 30s studio preview'}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-6 h-6 text-rose-400 fill-current" />
                          <Pause className="w-6 h-6 text-rose-400 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                          <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                        )}
                      </button>

                      {isThisPlaying && (
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      )}

                      {isThisPlaying && (
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </div>

                    {/* Metadata & Preview Badge */}
                    {/* Metadata & Preview Badge */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate group-hover:text-rose-300 transition-colors">
                          {item.title}
                        </span>
                        {item.previewUrl ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0 flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5" />
                            <span>Preview</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-violet-500/15 text-violet-300 border border-violet-500/25 shrink-0">
                            Synth
                          </span>
                        )}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate group-hover:text-rose-300 transition-colors">
                          {item.title}
                        </span>
                        {item.previewUrl ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0 flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5" />
                            <span>Preview</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-violet-500/15 text-violet-300 border border-violet-500/25 shrink-0">
                            Synth
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-neutral-400 truncate mt-0.5">

                      <div className="text-xs text-neutral-400 truncate mt-0.5">
                        {item.artist} · <span className="text-neutral-500">{item.album}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-neutral-400">

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-neutral-400">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                          {item.genre}
                        </span>
                        <span>{item.releaseYear}</span>
                        <span>·</span>
                        <span className="text-cyan-400">{item.bpm} BPM</span>
                        {isThisPlaying && (
                          <span className="text-rose-400 font-sans font-medium flex items-center gap-1 ml-1 animate-pulse">
                            <Volume2 className="w-3 h-3" />
                            <span>Playing 30s preview</span>
                          </span>
                        )}
                        {isThisPlaying && (
                          <span className="text-rose-400 font-sans font-medium flex items-center gap-1 ml-1 animate-pulse">
                            <Volume2 className="w-3 h-3" />
                            <span>Playing 30s preview</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Direct Like Button & Optional Add to Catalog */}
                  {/* Actions: Direct Like Button & Optional Add to Catalog */}
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
                      className={`px-2.5 py-1.5 rounded-xl font-medium text-xs transition-all flex items-center gap-1 border ${
                      className={`px-2.5 py-1.5 rounded-xl font-medium text-xs transition-all flex items-center gap-1 border ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 cursor-default'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-800'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 cursor-default'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-800'
                      }`}
                      title="Add to visible 50-track catalog list"
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>In Catalog</span>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>In Catalog</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 text-neutral-400" />
                          <span className="hidden sm:inline">Add to Catalog</span>
                          <Plus className="w-3 h-3 text-neutral-400" />
                          <span className="hidden sm:inline">Add to Catalog</span>
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
            <span>Previews stream directly. Liking recalibrates your 8D taste vector in real-time.</span>
            <span>Previews stream directly. Liking recalibrates your 8D taste vector in real-time.</span>
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

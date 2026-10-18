import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderPlus,
  Heart,
  ListMusic,
  Music,
  Play,
  Pause,
  Trash2,
  Plus,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { Song, MusicGenre } from '../types/music';
import { relationalDbService, PlaylistRow } from '../services/vectorDb/relationalDbService';
import { UserDbRecord } from '../services/vectorDb/userDbService';

const API_BASE_URL = 'http://localhost:5000/api';

interface PlaylistsViewProps {
  currentUser: UserDbRecord;
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onToggleLike: (songId: string, song?: Song) => void;
  likedSongIds: Set<string>;
  allSongs: Song[];
  onInspectVector: (song: Song) => void;
  onOpenArchitecture: () => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  currentUser,
  currentSong,
  isPlaying,
  onPlaySong,
  onToggleLike,
  likedSongIds,
  allSongs,
  onInspectVector,
  onOpenArchitecture,
}) => {
  const [playlists, setPlaylists] = useState<(PlaylistRow & { track_count?: number; trackCount?: number })[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [activePlaylistTracks, setActivePlaylistTracks] = useState<Song[]>([]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [addTrackSearch, setAddTrackSearch] = useState('');
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [lastExecutedSql, setLastExecutedSql] = useState<string | null>(null);
  const [playlistLoadError, setPlaylistLoadError] = useState<string | null>(null);

  // 1. Load playlists for current user from Express API (with local fallback)
  const loadPlaylists = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${currentUser.user_id}/playlists`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPlaylists(data);
          if (data.length > 0 && (selectedPlaylistId === null || !data.some((p: any) => p.playlist_id === selectedPlaylistId))) {
            const likedPlaylist = data.find(
              (playlist: PlaylistRow & { track_count?: number }) =>
                (playlist.title === 'Liked Songs' || playlist.title === 'Favorites') &&
                (playlist.track_count ?? 0) > 0
            );
            const systemPlaylist = data.find(
              (playlist: PlaylistRow) =>
                playlist.title === 'Liked Songs' || playlist.title === 'Favorites'
            );
            setSelectedPlaylistId(
              (likedPlaylist || systemPlaylist || data[0]).playlist_id
            );
          }
          setLastExecutedSql(`SELECT p.playlist_id, p.title, COUNT(pt.track_id) FROM playlists p LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id WHERE p.user_id = ${currentUser.user_id} GROUP BY p.playlist_id;`);
          return;
        }
      }
    } catch (err) {
      console.warn('[Playlists] Backend offline, falling back to local service:', err);
    }

    const localPlaylists = relationalDbService.getPlaylists(currentUser.user_id);
    setPlaylists(localPlaylists);
    if (localPlaylists.length > 0 && (selectedPlaylistId === null || !localPlaylists.some((p) => p.playlist_id === selectedPlaylistId))) {
      setSelectedPlaylistId(localPlaylists[0]!.playlist_id);
    }
  }, [currentUser.user_id, selectedPlaylistId]);

  // 2. Fetch tracks for selected playlist from PostgreSQL and map cleanly to Song interface
  const loadPlaylistTracks = useCallback(async () => {
    setPlaylistLoadError(null);
    if (!selectedPlaylistId) {
      setActivePlaylistTracks([]);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/playlists/${selectedPlaylistId}/tracks`);
      if (!res.ok) {
        throw new Error(`Playlist tracks request failed (${res.status})`);
      }
      const dbTracks = await res.json();
      if (!Array.isArray(dbTracks)) {
        throw new Error('Playlist tracks response was not an array');
      }
      const mappedTracks: Song[] = dbTracks.map((row: any) => {
        const songId = String(row.id ?? row.track_id);
        const foundInCatalog = allSongs.find((s) => s.id === songId);
        if (foundInCatalog) return foundInCatalog;

        const rawGenre = row.genre || 'Nu-Disco / Pop';
        const genre = (rawGenre === 'Uncategorized' ? 'Nu-Disco / Pop' : rawGenre) as MusicGenre;

        return {
          id: songId,
          title: row.title || `Track #${songId}`,
          artist: row.artist || 'Unknown Artist',
          album: 'Single',
          genre,
          bpm: Number(row.bpm) || 120,
          durationSeconds: Number(row.duration) || 180,
          releaseYear: 2022,
          coverGradient: 'from-violet-600 via-indigo-600 to-cyan-500',
          coverImage: row.cover_image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
          previewUrl: row.preview_url || '',
          datasetSource: 'Kaggle Spotify 1.2M+' as any,
          audioFeatures: {
            danceability: 0.5,
            energy: 0.5,
            valence: 0.5,
            tempo: Number(row.bpm) || 120,
            acousticness: 0.5,
            instrumentalness: 0.1,
            liveness: 0.1,
            speechiness: 0.1,
          },
          vector: {
            danceability: 0.5,
            energy: 0.5,
            valence: 0.5,
            beatsBpmNormalized: 0.5,
            vibeChillToHype: 0.5,
            acousticness: 0.5,
            instrumentalness: 0.1,
            moodHarmonics: 0.5,
          },
          tags: [genre],
        } as Song;
      });

      setActivePlaylistTracks(mappedTracks);
      setLastExecutedSql(`SELECT t.* FROM playlist_tracks pt JOIN tracks t ON pt.track_id = t.track_id WHERE pt.playlist_id = ${selectedPlaylistId} ORDER BY pt.position ASC;`);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Playlist Tracks] Could not load persisted tracks:', err);
      setPlaylistLoadError(message);
    }

    const localTracks = relationalDbService.getTracksForPlaylist(selectedPlaylistId);
    setActivePlaylistTracks(localTracks);
  }, [selectedPlaylistId, allSongs]);

  useEffect(() => {
    loadPlaylists();
  }, [currentUser.user_id, likedSongIds, loadPlaylists]);

  useEffect(() => {
    loadPlaylistTracks();
  }, [selectedPlaylistId, likedSongIds, loadPlaylistTracks]);

  const activePlaylist = playlists.find((p) => p.playlist_id === selectedPlaylistId) || null;

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;

    const titleToCreate = newPlaylistTitle.trim();

    try {
      const res = await fetch(`${API_BASE_URL}/users/${currentUser.user_id}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleToCreate }),
      });

      if (res.ok) {
        const created = await res.json();
        setNewPlaylistTitle('');
        setIsCreatingPlaylist(false);
        setSelectedPlaylistId(created.playlist_id);
        await loadPlaylists();
        return;
      }
    } catch (err) {
      console.warn('Could not sync playlist creation to backend:', err);
    }

    const createdLocal = relationalDbService.createPlaylist(currentUser.user_id, titleToCreate);
    setNewPlaylistTitle('');
    setIsCreatingPlaylist(false);
    setSelectedPlaylistId(createdLocal.playlist_id);
    loadPlaylists();
  };

  const handleDeletePlaylist = async (playlistId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this playlist from PostgreSQL?')) {
      relationalDbService.deletePlaylist(playlistId);
      await loadPlaylists();
    }
  };

  const handleAddTrack = async (song: Song) => {
    if (!activePlaylist) return;

    relationalDbService.addTrackToPlaylist(activePlaylist.playlist_id, song.id);
    setAddTrackSearch('');
    setIsAddTrackOpen(false);

    try {
      await fetch(`${API_BASE_URL}/playlists/${activePlaylist.playlist_id}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: song.id }),
      });
    } catch (err) {
      console.warn('Could not sync track addition to backend:', err);
    }

    await loadPlaylists();
    await loadPlaylistTracks();
  };

  const handleRemoveTrack = async (songId: string) => {
    if (!activePlaylist) return;

    const isSystemPlaylist = activePlaylist.is_system || activePlaylist.title === 'Liked Songs' || activePlaylist.title === 'Favorites';

    if (isSystemPlaylist) {
      onToggleLike(songId);
    } else {
      relationalDbService.removeTrackFromPlaylist(activePlaylist.playlist_id, songId);
      try {
        await fetch(`${API_BASE_URL}/playlists/${activePlaylist.playlist_id}/tracks/${songId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Could not sync track deletion to backend:', err);
      }
    }

    await loadPlaylists();
    await loadPlaylistTracks();
  };

  const handlePlayAll = () => {
    if (activePlaylistTracks.length > 0) {
      onPlaySong(activePlaylistTracks[0]!);
    }
  };

  const filteredCandidates = allSongs
    .filter((s) => !activePlaylistTracks.some((pt) => pt.id === s.id))
    .filter((s) => {
      if (!addTrackSearch.trim()) return true;
      const q = addTrackSearch.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.genre.toLowerCase().includes(q);
    })
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-2xl p-6 sm:p-7 backdrop-blur-xl bg-[#0b0b10]/70 border border-white/10 ring-1 ring-white/5 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Relational Playlists &amp; Collections
            </h1>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Every playlist is persisted in PostgreSQL (<code className="text-violet-300 font-mono">playlists</code> table) and linked to user <code className="text-violet-300 font-mono">#{currentUser.user_id}</code>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setIsCreatingPlaylist(true)}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-violet-600/20"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Playlist</span>
            </button>

            <button
              onClick={onOpenArchitecture}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-medium text-xs sm:text-sm transition-all"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Inspect Schema</span>
            </button>
          </div>
        </div>

        {lastExecutedSql && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-mono">
              <Terminal className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] text-white/50">Latest SQL Executed:</span>
            </div>
            <code className="w-full sm:w-auto overflow-x-auto text-[11px] font-mono text-emerald-300/90 bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
              {lastExecutedSql}
            </code>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Playlist Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
              <ListMusic className="w-3.5 h-3.5 text-violet-400" />
              <span>User Collections ({playlists.length})</span>
            </h2>
            <span className="text-[10px] font-mono text-white/40">user_id = {currentUser.user_id}</span>
          </div>

          {isCreatingPlaylist && (
            <form
              onSubmit={handleCreatePlaylist}
              className="p-4 rounded-xl bg-violet-950/40 border border-violet-500/30 space-y-3 shadow-lg"
            >
              <div className="text-xs font-medium text-white flex items-center justify-between">
                <span>New Playlist Title</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingPlaylist(false)}
                  className="text-white/40 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                placeholder="e.g. Midnight Ambient Code..."
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-violet-500/30 text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPlaylist(false)}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistTitle.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white"
                >
                  Save to SQL
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {playlists.map((pl) => {
              const isSelected = pl.playlist_id === selectedPlaylistId;
              const isSystem = pl.is_system || pl.title === 'Liked Songs' || pl.title === 'Favorites';
              const count = pl.track_count ?? pl.trackCount ?? 0;

              return (
                <div
                  key={pl.playlist_id}
                  onClick={() => setSelectedPlaylistId(pl.playlist_id)}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-violet-900/30 border-violet-500/50 shadow-md ring-1 ring-violet-500/20'
                      : 'bg-[#0b0b10]/60 hover:bg-white/[0.04] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isSystem
                          ? 'bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-sm'
                          : 'bg-white/10 text-violet-300'
                      }`}
                    >
                      {isSystem ? <Heart className="w-5 h-5 fill-current" /> : <Music className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-white truncate">{pl.title}</h3>
                        {isSystem && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            SYSTEM
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/50 flex items-center gap-2 mt-0.5">
                        <span>{count} {count === 1 ? 'track' : 'tracks'}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">ID: #{pl.playlist_id}</span>
                      </p>
                    </div>
                  </div>

                  {!isSystem && (
                    <button
                      onClick={(e) => handleDeletePlaylist(pl.playlist_id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Track List */}
        <div className="lg:col-span-8 space-y-4">
          {activePlaylist ? (
            <div className="rounded-2xl p-5 sm:p-6 backdrop-blur-xl bg-[#0b0b10]/70 border border-white/10 ring-1 ring-white/5 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                      activePlaylist.is_system || activePlaylist.title === 'Liked Songs' || activePlaylist.title === 'Favorites'
                        ? 'bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg'
                        : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg'
                    }`}
                  >
                    {activePlaylist.is_system || activePlaylist.title === 'Liked Songs' || activePlaylist.title === 'Favorites' ? (
                      <Heart className="w-7 h-7 fill-current" />
                    ) : (
                      <ListMusic className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {activePlaylist.title}
                    </h2>
                    <p className="text-xs text-white/60 mt-0.5">
                      {activePlaylistTracks.length} tracks in this collection
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {activePlaylistTracks.length > 0 && (
                    <button
                      onClick={handlePlayAll}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-600/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play All</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsAddTrackOpen(!isAddTrackOpen)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 text-violet-400" />
                    <span>Add Tracks</span>
                  </button>
                </div>
              </div>

              {playlistLoadError && (
                <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                  Could not restore playlist tracks: {playlistLoadError}. Restart the backend on port 5000, then reload.
                </div>
              )}

              {isAddTrackOpen && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-violet-500/30 space-y-3">
                  <input
                    type="text"
                    value={addTrackSearch}
                    onChange={(e) => setAddTrackSearch(e.target.value)}
                    placeholder="Search catalog by title, artist..."
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                    {filteredCandidates.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handleAddTrack(song)}
                        className="p-2.5 rounded-lg bg-black/40 hover:bg-violet-950/40 border border-white/5 flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{song.title}</p>
                          <p className="text-[10px] text-white/50 truncate">{song.artist}</p>
                        </div>
                        <Plus className="w-4 h-4 text-violet-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePlaylistTracks.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Music className="w-8 h-8 text-white/30 mx-auto" />
                  <h3 className="text-sm font-medium text-white">No tracks in this playlist yet</h3>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activePlaylistTracks.map((song, index) => {
                    const isTrackPlaying = currentSong?.id === song.id && isPlaying;

                    return (
                      <div
                        key={song.id}
                        className={`group p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          currentSong?.id === song.id
                            ? 'bg-violet-950/30 border-violet-500/40 ring-1 ring-violet-500/20'
                            : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-5 text-xs font-mono text-white/40 group-hover:hidden">
                            {index + 1}
                          </span>
                          <button
                            onClick={() => onPlaySong(song)}
                            className="w-5 hidden group-hover:flex items-center justify-center text-violet-400 hover:text-white"
                          >
                            {isTrackPlaying ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                          </button>

                          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/10 relative">
                            {song.coverImage ? (
                              <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-tr ${song.coverGradient}`} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4
                              className={`text-xs font-medium truncate ${
                                currentSong?.id === song.id ? 'text-violet-300 font-semibold' : 'text-white'
                              }`}
                            >
                              {song.title}
                            </h4>
                            <p className="text-[11px] text-white/50 truncate">{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onInspectVector(song)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-violet-300 hover:bg-white/5 transition-colors"
                            title="Inspect 8D Vector"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRemoveTrack(song.id)}
                            className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                            title="Remove track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-white/60 text-xs">
              Select or create a playlist.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
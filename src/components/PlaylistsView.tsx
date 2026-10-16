import React, { useState, useEffect } from 'react';
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
  Check,
  Disc,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Song } from '../types/music';
import { relationalDbService, PlaylistRow, SqlAuditLogEntry } from '../services/vectorDb/relationalDbService';
import { UserDbRecord } from '../services/vectorDb/userDbService';

interface PlaylistsViewProps {
  currentUser: UserDbRecord;
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onToggleLike: (songId: string) => void;
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
  const [playlists, setPlaylists] = useState<(PlaylistRow & { trackCount: number })[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [addTrackSearch, setAddTrackSearch] = useState('');
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [lastExecutedSql, setLastExecutedSql] = useState<string | null>(null);

  const loadData = () => {
    const list = relationalDbService.getPlaylists(currentUser.user_id);
    setPlaylists(list);
    if (list.length > 0 && (selectedPlaylistId === null || !list.some((p) => p.playlist_id === selectedPlaylistId))) {
      setSelectedPlaylistId(list[0]!.playlist_id);
    }
    const logs = relationalDbService.getAuditLogs();
    if (logs.length > 0) {
      setLastExecutedSql(logs[0]!.query);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = relationalDbService.subscribe(loadData);
    return () => unsubscribe();
  }, [currentUser.user_id]);

  const activePlaylist = playlists.find((p) => p.playlist_id === selectedPlaylistId) || null;
  const activePlaylistTracks = activePlaylist ? relationalDbService.getTracksForPlaylist(activePlaylist.playlist_id) : [];

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;

    const titleToCreate = newPlaylistTitle.trim();
    const created = relationalDbService.createPlaylist(currentUser.user_id, titleToCreate);
    setNewPlaylistTitle('');
    setIsCreatingPlaylist(false);
    setSelectedPlaylistId(created.playlist_id);

    try {
      await fetch(`/api/users/${currentUser.user_id}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleToCreate }),
      });
    } catch (err) {
      console.warn('Could not sync playlist creation to backend:', err);
    }
  };

  const handleDeletePlaylist = (playlistId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this playlist from the relational database?')) {
      relationalDbService.deletePlaylist(playlistId);
    }
  };

  const handleAddTrack = async (song: Song) => {
    if (!activePlaylist) return;
    relationalDbService.addTrackToPlaylist(activePlaylist.playlist_id, song.id);
    setAddTrackSearch('');
    setIsAddTrackOpen(false);

    try {
      await fetch(`/api/playlists/${activePlaylist.playlist_id}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: song.id }),
      });
    } catch (err) {
      console.warn('Could not sync track addition to backend:', err);
    }
  };

  const handleRemoveTrack = async (songId: string) => {
    if (!activePlaylist) return;
    if (activePlaylist.is_system && activePlaylist.title === 'Liked Songs') {
      onToggleLike(songId);
    } else {
      relationalDbService.removeTrackFromPlaylist(activePlaylist.playlist_id, songId);
      try {
        await fetch(`/api/playlists/${activePlaylist.playlist_id}/tracks/${songId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Could not sync track deletion to backend:', err);
      }
    }
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
      {/* Top Banner: Relational Playlists Introduction & SQL Status */}
      <div className="relative rounded-2xl p-6 sm:p-7 backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Relational Playlists &amp; Collections
            </h1>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Every playlist is persisted in the PostgreSQL <code className="text-violet-300 font-mono">playlists</code> table,
              while tracks and ordering sequences are stored in the <code className="text-violet-300 font-mono">playlist_tracks</code> junction table
              with cascade foreign key integrity.
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
              title="Inspect 11 Relational Tables"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Inspect Schema</span>
            </button>
          </div>
        </div>

        {/* Live SQL Console Snippet */}
        {lastExecutedSql && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-mono">
              <Terminal className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] text-white/50">Latest SQL Executed:</span>
            </div>
            <code className="w-full sm:w-auto overflow-x-auto text-[11px] font-mono text-emerald-300/90 bg-black/40 px-2.5 py-1 rounded-md border border-white/5 line-clamp-1 max-w-xl">
              {lastExecutedSql.replace(/\n/g, ' ')}
            </code>
          </div>
        )}
      </div>

      {/* Main Grid: Left Playlist Navigation & Right Track List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Playlist Tabs / List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
              <ListMusic className="w-3.5 h-3.5 text-violet-400" />
              <span>User Collections ({playlists.length})</span>
            </h2>
            <span className="text-[10px] font-mono text-white/40">user_id = {currentUser.user_id}</span>
          </div>

          {/* New Playlist Input Modal / Card */}
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
                placeholder="e.g. Midnight Ambient Code, Gym Pump..."
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-violet-500/30 text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPlaylist(false)}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistTitle.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white"
                >
                  Save to SQL
                </button>
              </div>
            </form>
          )}

          {/* Playlist Cards List */}
          <div className="space-y-2">
            {playlists.map((pl) => {
              const isSelected = pl.playlist_id === selectedPlaylistId;
              const isLiked = pl.is_system && pl.title === 'Liked Songs';

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
                        isLiked
                          ? 'bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-sm'
                          : 'bg-white/10 text-violet-300'
                      }`}
                    >
                      {isLiked ? <Heart className="w-5 h-5 fill-current" /> : <Music className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-white truncate">{pl.title}</h3>
                        {isLiked && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            SYSTEM
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/50 flex items-center gap-2 mt-0.5">
                        <span>{pl.trackCount} {pl.trackCount === 1 ? 'track' : 'tracks'}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">ID: #{pl.playlist_id}</span>
                      </p>
                    </div>
                  </div>

                  {!pl.is_system && (
                    <button
                      onClick={(e) => handleDeletePlaylist(pl.playlist_id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Playlist Details & Songs List */}
        <div className="lg:col-span-8 space-y-4">
          {activePlaylist ? (
            <div className="rounded-2xl p-5 sm:p-6 backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 space-y-5">
              {/* Playlist Header Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                      activePlaylist.is_system
                        ? 'bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg'
                        : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg'
                    }`}
                  >
                    {activePlaylist.is_system ? (
                      <Heart className="w-7 h-7 fill-current" />
                    ) : (
                      <ListMusic className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {activePlaylist.title}
                      </h2>
                    </div>
                    <p className="text-xs text-white/60 mt-0.5 flex items-center gap-2">
                      <span>{activePlaylistTracks.length} tracks</span>
                      <span>•</span>
                      <span>Created {new Date(activePlaylist.created_at).toLocaleDateString()}</span>
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
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-violet-400" />
                    <span>Add Tracks</span>
                  </button>
                </div>
              </div>

              {/* Add Track Selector Dropdown / Search */}
              {isAddTrackOpen && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-violet-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-violet-400" />
                      <span>Add Track to "{activePlaylist.title}"</span>
                    </span>
                    <button
                      onClick={() => setIsAddTrackOpen(false)}
                      className="text-white/40 hover:text-white text-xs"
                    >
                      Close
                    </button>
                  </div>

                  <input
                    type="text"
                    value={addTrackSearch}
                    onChange={(e) => setAddTrackSearch(e.target.value)}
                    placeholder="Search catalog by title, artist, or genre..."
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                    {filteredCandidates.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handleAddTrack(song)}
                        className="p-2.5 rounded-lg bg-black/40 hover:bg-violet-950/40 border border-white/5 hover:border-violet-500/30 cursor-pointer flex items-center justify-between gap-2 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{song.title}</p>
                          <p className="text-[10px] text-white/50 truncate">{song.artist} • {song.genre}</p>
                        </div>
                        <Plus className="w-4 h-4 text-violet-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Track Sequence Listing */}
              {activePlaylistTracks.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                    <Music className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-medium text-white">No tracks in this playlist yet</h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">
                    Click "Add Tracks" or tap the heart icon on any track in Discover or Catalog to add songs.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activePlaylistTracks.map((song, index) => {
                    const isTrackPlaying = currentSong?.id === song.id && isPlaying;
                    const isLiked = likedSongIds.has(song.id);

                    return (
                      <div
                        key={song.id}
                        className={`group relative p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          currentSong?.id === song.id
                            ? 'bg-violet-950/30 border-violet-500/40 ring-1 ring-violet-500/20'
                            : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/5 hover:border-white/15'
                        }`}
                      >
                        {/* Left: Position & Thumbnail & Play */}
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-5 text-center text-xs font-mono text-white/40 group-hover:hidden">
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
                            <p className="text-[11px] text-white/50 truncate">
                              {song.artist} • <span className="text-white/40">{song.album}</span>
                            </p>
                          </div>
                        </div>

                        {/* Right: Genre Badge, Duration & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/60 border border-white/10">
                            {song.genre}
                          </span>

                          <span className="text-[11px] font-mono text-white/50">
                            {Math.floor(song.durationSeconds / 60)}:
                            {(song.durationSeconds % 60).toString().padStart(2, '0')}
                          </span>

                          <button
                            onClick={() => onInspectVector(song)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-violet-300 hover:bg-white/5 transition-colors"
                            title="Inspect 8D Vector"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRemoveTrack(song.id)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Remove from playlist"
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
              Select or create a playlist from the left panel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

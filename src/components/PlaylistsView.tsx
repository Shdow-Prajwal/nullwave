import React, { useState } from 'react';
import {
  ListMusic,
  Plus,
  Play,
  Pause,
  Trash2,
  Zap,
  Code2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Music,
  Activity,
  Radio,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Song, MusicVector, RecommendationResult } from '../types/music';
import {
  PlaylistRecord,
  PlaylistTrackRecord,
  userDbService,
  TriggerExecutionEvent,
} from '../services/vectorDb/userDbService';
import {
  musicVectorToArray,
  arrayToMusicVector,
  VECTOR_DIMENSIONS_META,
  VECTOR_DIMENSION_KEYS,
} from '../services/vectorDb/vectorMath';
import { GENRE_THEMES } from '../data/mockCatalog';

interface PlaylistsViewProps {
  userId: number;
  playlists: PlaylistRecord[];
  activePlaylistId: number | null;
  onSelectPlaylist: (playlistId: number) => void;
  onCreatePlaylist: (title: string, description?: string) => void;
  onDeletePlaylist: (playlistId: number) => void;
  playlistTracks: PlaylistTrackRecord[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onRemoveTrack: (playlistId: number, trackId: string) => void;
  onAddTrack: (playlistId: number, song: Song) => void;
  recommendedSongs: RecommendationResult[];
  lastTriggerEvent: TriggerExecutionEvent | null;
  currentUserTasteVector: number[];
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  userId,
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  playlistTracks,
  currentSong,
  isPlaying,
  onPlaySong,
  onRemoveTrack,
  onAddTrack,
  recommendedSongs,
  lastTriggerEvent,
  currentUserTasteVector,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showSqlTriggerCode, setShowSqlTriggerCode] = useState(false);

  const activePlaylist = playlists.find((p) => p.playlist_id === activePlaylistId) || playlists[0];

  // Calculate total duration in seconds
  const totalDurationSec = playlistTracks.reduce(
    (acc, pt) => acc + (pt.song.durationSeconds || 180),
    0
  );
  const durationMin = Math.floor(totalDurationSec / 60);
  const durationRemainingSec = totalDurationSec % 60;

  // Compute live playlist vector centroid across tracks
  const centroidVector = React.useMemo(() => {
    if (playlistTracks.length === 0) return null;
    const sums = [0, 0, 0, 0, 0, 0, 0, 0];
    playlistTracks.forEach((pt) => {
      const arr = musicVectorToArray(pt.song.vector);
      for (let i = 0; i < 8; i++) sums[i] += arr[i] || 0;
    });
    return sums.map((s) => s / playlistTracks.length);
  }, [playlistTracks]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle.trim());
    setNewTitle('');
    setIsCreatingNew(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── 1. Top Section: PostgreSQL Database Trigger Callout ── */}
      <div className="p-5 sm:p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-[#0b0b10]/80 border border-violet-500/30 ring-1 ring-violet-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1.5 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>PostgreSQL Trigger: trg_playlist_tracks_taste_update</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 font-medium">
                ACTIVE · AFTER INSERT / DELETE ON playlist_tracks
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Playlist-Driven Taste Vector Recalculation
            </h1>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              In this relational architecture, adding or removing a track from a playlist automatically
              fires an atomic PostgreSQL database trigger. The trigger calculates the 8D acoustic centroid
              <code className="text-violet-300 bg-black/40 px-1.5 py-0.5 rounded mx-1 text-xs">AVG(af.feature_vector)</code>
              across your playlist tracks and directly updates <code className="text-indigo-300 bg-black/40 px-1.5 py-0.5 rounded mx-1 text-xs">users.taste_vector</code> in real time!
            </p>
          </div>

          {/* Quick SQL Trigger Drawer Toggle */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setShowSqlTriggerCode(!showSqlTriggerCode)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Code2 className="w-4 h-4 text-violet-400" />
              <span>{showSqlTriggerCode ? 'Hide Trigger DDL' : 'View Trigger SQL DDL'}</span>
              {showSqlTriggerCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {lastTriggerEvent && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  Trigger fired on <strong>{lastTriggerEvent.action}</strong> ({lastTriggerEvent.songTitle})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Trigger SQL Definition */}
        {showSqlTriggerCode && (
          <div className="mt-5 pt-4 border-t border-white/10 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
              <div className="text-violet-400 mb-2 font-semibold">// PostgreSQL Trigger Function &amp; Event Binding</div>
              <pre className="text-zinc-300">{`CREATE OR REPLACE FUNCTION trg_fn_update_user_taste_from_playlist()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INT;
    v_new_taste VECTOR(8);
BEGIN
    -- Determine user_id of the modified playlist
    SELECT user_id INTO v_user_id
    FROM playlists
    WHERE playlist_id = COALESCE(NEW.playlist_id, OLD.playlist_id);

    -- Calculate the 8D centroid (mean vector) across all tracks in the user's playlists
    SELECT AVG(af.feature_vector) INTO v_new_taste
    FROM playlist_tracks pt
    JOIN playlists p ON pt.playlist_id = p.playlist_id
    JOIN audio_features af ON pt.track_id = af.track_id
    WHERE p.user_id = v_user_id;

    -- Update users.taste_vector in PostgreSQL state
    IF v_new_taste IS NOT NULL THEN
        UPDATE users
        SET taste_vector = v_new_taste
        WHERE user_id = v_user_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_playlist_tracks_taste_update
AFTER INSERT OR DELETE ON playlist_tracks
FOR EACH ROW
EXECUTE FUNCTION trg_fn_update_user_taste_from_playlist();`}</pre>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Playlists Selector Bar & Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Playlists tabs */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 text-xs">
          {playlists.map((pl) => (
            <button
              key={pl.playlist_id}
              onClick={() => onSelectPlaylist(pl.playlist_id)}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 shrink-0 ${
                activePlaylist?.playlist_id === pl.playlist_id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-1 ring-violet-400/40'
                  : 'bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/10'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>{pl.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-white/80 font-mono">
                {activePlaylist?.playlist_id === pl.playlist_id ? playlistTracks.length : 'Mix'}
              </span>
            </button>
          ))}

          {/* New Playlist Button */}
          {!isCreatingNew ? (
            <button
              onClick={() => setIsCreatingNew(true)}
              className="px-3 py-2 rounded-xl border border-dashed border-white/20 text-white/60 hover:text-white hover:border-violet-500/50 hover:bg-white/5 transition-all flex items-center gap-1.5 text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Playlist</span>
            </button>
          ) : (
            <form onSubmit={handleCreateSubmit} className="flex items-center gap-1.5 shrink-0">
              <input
                type="text"
                autoFocus
                placeholder="Playlist title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-violet-500/50 text-xs text-white placeholder-white/40 focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-2 py-1.5 text-xs text-white/50 hover:text-white"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {/* Delete Playlist Option (if not the only one) */}
        {activePlaylist && playlists.length > 1 && (
          <button
            onClick={() => onDeletePlaylist(activePlaylist.playlist_id)}
            className="text-xs text-red-400/70 hover:text-red-400 flex items-center gap-1 transition-colors"
            title="Delete this playlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Playlist</span>
          </button>
        )}
      </div>

      {/* ── 3. Active Playlist Metadata & Live Centroid Vector Bar ── */}
      {activePlaylist && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Playlist Tracks List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-violet-400" />
                  <span>{activePlaylist.title}</span>
                </h2>
                <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                  <span>{playlistTracks.length} tracks in playlist</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-white/40" />
                    {durationMin}m {durationRemainingSec}s
                  </span>
                  <span>•</span>
                  <span className="text-indigo-400 font-mono">user_id: {userId}</span>
                </div>
              </div>

              {playlistTracks.length > 0 && (
                <button
                  onClick={() => onPlaySong(playlistTracks[0]!.song)}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play All</span>
                </button>
              )}
            </div>

            {/* Track List */}
            {playlistTracks.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center space-y-3 bg-white/[0.01]">
                <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center mx-auto">
                  <Music className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">This playlist has no tracks yet</h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto">
                  Add tracks from the recommendations below or from the <strong>Discover</strong> and <strong>Catalog</strong> tabs.
                  Watch the trigger update your taste vector immediately!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {playlistTracks.map((pt, idx) => {
                  const isCurrent = currentSong?.id === pt.song.id;
                  const theme = GENRE_THEMES[pt.song.genre] || GENRE_THEMES.Synthwave;
                  const arr = musicVectorToArray(pt.song.vector);

                  return (
                    <div
                      key={pt.track_id}
                      className={`p-3 sm:p-3.5 rounded-xl backdrop-blur-xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-violet-950/30 border-violet-500/50 ring-1 ring-violet-500/30 shadow-lg'
                          : 'bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Left: Position & Play Button & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 text-center text-xs font-mono text-white/40 shrink-0">
                          {pt.position || idx + 1}
                        </span>

                        {/* Artwork / Play button */}
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/10">
                          {pt.song.coverImage ? (
                            <img
                              src={pt.song.coverImage}
                              alt={pt.song.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-tr ${pt.song.coverGradient}`} />
                          )}
                          <button
                            onClick={() => onPlaySong(pt.song)}
                            className={`absolute inset-0 m-auto w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isCurrent && isPlaying
                                ? 'bg-violet-600 text-white'
                                : 'bg-black/60 text-white hover:bg-white hover:text-black'
                            }`}
                          >
                            {isCurrent && isPlaying ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>

                        {/* Title & Artist */}
                        <div className="min-w-0">
                          <h4
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              isCurrent ? 'text-violet-300' : 'text-white'
                            }`}
                          >
                            {pt.song.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-white/60 truncate">
                            <span>{pt.song.artist}</span>
                            <span>•</span>
                            <span
                              className="px-1.5 py-0.2 rounded text-[10px] font-medium"
                              style={{ color: theme.primary }}
                            >
                              {pt.song.genre}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Vector Snapshot Chips & Remove Button */}
                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-white/50">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                            DNC: {Math.round(pt.song.vector.danceability * 100)}%
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                            NRG: {Math.round(pt.song.vector.energy * 100)}%
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                            {pt.song.bpm} BPM
                          </span>
                        </div>

                        <button
                          onClick={() => onRemoveTrack(activePlaylist.playlist_id, pt.track_id)}
                          title="Remove from playlist (fires trigger)"
                          className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Add Section: Recommended Tracks */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>Add Recommended Tracks (Test the Trigger!)</span>
                </h3>
                <span className="text-[11px] text-white/50">Click "+ Add" to fire trigger</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedSongs.slice(0, 4).map((rec) => {
                  const alreadyIn = playlistTracks.some((pt) => pt.track_id === rec.song.id);
                  return (
                    <div
                      key={rec.song.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/10">
                          {rec.song.coverImage ? (
                            <img
                              src={rec.song.coverImage}
                              alt={rec.song.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-tr ${rec.song.coverGradient}`} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{rec.song.title}</p>
                          <p className="text-[11px] text-white/50 truncate">{rec.song.artist}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddTrack(activePlaylist.playlist_id, rec.song)}
                        disabled={alreadyIn}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shrink-0 ${
                          alreadyIn
                            ? 'bg-white/5 text-white/40 border border-white/10 cursor-default'
                            : 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20'
                        }`}
                      >
                        {alreadyIn ? (
                          <span>In Playlist</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Live 8D Taste Vector Centroid & Trigger State */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Live Taste Vector State</h3>
                    <p className="text-[10px] text-white/50">users.taste_vector in PostgreSQL</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  VECTOR(8)
                </span>
              </div>

              <div className="text-xs text-white/70 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                Every track added or removed from this playlist directly recalculates this 8D vector.
                Observe how the bars below shift dynamically with each change:
              </div>

              {/* 8-Dimensional Vector Bars */}
              <div className="space-y-3 pt-1">
                {VECTOR_DIMENSION_KEYS.map((key, idx) => {
                  const meta = VECTOR_DIMENSIONS_META[key];
                  const currentVal = currentUserTasteVector[idx] ?? 0.5;
                  const percent = Math.round(currentVal * 100);

                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70 font-medium">{meta.label}</span>
                        <span className="font-mono text-white/90 text-[11px]">{percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Centroid status badge */}
              <div className="pt-3 border-t border-white/10 text-[11px] text-white/50 flex items-center justify-between">
                <span>Calculated via:</span>
                <span className="font-mono text-emerald-400">AVG(feature_vector)</span>
              </div>
            </div>

            {/* Quick Trigger Explanation Box */}
            <div className="p-4 rounded-xl bg-violet-500/[0.04] border border-violet-500/20 text-xs space-y-2 text-white/70">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <Info className="w-4 h-4 text-violet-400" />
                <span>Why this matters for your Recommender</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                When you go back to the <strong>Discover</strong> tab, the pgvector KNN query runs:
              </p>
              <div className="p-2 rounded-lg bg-black/50 font-mono text-[10px] text-violet-300">
                ORDER BY af.feature_vector &lt;=&gt; users.taste_vector
              </div>
              <p className="text-[11px] text-white/60">
                Because the playlist trigger updated <code className="text-white">users.taste_vector</code>,
                your Discover recommendations immediately adapt to your playlist's vibe!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

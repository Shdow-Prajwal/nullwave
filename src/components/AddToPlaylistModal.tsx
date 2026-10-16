import React, { useState } from 'react';
import { FolderPlus, Check, Plus, ListMusic, Heart, X, Database } from 'lucide-react';
import { Song } from '../types/music';
import { relationalDbService, PlaylistRow } from '../services/vectorDb/relationalDbService';
import { UserDbRecord } from '../services/vectorDb/userDbService';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  currentUser: UserDbRecord;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  song,
  currentUser,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !song) return null;

  const playlists = relationalDbService.getPlaylists(currentUser.user_id);

  const handleAddToPlaylist = (playlist: PlaylistRow) => {
    const success = relationalDbService.addTrackToPlaylist(playlist.playlist_id, song.id);
    if (success) {
      setSuccessMsg(`Added "${song.title}" to "${playlist.title}"`);
    } else {
      setSuccessMsg(`Track already exists in "${playlist.title}"`);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = relationalDbService.createPlaylist(currentUser.user_id, newTitle.trim());
    relationalDbService.addTrackToPlaylist(created.playlist_id, song.id);
    setNewTitle('');
    setIsCreating(false);
    setSuccessMsg(`Created "${created.title}" & added "${song.title}"`);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0b0b10] border border-white/10 ring-1 ring-white/5 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Add to Playlist</h3>
              <p className="text-xs text-white/50 truncate max-w-[240px]">
                {song.title} • {song.artist}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMsg ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 justify-center">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Existing Playlists */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {playlists.map((pl) => (
                <button
                  key={pl.playlist_id}
                  onClick={() => handleAddToPlaylist(pl)}
                  className="w-full p-3 rounded-xl bg-white/[0.03] hover:bg-violet-950/40 border border-white/5 hover:border-violet-500/30 text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {pl.is_system ? (
                      <Heart className="w-4 h-4 text-rose-400 fill-current shrink-0" />
                    ) : (
                      <ListMusic className="w-4 h-4 text-violet-400 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-white truncate">{pl.title}</span>
                  </div>
                  <Plus className="w-4 h-4 text-white/40 group-hover:text-violet-400 shrink-0" />
                </button>
              ))}
            </div>

            {/* Create New Playlist Option */}
            {isCreating ? (
              <form onSubmit={handleCreateAndAdd} className="space-y-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New playlist name..."
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-violet-500/30 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2.5 py-1.5 rounded-lg text-xs text-white/50 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTitle.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white"
                  >
                    Create &amp; Add
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-violet-500/50 hover:bg-white/[0.02] text-xs font-medium text-white/70 hover:text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <FolderPlus className="w-3.5 h-3.5 text-violet-400" />
                <span>+ Create New Playlist</span>
              </button>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-violet-400" />
            <span>Updates <code className="text-violet-300">playlist_tracks</code> table</span>
          </span>
          <span className="font-mono">CASCADE ON DELETE</span>
        </div>
      </div>
    </div>
  );
};

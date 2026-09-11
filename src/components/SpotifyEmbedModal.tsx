import React from 'react';
import { ExternalLink, Disc, Music, Check, Copy } from 'lucide-react';
import { Song } from '../types/music';

interface SpotifyEmbedModalProps {
  song: Song | null;
  onClose: () => void;
}

export const SpotifyEmbedModal: React.FC<SpotifyEmbedModalProps> = ({ song, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!song) return null;

  const spotifyUrl =
    song.spotifyUrl ||
    (song.spotifyId
      ? `https://open.spotify.com/track/${song.spotifyId}`
      : `https://open.spotify.com/search/${encodeURIComponent(`${song.artist} ${song.title}`)}`);

  // If we have a standard Spotify track ID, use Spotify embed iframe
  const hasStandardId = song.spotifyId && !song.spotifyId.startsWith('custom-');
  const embedUrl = hasStandardId
    ? `https://open.spotify.com/embed/track/${song.spotifyId}?utm_source=generator&theme=0`
    : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(spotifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="spotify-embed-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954]">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white line-clamp-1">Spotify Player & Link</h2>
              <p className="text-xs text-neutral-400">
                {song.title} · {song.artist}
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {embedUrl ? (
            <div className="rounded-2xl overflow-hidden shadow-xl border border-neutral-800 bg-black">
              <iframe
                title="Spotify Web Player"
                src={embedUrl}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-2xl"
              />
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center gap-4">
              {song.coverImage ? (
                <img
                  src={song.coverImage}
                  alt={song.title}
                  className="w-16 h-16 rounded-xl object-cover border border-neutral-800"
                />
              ) : (
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center`}
                >
                  <Disc className="w-8 h-8 text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{song.title}</div>
                <div className="text-xs text-neutral-400 truncate">{song.artist}</div>
                <div className="text-[11px] text-emerald-400 font-mono mt-1">
                  Kaggle Spotify Dataset · {song.bpm} BPM
                </div>
              </div>
            </div>
          )}

          {/* Spotify Audio Features breakdown */}
          {song.audioFeatures && (
            <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2 text-xs">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                Spotify Audio Features (Kaggle Dataset)
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] text-neutral-500">DANCEABILITY</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {Math.round(song.audioFeatures.danceability * 100)}%
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] text-neutral-500">ENERGY</div>
                  <div className="text-sm font-bold text-amber-400">
                    {Math.round(song.audioFeatures.energy * 100)}%
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] text-neutral-500">VALENCE</div>
                  <div className="text-sm font-bold text-pink-400">
                    {Math.round(song.audioFeatures.valence * 100)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Direct Spotify Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex-1 py-3 px-4 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1DB954]/20"
            >
              <span>Open on Spotify</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

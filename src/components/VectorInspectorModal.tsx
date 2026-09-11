import React, { useState } from 'react';
import { Activity, Copy, Check, Disc, ExternalLink, Music } from 'lucide-react';
import { MusicVector, Song } from '../types/music';
import { VectorRadarChart } from './VectorRadarChart';
import {
  VECTOR_DIMENSION_KEYS,
  VECTOR_DIMENSIONS_META,
  cosineDistance,
  cosineSimilarity,
  euclideanDistance,
  musicVectorToArray,
  vectorToPgVectorString,
  normalizedToBpm,
} from '../services/vectorDb/vectorMath';
import { GENRE_THEMES } from '../data/mockCatalog';

interface VectorInspectorModalProps {
  song: Song | null;
  comparisonVector: MusicVector;
  comparisonLabel?: string;
  onClose: () => void;
  onOpenSpotify?: (song: Song) => void;
}

export const VectorInspectorModal: React.FC<VectorInspectorModalProps> = ({
  song,
  comparisonVector,
  comparisonLabel = 'Your Query / Taste Vector',
  onClose,
  onOpenSpotify,
}) => {
  const [copied, setCopied] = useState(false);

  if (!song) return null;

  const songArray = musicVectorToArray(song.vector);
  const comparisonArray = musicVectorToArray(comparisonVector);
  const pgVectorStr = vectorToPgVectorString(songArray);

  const cosSim = cosineSimilarity(songArray, comparisonArray);
  const cosDist = cosineDistance(songArray, comparisonArray);
  const eucDist = euclideanDistance(songArray, comparisonArray);

  const genreTheme = GENRE_THEMES[song.genre] || GENRE_THEMES.Synthwave;

  const handleCopy = () => {
    navigator.clipboard.writeText(pgVectorStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="vector-inspector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-neutral-800 bg-neutral-950">
              {song.coverImage ? (
                <img
                  src={song.coverImage}
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center`}
                >
                  <Disc className="w-6 h-6 text-white/40" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white line-clamp-1">{song.title}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                  {song.datasetSource || 'Kaggle Spotify'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {song.artist} · <span className="font-semibold text-neutral-300">{song.genre}</span> ·{' '}
                <span className="text-neutral-500">{song.releaseYear}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSpotify && (
              <button
                onClick={() => onOpenSpotify(song)}
                className="px-2.5 py-1 rounded-xl bg-[#1DB954]/20 border border-[#1DB954]/40 text-[#1DB954] text-xs font-semibold hover:bg-[#1DB954]/30 transition-colors flex items-center gap-1"
                title="Spotify Embed Player"
              >
                <Music className="w-3 h-3" />
                <span>Spotify</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Comparison Metrics Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-center">
              <div className="text-[10px] text-neutral-400 uppercase font-mono">Cosine Similarity</div>
              <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                {(cosSim * 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-center">
              <div className="text-[10px] text-neutral-400 uppercase font-mono">Cosine Dist (&lt;=&gt;)</div>
              <div className="text-lg font-black font-mono text-cyan-400 mt-0.5">
                {cosDist.toFixed(4)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-center">
              <div className="text-[10px] text-neutral-400 uppercase font-mono">Euclidean Dist (&lt;-&gt;)</div>
              <div className="text-lg font-black font-mono text-purple-400 mt-0.5">
                {eucDist.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Radar Chart Overlay */}
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex flex-col items-center">
            <div className="text-xs font-semibold text-neutral-300 mb-2">
              Vector Space Overlap: Song vs. Target
            </div>
            <VectorRadarChart
              primaryVector={song.vector}
              secondaryVector={comparisonVector}
              primaryLabel={song.title}
              secondaryLabel={comparisonLabel}
              primaryColor={genreTheme.primary}
              secondaryColor="#38BDF8"
              size={260}
            />
          </div>

          {/* Dimension by Dimension Comparison List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-neutral-300 mb-2">
              8-Dimensional pgvector Embedding Breakdown
            </div>
            {VECTOR_DIMENSION_KEYS.map((key, i) => {
              const meta = VECTOR_DIMENSIONS_META[key];
              const sVal = songArray[i] ?? 0;
              const cVal = comparisonArray[i] ?? 0;
              const diff = Math.abs(sVal - cVal);
              const closeness = Math.max(0, 1 - diff);

              const sDisplay =
                key === 'beatsBpmNormalized'
                  ? `${normalizedToBpm(sVal)} BPM`
                  : `${Math.round(sVal * 100)}%`;

              const cDisplay =
                key === 'beatsBpmNormalized'
                  ? `${normalizedToBpm(cVal)} BPM`
                  : `${Math.round(cVal * 100)}%`;

              return (
                <div
                  key={key}
                  className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/70 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-[130px]">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="font-medium text-neutral-300">{meta.label}</span>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-mono text-[11px] text-neutral-400">{sDisplay}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden relative">
                      <div
                        className="h-full rounded-full absolute"
                        style={{
                          width: `${sVal * 100}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-neutral-500">
                      Target: {cDisplay}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                      closeness >= 0.85
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : closeness >= 0.65
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {Math.round(closeness * 100)}% match
                  </span>
                </div>
              );
            })}
          </div>

          {/* Raw pgvector array string representation */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 font-mono">
                PostgreSQL pgvector Literal:
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800/80 font-mono text-xs text-cyan-300 break-all">
              {pgVectorStr}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

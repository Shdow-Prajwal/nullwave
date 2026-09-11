import React, { useEffect, useRef } from 'react';
import { Play, Pause, Disc, Sparkles, Volume2, Radio } from 'lucide-react';
import { Song } from '../types/music';

interface NullwaveHeroProps {
  currentSong: Song;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExploreStations: () => void;
  onSearchRealSongs: () => void;
}

export const NullwaveHero: React.FC<NullwaveHeroProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  onExploreStations,
  onSearchRealSongs,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animate the hero waveform canvas exactly like in the provided UI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const BARS = 48;
    const baseHeights = Array.from({ length: BARS }, (_, i) => 0.2 + (Math.sin(i * 0.4) * 0.3 + 0.4));

    const render = () => {
      const w = (canvas.width = canvas.parentElement?.clientWidth || 260);
      const h = (canvas.height = 36);

      ctx.clearRect(0, 0, w, h);
      const bw = w / BARS;

      for (let i = 0; i < BARS; i++) {
        const live = isPlaying
          ? 0.3 + 0.7 * Math.abs(Math.sin(t * 2.5 + i * 0.35))
          : 0.15;
        const barH = Math.max(2, baseHeights[i] * live * h);
        const isHead = i / BARS < 0.45;

        ctx.fillStyle = isHead
          ? isPlaying
            ? '#FF6B6B'
            : 'rgba(244,245,246,0.85)'
          : 'rgba(244,245,246,0.3)';

        ctx.fillRect(i * bw, (h - barH) / 2, Math.max(1, bw - 2), barH);
      }

      if (isPlaying) {
        t += 0.02;
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  return (
    <section
      id="hero"
      className="relative min-h-[72vh] lg:min-h-[78vh] flex flex-col justify-end overflow-hidden border-b border-[#232733] bg-[#0c0e12] pt-8 pb-12 px-4 sm:px-6 lg:px-12 mb-8"
    >
      {/* Background Japanese Watermark */}
      <div
        className="hidden lg:block absolute right-12 top-12 font-display text-2xl font-bold tracking-[0.3em] text-neutral-800/80 pointer-events-none select-none writing-vertical"
        style={{ writingMode: 'vertical-rl' }}
      >
        未来音波 · ベクトル
      </div>

      {/* Cyberpunk Hero Figure Artwork */}
      <div className="absolute right-0 bottom-0 pointer-events-none z-0 max-w-[48%] max-h-[92%] opacity-40 lg:opacity-75 overflow-hidden flex items-end justify-end">
        <img
          src="https://cdn.jsdelivr.net/gh/VanhDc/aura-assets@nullwave-v1/nullwave/img/hero.png"
          alt="Listener in cyberpunk technical gear with headphones"
          className="object-contain h-full max-h-[640px] drop-shadow-[-20px_20px_50px_rgba(0,0,0,0.8)]"
          loading="eager"
        />
      </div>

      {/* Hero Content Left Column */}
      <div className="relative z-10 max-w-2xl">
        {/* Three technical marks */}
        <div className="flex flex-col gap-1.5 mb-6" aria-hidden="true">
          <span className="w-6 h-[2px] bg-[#FF6B6B]" />
          <span className="w-3 h-[2px] bg-neutral-600" />
          <span className="w-8 h-[2px] bg-neutral-400" />
        </div>

        {/* Brand identity */}
        <div className="mb-4">
          <b className="block font-display font-bold text-lg sm:text-xl tracking-[0.25em] uppercase text-white">
            NULLWAVE · VECTORVIBE
          </b>
          <span className="font-mono text-xs text-[#FF6B6B] tracking-widest uppercase">
            Neon ghost frequencies &amp; 8D pgvector
          </span>
        </div>

        {/* Big Bold Headline */}
        <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl tracking-tight uppercase leading-[0.96] text-white mb-5">
          Cyberpunk music <br className="hidden sm:inline" />
          for reading &amp; <br className="hidden sm:inline" />
          coding
        </h1>

        {/* Vibe Tags */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-neutral-400 tracking-wider uppercase mb-8">
          <span className="text-white font-medium">Rain</span>
          <span className="text-[#FF6B6B]">·</span>
          <span>Drones</span>
          <span className="text-[#FF6B6B]">·</span>
          <span>Machine hum</span>
          <span className="text-[#FF6B6B]">·</span>
          <span className="text-emerald-400 font-semibold">1.2M+ Real Spotify Vectors</span>
        </div>

        {/* Interactive Hero Audio Player Bar (Matching provided design) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#12141A] border border-[#2B303E] shadow-2xl flex items-center gap-4 sm:gap-6 max-w-xl">
          {/* Big Play / Pause Circular Button */}
          <button
            onClick={onTogglePlay}
            className="w-13 h-13 rounded-full bg-white hover:bg-[#FF6B6B] text-black transition-all flex items-center justify-center shrink-0 shadow-lg hover:scale-105 cursor-pointer group"
            aria-label={isPlaying ? 'Pause broadcast stream' : 'Play broadcast stream'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current text-black" />
            ) : (
              <Play className="w-5 h-5 fill-current text-black translate-x-0.5" />
            )}
          </button>

          {/* Current On-Air Metadata & Waveform */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="min-w-0">
                <b className="block font-display font-bold text-sm text-white truncate">
                  {currentSong.title}
                </b>
                <span className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider truncate">
                  {currentSong.artist} · <span className="text-[#FF6B6B]">{currentSong.genre}</span> · Live
                </span>
              </div>

              <span className="font-mono text-xs text-neutral-400 shrink-0 font-tabular">
                {isPlaying ? 'ON AIR' : 'PAUSED'}
              </span>
            </div>

            {/* Dynamic Waveform Canvas */}
            <canvas ref={canvasRef} className="w-full h-8 block rounded bg-[#0C0E12]/80 mt-1" />
          </div>
        </div>

        {/* Quick Station Navigation Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onExploreStations}
            className="px-4 py-2 rounded-xl bg-[#161820] hover:bg-[#20242e] border border-[#2B303E] text-xs font-display uppercase font-bold text-white tracking-wider transition-colors flex items-center gap-2"
          >
            <Radio className="w-3.5 h-3.5 text-[#FF6B6B]" />
            <span>Tune Channels</span>
          </button>

          <button
            onClick={onSearchRealSongs}
            className="px-4 py-2 rounded-xl bg-[#1DB954]/15 hover:bg-[#1DB954]/25 border border-[#1DB954]/40 text-xs font-display uppercase font-bold text-[#1DB954] tracking-wider transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Search Any Real Song</span>
          </button>
        </div>
      </div>
    </section>
  );
};

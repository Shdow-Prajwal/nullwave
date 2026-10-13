import React, { useMemo } from 'react';
import { GENRE_THEMES } from '../data/mockCatalog';
import { MusicGenre } from '../types/music';

interface DynamicGenreBackgroundProps {
  currentGenre: MusicGenre;
  isPlaying: boolean;
}

export const DynamicGenreBackground: React.FC<DynamicGenreBackgroundProps> = ({
  currentGenre,
  isPlaying,
}) => {
  const theme = useMemo(() => {
    return GENRE_THEMES[currentGenre] || GENRE_THEMES.Synthwave;
  }, [currentGenre]);

  return (
    <div
      id="dynamic-genre-ambient-canvas"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-all duration-1000 ease-out"
    >
      {/* Base deep obsidian background */}
      <div className="absolute inset-0 bg-[#0b0b10]" />

      {/* Cosmic radial glow from template */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 rounded-full opacity-60 blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 60%, rgba(139, 92, 246, 0.22) 0%, rgba(99, 102, 241, 0.16) 40%, rgba(0, 0, 0, 0) 75%)',
        }}
      />

      {/* Dynamic atmospheric radial gradient mesh blended with genre */}
      <div
        className="absolute inset-0 opacity-40 transition-all duration-1000 ease-out"
        style={{
          background: theme.gradientBg,
        }}
      />

      {/* Animated ambient orbs reflecting genre primary and secondary colors */}
      <div
        className={`absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-20 transition-all duration-1000 ease-out ${
          isPlaying ? 'animate-pulse' : ''
        }`}
        style={{
          backgroundColor: theme.primary,
          filter: 'blur(100px)',
          transform: isPlaying ? 'scale(1.15)' : 'scale(1.0)',
        }}
      />

      <div
        className={`absolute top-1/3 -right-24 w-[380px] h-[380px] rounded-full blur-3xl opacity-20 transition-all duration-1000 ease-out ${
          isPlaying ? 'animate-pulse' : ''
        }`}
        style={{
          backgroundColor: theme.secondary,
          filter: 'blur(110px)',
          animationDelay: '1.5s',
          transform: isPlaying ? 'scale(1.1)' : 'scale(0.95)',
        }}
      />

      {/* Subtle starlight grain */}
      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.9) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};

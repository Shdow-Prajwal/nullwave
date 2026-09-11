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
      {/* Base deep background */}
      <div className="absolute inset-0 bg-neutral-950" />

      {/* Dynamic atmospheric radial gradient mesh */}
      <div
        className="absolute inset-0 opacity-70 transition-all duration-1000 ease-out"
        style={{
          background: theme.gradientBg,
        }}
      />

      {/* Animated ambient orbs reflecting genre primary and secondary colors */}
      <div
        className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30 transition-all duration-1000 ease-out ${
          isPlaying ? 'animate-pulse' : ''
        }`}
        style={{
          backgroundColor: theme.primary,
          filter: 'blur(90px)',
          transform: isPlaying ? 'scale(1.15)' : 'scale(1.0)',
        }}
      />

      <div
        className={`absolute top-1/4 -right-28 w-96 h-96 rounded-full blur-3xl opacity-25 transition-all duration-1000 ease-out ${
          isPlaying ? 'animate-pulse' : ''
        }`}
        style={{
          backgroundColor: theme.secondary,
          filter: 'blur(100px)',
          animationDelay: '1.5s',
          transform: isPlaying ? 'scale(1.1)' : 'scale(0.95)',
        }}
      />

      <div
        className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-20 transition-all duration-1000 ease-out"
        style={{
          backgroundColor: theme.accent,
          filter: 'blur(80px)',
        }}
      />

      {/* Subtle audio grit / vinyl texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};

import React, { useMemo } from 'react';
import { GENRE_THEMES } from '../data/mockCatalog';
import { MusicGenre } from '../types/music';

interface DynamicGenreBackgroundProps {
  currentGenre: MusicGenre;
  isPlaying: boolean;
  coverImage?: string;
}

export const DynamicGenreBackground: React.FC<DynamicGenreBackgroundProps> = ({
  currentGenre,
  isPlaying,
  coverImage,
}) => {
  const theme = useMemo(
    () => GENRE_THEMES[currentGenre] || GENRE_THEMES.Synthwave,
    [currentGenre]
  );

  return (
    <div
      id="dynamic-genre-ambient-canvas"
      className={`ambient-root${isPlaying ? ' is-playing' : ''}`}
    >
      {coverImage && (
        <div
          key={coverImage}
          className="ambient-cover"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      )}
      <div className="ambient-blob ambient-blob-a" style={{ '--c': theme.primary } as React.CSSProperties} />
      <div className="ambient-blob ambient-blob-b" style={{ '--c': theme.secondary } as React.CSSProperties} />
      <div className="ambient-blob ambient-blob-c" style={{ '--c': '#FF7F4D' } as React.CSSProperties} />
      <div className="ambient-vignette" />
      <div className="ambient-grain" />
    </div>
  );
};

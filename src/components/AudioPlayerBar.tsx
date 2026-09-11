import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Activity,
  Disc,
  Music,
  Radio,
} from 'lucide-react';
import { Song } from '../types/music';
import { audioSynthesizer } from '../services/audioSynthesizer';
import { GENRE_THEMES } from '../data/mockCatalog';

interface AudioPlayerBarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  isLiked: boolean;
  onToggleLike: (songId: string) => void;
  onInspectVector: (song: Song) => void;
  onOpenSpotify?: (song: Song) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  isLiked,
  onToggleLike,
  onInspectVector,
  onOpenSpotify,
}) => {
  const [volume, setVolumeState] = useState(0.65);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.65);
  const [frequencies, setFrequencies] = useState<number[]>(new Array(16).fill(4));
  const [progressSec, setProgressSec] = useState(0);
  const [durationSec, setDurationSec] = useState(30);

  // Subscribe to real-time Web Audio Analyser
  useEffect(() => {
    const unsubscribe = audioSynthesizer.subscribeFrequencyData((data) => {
      if (isPlaying) {
        // Downsample FFT into 16 equalizer bars
        const step = Math.max(1, Math.floor(data.length / 16));
        const bars: number[] = [];
        for (let i = 0; i < 16; i++) {
          const val = data[i * step] ?? 0;
          bars.push(Math.max(4, (val / 255) * 28));
        }
        setFrequencies(bars);
      } else {
        setFrequencies((prev) => prev.map((v) => Math.max(4, v * 0.9)));
      }
    });

    return () => unsubscribe();
  }, [isPlaying]);

  // Subscribe to audio time update from audio synthesizer
  useEffect(() => {
    const unsubscribeTime = audioSynthesizer.subscribeTimeUpdate((curr, dur) => {
      setProgressSec(Math.round(curr));
      if (dur > 0) {
        setDurationSec(Math.round(dur));
      }
    });

    const unsubscribeEnd = audioSynthesizer.subscribeEnded(() => {
      onNext();
    });

    return () => {
      unsubscribeTime();
      unsubscribeEnd();
    };
  }, [onNext]);

  // Reset progress when song changes
  useEffect(() => {
    setProgressSec(0);
    if (currentSong?.previewUrl) {
      setDurationSec(30);
    } else if (currentSong) {
      setDurationSec(currentSong.durationSeconds || 210);
    }
  }, [currentSong?.id, currentSong?.previewUrl, currentSong?.durationSeconds]);

  const handleVolumeChange = (newVal: number) => {
    setVolumeState(newVal);
    audioSynthesizer.setVolume(newVal);
    if (newVal > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioSynthesizer.setVolume(prevVolume);
      setVolumeState(prevVolume);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      audioSynthesizer.setVolume(0);
      setVolumeState(0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSec = Math.round(ratio * durationSec);
    setProgressSec(targetSec);
    audioSynthesizer.seek(targetSec);
  };

  if (!currentSong) return null;

  const genreTheme = GENRE_THEMES[currentSong.genre] || GENRE_THEMES.Synthwave;
  const progressPercent = durationSec > 0 ? Math.min(100, (progressSec / durationSec) * 100) : 0;
  const isReal = !!currentSong.previewUrl;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="bottom-audio-player-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 border-t border-neutral-800/90 backdrop-blur-2xl px-4 sm:px-6 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]"
    >
      {/* Interactive Progress Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-neutral-800 cursor-pointer group"
        onClick={handleSeek}
      >
        <div
          className="h-full transition-all duration-150 relative group-hover:h-1.5"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: genreTheme.primary,
          }}
        >
          <span
            className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            style={{ backgroundColor: genreTheme.primary }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Song Info & Real Album Art */}
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:w-72">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md border border-neutral-800 bg-neutral-900">
            {currentSong.coverImage ? (
              <img
                src={currentSong.coverImage}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-tr ${currentSong.coverGradient} flex items-center justify-center`}
              >
                <Disc
                  className={`w-7 h-7 text-white/40 ${isPlaying ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '4s' }}
                />
              </div>
            )}
            {isPlaying && (
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white truncate">
                {currentSong.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate">
              <span className="truncate">{currentSong.artist}</span>
              <span>·</span>
              <span
                className="font-medium text-[11px] shrink-0"
                style={{ color: genreTheme.primary }}
              >
                {currentSong.genre}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-emerald-400/90 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" />
                <span>{isReal ? 'Studio Preview' : 'Procedural Synth'}</span>
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {currentSong.bpm} BPM
              </span>
            </div>
          </div>

          <button
            onClick={() => onToggleLike(currentSong.id)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors ml-1 shrink-0"
            aria-label={isLiked ? 'Unlike track' : 'Like track'}
          >
            <Heart
              className={`w-4 h-4 ${
                isLiked ? 'fill-rose-500 text-rose-500' : 'hover:text-rose-400'
              }`}
            />
          </button>
        </div>

        {/* Center: Playback Controls & Real-Time Waveform Equalizer */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-md">
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevious}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 shadow-lg"
              style={{
                backgroundColor: genreTheme.primary,
                boxShadow: `0 0 20px ${genreTheme.glowColor}`,
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Real-time Equalizer Waveform Bars */}
          <div className="flex items-end justify-center gap-1 h-6 w-44">
            {frequencies.map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full transition-all duration-75"
                style={{
                  height: `${h}px`,
                  backgroundColor: isPlaying ? genreTheme.primary : '#525252',
                  opacity: isPlaying ? 0.95 : 0.4,
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between w-full text-[11px] font-mono text-neutral-500 px-2">
            <span>{formatTime(progressSec)}</span>
            <span className="text-[10px] text-neutral-400 font-semibold">
              Kaggle Spotify
            </span>
            <span>{formatTime(durationSec)}</span>
          </div>
        </div>

        {/* Right: Spotify Link, Volume & Vector Inspector Button */}
        <div className="hidden sm:flex items-center gap-2.5 w-72 justify-end">
          {onOpenSpotify && (
            <button
              onClick={() => onOpenSpotify(currentSong)}
              className="px-2.5 py-1.5 rounded-xl bg-[#1DB954]/15 border border-[#1DB954]/30 hover:border-[#1DB954]/60 text-[#1DB954] text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Spotify Embed Player"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Spotify</span>
            </button>
          )}

          <button
            onClick={() => onInspectVector(currentSong)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
            title="Inspect 8D Vector Alignment"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Vectors</span>
          </button>

          <div className="flex items-center gap-2 pl-1">
            <button
              onClick={handleToggleMute}
              className="text-neutral-400 hover:text-white transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 accent-cyan-400 h-1 bg-neutral-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

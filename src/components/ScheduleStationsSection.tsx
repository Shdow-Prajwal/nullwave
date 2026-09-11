import React, { useState, useEffect } from 'react';
import { Radio, Volume2, Play, Disc, ArrowUpRight, Clock } from 'lucide-react';
import { Song, MusicVector } from '../types/music';
import { bpmToNormalized } from '../services/vectorDb/vectorMath';

interface ScheduleStationsSectionProps {
  currentSong: Song;
  isPlaying: boolean;
  onSelectStation: (presetVector: MusicVector, genre: string, targetSong?: Song) => void;
  catalog: Song[];
}

export const STATION_CHANNELS = [
  {
    id: 'focus',
    num: '01',
    title: 'Focus',
    genre: 'Cyber Techno',
    img: 'https://cdn.jsdelivr.net/gh/VanhDc/aura-assets@nullwave-v1/nullwave/img/sh-hum.webp',
    desc: 'Long form drones and machine hum with no percussion, built for deep engineering and code flows.',
    baseLevel: 74,
    vector: {
      danceability: 0.7,
      energy: 0.85,
      valence: 0.35,
      beatsBpmNormalized: bpmToNormalized(128),
      vibeChillToHype: 0.88,
      acousticness: 0.05,
      instrumentalness: 0.95,
      moodHarmonics: 0.7,
    },
  },
  {
    id: 'night-drive',
    num: '02',
    title: 'Night drive',
    genre: 'Synthwave',
    img: 'https://cdn.jsdelivr.net/gh/VanhDc/aura-assets@nullwave-v1/nullwave/img/sh-rain.webp',
    desc: 'Slow arpeggios, neon synth chords and steady rain. The frequency listeners leave on until dawn.',
    baseLevel: 58,
    vector: {
      danceability: 0.82,
      energy: 0.78,
      valence: 0.65,
      beatsBpmNormalized: bpmToNormalized(118),
      vibeChillToHype: 0.72,
      acousticness: 0.1,
      instrumentalness: 0.8,
      moodHarmonics: 0.45,
    },
  },
  {
    id: 'deep-read',
    num: '03',
    title: 'Deep read',
    genre: 'Lo-Fi Chill',
    img: 'https://cdn.jsdelivr.net/gh/VanhDc/aura-assets@nullwave-v1/nullwave/img/sh-drone.webp',
    desc: 'Almost nothing happens on purpose. Sub bass, vinyl warmth, tape hiss, and slow warm Rhodes.',
    baseLevel: 32,
    vector: {
      danceability: 0.45,
      energy: 0.3,
      valence: 0.5,
      beatsBpmNormalized: bpmToNormalized(78),
      vibeChillToHype: 0.15,
      acousticness: 0.75,
      instrumentalness: 0.88,
      moodHarmonics: 0.65,
    },
  },
  {
    id: 'tape-room',
    num: '04',
    title: 'Tape room',
    genre: 'Alt Rock',
    img: 'https://cdn.jsdelivr.net/gh/VanhDc/aura-assets@nullwave-v1/nullwave/img/sh-tape.webp',
    desc: 'Archive studio master reels played end to end, dropouts and all. Raw acoustic warmth.',
    baseLevel: 64,
    vector: {
      danceability: 0.62,
      energy: 0.72,
      valence: 0.55,
      beatsBpmNormalized: bpmToNormalized(112),
      vibeChillToHype: 0.6,
      acousticness: 0.35,
      instrumentalness: 0.45,
      moodHarmonics: 0.5,
    },
  },
];

export const ScheduleStationsSection: React.FC<ScheduleStationsSectionProps> = ({
  currentSong,
  isPlaying,
  onSelectStation,
  catalog,
}) => {
  // Live levels animation state
  const [levels, setLevels] = useState<number[]>([74, 58, 32, 64]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLevels((prev) =>
        prev.map((base, idx) => {
          const delta = (Math.random() - 0.5) * 12;
          return Math.max(10, Math.min(95, Math.round(base + delta)));
        })
      );
    }, 600);
    return () => clearInterval(timer);
  }, []);

  // 24H schedule slots mapped to actual catalog tracks
  const scheduleSlots = [
    { hour: '00:00', title: 'Deep Read & Sub Bass', genre: 'Lo-Fi Chill', artist: 'Powfu / Kudasa' },
    { hour: '04:00', title: 'Cold Sunrise Drone', genre: 'Cinematic Ambient', artist: 'Brian Eno / Stars' },
    { hour: '08:00', title: 'Focus Block Machine Hum', genre: 'Cyber Techno', artist: 'Daft Punk / Boys Noize' },
    { hour: '12:00', title: 'Wet Concourse & Tape', genre: 'Nu-Disco / Pop', artist: 'The Weeknd / Daft Punk' },
    { hour: '16:00', title: 'Night Drive Arpeggios', genre: 'Synthwave', artist: 'Kavinsky / Perturbator' },
    { hour: '20:00', title: 'Sable Circuit Archive', genre: 'Alt Rock', artist: 'Arctic Monkeys / Strokes' },
  ];

  const currentHour = new Date().getHours();
  const currentSlotIndex = Math.floor(currentHour / 4) % scheduleSlots.length;

  return (
    <div className="space-y-16 py-8">
      {/* ── SECTION 1: FOUR STATIONS ───────────────────────────── */}
      <section id="stations" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#232733] pb-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#FF6B6B]">
              Broadcast Channels
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-white mt-1">
              Four Stations
            </h2>
          </div>
          <p className="font-mono text-xs text-neutral-400 max-w-md">
            Each station delivers a curated acoustic embedding spectrum. Click any station to snap
            the vector tuner and stream live.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATION_CHANNELS.map((station, idx) => {
            const isStationActive =
              currentSong.genre.toLowerCase().includes(station.genre.toLowerCase()) ||
              (station.id === 'night-drive' && currentSong.genre === 'Synthwave') ||
              (station.id === 'deep-read' && currentSong.genre === 'Lo-Fi Chill') ||
              (station.id === 'focus' && currentSong.genre === 'Cyber Techno');

            return (
              <article
                key={station.id}
                onClick={() => {
                  const matchingSong = catalog.find(
                    (s) => s.genre.toLowerCase() === station.genre.toLowerCase()
                  );
                  onSelectStation(station.vector, station.genre, matchingSong);
                }}
                className={`group relative rounded-2xl overflow-hidden bg-[#12141A] border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isStationActive
                    ? 'border-[#FF6B6B] shadow-xl shadow-[#FF6B6B]/10'
                    : 'border-[#232733] hover:border-neutral-500 hover:bg-[#161922]'
                }`}
              >
                {/* Station Artwork Plate */}
                <div className="relative aspect-square w-full bg-[#0C0E12] overflow-hidden">
                  <img
                    src={station.img}
                    alt={station.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter contrast-[1.04]"
                    loading="lazy"
                  />

                  {/* On-air pill */}
                  {isStationActive && isPlaying && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#FF6B6B] text-black font-display text-[10px] font-bold uppercase tracking-widest shadow-md">
                      On Air
                    </span>
                  )}

                  {/* Audio Level Meter at the bottom of the art plate */}
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isStationActive ? 'bg-[#FF6B6B]' : 'bg-white/40'
                      }`}
                      style={{ width: `${levels[idx]}%` }}
                    />
                  </div>
                </div>

                {/* Station Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-[#FF6B6B] tracking-widest mb-1.5">
                      {station.num} // {station.genre}
                    </div>
                    <h3 className="font-display text-lg font-bold uppercase tracking-tight text-white mb-2 flex items-center justify-between">
                      <span>{station.title}</span>
                      <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                    </h3>
                    <p className="font-mono text-xs text-neutral-400 leading-relaxed">
                      {station.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#232733] flex items-center justify-between font-mono text-[11px] text-neutral-500">
                    <span>Channel {station.num}</span>
                    <span className="text-white group-hover:text-[#FF6B6B] transition-colors">
                      Tune &amp; Play →
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 2: TODAY ON AIR SCHEDULE ──────────────────── */}
      <section id="schedule" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#232733] pb-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              24-Hour Continuous Stream
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-white mt-1">
              Today On Air
            </h2>
          </div>
          <span className="font-mono text-xs text-neutral-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#FF6B6B]" />
            Continuous Live Stream · GMT
          </span>
        </div>

        {/* Timetable slots */}
        <div className="border-t border-[#232733] divide-y divide-[#232733]">
          {scheduleSlots.map((slot, index) => {
            const isNow = index === currentSlotIndex;
            return (
              <div
                key={slot.hour}
                onClick={() => {
                  const found = catalog.find(
                    (s) => s.genre.toLowerCase() === slot.genre.toLowerCase()
                  );
                  if (found) {
                    onSelectStation(found.vector, found.genre, found);
                  }
                }}
                className={`py-4 px-3 sm:px-5 flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer ${
                  isNow
                    ? 'bg-[#181B22] border-l-4 border-l-[#FF6B6B] text-white pl-4 sm:pl-6'
                    : 'hover:bg-[#12141A] hover:pl-5 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-4 sm:gap-8">
                  <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-neutral-400 w-14">
                    {slot.hour}
                  </span>
                  <div>
                    <span className="font-display text-sm sm:text-base font-bold uppercase tracking-tight block text-white">
                      {slot.title}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-400">
                      {slot.artist}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="hidden sm:inline-block font-mono text-xs text-neutral-500 uppercase tracking-widest">
                    {slot.genre}
                  </span>

                  <span
                    className={`font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 rounded font-bold ${
                      isNow
                        ? 'bg-[#FF6B6B] text-black'
                        : 'bg-[#232733] text-neutral-400 group-hover:text-white'
                    }`}
                  >
                    {isNow ? 'On Air' : 'Scheduled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

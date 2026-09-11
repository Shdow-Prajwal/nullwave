import React, { useState } from 'react';
import { Radio, Database, Cpu, Activity, ExternalLink } from 'lucide-react';

interface HopInfo {
  name: string;
  sub: string;
  stats: [string, string][];
}

const HOPS_DATA: HopInfo[] = [
  {
    name: 'Corpus Mast, Rotterdam',
    sub: 'Kaggle Spotify 1.2M+ Real Tracks',
    stats: [
      ['1,200,000+', 'Songs Indexed'],
      ['8-Dim', 'Acoustic pgvector'],
      ['100%', 'Real Studio Previews'],
    ],
  },
  {
    name: 'Vector Encoder & FFT',
    sub: 'Web Audio API + Feature Normalizer',
    stats: [
      ['320', 'kbit/s AAC / PCM'],
      ['44.1', 'kHz Sampling Rate'],
      ['8D', 'Vector Space Output'],
    ],
  },
  {
    name: 'PostgreSQL + pgvector Node',
    sub: 'HNSW Cosine Operator (<=>)',
    stats: [
      ['< 4', 'ms Query Latency'],
      ['16', 'm_index Connections'],
      ['99.98', '% Cosine Recall'],
    ],
  },
  {
    name: 'You / Listener',
    sub: 'Personalized Taste Centroid',
    stats: [
      ['1', 'Active Stream Open'],
      ['0', 'Advertisements Served'],
      ['100%', 'Free Listener Supported'],
    ],
  },
];

export const SignalChainSection: React.FC = () => {
  const [activeHopIndex, setActiveHopIndex] = useState<number>(0);
  const activeHop = HOPS_DATA[activeHopIndex]!;

  return (
    <div className="space-y-16 py-8">
      {/* ── SECTION 1: SIGNAL ROUTE TRANSMISSION ────────────────── */}
      <section
        id="signal"
        className="relative rounded-3xl overflow-hidden border border-[#232733] bg-[#0c0e12] min-h-[440px] sm:min-h-[500px] flex flex-col justify-end p-6 sm:p-10"
      >
        {/* Mast background image */}
        <img
          src="https://cdn.jsdelivr.net/gh/VanhDc/aura-assets@nullwave-v1/nullwave/img/mast.webp"
          alt="Radio transmission lattice mast against sky"
          className="absolute inset-0 w-full h-full object-cover opacity-25 filter contrast-125 pointer-events-none"
          loading="lazy"
        />

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0E12] via-[#0C0E12]/80 to-transparent pointer-events-none" />

        {/* Interactive SVG Signal Wire */}
        <div className="relative z-10 w-full mb-8">
          <svg
            viewBox="0 0 1000 240"
            className="w-full h-32 sm:h-44 overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Ghost background path */}
            <path
              d="M100,120 C250,50 350,190 500,120 S750,50 900,120"
              fill="none"
              stroke="rgba(244,245,246,0.15)"
              strokeWidth="2"
            />

            {/* Glowing active wire */}
            <path
              d="M100,120 C250,50 350,190 500,120 S750,50 900,120"
              fill="none"
              stroke="#FF6B6B"
              strokeWidth="2"
              strokeDasharray="8 4"
            />

            {/* Interactive Hops */}
            {[
              { x: 100, y: 120, label: 'CORPUS', sub: 'Kaggle 1.2M' },
              { x: 370, y: 145, label: 'ENCODER', sub: '8D Vectors' },
              { x: 630, y: 95, label: 'PGVECTOR', sub: 'HNSW Index' },
              { x: 900, y: 120, label: 'YOU', sub: 'Live Audio' },
            ].map((hop, i) => {
              const isSelected = activeHopIndex === i;
              return (
                <g
                  key={hop.label}
                  transform={`translate(${hop.x},${hop.y})`}
                  className="cursor-pointer group"
                  onClick={() => setActiveHopIndex(i)}
                >
                  <circle
                    r={isSelected ? 16 : 8}
                    fill={isSelected ? 'rgba(255,107,107,0.2)' : 'none'}
                    stroke="#FF6B6B"
                    strokeWidth="1.5"
                    className="transition-all duration-300"
                  />
                  <circle
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#FF6B6B' : '#F4F5F6'}
                    className="transition-all"
                  />
                  <text
                    x="0"
                    y={i % 2 === 0 ? -22 : 28}
                    textAnchor="middle"
                    className="font-display font-bold text-xs uppercase fill-white select-none"
                  >
                    {hop.label}
                  </text>
                  <text
                    x="0"
                    y={i % 2 === 0 ? -8 : 42}
                    textAnchor="middle"
                    className="font-mono text-[9px] fill-neutral-400 select-none"
                  >
                    {hop.sub}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Section Headline & Real Telemetry readout */}
        <div className="relative z-10">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#FF6B6B]">
                Transmission Topology
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-white mt-1">
                One Mast. Zero Ads.
              </h2>
            </div>
            <p className="font-mono text-xs text-neutral-400 max-w-md">
              Audio vectors stream directly from high-dimensional space into your browser. Click any
              node in the transmission path above to inspect pipeline telemetry.
            </p>
          </div>

          {/* Dynamic Hop Telemetry stats row */}
          <div className="pt-4 border-t border-[#232733] flex flex-wrap gap-6 sm:gap-12">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
                Active Node
              </span>
              <b className="font-display text-sm sm:text-base text-white block">
                {activeHop.name}
              </b>
              <span className="font-mono text-xs text-[#FF6B6B] block">{activeHop.sub}</span>
            </div>

            {activeHop.stats.map(([val, label]) => (
              <div key={label} className="min-w-[90px]">
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
                  {label}
                </span>
                <b className="font-mono text-xl sm:text-2xl font-bold text-white block">{val}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: SIGNAL CHAIN ─────────────────────────────── */}
      <section
        id="chain"
        className="rounded-3xl overflow-hidden border border-[#232733] bg-[#12141A] grid grid-cols-1 lg:grid-cols-2"
      >
        {/* Broadcast Studio Shot */}
        <div className="relative min-h-[260px] lg:min-h-full bg-[#0C0E12] overflow-hidden">
          <img
            src="https://cdn.jsdelivr.net/gh/VanhDc/aura-assets@nullwave-v1/nullwave/img/studio.webp"
            alt="Analog broadcast desk with console"
            className="w-full h-full object-cover opacity-80 filter contrast-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-transparent to-[#12141A]" />
        </div>

        {/* Chain Description & Ordered Steps */}
        <div className="p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#FF6B6B]">
              Signal Pipeline Architecture
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-white mt-1 mb-3">
              What The Signal Goes Through
            </h2>
            <p className="font-mono text-xs text-neutral-400 leading-relaxed max-w-lg">
              Every track flows through mathematical acoustic normalization, vector embeddings,
              and low-latency vector index querying. The pipeline guarantees pure audio fidelity
              with zero commercial interruptions.
            </p>
          </div>

          {/* Ordered Signal Steps */}
          <ol className="divide-y divide-[#232733] border-y border-[#232733] font-mono text-xs">
            {[
              { title: 'Studio Master Audio PCM', tech: 'Kaggle Spotify 30s Master', num: '01' },
              { title: 'Web Audio Analyser Node', tech: '16-Band Realtime FFT', num: '02' },
              { title: '8-Dimensional Embedding', tech: 'Dance, Energy, Valence, BPM', num: '03' },
              { title: 'PostgreSQL pgvector Engine', tech: 'Cosine (<=>) KNN Metric', num: '04' },
              { title: 'History Taste Centroid', tech: 'Time-Weighted Decay', num: '05' },
              { title: 'Lossless Streaming Output', tech: 'Direct PCM & AAC Pipeline', num: '06' },
            ].map((step) => (
              <li
                key={step.num}
                className="py-3 flex items-center justify-between gap-4 text-neutral-300"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#FF6B6B]">{step.num}</span>
                  <span className="font-medium text-white">{step.title}</span>
                </div>
                <span className="text-neutral-500 text-[11px] shrink-0">{step.tech}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
};

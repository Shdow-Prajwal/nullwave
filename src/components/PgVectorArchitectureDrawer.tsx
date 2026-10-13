import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Database,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Sliders,
  Zap,
} from 'lucide-react';
import { PGVECTOR_SCHEMA_SQL } from '../services/vectorDb/schemaSql';
import { PgVectorQueryPlan, VectorDistanceMetric } from '../services/vectorDb/types';
import { MusicVector } from '../types/music';
import { vectorToPgVectorString, musicVectorToArray } from '../services/vectorDb/vectorMath';

interface PgVectorArchitectureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentQueryPlan: PgVectorQueryPlan | null;
  targetVector: MusicVector;
  metric: VectorDistanceMetric;
  onChangeMetric: (m: VectorDistanceMetric) => void;
}

export const PgVectorArchitectureDrawer: React.FC<PgVectorArchitectureDrawerProps> = ({
  isOpen,
  onClose,
  currentQueryPlan,
  targetVector,
  metric,
  onChangeMetric,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'sql' | 'schema' | 'benchmark'>('architecture');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSchema = () => {
    const blob = new Blob([PGVECTOR_SCHEMA_SQL], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'music_recommender_pgvector_schema.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  const vectorArray = musicVectorToArray(targetVector);
  const pgVectorParam = vectorToPgVectorString(vectorArray);

  return (
    <div
      id="pgvector-architecture-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0b0b10] border border-white/10 ring-1 ring-white/5 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  PostgreSQL + pgvector Architecture
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-violet-500/15 text-violet-300 border border-violet-500/20">
                  Ready for Production
                </span>
              </div>
              <p className="text-xs text-white/60">
                Vector embeddings schema, HNSW indexing specifications, and live KNN query execution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/10 bg-white/[0.02] text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'architecture'
                ? 'text-violet-300 border-violet-400 bg-white/[0.04]'
                : 'text-white/50 border-transparent hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'sql'
                ? 'text-violet-300 border-violet-400 bg-white/[0.04]'
                : 'text-white/50 border-transparent hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live KNN Query</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'schema'
                ? 'text-violet-300 border-violet-400 bg-white/[0.04]'
                : 'text-white/50 border-transparent hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>schema.sql Migration</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'benchmark'
                ? 'text-violet-300 border-violet-400 bg-white/[0.04]'
                : 'text-white/50 border-transparent hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Distance Operators & HNSW</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Architecture Flow */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              {/* Visual Pipeline */}
              <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                  End-to-End Vector Pipeline
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                    <div className="text-xs font-bold text-pink-400 flex items-center gap-1">
                      <span>1. Feature Extraction</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Normalizes acoustic properties into an 8D vector [0.0 - 1.0]
                    </div>
                    <div className="font-mono text-[10px] text-neutral-500 truncate">
                      energy, dance, valence...
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                    <div className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                      <span>2. PostgreSQL + pgvector</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      1:1 <code className="text-indigo-300">audio_features</code> table with <code className="text-indigo-300">vector(8)</code>
                    </div>
                    <div className="font-mono text-[10px] text-neutral-500">
                      CREATE EXTENSION vector;
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                    <div className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                      <span>3. IVFFlat & HNSW Indexes</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Cosine distance index (<code className="text-cyan-300">vector_cosine_ops</code>)
                    </div>
                    <div className="font-mono text-[10px] text-neutral-500">
                      Sub-millisecond KNN
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <span>4. Relational Multi-Join</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Joins <code className="text-emerald-300">tracks</code>, <code className="text-emerald-300">artist</code>, <code className="text-emerald-300">genre</code>
                    </div>
                    <div className="font-mono text-[10px] text-neutral-500">
                      Ranked recommendations
                    </div>
                  </div>
                </div>
              </div>

              {/* Relational Entity Blueprint Breakdown */}
              <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-violet-400" />
                    <span>Relational Database Blueprint (8D Vector Model)</span>
                  </div>
                  <span className="text-[11px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                    PostgreSQL 15+ &bull; pgvector
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                      <span>Strong Entities</span>
                    </div>
                    <ul className="text-[11px] space-y-1 text-neutral-400">
                      <li><strong className="text-neutral-200">users</strong>: user_id, username, email, <code className="text-violet-300">taste_vector(8)</code></li>
                      <li><strong className="text-neutral-200">tracks</strong>: track_id, title, duration, bpm, genre_id</li>
                      <li><strong className="text-neutral-200">genre</strong>: genre_id, name</li>
                      <li><strong className="text-neutral-200">artist</strong>: artist_id, name, bio</li>
                      <li><strong className="text-neutral-200">moods</strong>: mood_id, label</li>
                      <li><strong className="text-neutral-200">playlists</strong>: playlist_id, title, user_id</li>
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <span>1:1 Audio Features</span>
                    </div>
                    <ul className="text-[11px] space-y-1 text-neutral-400">
                      <li><strong className="text-neutral-200">track_id</strong> (PK, FK &rarr; tracks)</li>
                      <li>energy, danceability, valence [0.0 - 1.0]</li>
                      <li>acousticness, instrumentalness [0.0 - 1.0]</li>
                      <li>liveness, speechiness, tempo_norm [0.0 - 1.0]</li>
                      <li className="pt-1 text-cyan-300 font-mono text-[10px]">
                        feature_vector VECTOR(8)
                      </li>
                      <li className="text-[10px] text-neutral-500">
                        IVFFLAT & HNSW vector_cosine_ops
                      </li>
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>M:N Junction Tables</span>
                    </div>
                    <ul className="text-[11px] space-y-1 text-neutral-400">
                      <li><strong className="text-neutral-200">performs</strong>: (artist_id, track_id, role)</li>
                      <li><strong className="text-neutral-200">track_moods</strong>: (track_id, mood_id)</li>
                      <li><strong className="text-neutral-200">playlist_tracks</strong>: (playlist_id, track_id, position)</li>
                      <li><strong className="text-neutral-200">listen_history</strong>: user_id, track_id, rating [1..5], last_played</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Dynamic User Taste Centroid Explanation */}
              <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Dynamic User Taste Vector Synthesis (PostgreSQL Trigger / Cron)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-purple-400">Exponential Decay</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Every time a user listens to a song, the system updates their personal taste vector
                  using a time-decayed centroid algorithm. Recent listens have higher weight, while
                  skipped songs or older sessions gracefully fade:
                </p>
                <div className="p-3 rounded-xl bg-neutral-900 font-mono text-xs text-cyan-300 overflow-x-auto">
                  weight = (user_liked ? 1.6 : 1.0) * (completion / 100) * exp(-0.099 * days_ago)
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Live KNN Query */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-neutral-400">
                  Exact SQL query executed against PostgreSQL pgvector based on current tuner:
                </div>
                <button
                  onClick={() => handleCopySql(currentQueryPlan?.querySql || '')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors border border-neutral-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Query'}</span>
                </button>
              </div>

              <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
                <pre>{currentQueryPlan?.querySql}</pre>
              </div>

              {/* Parameter values */}
              <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                <div className="text-xs font-semibold text-neutral-400">Query Vector Parameter ($1):</div>
                <div className="font-mono text-xs text-neutral-300 break-all p-2 rounded bg-neutral-900 border border-neutral-800">
                  {pgVectorParam}
                </div>
              </div>

              {/* Execution Plan Metrics */}
              {currentQueryPlan && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                    <div className="text-[10px] text-neutral-500 uppercase font-mono">Execution Time</div>
                    <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                      {currentQueryPlan.executionTimeMs} ms
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                    <div className="text-[10px] text-neutral-500 uppercase font-mono">Index Method</div>
                    <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                      {currentQueryPlan.indexUsed}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                    <div className="text-[10px] text-neutral-500 uppercase font-mono">Operator</div>
                    <div className="text-sm font-bold font-mono text-purple-400 mt-0.5">
                      &lt;=&gt; (Cosine)
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                    <div className="text-[10px] text-neutral-500 uppercase font-mono">Estimated Cost</div>
                    <div className="text-sm font-bold font-mono text-neutral-300 mt-0.5">
                      {currentQueryPlan.estimatedCost}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: schema.sql */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-neutral-400">
                  Complete PostgreSQL migration script with table definitions, HNSW indexes, and triggers:
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSchema}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                  >
                    <span>Download .sql</span>
                  </button>
                  <button
                    onClick={() => handleCopySql(PGVECTOR_SCHEMA_SQL)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 font-mono text-xs text-neutral-300 overflow-x-auto max-h-96 leading-relaxed">
                <pre>{PGVECTOR_SCHEMA_SQL}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: Benchmark & Distance Operators */}
          {activeTab === 'benchmark' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Distance Metric Selection</h3>
                <p className="text-xs text-neutral-400 mb-4">
                  Select which vector distance operator is used for KNN queries in PostgreSQL:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => onChangeMetric('cosine')}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      metric === 'cosine'
                        ? 'bg-violet-500/10 border-violet-500/40 ring-1 ring-violet-500/30'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-violet-300 mb-1">&lt;=&gt; Cosine Distance</div>
                    <div className="text-xs font-semibold text-white mb-1">Recommended for Music</div>
                    <div className="text-[11px] text-neutral-400">
                      Measures angle between vector features regardless of total magnitude.
                    </div>
                  </button>

                  <button
                    onClick={() => onChangeMetric('l2')}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      metric === 'l2'
                        ? 'bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/30'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-purple-400 mb-1">&lt;-&gt; L2 Euclidean</div>
                    <div className="text-xs font-semibold text-white mb-1">Geometric Distance</div>
                    <div className="text-[11px] text-neutral-400">
                      Measures straight-line distance in 8-dimensional Cartesian space.
                    </div>
                  </button>

                  <button
                    onClick={() => onChangeMetric('inner_product')}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      metric === 'inner_product'
                        ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-amber-400 mb-1">&lt;#&gt; Negative Dot Product</div>
                    <div className="text-xs font-semibold text-white mb-1">Inner Product</div>
                    <div className="text-[11px] text-neutral-400">
                      Useful for unnormalized embeddings where length correlates to prominence.
                    </div>
                  </button>
                </div>
              </div>

              {/* Index comparison table */}
              <div className="rounded-2xl bg-neutral-950/80 border border-neutral-800 p-4">
                <div className="text-xs font-bold text-white mb-3">pgvector Index Performance Comparison</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400">
                        <th className="pb-2 font-mono">Index Type</th>
                        <th className="pb-2 font-mono">Query Speed</th>
                        <th className="pb-2 font-mono">Recall Accuracy</th>
                        <th className="pb-2 font-mono">Build Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      <tr>
                        <td className="py-2.5 font-bold text-cyan-400">HNSW (Hierarchical Graph)</td>
                        <td className="py-2.5 text-emerald-400 font-semibold">Sub-millisecond (&lt;2ms)</td>
                        <td className="py-2.5">99%+ Near-Perfect</td>
                        <td className="py-2.5 text-neutral-400">Moderate</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-medium text-purple-400">IVFFlat (Inverted File)</td>
                        <td className="py-2.5 text-amber-400">Fast (5-15ms)</td>
                        <td className="py-2.5">90-95%</td>
                        <td className="py-2.5 text-emerald-400">Fast</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-medium text-neutral-400">Exact Sequential Scan</td>
                        <td className="py-2.5 text-rose-400">Slow (O(N))</td>
                        <td className="py-2.5">100% (Exact)</td>
                        <td className="py-2.5 text-emerald-400">Instant (No index)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>PostgreSQL 15+ with pgvector 0.5.0+ extension ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

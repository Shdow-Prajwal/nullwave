import React, { useState, useEffect } from 'react';
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
  Table,
  Clock,
  ChevronDown,
  Play,
  Download,
  Server,
  FileText,
} from 'lucide-react';
import { PGVECTOR_SCHEMA_SQL } from '../services/vectorDb/schemaSql';
import { PgVectorQueryPlan, VectorDistanceMetric } from '../services/vectorDb/types';
import { MusicVector } from '../types/music';
import { vectorToPgVectorString, musicVectorToArray } from '../services/vectorDb/vectorMath';
import { relationalDbService, TableSummary, SqlAuditLogEntry } from '../services/vectorDb/relationalDbService';

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
  const [activeTab, setActiveTab] = useState<
    'tables' | 'query' | 'export' | 'audit' | 'architecture' | 'sql' | 'schema' | 'benchmark'
  >('tables');
  const [copied, setCopied] = useState(false);
  const [copiedDump, setCopiedDump] = useState(false);
  const [tableStats, setTableStats] = useState<TableSummary[]>([]);
  const [selectedInspectTable, setSelectedInspectTable] = useState<string>('tracks');
  const [inspectRows, setInspectRows] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<SqlAuditLogEntry[]>([]);
  const [customQuery, setCustomQuery] = useState('SELECT * FROM playlist_tracks;');
  const [queryResult, setQueryResult] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;
    const refresh = () => {
      const stats = relationalDbService.getTableStats();
      setTableStats(stats);
      setInspectRows(relationalDbService.getTableData(selectedInspectTable));
      setAuditLogs(relationalDbService.getAuditLogs());
    };
    refresh();
    const unsub = relationalDbService.subscribe(refresh);
    return () => unsub();
  }, [isOpen, selectedInspectTable]);

  if (!isOpen) return null;

  const handleCopySql = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunQuery = (sqlToRun?: string) => {
    const q = sqlToRun || customQuery;
    const res = relationalDbService.executeSqlQuery(q);
    setQueryResult(res);
    // Refresh table stats in case INSERT/UPDATE/DELETE occurred
    setTableStats(relationalDbService.getTableStats());
    setInspectRows(relationalDbService.getTableData(selectedInspectTable));
    setAuditLogs(relationalDbService.getAuditLogs());
  };

  const handleDownloadPostgresDump = () => {
    const sql = relationalDbService.exportDatabaseToPostgresSql();
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vectorvibe_postgres_dump.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPostgresDump = () => {
    const sql = relationalDbService.exportDatabaseToPostgresSql();
    navigator.clipboard.writeText(sql);
    setCopiedDump(true);
    setTimeout(() => setCopiedDump(false), 2000);
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
                  PostgreSQL + pgvector Architecture &amp; Console
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-violet-500/15 text-violet-300 border border-violet-500/20">
                  Ready for Production
                </span>
              </div>
              <p className="text-xs text-white/60">
                Live relational tables, interactive SQL query console, local export dump, and 8D pgvector indexing
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
            onClick={() => setActiveTab('tables')}
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
              activeTab === 'tables'
                ? 'text-violet-300 border-violet-400 bg-white/[0.04]'
                : 'text-white/50 border-transparent hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-violet-400" />
            <span>Database Tables (All 11)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('query');
              if (!queryResult) {
                handleRunQuery('SELECT * FROM playlist_tracks;');
              }
            }}
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
              activeTab === 'query'
                ? 'text-emerald-300 border-emerald-400 bg-white/[0.04]'
                : 'text-white/50 border-transparent hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>SQL Query Console</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
              activeTab === 'export'
                ? 'text-cyan-300 border-cyan-400 bg-white/[0.04]'
                : 'text-white/50 border-transparent hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>Local Postgres Setup &amp; Export</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
              activeTab === 'audit'
                ? 'text-violet-300 border-violet-400 bg-white/[0.04]'
                : 'text-white/50 border-transparent hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>SQL Audit Log</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
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
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
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
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
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
            className={`px-3.5 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${
              activeTab === 'benchmark'
                ? 'text-violet-300 border-violet-400 bg-white/[0.04]'
                : 'text-white/50 border-transparent hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Distance &amp; HNSW</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 0: All 11 Relational Tables */}
          {activeTab === 'tables' && (
            <div className="space-y-6">
              {/* Relational Status Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-neutral-950 to-indigo-950/40 border border-violet-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <h3 className="text-sm font-semibold text-white">
                        All 11 PostgreSQL Tables Active &amp; Persistent
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        100% OPERATIONAL
                      </span>
                    </div>
                    <p className="text-xs text-white/70 mt-1 max-w-2xl leading-relaxed">
                      Every interaction—liking a song, creating playlists, ordering tracks, adjusting taste sliders, or playing tracks—executes real SQL statements across normalized entities, junctions, and pgvector embeddings.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => relationalDbService.expandCatalogWithGeneratedSeeds(6)}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-md"
                      title="Insert 6 new tracks across genres into tracks and audio_features tables"
                    >
                      + Seed Tracks (+6)
                    </button>
                  </div>
                </div>
              </div>

              {/* 11 Tables Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tableStats.map((t) => (
                  <div
                    key={t.name}
                    onClick={() => {
                      setSelectedInspectTable(t.name);
                      setInspectRows(relationalDbService.getTableData(t.name));
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedInspectTable === t.name
                        ? 'bg-violet-950/40 border-violet-500/60 ring-1 ring-violet-500/30'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-white truncate">{t.displayName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            t.category === 'Vector'
                              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                              : t.category === 'Junction'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : t.category === 'History'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {t.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed mb-3">
                        {t.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                      <span className="text-white/40 font-mono">{t.columns.length} columns</span>
                      <span className="font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {t.rowCount} {t.rowCount === 1 ? 'row' : 'rows'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Table Records Inspector */}
              <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-violet-400" />
                    <h4 className="text-xs font-semibold text-white tracking-wide uppercase">
                      Live Table Inspector: <span className="text-violet-300 font-mono lowercase">{selectedInspectTable}</span>
                    </h4>
                    <span className="text-xs text-white/40 font-mono">
                      ({inspectRows.length} total rows)
                    </span>
                  </div>

                  <select
                    value={selectedInspectTable}
                    onChange={(e) => {
                      setSelectedInspectTable(e.target.value);
                      setInspectRows(relationalDbService.getTableData(e.target.value));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-violet-400"
                  >
                    {tableStats.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} ({s.rowCount} rows)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto max-h-72 border border-white/5 rounded-xl">
                  {inspectRows.length === 0 ? (
                    <div className="p-8 text-center text-xs text-white/40">No rows found in {selectedInspectTable}</div>
                  ) : (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-white/5 border-b border-white/10 text-white/60 sticky top-0">
                        <tr>
                          {Object.keys(inspectRows[0] || {}).map((col) => (
                            <th key={col} className="p-2.5 font-medium whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        {inspectRows.slice(0, 20).map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            {Object.entries(row).map(([k, val], cIdx) => (
                              <td key={cIdx} className="p-2.5 whitespace-nowrap max-w-xs truncate text-[11px]">
                                {typeof val === 'object' && val !== null
                                  ? JSON.stringify(val)
                                  : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Live Interactive SQL Query Console */}
          {activeTab === 'query' && (
            <div className="space-y-5">
              {/* Query Console Intro */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Interactive PostgreSQL Query Runner</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE ENGINE
                    </span>
                  </div>
                  <p className="text-xs text-white/60">
                    Send real SQL queries against all 11 tables. Inspect songs in your playlists, user taste vectors, listen history, or insert new entries!
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRunQuery()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Query (Ctrl+Enter)</span>
                  </button>
                </div>
              </div>

              {/* Preset SQL Buttons */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                  Quick Query Presets (Click to Execute):
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    {
                      label: 'Playlist Tracks & Positions',
                      sql: 'SELECT * FROM playlist_tracks;',
                    },
                    {
                      label: 'Users & 8D Taste Vectors',
                      sql: 'SELECT user_id, username, email, taste_vector FROM users;',
                    },
                    {
                      label: 'Playlists Summary',
                      sql: 'SELECT playlist_id, title, user_id, is_system FROM playlists;',
                    },
                    {
                      label: 'JOIN Playlists + Tracks',
                      sql: 'SELECT playlist_id, playlist_title, username, track_id, track_title, artist, position FROM playlist_tracks JOIN tracks;',
                    },
                    {
                      label: 'Audio Features & Vector Embeddings',
                      sql: 'SELECT track_id, energy, danceability, valence, feature_vector FROM audio_features LIMIT 10;',
                    },
                    {
                      label: 'Recent Listen History',
                      sql: 'SELECT history_id, user_id, track_id, last_played, rating FROM listen_history LIMIT 10;',
                    },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCustomQuery(preset.sql);
                        handleRunQuery(preset.sql);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 text-white/70 hover:text-emerald-300 transition-colors font-mono text-[11px]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SQL Textarea Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className="font-mono">SQL Editor</span>
                  <button
                    onClick={() => setCustomQuery('')}
                    className="text-white/40 hover:text-white"
                  >
                    Clear Editor
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleRunQuery();
                      }
                    }}
                    placeholder="Enter SQL statement: SELECT, INSERT INTO, UPDATE, DELETE..."
                    className="w-full p-3.5 rounded-xl bg-black/80 border border-white/10 focus:border-emerald-500/80 font-mono text-xs text-emerald-300 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    onClick={() => handleRunQuery()}
                    className="absolute right-3 bottom-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow-md"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </button>
                </div>
              </div>

              {/* Query Results View */}
              {queryResult && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${queryResult.success ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="text-xs font-semibold text-white">Execution Result</span>
                      <span className="text-xs font-mono text-white/40">
                        ({queryResult.executionTimeMs}ms)
                      </span>
                    </div>

                    {queryResult.success && queryResult.rowCount !== undefined && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {queryResult.rowCount} rows returned
                      </span>
                    )}
                  </div>

                  {queryResult.error ? (
                    <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono">
                      {queryResult.error}
                    </div>
                  ) : queryResult.rows && queryResult.rows.length > 0 ? (
                    <div className="overflow-x-auto max-h-72 border border-white/10 rounded-xl bg-black/40">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-white/5 border-b border-white/10 text-emerald-300/80 sticky top-0">
                          <tr>
                            {queryResult.columns?.map((col: string) => (
                              <th key={col} className="p-2.5 font-semibold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/90">
                          {queryResult.rows.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-white/[0.03]">
                              {queryResult.columns?.map((col: string, cIdx: number) => {
                                const val = row[col];
                                return (
                                  <td key={cIdx} className="p-2.5 whitespace-nowrap max-w-xs truncate text-[11px]">
                                    {typeof val === 'object' && val !== null
                                      ? JSON.stringify(val)
                                      : String(val !== undefined ? val : 'NULL')}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-emerald-300 font-mono">
                      {queryResult.message || 'Query OK (0 rows returned)'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: Local PostgreSQL Setup & .sql Dump Export */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-neutral-950 to-blue-950/40 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Export &amp; Run on Local PostgreSQL with pgvector
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      COMPLETE DUMP
                    </span>
                  </div>
                  <p className="text-xs text-white/70 max-w-xl leading-relaxed">
                    Download a self-contained SQL file containing the DDL for all 11 tables, HNSW vector indexes, and all real saved rows (including users, emails, 8D taste vectors, playlists, and track sequences).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyPostgresDump}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-all flex items-center gap-1.5 border border-white/10"
                  >
                    {copiedDump ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDump ? 'Copied Dump!' : 'Copy SQL'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPostgresDump}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .sql Dump</span>
                  </button>
                </div>
              </div>

              {/* 4-Step Local Run Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-cyan-300 font-semibold">
                    <span>Step 1: Start Local PostgreSQL + pgvector</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">Docker</span>
                  </div>
                  <p className="text-white/60 text-[11px]">
                    Run the official PostgreSQL container with the pgvector extension pre-installed:
                  </p>
                  <pre className="p-2.5 rounded-lg bg-neutral-950 font-mono text-[11px] text-cyan-200 overflow-x-auto whitespace-pre-wrap border border-white/5">
docker run -d \
  --name musicdb \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  pgvector/pgvector:pg16
                  </pre>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-cyan-300 font-semibold">
                    <span>Step 2: Import the Database Dump</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">psql</span>
                  </div>
                  <p className="text-white/60 text-[11px]">
                    Import the downloaded <code className="text-white">vectorvibe_postgres_dump.sql</code> file:
                  </p>
                  <pre className="p-2.5 rounded-lg bg-neutral-950 font-mono text-[11px] text-cyan-200 overflow-x-auto whitespace-pre-wrap border border-white/5">
psql -h localhost \
  -U postgres \
  -d postgres \
  -f vectorvibe_postgres_dump.sql
                  </pre>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-emerald-300 font-semibold">
                    <span>Step 3: Query Added Entries</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Query</span>
                  </div>
                  <p className="text-white/60 text-[11px]">
                    Inspect your playlist tracks, user profiles, and taste vectors from your terminal:
                  </p>
                  <pre className="p-2.5 rounded-lg bg-neutral-950 font-mono text-[11px] text-emerald-200 overflow-x-auto whitespace-pre-wrap border border-white/5">
psql -h localhost -U postgres -d postgres \
  -c "SELECT * FROM playlist_tracks;"

psql -h localhost -U postgres -d postgres \
  -c "SELECT user_id, username, taste_vector FROM users;"
                  </pre>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-violet-300 font-semibold">
                    <span>Step 4: Real Vector Distance Search</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">pgvector</span>
                  </div>
                  <p className="text-white/60 text-[11px]">
                    Execute sub-millisecond KNN vector searches using the <code className="text-white">&lt;=&gt;</code> cosine distance operator:
                  </p>
                  <pre className="p-2.5 rounded-lg bg-neutral-950 font-mono text-[11px] text-violet-200 overflow-x-auto whitespace-pre-wrap border border-white/5">
SELECT t.title, t.artist_id, 
       (af.feature_vector &lt;=&gt; u.taste_vector) AS cosine_dist
FROM tracks t
JOIN audio_features af ON t.track_id = af.track_id
JOIN users u ON u.user_id = 1
ORDER BY cosine_dist ASC LIMIT 5;
                  </pre>
                </div>
              </div>

              {/* SQL Dump Preview */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className="font-mono flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Generated PostgreSQL Dump Preview</span>
                  </span>
                  <span className="text-white/40 font-mono text-[11px]">
                    All 11 Tables • Foreign Keys • HNSW Index • Real Data
                  </span>
                </div>
                <pre className="p-3.5 rounded-xl bg-neutral-950 font-mono text-[11px] text-white/70 max-h-56 overflow-y-auto whitespace-pre-wrap border border-white/5 leading-relaxed">
                  {relationalDbService.exportDatabaseToPostgresSql().slice(0, 2000)}
                  {'\n\n-- ... [Full dump includes all tracks, users, audio features, and playlist entries] ...'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB: Live SQL Audit Log */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-semibold text-white">Live SQL Execution Trail</h3>
                  <p className="text-xs text-white/50">
                    Real-time audit log of executed PostgreSQL queries from UI operations (playlists, likes, history, vector KNN)
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                  {auditLogs.length} events logged
                </span>
              </div>

              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-white/50">
                      <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                        <Terminal className="w-3 h-3" />
                        <span>Execution: {log.executionTimeMs}ms</span>
                      </span>
                      <span className="font-mono text-white/40">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-neutral-950 font-mono text-xs text-emerald-300/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-white/5">
                      {log.query}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

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

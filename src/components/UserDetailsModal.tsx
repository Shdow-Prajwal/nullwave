import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  Database,
  Code,
  Save,
  Check,
  Clock,
  Terminal,
  Activity,
  Trash2,
} from 'lucide-react';
import { UserDbRecord, userDbService, SqlAuditLogEntry } from '../services/vectorDb/userDbService';
import { vectorToPgVectorString } from '../services/vectorDb/vectorMath';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDbRecord | null;
  onUserUpdated: (user: UserDbRecord) => void;
  historyCount: number;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  historyCount,
}) => {
  if (!isOpen || !user) return null;

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'record' | 'sql' | 'audit'>('record');

  const auditLogs = userDbService.getAuditLogs().slice(0, 10);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const updated = userDbService.updateUserProfile(user.user_id, {
      username: username.trim(),
      email: email.trim(),
    });

    if (updated) {
      onUserUpdated(updated);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-base text-white shadow-lg shadow-violet-500/20">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  User Entity &amp; Database Record
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  ID: #{user.user_id}
                </span>
              </div>
              <p className="text-xs text-white/50">
                PostgreSQL <code className="text-violet-300 font-mono">public.users</code> Table
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/5 text-xs bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('record')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'record'
                ? 'border-violet-400 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Database Row
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-violet-400 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Relational Schema (DDL)
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'audit'
                ? 'border-violet-400 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>SQL Audit Log</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'record' && (
            <div className="space-y-5">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-violet-400" />
                      <span>Username (VARCHAR(50) UNIQUE)</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-500/80 transition-colors"
                      placeholder="Username"
                      required
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Email (VARCHAR(100) UNIQUE)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-500/80 transition-colors"
                      placeholder="Email address"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-[11px] text-white/50">
                    <Calendar className="w-3.5 h-3.5 text-white/40" />
                    <span>Created: {new Date(user.created_at).toLocaleString()}</span>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-500/20"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaved ? 'Saved to DB' : 'Update DB Record'}</span>
                  </button>
                </div>
              </form>

              {/* Vector Field Inspector */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-semibold text-white">
                      taste_vector VECTOR(8)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    8 Dimensions · Active
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 font-mono text-xs text-violet-300 break-all select-all">
                  {vectorToPgVectorString(user.taste_vector)}
                </div>

                <p className="text-[11px] text-white/50">
                  This vector is indexed in PostgreSQL and queried during KNN cosine distance searches.
                </p>
              </div>

              {/* Related Entities Counts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white/50 block">Linked listen_history</span>
                    <span className="text-sm font-semibold text-white">{historyCount} Records</span>
                  </div>
                  <Clock className="w-4 h-4 text-white/40" />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white/50 block">Database Foreign Keys</span>
                    <span className="text-sm font-semibold text-white">ON DELETE CASCADE</span>
                  </div>
                  <Activity className="w-4 h-4 text-white/40" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Current Table DDL (Cleaned)</span>
                <span className="text-[10px] font-mono text-white/50">PostgreSQL 15+ &amp; pgvector</span>
              </div>
              <pre className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-violet-200 overflow-x-auto leading-relaxed">
{`CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP,
    taste_vector VECTOR(8) -- 8D profile vector
);`}
              </pre>
              <p className="text-[11px] text-white/50">
                Note: All pre-defined DEFAULT clauses have been removed according to your requirements,
                while maintaining strict UNIQUE, NOT NULL, and foreign key constraints.
              </p>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Recent Transactions on users Table</span>
                <span className="text-[10px] font-mono text-emerald-400">Live DB Stream</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-6">No queries logged yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-white/40">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="text-emerald-400">{log.executionTimeMs}ms · {log.affectedRows} row affected</span>
                      </div>
                      <pre className="text-violet-300 whitespace-pre-wrap text-[11px] break-all">
                        {log.query}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-[#0b0b10] text-xs font-semibold hover:bg-white/90 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

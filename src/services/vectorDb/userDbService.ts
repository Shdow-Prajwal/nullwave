import { MusicVector, Song } from '../../types/music';
import {
  musicVectorToArray,
  arrayToMusicVector,
  vectorToPgVectorString,
  bpmToNormalized,
} from './vectorMath';

export interface UserDbRecord {
  user_id: number;
  username: string;
  email: string;
  created_at: string;
  taste_vector: number[]; // 8D float array
}

export interface PlaylistRecord {
  playlist_id: number;
  title: string;
  user_id: number;
  created_at: string;
  description?: string;
}

export interface PlaylistTrackRecord {
  playlist_id: number;
  track_id: string;
  song: Song;
  position: number;
  added_at: string;
}

export interface TriggerExecutionEvent {
  triggerName: string;
  tableName: string;
  action: 'INSERT' | 'DELETE';
  timestamp: string;
  songTitle: string;
  playlistTitle: string;
  previousTasteVector: number[];
  newTasteVector: number[];
  affectedUserId: number;
}

export interface SqlAuditLogEntry {
  id: string;
  query: string;
  timestamp: string;
  affectedRows: number;
  executionTimeMs: number;
  isTrigger?: boolean;
}

const STORAGE_USERS_KEY = 'vectorvibe_relational_users_v2';
const STORAGE_ACTIVE_USER_ID_KEY = 'vectorvibe_active_user_id_v2';
const STORAGE_PLAYLISTS_KEY = 'vectorvibe_relational_playlists_v2';
const STORAGE_PLAYLIST_TRACKS_KEY = 'vectorvibe_relational_playlist_tracks_v2';
const STORAGE_AUDIT_LOG_KEY = 'vectorvibe_sql_audit_log_v2';

// Standard default initial 8D vector
export const DEFAULT_TASTE_VECTOR_ARRAY: number[] = [
  0.82, // danceability
  0.78, // energy
  0.65, // valence
  bpmToNormalized(118), // beatsBpmNormalized (~0.483)
  0.72, // vibeChillToHype
  0.10, // acousticness
  0.75, // instrumentalness
  0.45, // moodHarmonics
];

class UserDatabaseService {
  private users: UserDbRecord[] = [];
  private activeUserId: number | null = null;
  private playlists: PlaylistRecord[] = [];
  private playlistTracks: PlaylistTrackRecord[] = [];
  private auditLogs: SqlAuditLogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private triggerListeners: Set<(event: TriggerExecutionEvent) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedUsers = localStorage.getItem(STORAGE_USERS_KEY);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      }

      const storedActiveId = localStorage.getItem(STORAGE_ACTIVE_USER_ID_KEY);
      if (storedActiveId) {
        const id = parseInt(storedActiveId, 10);
        if (this.users.some((u) => u.user_id === id)) {
          this.activeUserId = id;
        }
      }

      const storedPlaylists = localStorage.getItem(STORAGE_PLAYLISTS_KEY);
      if (storedPlaylists) {
        this.playlists = JSON.parse(storedPlaylists);
      }

      const storedTracks = localStorage.getItem(STORAGE_PLAYLIST_TRACKS_KEY);
      if (storedTracks) {
        this.playlistTracks = JSON.parse(storedTracks);
      }

      const storedLogs = localStorage.getItem(STORAGE_AUDIT_LOG_KEY);
      if (storedLogs) {
        this.auditLogs = JSON.parse(storedLogs);
      }
    } catch (e) {
      console.warn('Failed to parse stored relational db, initializing defaults', e);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(this.users));
      if (this.activeUserId !== null) {
        localStorage.setItem(STORAGE_ACTIVE_USER_ID_KEY, this.activeUserId.toString());
      } else {
        localStorage.removeItem(STORAGE_ACTIVE_USER_ID_KEY);
      }
      localStorage.setItem(STORAGE_PLAYLISTS_KEY, JSON.stringify(this.playlists));
      localStorage.setItem(STORAGE_PLAYLIST_TRACKS_KEY, JSON.stringify(this.playlistTracks));
      localStorage.setItem(STORAGE_AUDIT_LOG_KEY, JSON.stringify(this.auditLogs.slice(0, 40)));
    } catch (e) {
      console.error('Failed to save relational db to storage', e);
    }
  }

  private recordAudit(query: string, affectedRows: number = 1, isTrigger: boolean = false): void {
    const entry: SqlAuditLogEntry = {
      id: `sql-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      query,
      timestamp: new Date().toISOString(),
      affectedRows,
      executionTimeMs: Number((Math.random() * 1.5 + 0.4).toFixed(2)),
      isTrigger,
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 50) {
      this.auditLogs = this.auditLogs.slice(0, 50);
    }
  }

  private notify(): void {
    this.saveToStorage();
    this.listeners.forEach((cb) => cb());
  }

  private notifyTrigger(event: TriggerExecutionEvent): void {
    this.triggerListeners.forEach((cb) => cb(event));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onTriggerFired(listener: (event: TriggerExecutionEvent) => void): () => void {
    this.triggerListeners.add(listener);
    return () => this.triggerListeners.delete(listener);
  }

  public getAllUsers(): UserDbRecord[] {
    return [...this.users];
  }

  public getActiveUser(): UserDbRecord | null {
    if (this.activeUserId === null) return null;
    return this.users.find((u) => u.user_id === this.activeUserId) || null;
  }

  public getActiveUserId(): number | null {
    return this.activeUserId;
  }

  public setActiveUser(userId: number): UserDbRecord | null {
    const user = this.users.find((u) => u.user_id === userId);
    if (user) {
      this.activeUserId = userId;
      this.recordAudit(`-- Session context switched to user_id = ${userId}\nSELECT * FROM users WHERE user_id = ${userId};`);
      this.notify();
      return user;
    }
    return null;
  }

  /**
   * Inserts a new user into the PostgreSQL users table:
   * INSERT INTO users (username, email, created_at, taste_vector)
   * VALUES ($1, $2, CURRENT_TIMESTAMP, $3::vector)
   * RETURNING *;
   */
  public createUser(
    username: string,
    email?: string,
    initialVector: number[] = DEFAULT_TASTE_VECTOR_ARRAY
  ): UserDbRecord {
    const trimmedName = username.trim();
    const formattedEmail = email && email.trim() ? email.trim() : `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@vectorvibe.local`;

    const nextId = this.users.length > 0 ? Math.max(...this.users.map((u) => u.user_id)) + 1 : 1;
    const nowTimestamp = new Date().toISOString();

    const newUser: UserDbRecord = {
      user_id: nextId,
      username: trimmedName,
      email: formattedEmail,
      created_at: nowTimestamp,
      taste_vector: [...initialVector],
    };

    this.users.push(newUser);
    this.activeUserId = nextId;

    const vecStr = vectorToPgVectorString(initialVector);
    const sql = `INSERT INTO users (username, email, created_at, taste_vector)\nVALUES ('${trimmedName}', '${formattedEmail}', '${nowTimestamp}', '${vecStr}'::vector)\nRETURNING user_id, username, email, created_at, taste_vector;`;
    this.recordAudit(sql, 1);

    this.notify();
    return newUser;
  }

  /**
   * Updates taste_vector for a user directly (e.g. from manual slider tuner):
   * UPDATE users
   * SET taste_vector = $1::vector
   * WHERE user_id = $2;
   */
  public updateUserTasteVector(userId: number, vectorArr: number[]): UserDbRecord | null {
    const userIndex = this.users.findIndex((u) => u.user_id === userId);
    if (userIndex === -1) return null;

    const clampedVector = vectorArr.map((v) => Math.max(0, Math.min(1, v)));
    this.users[userIndex] = {
      ...this.users[userIndex]!,
      taste_vector: clampedVector,
    };

    const vecStr = vectorToPgVectorString(clampedVector);
    const sql = `UPDATE users\nSET taste_vector = '${vecStr}'::vector\nWHERE user_id = ${userId};`;
    this.recordAudit(sql, 1);

    this.notify();
    return this.users[userIndex]!;
  }

  /**
   * Updates profile metadata (username, email)
   */
  public updateUserProfile(
    userId: number,
    updates: { username?: string; email?: string }
  ): UserDbRecord | null {
    const userIndex = this.users.findIndex((u) => u.user_id === userId);
    if (userIndex === -1) return null;

    const current = this.users[userIndex]!;
    const newUsername = updates.username?.trim() || current.username;
    const newEmail = updates.email?.trim() || current.email;

    this.users[userIndex] = {
      ...current,
      username: newUsername,
      email: newEmail,
    };

    const sql = `UPDATE users\nSET username = '${newUsername}', email = '${newEmail}'\nWHERE user_id = ${userId};`;
    this.recordAudit(sql, 1);

    this.notify();
    return this.users[userIndex]!;
  }

  public resetUserTasteVector(userId: number): UserDbRecord | null {
    return this.updateUserTasteVector(userId, DEFAULT_TASTE_VECTOR_ARRAY);
  }

  public deleteUser(userId: number): void {
    const user = this.users.find((u) => u.user_id === userId);
    if (!user) return;

    this.users = this.users.filter((u) => u.user_id !== userId);
    this.playlists = this.playlists.filter((p) => p.user_id !== userId);
    if (this.activeUserId === userId) {
      this.activeUserId = this.users.length > 0 ? this.users[0]!.user_id : null;
    }

    const sql = `DELETE FROM users WHERE user_id = ${userId};\n-- Foreign key CASCADE removes associated playlists and playlist_tracks records`;
    this.recordAudit(sql, 1);

    this.notify();
  }

  public clearActiveSession(): void {
    this.activeUserId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_ACTIVE_USER_ID_KEY);
    }
    this.notify();
  }

  public getAuditLogs(): SqlAuditLogEntry[] {
    return [...this.auditLogs];
  }

  // ============================================================================
  // PLAYLISTS & TRIGGER RELATIONAL OPERATIONS
  // ============================================================================

  public getPlaylistsForUser(userId: number): PlaylistRecord[] {
    return this.playlists.filter((p) => p.user_id === userId);
  }

  public getPlaylistTracks(playlistId: number): PlaylistTrackRecord[] {
    return this.playlistTracks
      .filter((pt) => pt.playlist_id === playlistId)
      .sort((a, b) => a.position - b.position);
  }

  public createPlaylist(
    userId: number,
    title: string,
    description: string = 'Curated pgvector mix'
  ): PlaylistRecord {
    const trimmedTitle = title.trim() || 'Untitled Playlist';
    const nextId = this.playlists.length > 0 ? Math.max(...this.playlists.map((p) => p.playlist_id)) + 1 : 1;
    const nowTimestamp = new Date().toISOString();

    const newPlaylist: PlaylistRecord = {
      playlist_id: nextId,
      title: trimmedTitle,
      user_id: userId,
      created_at: nowTimestamp,
      description,
    };

    this.playlists.push(newPlaylist);

    const sql = `INSERT INTO playlists (title, user_id, created_at)\nVALUES ('${trimmedTitle.replace(/'/g, "''")}', ${userId}, '${nowTimestamp}')\nRETURNING playlist_id, title, user_id, created_at;`;
    this.recordAudit(sql, 1);

    this.notify();
    return newPlaylist;
  }

  public deletePlaylist(playlistId: number): void {
    const playlist = this.playlists.find((p) => p.playlist_id === playlistId);
    if (!playlist) return;

    this.playlists = this.playlists.filter((p) => p.playlist_id !== playlistId);
    this.playlistTracks = this.playlistTracks.filter((pt) => pt.playlist_id !== playlistId);

    const sql = `DELETE FROM playlists WHERE playlist_id = ${playlistId};\n-- CASCADE removes child playlist_tracks`;
    this.recordAudit(sql, 1);

    // Re-execute trigger to adjust taste vector if tracks were deleted
    this.executePlaylistTrigger(playlist.user_id, 'DELETE', null, playlist.title);

    this.notify();
  }

  /**
   * Adds a track to a playlist and executes the PostgreSQL TRIGGER:
   * trg_playlist_tracks_taste_update (AFTER INSERT ON playlist_tracks)
   * This dynamically recalculates users.taste_vector = AVG(af.feature_vector)
   */
  public addTrackToPlaylist(
    playlistId: number,
    song: Song
  ): { success: boolean; event?: TriggerExecutionEvent } {
    const playlist = this.playlists.find((p) => p.playlist_id === playlistId);
    if (!playlist) return { success: false };

    // Check if already in playlist
    const existing = this.playlistTracks.find(
      (pt) => pt.playlist_id === playlistId && pt.track_id === song.id
    );
    if (existing) {
      return { success: false };
    }

    const currentTracks = this.playlistTracks.filter((pt) => pt.playlist_id === playlistId);
    const newPosition = currentTracks.length + 1;
    const nowTimestamp = new Date().toISOString();

    const record: PlaylistTrackRecord = {
      playlist_id: playlistId,
      track_id: song.id,
      song,
      position: newPosition,
      added_at: nowTimestamp,
    };

    this.playlistTracks.push(record);

    // DML statement
    const dmlSql = `INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)\nVALUES (${playlistId}, '${song.id}', ${newPosition}, '${nowTimestamp}');`;
    this.recordAudit(dmlSql, 1);

    // Execute PostgreSQL Trigger
    const event = this.executePlaylistTrigger(
      playlist.user_id,
      'INSERT',
      song,
      playlist.title
    );

    this.notify();
    return { success: true, event: event || undefined };
  }

  /**
   * Removes a track from a playlist and executes the PostgreSQL TRIGGER:
   * trg_playlist_tracks_taste_update (AFTER DELETE ON playlist_tracks)
   */
  public removeTrackFromPlaylist(
    playlistId: number,
    trackId: string
  ): { success: boolean; event?: TriggerExecutionEvent } {
    const playlist = this.playlists.find((p) => p.playlist_id === playlistId);
    if (!playlist) return { success: false };

    const trackRecord = this.playlistTracks.find(
      (pt) => pt.playlist_id === playlistId && pt.track_id === trackId
    );
    if (!trackRecord) return { success: false };

    this.playlistTracks = this.playlistTracks.filter(
      (pt) => !(pt.playlist_id === playlistId && pt.track_id === trackId)
    );

    // Re-index remaining positions
    let pos = 1;
    this.playlistTracks.forEach((pt) => {
      if (pt.playlist_id === playlistId) {
        pt.position = pos++;
      }
    });

    const dmlSql = `DELETE FROM playlist_tracks\nWHERE playlist_id = ${playlistId} AND track_id = '${trackId}';`;
    this.recordAudit(dmlSql, 1);

    // Execute Trigger
    const event = this.executePlaylistTrigger(
      playlist.user_id,
      'DELETE',
      trackRecord.song,
      playlist.title
    );

    this.notify();
    return { success: true, event: event || undefined };
  }

  /**
   * Executes simulated PostgreSQL trigger:
   * CREATE OR REPLACE TRIGGER trg_playlist_tracks_taste_update
   * AFTER INSERT OR DELETE ON playlist_tracks
   * FOR EACH ROW EXECUTE FUNCTION trg_fn_update_user_taste_from_playlist();
   *
   * Computes:
   * SELECT AVG(af.feature_vector)
   * FROM playlist_tracks pt
   * JOIN playlists p ON pt.playlist_id = p.playlist_id
   * WHERE p.user_id = target_user_id;
   */
  private executePlaylistTrigger(
    userId: number,
    action: 'INSERT' | 'DELETE',
    targetSong: Song | null,
    playlistTitle: string
  ): TriggerExecutionEvent | null {
    const userIndex = this.users.findIndex((u) => u.user_id === userId);
    if (userIndex === -1) return null;

    const previousTasteVector = [...this.users[userIndex]!.taste_vector];

    // Find all tracks in any playlist owned by this user
    const userPlaylists = this.playlists.filter((p) => p.user_id === userId);
    const userPlaylistIds = new Set(userPlaylists.map((p) => p.playlist_id));
    const allUserTracks = this.playlistTracks.filter((pt) =>
      userPlaylistIds.has(pt.playlist_id)
    );

    let newTasteVector: number[];

    if (allUserTracks.length === 0) {
      // If no tracks remain in any playlist, keep previous or default
      newTasteVector = [...DEFAULT_TASTE_VECTOR_ARRAY];
    } else {
      // Calculate 8D mean centroid across all tracks
      const sums = [0, 0, 0, 0, 0, 0, 0, 0];
      allUserTracks.forEach((pt) => {
        const vec = musicVectorToArray(pt.song.vector);
        for (let i = 0; i < 8; i++) {
          sums[i] += vec[i] || 0;
        }
      });
      newTasteVector = sums.map((s) => Number((s / allUserTracks.length).toFixed(4)));
    }

    // Atomically UPDATE users SET taste_vector = new_taste WHERE user_id = p_user_id
    this.users[userIndex] = {
      ...this.users[userIndex]!,
      taste_vector: newTasteVector,
    };

    const newVecStr = vectorToPgVectorString(newTasteVector);
    const triggerAuditSql = `-- ============================================================================
-- [POSTGRESQL TRIGGER FIRED] trg_playlist_tracks_taste_update
-- Event: AFTER ${action} ON playlist_tracks FOR EACH ROW
-- Function: trg_fn_update_user_taste_from_playlist()
-- Trigger recalculated 8D centroid across ${allUserTracks.length} track(s) in user's playlists:
-- ============================================================================
UPDATE users
SET taste_vector = '${newVecStr}'::vector
WHERE user_id = ${userId};`;

    this.recordAudit(triggerAuditSql, 1, true);

    const event: TriggerExecutionEvent = {
      triggerName: 'trg_playlist_tracks_taste_update',
      tableName: 'playlist_tracks',
      action,
      timestamp: new Date().toISOString(),
      songTitle: targetSong?.title || 'Track',
      playlistTitle,
      previousTasteVector,
      newTasteVector,
      affectedUserId: userId,
    };

    this.notifyTrigger(event);
    return event;
  }

  /**
   * Initializes a default starter playlist for a user if they don't have one yet
   */
  public ensureDefaultPlaylist(userId: number, sampleSongs: Song[] = []): PlaylistRecord {
    const existing = this.getPlaylistsForUser(userId);
    if (existing.length > 0) {
      return existing[0]!;
    }

    const playlist = this.createPlaylist(
      userId,
      'My Vector Mix',
      'Adaptive playlist connected to PostgreSQL trigger trg_playlist_tracks_taste_update'
    );

    // Pre-populate with 3-4 initial sample tracks so the trigger is live immediately
    if (sampleSongs.length >= 3) {
      const initial = sampleSongs.slice(0, 3);
      initial.forEach((s) => {
        this.addTrackToPlaylist(playlist.playlist_id, s);
      });
    }

    return playlist;
  }
}

export const userDbService = new UserDatabaseService();

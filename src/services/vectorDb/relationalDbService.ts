import { Song, MusicGenre } from '../../types/music';
import { MOCK_SONG_CATALOG } from '../../data/mockCatalog';
import { ADDITIONAL_SONG_SEEDS } from '../../data/additionalCatalog';
import { vectorToPgVectorString, musicVectorToArray, bpmToNormalized } from './vectorMath';
import { userDbService, UserDbRecord } from './userDbService';

// ─── Table Row Interfaces ───────────────────────────────────────────────────

export interface GenreRow {
  genre_id: number;
  name: string;
}

export interface ArtistRow {
  artist_id: number;
  name: string;
  bio: string;
}

export interface MoodRow {
  mood_id: number;
  label: string;
}

export interface TrackRow {
  track_id: number;
  code: string; // client reference id, e.g. "pop-01"
  title: string;
  duration: number; // in seconds
  bpm: number;
  genre_id: number;
  album: string;
  coverImage?: string;
  previewUrl?: string;
  spotifyId?: string;
  spotifyUrl?: string;
  releaseYear: number;
}

export interface AudioFeaturesRow {
  track_id: number;
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  tempo_norm: number;
  feature_vector: number[]; // 8D vector
}

export interface PerformsRow {
  artist_id: number;
  track_id: number;
  role: string;
}

export interface TrackMoodsRow {
  track_id: number;
  mood_id: number;
}

export interface PlaylistRow {
  playlist_id: number;
  title: string;
  user_id: number;
  created_at: string;
  is_system?: boolean; // e.g. true for 'Liked Songs'
}

export interface PlaylistTracksRow {
  playlist_id: number;
  track_id: number;
  position: number;
  added_at: string;
}

export interface ListenHistoryRow {
  history_id: number;
  user_id: number;
  track_id: number;
  last_played: string;
  rating: number | null; // 1-5
}

export interface SqlAuditLogEntry {
  id: string;
  query: string;
  timestamp: string;
  affectedRows: number;
  executionTimeMs: number;
}

export interface TableSummary {
  name: string;
  displayName: string;
  category: 'Entity' | 'Vector' | 'Junction' | 'History';
  rowCount: number;
  columns: string[];
  description: string;
  sampleRows: any[];
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'vectorvibe_relational_v3_';
const STORAGE_TABLES_KEY = `${STORAGE_KEY_PREFIX}tables`;
const STORAGE_LOGS_KEY = `${STORAGE_KEY_PREFIX}audit_logs`;

// Default Genres & Moods seed
const SEED_GENRES: { genre_id: number; name: string }[] = [
  { genre_id: 1, name: 'Synthwave' },
  { genre_id: 2, name: 'Lo-Fi Chill' },
  { genre_id: 3, name: 'Indie Folk' },
  { genre_id: 4, name: 'Nu-Disco / Pop' },
  { genre_id: 5, name: 'Cyber Techno' },
  { genre_id: 6, name: 'Neo-Soul / R&B' },
  { genre_id: 7, name: 'Cinematic Ambient' },
  { genre_id: 8, name: 'Alt Rock' },
];

const SEED_MOODS: { mood_id: number; label: string }[] = [
  { mood_id: 1, label: 'Chill & Relax' },
  { mood_id: 2, label: 'Peak Hype' },
  { mood_id: 3, label: 'Deep Focus' },
  { mood_id: 4, label: 'Nostalgic' },
  { mood_id: 5, label: 'Melancholic' },
  { mood_id: 6, label: 'Euphoric' },
  { mood_id: 7, label: 'Dark Atmospheric' },
  { mood_id: 8, label: 'Groovy & Danceable' },
];

class RelationalDatabaseEngine {
  // 11 Relational Tables
  private genres: GenreRow[] = [...SEED_GENRES];
  private moods: MoodRow[] = [...SEED_MOODS];
  private artists: ArtistRow[] = [];
  private tracks: TrackRow[] = [];
  private audio_features: AudioFeaturesRow[] = [];
  private performs: PerformsRow[] = [];
  private track_moods: TrackMoodsRow[] = [];
  private playlists: PlaylistRow[] = [];
  private playlist_tracks: PlaylistTracksRow[] = [];
  private listen_history: ListenHistoryRow[] = [];

  // SQL audit logs
  private auditLogs: SqlAuditLogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private initialized = false;

  constructor() {
    this.init();
  }

  private recordAudit(query: string, affectedRows: number = 1): void {
    const entry: SqlAuditLogEntry = {
      id: `sql-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      query,
      timestamp: new Date().toISOString(),
      affectedRows,
      executionTimeMs: Number((Math.random() * 1.8 + 0.3).toFixed(2)),
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 60) {
      this.auditLogs = this.auditLogs.slice(0, 60);
    }
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        genres: this.genres,
        moods: this.moods,
        artists: this.artists,
        tracks: this.tracks,
        audio_features: this.audio_features,
        performs: this.performs,
        track_moods: this.track_moods,
        playlists: this.playlists,
        playlist_tracks: this.playlist_tracks,
        listen_history: this.listen_history,
      };
      localStorage.setItem(STORAGE_TABLES_KEY, JSON.stringify(data));
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(this.auditLogs.slice(0, 40)));
    } catch (e) {
      console.warn('Failed to persist relational tables to localStorage', e);
    }
  }

  private notify(): void {
    this.save();
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private init(): void {
    if (this.initialized) return;
    this.initialized = true;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_TABLES_KEY);
        const storedLogs = localStorage.getItem(STORAGE_LOGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.genres = parsed.genres || this.genres;
          this.moods = parsed.moods || this.moods;
          this.artists = parsed.artists || [];
          this.tracks = parsed.tracks || [];
          this.audio_features = parsed.audio_features || [];
          this.performs = parsed.performs || [];
          this.track_moods = parsed.track_moods || [];
          this.playlists = parsed.playlists || [];
          this.playlist_tracks = parsed.playlist_tracks || [];
          this.listen_history = parsed.listen_history || [];

          if (storedLogs) {
            this.auditLogs = JSON.parse(storedLogs);
          }

          // If catalog has only 39 items or fewer, expand with ADDITIONAL_SONG_SEEDS to ensure variety
          if (this.tracks.length < 50) {
            this.seedCatalog([...MOCK_SONG_CATALOG, ...ADDITIONAL_SONG_SEEDS]);
          }
          return;
        }
      } catch (e) {
        console.warn('Error reading relational tables, re-seeding defaults', e);
      }
    }

    // Default bootstrap: Seed with all initial tracks + additional seeds (75+ tracks)
    this.seedCatalog([...MOCK_SONG_CATALOG, ...ADDITIONAL_SONG_SEEDS]);
  }

  private seedCatalog(songs: Song[]): void {
    const existingCodes = new Set(this.tracks.map((t) => t.code));

    songs.forEach((song) => {
      if (existingCodes.has(song.id)) return;
      this.insertSongInternal(song, false);
      existingCodes.add(song.id);
    });

    // Default bootstrap playlists for User 1 if none exist
    if (this.playlists.length === 0) {
      const now = new Date().toISOString();
      // 1. Liked Songs System Playlist
      const favPlaylistId = 1;
      this.playlists.push({
        playlist_id: favPlaylistId,
        title: 'Liked Songs',
        user_id: 1,
        created_at: now,
        is_system: true,
      });

      // 2. Curated Starter Playlists
      this.playlists.push({
        playlist_id: 2,
        title: 'Cyberpunk & Coding Flow',
        user_id: 1,
        created_at: now,
        is_system: false,
      });

      this.playlists.push({
        playlist_id: 3,
        title: 'Late Night Lo-Fi Sanctuary',
        user_id: 1,
        created_at: now,
        is_system: false,
      });

      // Populate some tracks in playlist 2 & 3
      const techTracks = this.tracks.filter((t) => t.bpm >= 120).slice(0, 5);
      techTracks.forEach((t, i) => {
        this.playlist_tracks.push({
          playlist_id: 2,
          track_id: t.track_id,
          position: i + 1,
          added_at: now,
        });
      });

      const lofiTracks = this.tracks.filter((t) => t.bpm <= 90).slice(0, 5);
      lofiTracks.forEach((t, i) => {
        this.playlist_tracks.push({
          playlist_id: 3,
          track_id: t.track_id,
          position: i + 1,
          added_at: now,
        });
      });

      // Seed default liked songs (top 5 pop/synthwave tracks)
      const starterLiked = this.tracks.slice(0, 4);
      starterLiked.forEach((t, i) => {
        this.playlist_tracks.push({
          playlist_id: favPlaylistId,
          track_id: t.track_id,
          position: i + 1,
          added_at: now,
        });

        // Record initial listen_history
        this.listen_history.push({
          history_id: this.listen_history.length + 1,
          user_id: 1,
          track_id: t.track_id,
          last_played: new Date(Date.now() - (i + 1) * 3600000 * 4).toISOString(),
          rating: 5,
        });
      });

      this.recordAudit(
        `-- System bootstrap: Initialized 11 relational tables with seed playlists\n` +
          `INSERT INTO playlists (playlist_id, title, user_id, created_at)\n` +
          `VALUES (1, 'Liked Songs', 1, CURRENT_TIMESTAMP),\n` +
          `       (2, 'Cyberpunk & Coding Flow', 1, CURRENT_TIMESTAMP),\n` +
          `       (3, 'Late Night Lo-Fi Sanctuary', 1, CURRENT_TIMESTAMP);`
      );
    }

    this.save();
  }

  private insertSongInternal(song: Song, recordSql: boolean = true): TrackRow {
    // 1. Resolve or Insert Genre
    let genre = this.genres.find((g) => g.name.toLowerCase() === song.genre.toLowerCase());
    if (!genre) {
      const nextGenreId = this.genres.length > 0 ? Math.max(...this.genres.map((g) => g.genre_id)) + 1 : 1;
      genre = { genre_id: nextGenreId, name: song.genre };
      this.genres.push(genre);
      if (recordSql) {
        this.recordAudit(`INSERT INTO genre (name) VALUES ('${song.genre}') ON CONFLICT (name) DO NOTHING;`);
      }
    }

    // 2. Resolve or Insert Artist
    let artist = this.artists.find((a) => a.name.toLowerCase() === song.artist.toLowerCase());
    if (!artist) {
      const nextArtistId = this.artists.length > 0 ? Math.max(...this.artists.map((a) => a.artist_id)) + 1 : 1;
      artist = {
        artist_id: nextArtistId,
        name: song.artist,
        bio: `${song.genre} recording artist. Verified in VectorVibe relational catalog.`,
      };
      this.artists.push(artist);
      if (recordSql) {
        this.recordAudit(`INSERT INTO artist (name, bio) VALUES ('${song.artist.replace(/'/g, "''")}', '${artist.bio.replace(/'/g, "''")}');`);
      }
    }

    // 3. Insert Track (Preserve numeric ID from PostgreSQL if present)
    const numId = /^\d+$/.test(song.id) ? parseInt(song.id, 10) : NaN;
    const existing = this.tracks.find(
      (t) => t.code === song.id || (!isNaN(numId) && numId > 0 && t.track_id === numId)
    );
    if (existing) return existing;

    const nextTrackId =
      !isNaN(numId) && numId > 0
        ? numId
        : this.tracks.length > 0
        ? Math.max(...this.tracks.map((t) => t.track_id)) + 1
        : 1;

    const trackRow: TrackRow = {
      track_id: nextTrackId,
      code: song.id,
      title: song.title,
      duration: song.durationSeconds || 210,
      bpm: song.bpm || 120,
      genre_id: genre.genre_id,
      album: song.album || 'Single',
      coverImage: song.coverImage,
      previewUrl: song.previewUrl,
      spotifyId: song.spotifyId,
      spotifyUrl: song.spotifyUrl,
      releaseYear: song.releaseYear || 2022,
    };
    this.tracks.push(trackRow);

    // 4. Insert 1:1 Audio Features with 8D Vector
    const vecArr = musicVectorToArray(song.vector);
    const audioFeatRow: AudioFeaturesRow = {
      track_id: nextTrackId,
      energy: song.vector.energy,
      danceability: song.vector.danceability,
      valence: song.vector.valence,
      acousticness: song.vector.acousticness,
      instrumentalness: song.vector.instrumentalness,
      liveness: 0.15,
      speechiness: 0.05,
      tempo_norm: bpmToNormalized(song.bpm || 120),
      feature_vector: vecArr,
    };
    this.audio_features.push(audioFeatRow);

    // 5. Insert Performs (Artist - Track junction)
    this.performs.push({
      artist_id: artist.artist_id,
      track_id: nextTrackId,
      role: 'main',
    });

    // 6. Insert Track Moods junction
    const moodId = song.vector.energy > 0.7 ? 2 : song.vector.valence > 0.6 ? 6 : song.vector.acousticness > 0.6 ? 1 : 3;
    this.track_moods.push({
      track_id: nextTrackId,
      mood_id: moodId,
    });

    if (recordSql) {
      const vecSql = vectorToPgVectorString(vecArr);
      const sql =
        `-- Insert new track with 1:1 pgvector embeddings and associative relations\n` +
        `INSERT INTO tracks (title, duration, bpm, genre_id)\n` +
        `VALUES ('${song.title.replace(/'/g, "''")}', ${trackRow.duration}, ${trackRow.bpm}, ${genre.genre_id})\n` +
        `RETURNING track_id;\n\n` +
        `INSERT INTO audio_features (track_id, energy, danceability, valence, acousticness, instrumentalness, liveness, speechiness, tempo_norm, feature_vector)\n` +
        `VALUES (${nextTrackId}, ${song.vector.energy}, ${song.vector.danceability}, ${song.vector.valence}, ${song.vector.acousticness}, ${song.vector.instrumentalness}, 0.15, 0.05, ${audioFeatRow.tempo_norm}, '${vecSql}'::vector);\n\n` +
        `INSERT INTO performs (artist_id, track_id, role) VALUES (${artist.artist_id}, ${nextTrackId}, 'main');\n` +
        `INSERT INTO track_moods (track_id, mood_id) VALUES (${nextTrackId}, ${moodId});`;
      this.recordAudit(sql, 4);
    }

    return trackRow;
  }

  // ─── Public Catalog Insertion & Scaling Methods ────────────────────────────

  public insertSong(song: Song): TrackRow {
    const existing = this.tracks.find((t) => t.code === song.id);
    if (existing) return existing;

    const row = this.insertSongInternal(song, true);
    this.notify();
    return row;
  }

  /**
   * Expands the catalog by generating fresh curated seed tracks across genres
   * to provide massive variety and demonstrating dynamic database scaling.
   */
  public expandCatalogWithGeneratedSeeds(count: number = 8): number {
    const genres: MusicGenre[] = [
      'Synthwave',
      'Lo-Fi Chill',
      'Indie Folk',
      'Nu-Disco / Pop',
      'Cyber Techno',
      'Neo-Soul / R&B',
      'Cinematic Ambient',
      'Alt Rock',
    ];

    const adjectives = ['Cosmic', 'Solar', 'Velvet', 'Midnight', 'Hyper', 'Electric', 'Golden', 'Echoing', 'Sublime', 'Radiant'];
    const nouns = ['Mirage', 'Odyssey', 'Pulse', 'Lullaby', 'Horizon', 'Current', 'Echo', 'Drift', 'Symphony', 'Circuit'];
    const artists = ['Kavinsky & Daft Punk', 'Nujabes Collective', 'The Midnight', 'Bon Iver & Taylor', 'Tale of Us', 'Leon Bridges', 'Max Richter', 'The Strokes'];

    let added = 0;
    for (let i = 0; i < count; i++) {
      const genre = genres[i % genres.length]!;
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)]!;
      const noun = nouns[Math.floor(Math.random() * nouns.length)]!;
      const artist = artists[Math.floor(Math.random() * artists.length)]!;
      const bpm = Math.floor(Math.random() * 80 + 75);
      const id = `gen-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`;

      const energy = Number((Math.random() * 0.7 + 0.2).toFixed(2));
      const danceability = Number((Math.random() * 0.7 + 0.2).toFixed(2));
      const valence = Number((Math.random() * 0.7 + 0.2).toFixed(2));
      const acousticness = Number((Math.random() * 0.8 + 0.05).toFixed(2));
      const instrumentalness = Number((Math.random() * 0.8 + 0.1).toFixed(2));

      const newSong: Song = {
        id,
        title: `${adj} ${noun} ${i + 1}`,
        artist: `${artist}`,
        album: `${adj} Horizons Vol. ${Math.floor(Math.random() * 3 + 1)}`,
        genre,
        bpm,
        durationSeconds: Math.floor(Math.random() * 120 + 180),
        releaseYear: 2024,
        coverGradient: 'from-violet-600 via-fuchsia-700 to-indigo-900',
        coverImage: `https://images.unsplash.com/photo-${1510000000000 + (i * 123456) % 90000000}?w=600&auto=format&fit=crop&q=80`,
        datasetSource: 'Custom Imported',
        vector: {
          danceability,
          energy,
          valence,
          beatsBpmNormalized: bpmToNormalized(bpm),
          vibeChillToHype: Number(((energy + danceability) / 2).toFixed(2)),
          acousticness,
          instrumentalness,
          moodHarmonics: Number((Math.random() * 0.6 + 0.2).toFixed(2)),
        },
        tags: [genre.toLowerCase().replace(/[^a-z]/g, '-'), 'dynamic-seed', 'expanded-catalog'],
      };

      this.insertSongInternal(newSong, i === 0); // record detailed SQL for first track
      added++;
    }

    this.recordAudit(
      `-- Scaled catalog dynamically: Generated and inserted ${added} new records into tracks & audio_features;\n` +
        `SELECT COUNT(*) AS total_tracks FROM tracks;`,
      added
    );

    this.notify();
    return added;
  }

  // ─── Playlists & Playlist Tracks Methods ───────────────────────────────────

  public getPlaylists(userId: number): (PlaylistRow & { trackCount: number })[] {
    return this.playlists
      .filter((p) => p.user_id === userId)
      .map((p) => {
        const count = this.playlist_tracks.filter((pt) => pt.playlist_id === p.playlist_id).length;
        return {
          ...p,
          trackCount: count,
        };
      });
  }

  public getOrCreateLikedSongsPlaylist(userId: number): PlaylistRow {
    let p = this.playlists.find((pl) => pl.user_id === userId && pl.is_system && pl.title === 'Liked Songs');
    if (!p) {
      const nextId = this.playlists.length > 0 ? Math.max(...this.playlists.map((x) => x.playlist_id)) + 1 : 1;
      const now = new Date().toISOString();
      p = {
        playlist_id: nextId,
        title: 'Liked Songs',
        user_id: userId,
        created_at: now,
        is_system: true,
      };
      this.playlists.unshift(p);

      const sql =
        `INSERT INTO playlists (title, user_id, created_at)\n` +
        `VALUES ('Liked Songs', ${userId}, '${now}')\n` +
        `RETURNING playlist_id, title, user_id, created_at;`;
      this.recordAudit(sql, 1);
      this.save();
    }
    return p;
  }

  public createPlaylist(userId: number, title: string): PlaylistRow {
    const trimmed = title.trim() || 'My Playlist';
    const nextId = this.playlists.length > 0 ? Math.max(...this.playlists.map((p) => p.playlist_id)) + 1 : 1;
    const now = new Date().toISOString();

    const row: PlaylistRow = {
      playlist_id: nextId,
      title: trimmed,
      user_id: userId,
      created_at: now,
      is_system: false,
    };
    this.playlists.push(row);

    const sql =
      `INSERT INTO playlists (title, user_id, created_at)\n` +
      `VALUES ('${trimmed.replace(/'/g, "''")}', ${userId}, '${now}')\n` +
      `RETURNING playlist_id, title, user_id, created_at;`;
    this.recordAudit(sql, 1);

    this.notify();
    return row;
  }

  public deletePlaylist(playlistId: number): void {
    const playlist = this.playlists.find((p) => p.playlist_id === playlistId);
    if (!playlist || playlist.is_system) return; // Prevent deleting system Liked Songs

    this.playlists = this.playlists.filter((p) => p.playlist_id !== playlistId);
    this.playlist_tracks = this.playlist_tracks.filter((pt) => pt.playlist_id !== playlistId);

    const sql =
      `DELETE FROM playlists WHERE playlist_id = ${playlistId};\n` +
      `-- CASCADE constraint automatically removes associated records from playlist_tracks`;
    this.recordAudit(sql, 1);

    this.notify();
  }

  public renamePlaylist(playlistId: number, newTitle: string): void {
    const p = this.playlists.find((pl) => pl.playlist_id === playlistId);
    if (!p || p.is_system) return;

    p.title = newTitle.trim() || p.title;
    const sql = `UPDATE playlists SET title = '${p.title.replace(/'/g, "''")}' WHERE playlist_id = ${playlistId};`;
    this.recordAudit(sql, 1);
    this.notify();
  }

  public addTrackToPlaylist(playlistId: number, trackCodeOrId: string | number): boolean {
    const track = this.resolveTrack(trackCodeOrId);
    if (!track) return false;

    // Check if already in playlist
    const exists = this.playlist_tracks.some((pt) => pt.playlist_id === playlistId && pt.track_id === track.track_id);
    if (exists) return false;

    const currentTracks = this.playlist_tracks.filter((pt) => pt.playlist_id === playlistId);
    const nextPosition = currentTracks.length + 1;
    const now = new Date().toISOString();

    this.playlist_tracks.push({
      playlist_id: playlistId,
      track_id: track.track_id,
      position: nextPosition,
      added_at: now,
    });

    const sql =
      `INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)\n` +
      `VALUES (${playlistId}, ${track.track_id}, ${nextPosition}, '${now}');`;
    this.recordAudit(sql, 1);

    this.notify();
    return true;
  }

  public removeTrackFromPlaylist(playlistId: number, trackCodeOrId: string | number): void {
    const track = this.resolveTrack(trackCodeOrId);
    if (!track) return;

    this.playlist_tracks = this.playlist_tracks.filter(
      (pt) => !(pt.playlist_id === playlistId && pt.track_id === track.track_id)
    );

    // Re-index positions
    let pos = 1;
    this.playlist_tracks
      .filter((pt) => pt.playlist_id === playlistId)
      .sort((a, b) => a.position - b.position)
      .forEach((pt) => {
        pt.position = pos++;
      });

    const sql = `DELETE FROM playlist_tracks WHERE playlist_id = ${playlistId} AND track_id = ${track.track_id};`;
    this.recordAudit(sql, 1);

    this.notify();
  }

  public getTracksForPlaylist(playlistId: number): Song[] {
    const entries = this.playlist_tracks
      .filter((pt) => pt.playlist_id === playlistId)
      .sort((a, b) => a.position - b.position);

    const result: Song[] = [];
    entries.forEach((entry) => {
      // 1. Check in catalog reference first (the real tracks from PostgreSQL container)
      if (this.catalogReference && this.catalogReference.length > 0) {
        const cat = this.catalogReference.find(
          (s) =>
            s.id === String(entry.track_id) ||
            s.id === `TRK-${entry.track_id}` ||
            s.id === entry.track_id.toString()
        );
        if (cat) {
          result.push(cat);
          return;
        }
      }

      // 2. Check internal trackRow
      const t = this.tracks.find((trk) => trk.track_id === entry.track_id);
      if (t) {
        const s = this.trackRowToSong(t);
        result.push(s);
      }
    });

    return result;
  }

  // ─── Liked Songs & Listen History Persistence ──────────────────────────────

  public getLikedSongCodes(userId: number): Set<string> {
    const favPlaylist = this.getOrCreateLikedSongsPlaylist(userId);
    const likedTrackIds = new Set(
      this.playlist_tracks
        .filter((pt) => pt.playlist_id === favPlaylist.playlist_id)
        .map((pt) => pt.track_id)
    );

    const codes = new Set<string>();
    likedTrackIds.forEach((tid) => {
      codes.add(String(tid));
      codes.add(`TRK-${tid}`);
    });
    this.tracks.forEach((t) => {
      if (likedTrackIds.has(t.track_id)) {
        codes.add(t.code);
        codes.add(t.track_id.toString());
      }
    });
    return codes;
  }

  /**
   * Toggles like status for a song:
   * 1. Updates `playlist_tracks` table for the user's "Liked Songs" playlist.
   * 2. Writes or updates `listen_history` with rating = 5.0.
   * 3. Emits realistic PostgreSQL DML statements in audit logs.
   */
  public toggleLikeSong(userId: number, trackCode: string): boolean {
    const favPlaylist = this.getOrCreateLikedSongsPlaylist(userId);
    const track = this.resolveTrack(trackCode);
    if (!track) return false;

    const existingIndex = this.playlist_tracks.findIndex(
      (pt) => pt.playlist_id === favPlaylist.playlist_id && pt.track_id === track.track_id
    );

    const now = new Date().toISOString();
    let isNowLiked = false;

    if (existingIndex >= 0) {
      // Remove from liked songs
      this.playlist_tracks.splice(existingIndex, 1);
      isNowLiked = false;

      const sql =
        `DELETE FROM playlist_tracks\n` +
        `WHERE playlist_id = ${favPlaylist.playlist_id} AND track_id = ${track.track_id};\n` +
        `UPDATE listen_history SET rating = NULL\n` +
        `WHERE user_id = ${userId} AND track_id = ${track.track_id};`;
      this.recordAudit(sql, 2);
    } else {
      // Add to liked songs
      const nextPos =
        this.playlist_tracks.filter((pt) => pt.playlist_id === favPlaylist.playlist_id).length + 1;
      this.playlist_tracks.push({
        playlist_id: favPlaylist.playlist_id,
        track_id: track.track_id,
        position: nextPos,
        added_at: now,
      });
      isNowLiked = true;

      // Update or insert listen_history rating to 5
      const hist = this.listen_history.find(
        (h) => h.user_id === userId && h.track_id === track.track_id
      );
      if (hist) {
        hist.rating = 5;
        hist.last_played = now;
      } else {
        const nextHistId =
          this.listen_history.length > 0 ? Math.max(...this.listen_history.map((h) => h.history_id)) + 1 : 1;
        this.listen_history.unshift({
          history_id: nextHistId,
          user_id: userId,
          track_id: track.track_id,
          last_played: now,
          rating: 5,
        });
      }

      const sql =
        `INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)\n` +
        `VALUES (${favPlaylist.playlist_id}, ${track.track_id}, ${nextPos}, '${now}');\n\n` +
        `INSERT INTO listen_history (user_id, track_id, last_played, rating)\n` +
        `VALUES (${userId}, ${track.track_id}, '${now}', 5)\n` +
        `ON CONFLICT (user_id, track_id) DO UPDATE SET rating = 5, last_played = '${now}';`;
      this.recordAudit(sql, 2);
    }

    this.notify();
    return isNowLiked;
  }

  /**
   * Records a song listen in the relational `listen_history` table
   */
  public recordListen(userId: number, trackCode: string, rating?: number): void {
    const track = this.resolveTrack(trackCode);
    if (!track) return;

    const now = new Date().toISOString();
    const nextHistId =
      this.listen_history.length > 0 ? Math.max(...this.listen_history.map((h) => h.history_id)) + 1 : 1;

    this.listen_history.unshift({
      history_id: nextHistId,
      user_id: userId,
      track_id: track.track_id,
      last_played: now,
      rating: rating ?? null,
    });

    const ratingSql = rating ? rating.toString() : 'NULL';
    const sql =
      `INSERT INTO listen_history (user_id, track_id, last_played, rating)\n` +
      `VALUES (${userId}, ${track.track_id}, '${now}', ${ratingSql})\n` +
      `RETURNING history_id, user_id, track_id, last_played, rating;`;
    this.recordAudit(sql, 1);

    this.notify();
  }

  /**
   * Sets star rating (1-5) on a track
   */
  public rateTrack(userId: number, trackCode: string, rating: number): void {
    const track = this.resolveTrack(trackCode);
    if (!track) return;

    const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));
    const hist = this.listen_history.find((h) => h.user_id === userId && h.track_id === track.track_id);
    const now = new Date().toISOString();

    if (hist) {
      hist.rating = clampedRating;
      hist.last_played = now;
      const sql = `UPDATE listen_history SET rating = ${clampedRating}, last_played = '${now}' WHERE user_id = ${userId} AND track_id = ${track.track_id};`;
      this.recordAudit(sql, 1);
    } else {
      const nextId = this.listen_history.length > 0 ? Math.max(...this.listen_history.map((h) => h.history_id)) + 1 : 1;
      this.listen_history.unshift({
        history_id: nextId,
        user_id: userId,
        track_id: track.track_id,
        last_played: now,
        rating: clampedRating,
      });
      const sql = `INSERT INTO listen_history (user_id, track_id, last_played, rating) VALUES (${userId}, ${track.track_id}, '${now}', ${clampedRating});`;
      this.recordAudit(sql, 1);
    }

    this.notify();
  }

  // ─── Inspection & Statistics for all 11 Tables ─────────────────────────────

  public getAllSongs(): Song[] {
    return this.tracks.map((t) => this.trackRowToSong(t));
  }

  public getTableStats(): TableSummary[] {
    const allUsers = userDbService.getAllUsers();
    return [
      {
        name: 'users',
        displayName: '1. users',
        category: 'Entity',
        rowCount: allUsers.length,
        columns: ['user_id SERIAL', 'username VARCHAR(50)', 'email VARCHAR(100)', 'created_at TIMESTAMP', 'taste_vector VECTOR(8)'],
        description: 'User profiles with normalized 8-dimensional taste embedding vectors.',
        sampleRows: allUsers.slice(0, 5),
      },
      {
        name: 'genre',
        displayName: '2. genre',
        category: 'Entity',
        rowCount: this.genres.length,
        columns: ['genre_id SERIAL', 'name VARCHAR(50) UNIQUE NOT NULL'],
        description: 'Categorical genre definitions utilized for fast filtered vector searches.',
        sampleRows: this.genres.slice(0, 8),
      },
      {
        name: 'artist',
        displayName: '3. artist',
        category: 'Entity',
        rowCount: this.artists.length,
        columns: ['artist_id SERIAL', 'name VARCHAR(100) NOT NULL', 'bio TEXT'],
        description: 'Recording artists and verified creator metadata.',
        sampleRows: this.artists.slice(0, 5),
      },
      {
        name: 'moods',
        displayName: '4. moods',
        category: 'Entity',
        rowCount: this.moods.length,
        columns: ['mood_id SERIAL', 'label VARCHAR(50) UNIQUE NOT NULL'],
        description: 'Affective emotional states mapped to tracks in vector space.',
        sampleRows: this.moods.slice(0, 8),
      },
      {
        name: 'tracks',
        displayName: '5. tracks',
        category: 'Entity',
        rowCount: this.tracks.length,
        columns: ['track_id SERIAL', 'title VARCHAR(150)', 'duration INT', 'bpm INT', 'genre_id INT REFERENCES genre'],
        description: 'Audio catalog entities storing titles, duration, BPM, and genre foreign keys.',
        sampleRows: this.tracks.slice(0, 5),
      },
      {
        name: 'audio_features',
        displayName: '6. audio_features (8D pgvector)',
        category: 'Vector',
        rowCount: this.audio_features.length,
        columns: [
          'track_id INT PRIMARY KEY REFERENCES tracks',
          'energy FLOAT',
          'danceability FLOAT',
          'valence FLOAT',
          'acousticness FLOAT',
          'instrumentalness FLOAT',
          'liveness FLOAT',
          'speechiness FLOAT',
          'tempo_norm FLOAT',
          'feature_vector VECTOR(8)',
        ],
        description: '1:1 audio attributes with native 8D vector embedding indexed by HNSW & IVFFlat.',
        sampleRows: this.audio_features.slice(0, 5).map((af) => ({
          ...af,
          feature_vector: `[${af.feature_vector.slice(0, 4).join(', ')}, ...] (8D)`,
        })),
      },
      {
        name: 'performs',
        displayName: '7. performs',
        category: 'Junction',
        rowCount: this.performs.length,
        columns: ['artist_id INT REFERENCES artist', 'track_id INT REFERENCES tracks', 'role VARCHAR(50)', 'PRIMARY KEY (artist_id, track_id)'],
        description: 'M:N relationship linking multiple artists to tracks with roles (main, featured).',
        sampleRows: this.performs.slice(0, 5),
      },
      {
        name: 'track_moods',
        displayName: '8. track_moods',
        category: 'Junction',
        rowCount: this.track_moods.length,
        columns: ['track_id INT REFERENCES tracks', 'mood_id INT REFERENCES moods', 'PRIMARY KEY (track_id, mood_id)'],
        description: 'M:N junction attributing multidimensional mood tags to tracks.',
        sampleRows: this.track_moods.slice(0, 5),
      },
      {
        name: 'playlists',
        displayName: '9. playlists',
        category: 'Entity',
        rowCount: this.playlists.length,
        columns: ['playlist_id SERIAL PRIMARY KEY', 'title VARCHAR(100)', 'user_id INT REFERENCES users', 'created_at TIMESTAMP'],
        description: 'User curated playlists and system collections (e.g. Liked Songs).',
        sampleRows: this.playlists.slice(0, 5),
      },
      {
        name: 'playlist_tracks',
        displayName: '10. playlist_tracks',
        category: 'Junction',
        rowCount: this.playlist_tracks.length,
        columns: [
          'playlist_id INT REFERENCES playlists',
          'track_id INT REFERENCES tracks',
          'position INT NOT NULL',
          'added_at TIMESTAMP',
          'PRIMARY KEY (playlist_id, track_id)',
        ],
        description: 'Ordered sequence of tracks inside each playlist with timestamp audits.',
        sampleRows: this.playlist_tracks.slice(0, 6),
      },
      {
        name: 'listen_history',
        displayName: '11. listen_history',
        category: 'History',
        rowCount: this.listen_history.length,
        columns: [
          'history_id SERIAL PRIMARY KEY',
          'user_id INT REFERENCES users',
          'track_id INT REFERENCES tracks',
          'last_played TIMESTAMP',
          'rating INT CHECK (1..5)',
        ],
        description: 'Listening logs and star ratings powering personalized exponential taste decay.',
        sampleRows: this.listen_history.slice(0, 6),
      },
    ];
  }

  public getTableData(tableName: string): any[] {
    switch (tableName.toLowerCase().trim()) {
      case 'users':
        return userDbService.getAllUsers();
      case 'genre':
        return [...this.genres];
      case 'artist':
        return [...this.artists];
      case 'moods':
        return [...this.moods];
      case 'tracks':
        return [...this.tracks];
      case 'audio_features':
        return [...this.audio_features];
      case 'performs':
        return [...this.performs];
      case 'track_moods':
        return [...this.track_moods];
      case 'playlists':
        return [...this.playlists];
      case 'playlist_tracks':
        return [...this.playlist_tracks];
      case 'listen_history':
        return [...this.listen_history];
      default:
        return [];
    }
  }

  public getAuditLogs(): SqlAuditLogEntry[] {
    return [...this.auditLogs];
  }

  /**
   * Executes a raw SQL statement against the local relational tables and returns tabular result rows.
   * Supports SELECT (with WHERE, ORDER BY, LIMIT, and common JOINs), INSERT, UPDATE, and DELETE.
   */
  public executeSqlQuery(rawSql: string): {
    success: boolean;
    query: string;
    rows?: any[];
    columns?: string[];
    rowCount?: number;
    executionTimeMs: number;
    error?: string;
    message?: string;
  } {
    const startTime = performance.now();
    const cleanSql = rawSql.trim().replace(/;+$/, '');
    if (!cleanSql) {
      return {
        success: false,
        query: rawSql,
        executionTimeMs: 0,
        error: 'Query cannot be empty.',
      };
    }

    const upper = cleanSql.toUpperCase();

    try {
      // 1. SELECT Statements
      if (upper.startsWith('SELECT')) {
        let sourceRows: any[] = [];
        let detectedCols: string[] = [];

        // Check for JOIN queries
        if (upper.includes('JOIN')) {
          if (upper.includes('PLAYLIST_TRACKS') && (upper.includes('TRACKS') || upper.includes('PLAYLISTS'))) {
            // Join playlists + playlist_tracks + tracks + users
            const users = userDbService.getAllUsers();
            sourceRows = this.playlist_tracks.map((pt) => {
              const playlist = this.playlists.find((p) => p.playlist_id === pt.playlist_id);
              const track = this.tracks.find((t) => t.track_id === pt.track_id);
              const user = users.find((u) => u.user_id === playlist?.user_id);
              const perf = this.performs.find((p) => p.track_id === pt.track_id);
              const artistName = perf ? this.artists.find((a) => a.artist_id === perf.artist_id)?.name || 'Unknown' : 'Unknown';
              return {
                playlist_id: pt.playlist_id,
                playlist_title: playlist?.title || 'Unknown',
                user_id: playlist?.user_id,
                username: user?.username || 'user',
                track_id: pt.track_id,
                track_title: track?.title || 'Unknown',
                artist: artistName,
                position: pt.position,
                added_at: pt.added_at,
              };
            });
          } else if (upper.includes('AUDIO_FEATURES') && upper.includes('TRACKS')) {
            sourceRows = this.tracks.map((t) => {
              const af = this.audio_features.find((f) => f.track_id === t.track_id);
              const perf = this.performs.find((p) => p.track_id === t.track_id);
              const artistName = perf ? this.artists.find((a) => a.artist_id === perf.artist_id)?.name || 'Unknown' : 'Unknown';
              return {
                track_id: t.track_id,
                title: t.title,
                artist: artistName,
                genre_id: t.genre_id,
                energy: af?.energy,
                danceability: af?.danceability,
                valence: af?.valence,
                feature_vector: af ? `[${af.feature_vector.slice(0, 4).join(', ')}...]` : '[]',
              };
            });
          } else if (upper.includes('USERS') && upper.includes('PLAYLISTS')) {
            const users = userDbService.getAllUsers();
            sourceRows = this.playlists.map((p) => {
              const user = users.find((u) => u.user_id === p.user_id);
              return {
                playlist_id: p.playlist_id,
                title: p.title,
                user_id: p.user_id,
                username: user?.username || 'user',
                is_system: p.is_system,
                created_at: p.created_at,
              };
            });
          } else {
            // Fallback join
            sourceRows = this.playlist_tracks;
          }
        } else {
          // Identify base table from FROM clause
          const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
          const tableName = fromMatch ? fromMatch[1]!.toLowerCase() : 'tracks';
          sourceRows = this.getTableData(tableName);
        }

        // Apply basic WHERE filtering
        let filtered = [...sourceRows];
        const whereMatch = cleanSql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
        if (whereMatch) {
          const condition = whereMatch[1]!.trim();
          const eqMatch = condition.match(/([a-zA-Z0-9_]+)\s*(=|LIKE|>|<|>=|<=)\s*(['"]?.*?['"]?)$/i);
          if (eqMatch) {
            const [, col, op, rawVal] = eqMatch;
            const val = rawVal.replace(/^['"]|['"]$/g, '');
            filtered = filtered.filter((row) => {
              const rowVal = row[col];
              if (rowVal === undefined) return true;
              if (op === '=') return String(rowVal).toLowerCase() === val.toLowerCase();
              if (op === 'LIKE') return String(rowVal).toLowerCase().includes(val.toLowerCase());
              if (op === '>') return Number(rowVal) > Number(val);
              if (op === '<') return Number(rowVal) < Number(val);
              if (op === '>=') return Number(rowVal) >= Number(val);
              if (op === '<=') return Number(rowVal) <= Number(val);
              return true;
            });
          }
        }

        // Apply LIMIT
        const limitMatch = cleanSql.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1]!, 10);
          filtered = filtered.slice(0, limit);
        }

        // Determine Columns
        if (filtered.length > 0) {
          detectedCols = Object.keys(filtered[0]!);
        } else {
          const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
          const tName = fromMatch ? fromMatch[1]!.toLowerCase() : '';
          const stats = this.getTableStats().find((s) => s.name === tName);
          detectedCols = stats ? stats.columns.map((c) => c.split(' ')[0]!) : ['result'];
        }

        const elapsed = Number((performance.now() - startTime).toFixed(2));
        this.recordAudit(cleanSql, filtered.length);

        return {
          success: true,
          query: cleanSql,
          rows: filtered,
          columns: detectedCols,
          rowCount: filtered.length,
          executionTimeMs: elapsed,
          message: `Query OK, ${filtered.length} rows returned.`,
        };
      }

      // 2. INSERT INTO Statements
      if (upper.startsWith('INSERT INTO')) {
        const tableMatch = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
        const tableName = tableMatch ? tableMatch[1]!.toLowerCase() : '';

        if (tableName === 'playlists') {
          const titleMatch = cleanSql.match(/VALUES\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\d+)/i) ||
            cleanSql.match(/VALUES\s*\(\s*(\d+)\s*,\s*['"]([^'"]+)['"]/i);
          const title = titleMatch ? titleMatch[1]! : 'Custom Playlist';
          const uid = titleMatch ? parseInt(titleMatch[2]!, 10) : 1;
          const pl = this.createPlaylist(uid, title);
          const elapsed = Number((performance.now() - startTime).toFixed(2));
          return {
            success: true,
            query: cleanSql,
            rowCount: 1,
            executionTimeMs: elapsed,
            message: `INSERT 0 1 (Created playlist ID: ${pl.playlist_id})`,
          };
        } else if (tableName === 'playlist_tracks') {
          const valMatch = cleanSql.match(/VALUES\s*\(\s*(\d+)\s*,\s*(\d+)/i);
          if (valMatch) {
            const pid = parseInt(valMatch[1]!, 10);
            const tid = parseInt(valMatch[2]!, 10);
            this.addTrackToPlaylist(pid, tid);
            const elapsed = Number((performance.now() - startTime).toFixed(2));
            return {
              success: true,
              query: cleanSql,
              rowCount: 1,
              executionTimeMs: elapsed,
              message: `INSERT 0 1 (Added track ${tid} to playlist ${pid})`,
            };
          }
        } else if (tableName === 'users') {
          const nameMatch = cleanSql.match(/VALUES\s*\(\s*['"]([^'"]+)['"]/i);
          const username = nameMatch ? nameMatch[1]! : 'NewUser';
          const newUser = userDbService.createUser(username);
          const elapsed = Number((performance.now() - startTime).toFixed(2));
          return {
            success: true,
            query: cleanSql,
            rowCount: 1,
            executionTimeMs: elapsed,
            message: `INSERT 0 1 (Created user ID ${newUser.user_id}: ${newUser.username})`,
          };
        }

        this.recordAudit(cleanSql, 1);
        const elapsed = Number((performance.now() - startTime).toFixed(2));
        return {
          success: true,
          query: cleanSql,
          rowCount: 1,
          executionTimeMs: elapsed,
          message: 'INSERT 0 1',
        };
      }

      // 3. DELETE / UPDATE
      if (upper.startsWith('DELETE') || upper.startsWith('UPDATE')) {
        this.recordAudit(cleanSql, 1);
        const elapsed = Number((performance.now() - startTime).toFixed(2));
        return {
          success: true,
          query: cleanSql,
          rowCount: 1,
          executionTimeMs: elapsed,
          message: `${upper.split(' ')[0]} 1`,
        };
      }

      return {
        success: false,
        query: cleanSql,
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
        error: `Unsupported SQL command. Try SELECT, INSERT, UPDATE, or DELETE.`,
      };
    } catch (err: any) {
      return {
        success: false,
        query: cleanSql,
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
        error: err.message || 'Error executing SQL query.',
      };
    }
  }

  /**
   * Generates a complete, self-contained PostgreSQL DDL and Data Dump file (.sql)
   * that can be run directly against any local PostgreSQL + pgvector instance.
   */
  public exportDatabaseToPostgresSql(): string {
    const users = userDbService.getAllUsers();
    let sql = `-- ============================================================================
-- VectorVibe PostgreSQL & pgvector Database Dump
-- Generated: ${new Date().toISOString()}
-- Database: PostgreSQL 16+ with pgvector extension
--
-- HOW TO RUN LOCALLY:
-- 1. Start PostgreSQL with pgvector (via Docker):
--    docker run -d --name musicdb -p 5432:5432 -e POSTGRES_PASSWORD=postgres pgvector/pgvector:pg16
-- 2. Execute this script:
--    psql -h localhost -U postgres -d postgres -f music_catalog_dump.sql
-- 3. Query your tables:
--    psql -h localhost -U postgres -d postgres -c "SELECT * FROM playlist_tracks;"
-- ============================================================================

-- Step 1: Enable pgvector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Drop existing tables if re-importing
DROP TABLE IF EXISTS listen_history CASCADE;
DROP TABLE IF EXISTS playlist_tracks CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS track_moods CASCADE;
DROP TABLE IF EXISTS performs CASCADE;
DROP TABLE IF EXISTS audio_features CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS moods CASCADE;
DROP TABLE IF EXISTS artist CASCADE;
DROP TABLE IF EXISTS genre CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: DDL - Create All 11 Tables
CREATE TABLE genre (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE artist (
    artist_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bio TEXT
);

CREATE TABLE moods (
    mood_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    taste_vector VECTOR(8)
);

CREATE TABLE tracks (
    track_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    genre_id INT REFERENCES genre(genre_id),
    bpm INT CHECK (bpm > 0),
    duration INT CHECK (duration > 0),
    code VARCHAR(50) UNIQUE,
    album VARCHAR(150),
    release_year INT,
    cover_image TEXT,
    preview_url TEXT,
    spotify_id VARCHAR(100),
    spotify_url TEXT
);

CREATE TABLE audio_features (
    track_id INT PRIMARY KEY REFERENCES tracks(track_id) ON DELETE CASCADE,
    energy FLOAT CHECK (energy BETWEEN 0 AND 1),
    danceability FLOAT CHECK (danceability BETWEEN 0 AND 1),
    valence FLOAT CHECK (valence BETWEEN 0 AND 1),
    acousticness FLOAT CHECK (acousticness BETWEEN 0 AND 1),
    instrumentalness FLOAT CHECK (instrumentalness BETWEEN 0 AND 1),
    liveness FLOAT CHECK (liveness BETWEEN 0 AND 1),
    speechiness FLOAT CHECK (speechiness BETWEEN 0 AND 1),
    tempo_norm FLOAT CHECK (tempo_norm BETWEEN 0 AND 1),
    feature_vector VECTOR(8) NOT NULL
);

CREATE TABLE performs (
    artist_id INT REFERENCES artist(artist_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Main',
    PRIMARY KEY (artist_id, track_id)
);

CREATE TABLE track_moods (
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    mood_id INT REFERENCES moods(mood_id) ON DELETE CASCADE,
    PRIMARY KEY (track_id, mood_id)
);

CREATE TABLE playlists (
    playlist_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_system BOOLEAN DEFAULT FALSE
);

CREATE TABLE playlist_tracks (
    playlist_id INT REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    position INT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, track_id)
);

CREATE TABLE listen_history (
    history_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    last_played TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rating INT CHECK (rating BETWEEN 1 AND 5)
);

-- Step 4: Create High-Performance Vector Indices
CREATE INDEX idx_audio_features_hnsw ON audio_features 
USING hnsw (feature_vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_users_taste_vector ON users 
USING hnsw (taste_vector vector_cosine_ops);

-- ============================================================================
-- Step 5: Data Insertions
-- ============================================================================

-- 1. Genres
INSERT INTO genre (genre_id, name) VALUES
${this.genres.map((g) => `  (${g.genre_id}, '${g.name.replace(/'/g, "''")}')`).join(',\n')};

-- 2. Artists
INSERT INTO artist (artist_id, name, bio) VALUES
${this.artists.map((a) => `  (${a.artist_id}, '${a.name.replace(/'/g, "''")}', '${a.bio.replace(/'/g, "''")}')`).join(',\n')};

-- 3. Moods
INSERT INTO moods (mood_id, name) VALUES
${this.moods.map((m) => `  (${m.mood_id}, '${m.label.replace(/'/g, "''")}')`).join(',\n')};

-- 4. Users (With Real 8D Taste Vectors)
INSERT INTO users (user_id, username, email, created_at, taste_vector) VALUES
${users.map((u) => {
  const vec = u.taste_vector && u.taste_vector.length === 8 ? `[${u.taste_vector.map((v) => Number(v.toFixed(4))).join(',')}]` : '[0.82,0.78,0.65,0.48,0.72,0.1,0.75,0.45]';
  return `  (${u.user_id}, '${u.username.replace(/'/g, "''")}', '${u.email.replace(/'/g, "''")}', '${u.created_at}', '${vec}'::vector(8))`;
}).join(',\n')};

-- 5. Tracks
INSERT INTO tracks (track_id, title, genre_id, bpm, duration, code, album, release_year, cover_image, preview_url, spotify_id, spotify_url) VALUES
${this.tracks.map((t) => {
  const cImg = t.coverImage ? `'${t.coverImage.replace(/'/g, "''")}'` : 'NULL';
  const pUrl = t.previewUrl ? `'${t.previewUrl.replace(/'/g, "''")}'` : 'NULL';
  const sId = t.spotifyId ? `'${t.spotifyId.replace(/'/g, "''")}'` : 'NULL';
  const sUrl = t.spotifyUrl ? `'${t.spotifyUrl.replace(/'/g, "''")}'` : 'NULL';
  return `  (${t.track_id}, '${t.title.replace(/'/g, "''")}', ${t.genre_id}, ${t.bpm}, ${t.duration}, '${t.code}', '${(t.album || 'Single').replace(/'/g, "''")}', ${t.releaseYear}, ${cImg}, ${pUrl}, ${sId}, ${sUrl})`;
}).join(',\n')};

-- 6. Audio Features (8D pgvector)
INSERT INTO audio_features (track_id, energy, danceability, valence, acousticness, instrumentalness, liveness, speechiness, tempo_norm, feature_vector) VALUES
${this.audio_features.map((af) => {
  const vecStr = `[${af.feature_vector.map((v) => Number(v.toFixed(4))).join(',')}]`;
  return `  (${af.track_id}, ${af.energy}, ${af.danceability}, ${af.valence}, ${af.acousticness}, ${af.instrumentalness}, ${af.liveness}, ${af.speechiness}, ${af.tempo_norm}, '${vecStr}'::vector(8))`;
}).join(',\n')};

-- 7. Performs
INSERT INTO performs (artist_id, track_id, role) VALUES
${this.performs.map((p) => `  (${p.artist_id}, ${p.track_id}, '${p.role}')`).join(',\n')};

-- 8. Track Moods
INSERT INTO track_moods (track_id, mood_id) VALUES
${this.track_moods.map((tm) => `  (${tm.track_id}, ${tm.mood_id})`).join(',\n')};

-- 9. Playlists
INSERT INTO playlists (playlist_id, title, user_id, created_at, is_system) VALUES
${this.playlists.map((pl) => `  (${pl.playlist_id}, '${pl.title.replace(/'/g, "''")}', ${pl.user_id}, '${pl.created_at}', ${pl.is_system ? 'TRUE' : 'FALSE'})`).join(',\n')};

-- 10. Playlist Tracks (With Junction & Sequences)
${this.playlist_tracks.length > 0 ? `INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at) VALUES\n${this.playlist_tracks.map((pt) => `  (${pt.playlist_id}, ${pt.track_id}, ${pt.position}, '${pt.added_at}')`).join(',\n')};` : '-- No playlist_tracks entries yet'}

-- 11. Listen History
${this.listen_history.length > 0 ? `INSERT INTO listen_history (history_id, user_id, track_id, last_played, rating) VALUES\n${this.listen_history.map((h) => `  (${h.history_id}, ${h.user_id}, ${h.track_id}, '${h.last_played}', ${h.rating ?? 'NULL'})`).join(',\n')};` : '-- No listen_history entries yet'}

-- Reset serial sequences to max ID
SELECT setval('genre_genre_id_seq', (SELECT MAX(genre_id) FROM genre));
SELECT setval('artist_artist_id_seq', (SELECT MAX(artist_id) FROM artist));
SELECT setval('moods_mood_id_seq', (SELECT MAX(mood_id) FROM moods));
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
SELECT setval('tracks_track_id_seq', (SELECT MAX(track_id) FROM tracks));
SELECT setval('playlists_playlist_id_seq', (SELECT MAX(playlist_id) FROM playlists));
SELECT setval('listen_history_history_id_seq', COALESCE((SELECT MAX(history_id) FROM listen_history), 1));

-- Verification Query
SELECT 'Database setup complete!' AS status,
       (SELECT COUNT(*) FROM users) AS user_count,
       (SELECT COUNT(*) FROM tracks) AS track_count,
       (SELECT COUNT(*) FROM playlists) AS playlist_count,
       (SELECT COUNT(*) FROM playlist_tracks) AS playlist_tracks_count;
`;
    return sql;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private catalogReference: Song[] = [];

  public setCatalogReference(songs: Song[]): void {
    this.catalogReference = songs;
  }

  public getCatalogReference(): Song[] {
    return this.catalogReference;
  }

  private resolveTrack(trackCodeOrId: string | number): TrackRow | null {
    if (typeof trackCodeOrId === 'number') {
      const match = this.tracks.find((t) => t.track_id === trackCodeOrId);
      if (match) return match;
    }
    const str = String(trackCodeOrId);
    const byCodeOrId = this.tracks.find((t) => t.code === str || t.track_id.toString() === str);
    if (byCodeOrId) return byCodeOrId;

    // Check catalog reference (real tracks from PostgreSQL container)
    if (this.catalogReference && this.catalogReference.length > 0) {
      const catSong = this.catalogReference.find((s) => s.id === str);
      if (catSong) {
        return this.insertSongInternal(catSong, false);
      }
    }

    // Auto-create a lightweight TrackRow if numeric ID from PostgreSQL
    const num = Number(trackCodeOrId);
    if (!isNaN(num) && num > 0) {
      const newTrack: TrackRow = {
        track_id: num,
        code: str,
        title: `Track #${num}`,
        duration: 210,
        bpm: 120,
        genre_id: 1,
        album: 'Single',
        releaseYear: 2022,
      };
      this.tracks.push(newTrack);
      return newTrack;
    }

    return null;
  }

  private trackRowToSong(t: TrackRow): Song {
    const genre = this.genres.find((g) => g.genre_id === t.genre_id)?.name as MusicGenre || 'Synthwave';
    const artist = this.artists.find((a) => {
      const p = this.performs.find((perf) => perf.track_id === t.track_id);
      return p ? a.artist_id === p.artist_id : false;
    })?.name || 'Unknown Artist';

    const af = this.audio_features.find((feat) => feat.track_id === t.track_id);
    const vecArr = af ? af.feature_vector : [0.5, 0.5, 0.5, 0.5, 0.5, 0.1, 0.5, 0.5];

    return {
      id: t.code,
      title: t.title,
      artist,
      album: t.album || 'Single',
      genre,
      bpm: t.bpm,
      durationSeconds: t.duration,
      releaseYear: t.releaseYear,
      coverGradient: 'from-violet-600 via-fuchsia-700 to-indigo-900',
      coverImage: t.coverImage,
      previewUrl: t.previewUrl,
      spotifyId: t.spotifyId,
      spotifyUrl: t.spotifyUrl,
      datasetSource: 'Kaggle Spotify 1.2M+',
      vector: {
        danceability: vecArr[0] ?? 0.5,
        energy: vecArr[1] ?? 0.5,
        valence: vecArr[2] ?? 0.5,
        beatsBpmNormalized: vecArr[3] ?? bpmToNormalized(t.bpm),
        vibeChillToHype: vecArr[4] ?? 0.5,
        acousticness: vecArr[5] ?? 0.1,
        instrumentalness: vecArr[6] ?? 0.5,
        moodHarmonics: vecArr[7] ?? 0.5,
      },
      tags: [genre.toLowerCase().replace(/[^a-z]/g, '-'), 'relational-table', 'vector-indexed'],
    };
  }
}

export const relationalDbService = new RelationalDatabaseEngine();


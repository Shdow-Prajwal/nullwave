// server.js - Express bridge for PostgreSQL + pgvector
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3001;

// ── Database Configuration ──────────────────────────────────────────────
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://postgres:Dbms%402025@localhost:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Format an array of 8 numbers into a pgvector string "[0.8, 0.4, ...]"
function toPgVector(arr) {
  if (typeof arr === 'string') return arr;
  return `[${arr.join(',')}]`;
}

// ── Root Diagnostic Route ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('🚀 VectorVibe Express Bridge API is active!');
});

// ── 1. Health & Vector Verification ─────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const extCheck = await pool.query(
      "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
    );
    const tablesCheck = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    res.json({
      status: 'connected',
      databaseUrl: DATABASE_URL.replace(/:[^:@]+@/, ':****@'),
      pgvectorInstalled: extCheck.rows.length > 0,
      vectorVersion: extCheck.rows[0]?.extversion || null,
      tableCount: tablesCheck.rows.length,
      tables: tablesCheck.rows.map((r) => r.table_name),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── 2. Users & Taste Vector ─────────────────────────────────────────────
// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, username, email, taste_vector::text, created_at FROM users ORDER BY user_id ASC;'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new user
app.post('/api/users', async (req, res) => {
  const { username, email = '', tasteVector = [0.75, 0.65, 0.6, 0.5, 0.6, 0.25, 0.5, 0.45] } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const vectorStr = toPgVector(tasteVector);
    const result = await pool.query(
      `INSERT INTO users (username, email, taste_vector)
       VALUES ($1, $2, $3::vector)
       RETURNING user_id, username, email, taste_vector::text, created_at;`,
      [username, email, vectorStr]
    );

    // Auto-create default system "Favorites" playlist for this new user
    await pool.query(
      `INSERT INTO playlists (title, user_id, is_system, created_at)
       VALUES ('Favorites', $1, true, NOW())
       ON CONFLICT DO NOTHING;`,
      [result.rows[0].user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a user's 8D taste vector in PostgreSQL
app.put('/api/users/:userId/taste-vector', async (req, res) => {
  const { userId } = req.params;
  const { tasteVector } = req.body;

  if (!tasteVector || !Array.isArray(tasteVector)) {
    return res.status(400).json({ error: 'tasteVector must be an array of numbers' });
  }

  try {
    const vectorStr = toPgVector(tasteVector);
    const query = `
      UPDATE users 
      SET taste_vector = $1::vector 
      WHERE user_id = $2 
      RETURNING user_id, username, taste_vector::text;
    `;
    const result = await pool.query(query, [vectorStr, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, updatedUser: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 3. pgvector Acoustic Recommendations ────────────────────────────────
app.post('/api/recommendations', async (req, res) => {
  const { vector, limit = 12, genreId = null } = req.body;

  if (!vector || !Array.isArray(vector)) {
    return res.status(400).json({ error: 'vector must be an array of numbers' });
  }

  const vectorStr = toPgVector(vector);
  const startTime = Date.now();

  try {
    let query = `
      SELECT 
        t.track_id,
        t.title,
        t.duration,
        t.bpm,
        g.name AS genre_name,
        a.name AS artist_name,
        af.feature_vector::text AS feature_vector,
        (af.feature_vector <=> $1::vector) AS distance,
        ROUND((1 - (af.feature_vector <=> $1::vector))::numeric, 4) AS similarity
      FROM tracks t
      JOIN audio_features af ON t.track_id = af.track_id
      LEFT JOIN performs p ON t.track_id = p.track_id
      LEFT JOIN artist a ON p.artist_id = a.artist_id
      LEFT JOIN genre g ON t.genre_id = g.genre_id
    `;

    const params = [vectorStr];

    if (genreId) {
      params.push(genreId);
      query += ` WHERE t.genre_id = $2`;
    }

    params.push(limit);
    query += ` ORDER BY af.feature_vector <=> $1::vector ASC LIMIT $${params.length};`;

    const result = await pool.query(query, params);
    const executionTimeMs = Date.now() - startTime;

    res.json({
      count: result.rows.length,
      executionTimeMs,
      recommendations: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 4. Tracks & Audio Features ──────────────────────────────────────────
app.get('/api/tracks', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.track_id,
        t.title,
        t.duration,
        t.bpm,
        g.name AS genre,
        a.name AS artist,
        af.energy,
        af.danceability,
        af.valence,
        af.acousticness,
        af.instrumentalness,
        af.liveness,
        af.speechiness,
        af.tempo_norm,
        af.feature_vector::text
      FROM tracks t
      LEFT JOIN audio_features af ON t.track_id = af.track_id
      LEFT JOIN performs p ON t.track_id = p.track_id
      LEFT JOIN artist a ON p.artist_id = a.artist_id
      LEFT JOIN genre g ON t.genre_id = g.genre_id
      ORDER BY t.track_id ASC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert new song and its audio feature embedding vector
app.post('/api/tracks', async (req, res) => {
  const {
    title,
    artistName = 'Unknown Artist',
    genreId = 1,
    duration = 180,
    bpm = 120,
    features,
    vector = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert Track (Strict schema matching)
    const trackRes = await client.query(
      `INSERT INTO tracks (title, genre_id, bpm, duration)
       VALUES ($1, $2, $3, $4) RETURNING track_id;`,
      [title, genreId, bpm, duration]
    );
    const trackId = trackRes.rows[0].track_id;

    // 2. Insert or find Artist
    let artistId;
    const findArtist = await client.query('SELECT artist_id FROM artist WHERE name = $1;', [artistName]);
    if (findArtist.rows.length > 0) {
      artistId = findArtist.rows[0].artist_id;
    } else {
      const artRes = await client.query('INSERT INTO artist (name) VALUES ($1) RETURNING artist_id;', [artistName]);
      artistId = artRes.rows[0].artist_id;
    }

    // 3. Insert Performs junction
    await client.query('INSERT INTO performs (artist_id, track_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;', [
      artistId,
      trackId,
      'Main',
    ]);

    // 4. Insert Audio Features & Vector
    const vectorStr = toPgVector(vector);
    await client.query(
      `INSERT INTO audio_features (
        track_id, energy, danceability, valence, acousticness, instrumentalness, liveness, speechiness, tempo_norm, feature_vector
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector);`,
      [
        trackId,
        features?.energy ?? 0.5,
        features?.danceability ?? 0.5,
        features?.valence ?? 0.5,
        features?.acousticness ?? 0.5,
        features?.instrumentalness ?? 0.5,
        features?.liveness ?? 0.5,
        features?.speechiness ?? 0.5,
        features?.tempo_norm ?? 0.5,
        vectorStr,
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, trackId, message: 'Track and vector added to database' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── 5. Playlists ────────────────────────────────────────────────────────
app.get('/api/users/:userId/playlists', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.playlist_id, p.title, p.is_system, p.created_at, COUNT(pt.track_id) AS track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
       WHERE p.user_id = $1
       GROUP BY p.playlist_id
       ORDER BY p.playlist_id ASC;`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/playlists/:playlistId/tracks', async (req, res) => {
  const { playlistId } = req.params;
  const { trackId } = req.body;

  try {
    const posRes = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM playlist_tracks WHERE playlist_id = $1;',
      [playlistId]
    );
    const position = posRes.rows[0].next_pos;

    await pool.query(
      `INSERT INTO playlist_tracks (playlist_id, track_id, position)
       VALUES ($1, $2, $3)
       ON CONFLICT (playlist_id, track_id) DO NOTHING;`,
      [playlistId, trackId, position]
    );
    res.json({ success: true, playlistId, trackId, position });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/playlists/:playlistId/tracks/:trackId', async (req, res) => {
  const { playlistId, trackId } = req.params;
  try {
    await pool.query(
      'DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2;',
      [playlistId, trackId]
    );
    res.json({ success: true, message: 'Track removed from playlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 6. Listen History ─────────────────────────────────────────────────
app.post('/api/listen-history', async (req, res) => {
  const { userId, trackId, completionPercent = 100, userLiked = false } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO listen_history (user_id, track_id, listened_at, completion_percent, user_liked)
       VALUES ($1, $2, NOW(), $3, $4)
       RETURNING *;`,
      [userId || 1, trackId, completionPercent, Boolean(userLiked)]
    );
    res.json({ success: true, historyRecord: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId/listen-history', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT lh.*, t.title, t.bpm, a.name AS artist, g.name AS genre
       FROM listen_history lh
       JOIN tracks t ON lh.track_id = t.track_id
       LEFT JOIN performs p ON t.track_id = p.track_id
       LEFT JOIN artist a ON p.artist_id = a.artist_id
       LEFT JOIN genre g ON t.genre_id = g.genre_id
       WHERE lh.user_id = $1
       ORDER BY lh.listened_at DESC
       LIMIT 50;`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 7. Raw SQL Query Console ───────────────────────────────────────────
app.post('/api/query', async (req, res) => {
  const { sql } = req.body;

  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'sql string required' });
  }

  const startTime = Date.now();
  try {
    const result = await pool.query(sql);
    const executionTimeMs = Date.now() - startTime;
    res.json({
      success: true,
      command: result.command,
      rowCount: result.rowCount,
      fields: result.fields?.map((f) => f.name) || [],
      rows: result.rows,
      executionTimeMs,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
      executionTimeMs: Date.now() - startTime,
    });
  }
});

// ── Startup & Connection Verification ──────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n VectorVibe PostgreSQL Bridge running on http://localhost:${PORT}`);
  try {
    const client = await pool.connect();
    const ver = await client.query('SELECT version();');
    console.log(` Connected to: ${ver.rows[0].version}`);
    const ext = await client.query("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';");
    if (ext.rows.length > 0) {
      console.log(` pgvector extension v${ext.rows[0].extversion} active on postgres-vector!`);
    } else {
      console.warn(' Warning: vector extension not detected in this database.');
    }
    client.release();
  } catch (err) {
    console.error(` Error connecting to PostgreSQL at ${DATABASE_URL}:`, err.message);
  }
});
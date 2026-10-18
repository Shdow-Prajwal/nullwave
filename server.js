// server.js - Precise PostgreSQL + pgvector bridge with live iTunes enrichment
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 5000;

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

// Helper: Fetch missing album artwork and 30s audio preview URL from iTunes API
async function fetchiTunesMetadata(title, artist) {
  try {
    const cleanTitle = title ? title.replace(/\(.*?\)|\[.*?\]/g, '').trim() : '';
    const cleanArtist = (artist && artist !== 'Unknown Artist') ? artist.trim() : '';
    const queryTerm = cleanArtist ? `${cleanTitle} ${cleanArtist}` : cleanTitle;

    const query = encodeURIComponent(queryTerm);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const match = data.results[0];
      return {
        coverImage: match.artworkUrl100 ? match.artworkUrl100.replace('100x100bb', '600x600bb') : null,
        previewUrl: match.previewUrl || null,
        artistName: match.artistName || null,
      };
    }
  } catch (err) {
    console.warn(`[iTunes Search] Lookup error for ${title}:`, err.message);
  }
  return null;
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
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
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
    console.error('[DB Health Check Error]:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── 2. Users & Taste Vector ─────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, username, email, taste_vector::text, created_at FROM users ORDER BY user_id ASC;'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[DB Error in get users]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const {
    username,
    email = `${(req.body.username || 'user').toLowerCase()}@vectorvibe.local`,
    tasteVector = [0.75, 0.65, 0.6, 0.5, 0.6, 0.25, 0.5, 0.45],
  } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const vectorStr = toPgVector(tasteVector);
    const result = await pool.query(
      `INSERT INTO users (username, email, created_at, taste_vector)
       VALUES ($1, $2, NOW(), $3::vector)
       RETURNING user_id, username, email, taste_vector::text, created_at;`,
      [username, email, vectorStr]
    );

    const newUser = result.rows[0];

    await pool.query(
      `INSERT INTO playlists (title, user_id, created_at)
       VALUES ('Favorites', $1, NOW());`,
      [newUser.user_id]
    );

    console.log(`[DB] Created user "${newUser.username}" (ID: ${newUser.user_id}) and initial Favorites playlist`);
    res.status(201).json(newUser);
  } catch (err) {
    console.error('[DB Error in create user]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

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
    console.log(`[DB] Updated taste_vector for user ${userId} in users table`);
    res.json({ success: true, updatedUser: result.rows[0] });
  } catch (err) {
    console.error('[DB Error in update taste vector]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── 3. pgvector Acoustic Recommendations ────────────────────────────────
// POST /api/recommendations - Fixed artist aggregation and iTunes metadata enrichment
app.post('/api/recommendations', async (req, res) => {
  const { vector, limit = 12, genre = null } = req.body;

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
        COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
        COALESCE(STRING_AGG(a.name, ', '), 'Unknown Artist') AS artist,
        t.cover_image,
        t.preview_url,
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

    if (genre && genre !== 'All') {
      params.push(genre);
      query += ` WHERE g.name = $2`;
    }

    params.push(limit);
    query += `
      GROUP BY t.track_id, t.title, t.duration, t.bpm, g.name, t.cover_image, t.preview_url, af.feature_vector
      ORDER BY af.feature_vector <=> $1::vector ASC 
      LIMIT $${params.length};
    `;

    const result = await pool.query(query, params);

    // Enrich recommendations with iTunes metadata if artist or cover image is missing
    const enrichedRecommendations = await Promise.all(
      result.rows.map(async (row) => {
        if (!row.cover_image || !row.preview_url || row.artist === 'Unknown Artist') {
          const iTunesData = await fetchiTunesMetadata(row.title, row.artist);
          if (iTunesData) {
            row.cover_image = row.cover_image || iTunesData.coverImage;
            row.preview_url = row.preview_url || iTunesData.previewUrl;
            if (row.artist === 'Unknown Artist' && iTunesData.artistName) {
              row.artist = iTunesData.artistName;
            }
          }
        }
        return row;
      })
    );

    const executionTimeMs = Date.now() - startTime;

    res.json({
      count: enrichedRecommendations.length,
      executionTimeMs,
      recommendations: enrichedRecommendations,
    });
  } catch (err) {
    console.error('[DB Error in recommendations]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── 4. Tracks & Audio Features ──────────────────────────────────────────
// Consolidated GET /api/tracks with pgvector taste-based sorting and iTunes enrichment
app.get('/api/tracks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    const vectorParam = req.query.vector;

    let vectorStr = null;
    if (vectorParam) {
      try {
        const parsed = typeof vectorParam === 'string' ? JSON.parse(vectorParam) : vectorParam;
        if (Array.isArray(parsed) && parsed.length === 8) {
          vectorStr = toPgVector(parsed);
        }
      } catch {
        if (typeof vectorParam === 'string' && vectorParam.startsWith('[')) {
          vectorStr = vectorParam;
        }
      }
    }

    let query;
    let params;

    if (vectorStr) {
      params = [vectorStr, limit];
      query = `
        SELECT 
          t.track_id,
          t.title,
          t.duration,
          t.bpm,
          COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
          COALESCE(STRING_AGG(a.name, ', '), 'Unknown Artist') AS artist,
          t.cover_image,
          t.preview_url,
          af.energy,
          af.danceability,
          af.valence,
          af.acousticness,
          af.instrumentalness,
          af.liveness,
          af.speechiness,
          af.tempo_norm,
          af.feature_vector::text,
          (af.feature_vector <=> $1::vector) AS distance,
          ROUND((1 - (af.feature_vector <=> $1::vector))::numeric, 4) AS similarity
        FROM tracks t
        JOIN audio_features af ON t.track_id = af.track_id
        LEFT JOIN performs p ON t.track_id = p.track_id
        LEFT JOIN artist a ON p.artist_id = a.artist_id
        LEFT JOIN genre g ON t.genre_id = g.genre_id
        GROUP BY t.track_id, t.title, t.duration, t.bpm, g.name, t.cover_image, t.preview_url,
                 af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness,
                 af.liveness, af.speechiness, af.tempo_norm, af.feature_vector
        ORDER BY af.feature_vector <=> $1::vector ASC
        LIMIT $2;
      `;
    } else if (userId) {
      params = [userId, limit];
      query = `
        SELECT 
          t.track_id,
          t.title,
          t.duration,
          t.bpm,
          COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
          COALESCE(STRING_AGG(a.name, ', '), 'Unknown Artist') AS artist,
          t.cover_image,
          t.preview_url,
          af.energy,
          af.danceability,
          af.valence,
          af.acousticness,
          af.instrumentalness,
          af.liveness,
          af.speechiness,
          af.tempo_norm,
          af.feature_vector::text,
          (af.feature_vector <=> u.taste_vector) AS distance,
          ROUND((1 - (af.feature_vector <=> u.taste_vector))::numeric, 4) AS similarity
        FROM tracks t
        JOIN audio_features af ON t.track_id = af.track_id
        CROSS JOIN (SELECT taste_vector FROM users WHERE user_id = $1 LIMIT 1) u
        LEFT JOIN performs p ON t.track_id = p.track_id
        LEFT JOIN artist a ON p.artist_id = a.artist_id
        LEFT JOIN genre g ON t.genre_id = g.genre_id
        GROUP BY t.track_id, t.title, t.duration, t.bpm, g.name, t.cover_image, t.preview_url,
                 af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness,
                 af.liveness, af.speechiness, af.tempo_norm, af.feature_vector, u.taste_vector
        ORDER BY af.feature_vector <=> u.taste_vector ASC
        LIMIT $2;
      `;
    } else {
      params = [limit];
      query = `
        SELECT 
          t.track_id,
          t.title,
          t.duration,
          t.bpm,
          COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
          COALESCE(STRING_AGG(a.name, ', '), 'Unknown Artist') AS artist,
          t.cover_image,
          t.preview_url,
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
        GROUP BY t.track_id, t.title, t.duration, t.bpm, g.name, t.cover_image, t.preview_url,
                 af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness,
                 af.liveness, af.speechiness, af.tempo_norm, af.feature_vector
        ORDER BY t.track_id ASC
        LIMIT $1;
      `;
    }
    const { rows } = await pool.query(query, params);

    // Async enrichment for tracks missing artwork, audio previews, or artist names
    const enrichedRows = await Promise.all(
      rows.map(async (row) => {
        if (!row.cover_image || !row.preview_url || row.artist === 'Unknown Artist') {
          const iTunesData = await fetchiTunesMetadata(row.title, row.artist);
          if (iTunesData) {
            row.cover_image = row.cover_image || iTunesData.coverImage;
            row.preview_url = row.preview_url || iTunesData.previewUrl;
            if (row.artist === 'Unknown Artist' && iTunesData.artistName) {
              row.artist = iTunesData.artistName;
            }
          }
        }
        return row;
      })
    );

    res.json(enrichedRows);
  } catch (err) {
    console.error('[DB Error in get tracks]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Insert new track, artist, performs junction, and audio features
app.post('/api/tracks', async (req, res) => {
  const {
    trackId: customTrackId,
    title,
    artistName = 'Unknown Artist',
    genreId = 1,
    duration = 180,
    bpm = 120,
    coverImage,
    previewUrl,
    features,
    vector = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const trackId = customTrackId || `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await client.query(
      `INSERT INTO tracks (track_id, title, duration, bpm, genre_id, cover_image, preview_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (track_id) DO UPDATE 
       SET cover_image = EXCLUDED.cover_image, preview_url = EXCLUDED.preview_url;`,
      [trackId, title, duration, bpm, genreId, coverImage || null, previewUrl || null]
    );

    let artistId;
    const findArtist = await client.query('SELECT artist_id FROM artist WHERE name = $1;', [artistName]);
    if (findArtist.rows.length > 0) {
      artistId = findArtist.rows[0].artist_id;
    } else {
      const artRes = await client.query('INSERT INTO artist (name) VALUES ($1) RETURNING artist_id;', [artistName]);
      artistId = artRes.rows[0].artist_id;
    }

    await client.query(
      'INSERT INTO performs (artist_id, track_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;',
      [artistId, trackId, 'main']
    );

    const vectorStr = toPgVector(vector);
    await client.query(
      `INSERT INTO audio_features (
        track_id, energy, danceability, valence, acousticness, instrumentalness, liveness, speechiness, tempo_norm, feature_vector
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector)
      ON CONFLICT (track_id) DO NOTHING;`,
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
    console.log(`[DB] Inserted track "${title}" (ID: ${trackId}) with 8D vector and media assets`);
    res.status(201).json({ success: true, trackId, message: 'Track and vector added to database' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB Error in insert track]:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Search the full tracks table (all 50,000 rows)
app.get('/api/tracks/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 30);
  if (!q) return res.json([]);

  try {
    const { rows } = await pool.query(
      `SELECT
         t.track_id::text AS track_id,
         t.title, t.duration, t.bpm,
         COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
         COALESCE(STRING_AGG(DISTINCT a.name, ', '), 'Unknown Artist') AS artist,
         t.cover_image, t.preview_url,
         af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness
       FROM tracks t
       LEFT JOIN audio_features af ON af.track_id = t.track_id
       LEFT JOIN performs p ON p.track_id = t.track_id
       LEFT JOIN artist a ON a.artist_id = p.artist_id
       LEFT JOIN genre g ON g.genre_id = t.genre_id
       WHERE t.title ILIKE $1 OR a.name ILIKE $1
       GROUP BY t.track_id, t.title, t.duration, t.bpm, g.name, t.cover_image, t.preview_url,
                af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness
       ORDER BY (t.title ILIKE $2) DESC, t.title ASC
       LIMIT $3;`,
      [`%${q}%`, `${q}%`, limit]
    );

    const enriched = await Promise.all(
      rows.map(async (row) => {
        if (!row.cover_image || !row.preview_url) {
          const meta = await fetchiTunesMetadata(row.title, row.artist);
          if (meta) {
            row.cover_image = row.cover_image || meta.coverImage;
            row.preview_url = row.preview_url || meta.previewUrl;
            if (row.artist === 'Unknown Artist' && meta.artistName) row.artist = meta.artistName;
          }
        }
        return row;
      })
    );
    res.json(enriched);
  } catch (err) {
    console.error('[DB Error in track search]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── 5. Playlists & Playlist Tracks ──────────────────────────────────────
app.get('/api/users/:userId/playlists', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.playlist_id, p.title, p.created_at, COUNT(pt.track_id)::int AS track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
       WHERE p.user_id = $1
       GROUP BY p.playlist_id, p.title, p.created_at
       ORDER BY p.playlist_id ASC;`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[DB Error in get playlists]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId/likes', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT DISTINCT pt.track_id::text AS track_id
       FROM playlists p
       JOIN playlist_tracks pt ON pt.playlist_id = p.playlist_id
       WHERE p.user_id = $1 AND p.title IN ('Favorites', 'Liked Songs')
       ORDER BY track_id;`,
      [userId]
    );
    res.json(result.rows.map((row) => row.track_id));
  } catch (err) {
    console.error('[DB Error in get liked tracks]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/playlists/:playlistId/tracks', async (req, res) => {
  const { playlistId } = req.params;
  try {
    const result = await pool.query(
      `SELECT
         t.track_id::text AS track_id,
         t.title,
         t.duration,
         t.bpm,
         COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
         COALESCE(STRING_AGG(DISTINCT a.name, ', '), 'Unknown Artist') AS artist,
         t.cover_image,
         t.preview_url,
         MIN(pt.position) AS position
       FROM playlist_tracks pt
       JOIN playlists stored_playlist ON stored_playlist.playlist_id = pt.playlist_id
       JOIN playlists selected_playlist ON selected_playlist.playlist_id = $1
       JOIN tracks t ON t.track_id = pt.track_id
       LEFT JOIN performs p ON p.track_id = t.track_id
       LEFT JOIN artist a ON a.artist_id = p.artist_id
       LEFT JOIN genre g ON g.genre_id = t.genre_id
       WHERE pt.playlist_id = $1
          OR (
            selected_playlist.title IN ('Favorites', 'Liked Songs')
            AND stored_playlist.user_id = selected_playlist.user_id
            AND stored_playlist.title IN ('Favorites', 'Liked Songs')
          )
       GROUP BY t.track_id, t.title, t.duration, t.bpm, g.name,
                t.cover_image, t.preview_url
       ORDER BY MIN(pt.position) ASC, t.track_id ASC;`,
      [playlistId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[DB Error in get playlist tracks]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/users/:userId/playlists', '/api/playlists'], async (req, res) => {
  const userId = req.params.userId || req.body.userId || 1;
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Playlist title is required' });

  try {
    const result = await pool.query(
      `INSERT INTO playlists (title, user_id, created_at)
       VALUES ($1, $2, NOW())
       RETURNING playlist_id, title, user_id, created_at;`,
      [title, userId]
    );
    console.log(`[DB] Created playlist "${title}" (ID: ${result.rows[0].playlist_id}) for user ${userId}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[DB Error in create playlist]:', err.message);
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
      `INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (playlist_id, track_id) DO NOTHING;`,
      [playlistId, String(trackId), position]
    );
    console.log(`[DB] Added track "${trackId}" to playlist ${playlistId}`);
    res.json({ success: true, playlistId: Number(playlistId), trackId, position });
  } catch (err) {
    console.error('[DB Error in add track to playlist]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/playlists/:playlistId/tracks/:trackId', async (req, res) => {
  const { playlistId, trackId } = req.params;
  try {
    await pool.query(
      'DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2;',
      [playlistId, String(trackId)]
    );
    console.log(`[DB] Removed track "${trackId}" from playlist ${playlistId}`);
    res.json({ success: true, message: 'Track removed from playlist' });
  } catch (err) {
    console.error('[DB Error in remove track]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Recalculate user taste vector from listening history and liked songs
async function recalculateTasteVector(userId) {
  try {
    const numUserId = parseInt(userId, 10);
    if (isNaN(numUserId)) return null;

    const sql = `
      WITH user_signals AS (
        -- 1. Explicit Likes from Favorites / Liked Songs playlist (strong positive weight = 2.5)
        SELECT 
          af.energy, af.danceability, af.valence, af.acousticness, 
          af.instrumentalness, af.liveness, af.speechiness, af.tempo_norm,
          2.5 AS weight
        FROM playlist_tracks pt
        JOIN playlists p ON pt.playlist_id = p.playlist_id
        JOIN audio_features af ON pt.track_id::text = af.track_id::text
        WHERE p.user_id = $1 AND p.title IN ('Favorites', 'Liked Songs')

        UNION ALL

        -- 2. Listening History (weight scaled by rating, default 4/2.5 = 1.6)
        SELECT 
          af.energy, af.danceability, af.valence, af.acousticness, 
          af.instrumentalness, af.liveness, af.speechiness, af.tempo_norm,
          (COALESCE(lh.rating, 4)::float / 2.5) AS weight
        FROM (
          SELECT track_id, rating FROM listen_history WHERE user_id = $1 ORDER BY last_played DESC LIMIT 100
        ) lh
        JOIN audio_features af ON lh.track_id::text = af.track_id::text
      )
      SELECT 
        ROUND((SUM(energy * weight) / NULLIF(SUM(weight), 0))::numeric, 4) AS energy,
        ROUND((SUM(danceability * weight) / NULLIF(SUM(weight), 0))::numeric, 4) AS danceability,
        ROUND((SUM(valence * weight) / NULLIF(SUM(weight), 0))::numeric, 4) AS valence,
        ROUND((SUM(acousticness * weight) / NULLIF(SUM(weight), 0))::numeric, 4) AS acousticness,
        ROUND((SUM(instrumentalness * weight) / NULLIF(SUM(weight), 0))::numeric, 4) AS instrumentalness,
        ROUND((SUM(liveness * weight) / NULLIF(SUM(weight), 0))::numeric, 4) AS liveness,
        ROUND((SUM(speechiness * weight) / NULLIF(SUM(weight), 0))::numeric, 4) AS speechiness,
        ROUND((SUM(tempo_norm * weight) / NULLIF(SUM(weight), 0))::numeric, 4) AS tempo_norm,
        COUNT(*)::int AS signal_count
      FROM user_signals;
    `;

    const res = await pool.query(sql, [numUserId]);
    const row = res.rows[0];

    if (row && row.danceability !== null && row.signal_count > 0) {
      const energy = Number(row.energy) || 0.5;
      const danceability = Number(row.danceability) || 0.5;
      const valence = Number(row.valence) || 0.5;
      const tempo_norm = Number(row.tempo_norm) || 0.5;
      const vibe = Number(((energy + danceability) / 2).toFixed(4)) || 0.5;
      const acousticness = Number(row.acousticness) || 0.5;
      const instrumentalness = Number(row.instrumentalness) || 0.1;
      const moodHarmonics = 0.5;

      const vector = [danceability, energy, valence, tempo_norm, vibe, acousticness, instrumentalness, moodHarmonics];
      const vectorStr = toPgVector(vector);

      await pool.query(
        `UPDATE users SET taste_vector = $1::vector WHERE user_id = $2;`,
        [vectorStr, numUserId]
      );
      console.log(`[DB] Recalculated 8D taste vector for user ${numUserId} from ${row.signal_count} signal(s): ${vectorStr}`);
      return vector;
    }
  } catch (err) {
    console.warn(`[DB] Recalculate taste vector note for user ${userId}:`, err.message);
  }
  return null;
}

app.post('/api/users/:userId/recalculate-taste', async (req, res) => {
  const { userId } = req.params;
  try {
    const newVector = await recalculateTasteVector(userId);
    res.json({ success: true, userId: Number(userId), tasteVector: newVector });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:userId/likes', async (req, res) => {
  const { userId } = req.params;
  const { trackId, song } = req.body;
  if (trackId === undefined || trackId === null) {
    return res.status(400).json({ error: 'trackId is required' });
  }
  const strTrackId = String(trackId);

  try {
    // 1. Check if track exists in tracks table; if not and song metadata provided, auto-insert
    if (song) {
      try {
        const check = await pool.query('SELECT track_id FROM tracks WHERE track_id::text = $1;', [strTrackId]);
        if (check.rows.length === 0) {
          await pool.query(
            `INSERT INTO tracks (track_id, title, duration, bpm, genre_id, cover_image, preview_url)
             VALUES ($1, $2, $3, $4, 1, $5, $6)
             ON CONFLICT (track_id) DO UPDATE SET cover_image = EXCLUDED.cover_image, preview_url = EXCLUDED.preview_url;`,
            [
              strTrackId,
              song.title || `Track #${strTrackId}`,
              song.durationSeconds || 180,
              song.bpm || 120,
              song.coverImage || null,
              song.previewUrl || null,
            ]
          );

          if (song.artist && song.artist !== 'Unknown Artist') {
            let artRes = await pool.query('SELECT artist_id FROM artist WHERE name = $1;', [song.artist]);
            let artistId = artRes.rows[0]?.artist_id;
            if (!artistId) {
              const createdArt = await pool.query('INSERT INTO artist (name) VALUES ($1) RETURNING artist_id;', [song.artist]);
              artistId = createdArt.rows[0]?.artist_id;
            }
            if (artistId) {
              await pool.query(
                'INSERT INTO performs (artist_id, track_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;',
                [artistId, strTrackId, 'main']
              );
            }
          }

          const rawVec = song.vector
            ? (Array.isArray(song.vector) ? song.vector : [
                song.vector.danceability ?? 0.5,
                song.vector.energy ?? 0.5,
                song.vector.valence ?? 0.5,
                song.vector.beatsBpmNormalized ?? 0.5,
                song.vector.vibeChillToHype ?? 0.5,
                song.vector.acousticness ?? 0.5,
                song.vector.instrumentalness ?? 0.1,
                song.vector.moodHarmonics ?? 0.5,
              ])
            : [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.1, 0.5];

          await pool.query(
            `INSERT INTO audio_features (
               track_id, energy, danceability, valence, acousticness, instrumentalness, liveness, speechiness, tempo_norm, feature_vector
             ) VALUES ($1, $2, $3, $4, $5, $6, 0.5, 0.1, $7, $8::vector)
             ON CONFLICT (track_id) DO NOTHING;`,
            [
              strTrackId,
              rawVec[1],
              rawVec[0],
              rawVec[2],
              rawVec[5],
              rawVec[6],
              rawVec[3],
              toPgVector(rawVec),
            ]
          );
          console.log(`[DB] Auto-inserted track "${song.title}" (${strTrackId}) into tracks & audio_features for user like`);
        }
      } catch (insertErr) {
        console.warn('[DB Track Insert Warning on Like]:', insertErr.message);
      }
    }

    const existing = await pool.query(
      `SELECT pt.playlist_id
       FROM playlist_tracks pt
       JOIN playlists p ON p.playlist_id = pt.playlist_id
       WHERE p.user_id = $1
         AND p.title IN ('Favorites', 'Liked Songs')
         AND pt.track_id::text = $2
       LIMIT 1;`,
      [userId, strTrackId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `DELETE FROM playlist_tracks pt
         USING playlists p
         WHERE pt.playlist_id = p.playlist_id
           AND p.user_id = $1
           AND p.title IN ('Favorites', 'Liked Songs')
           AND pt.track_id::text = $2;`,
        [userId, strTrackId]
      );
      console.log(`[DB] User ${userId} unliked track "${strTrackId}"`);
      const updatedTaste = await recalculateTasteVector(userId);
      return res.json({ success: true, trackId: strTrackId, isLiked: false, newTasteVector: updatedTaste });
    }

    let plRes = await pool.query(
      `SELECT playlist_id
       FROM playlists
       WHERE user_id = $1 AND title IN ('Favorites', 'Liked Songs')
       ORDER BY CASE WHEN title = 'Favorites' THEN 0 ELSE 1 END, playlist_id ASC
       LIMIT 1;`,
      [userId]
    );
    let playlistId = plRes.rows[0]?.playlist_id;
    if (!playlistId) {
      const created = await pool.query(
        `INSERT INTO playlists (title, user_id, created_at)
         VALUES ('Favorites', $1, NOW()) RETURNING playlist_id;`,
        [userId]
      );
      playlistId = created.rows[0].playlist_id;
    }

    await pool.query(
      `INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
       VALUES ($1, $2, (SELECT COALESCE(MAX(position),0)+1 FROM playlist_tracks WHERE playlist_id = $1), NOW())
       ON CONFLICT (playlist_id, track_id) DO NOTHING;`,
      [playlistId, strTrackId]
    );
    console.log(`[DB] User ${userId} liked track "${strTrackId}" in playlist ${playlistId}`);

    const updatedTaste = await recalculateTasteVector(userId);
    res.json({ success: true, trackId: strTrackId, isLiked: true, newTasteVector: updatedTaste });
  } catch (err) {
    console.error('[DB Error in toggle like]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── 6. Listen History ──────────────────────────────────────────────────
app.post('/api/listen-history', async (req, res) => {
  const { userId, trackId, rating = 4 } = req.body;
  const strTrackId = String(trackId);

  try {
    const result = await pool.query(
      `INSERT INTO listen_history (user_id, track_id, last_played, rating)
       VALUES ($1, $2, NOW(), $3)
       RETURNING history_id, user_id, track_id, last_played, rating;`,
      [userId || 1, strTrackId, rating]
    );
    console.log(`[DB] Inserted listen session (user_id: ${userId || 1}, track_id: "${strTrackId}", rating: ${rating})`);

    // Dynamically recalculate taste vector from new listening session
    const updatedTaste = await recalculateTasteVector(userId || 1);
    res.json({ success: true, historyRecord: result.rows[0], newTasteVector: updatedTaste });
  } catch (err) {
    console.error('[DB Error in listen history]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId/listen-history', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT lh.history_id, lh.user_id, lh.track_id, lh.last_played, lh.rating,
              t.title, t.bpm, t.duration, COALESCE(STRING_AGG(a.name, ', '), 'Unknown Artist') AS artist, g.name AS genre,
              t.cover_image, t.preview_url
       FROM listen_history lh
       JOIN tracks t ON lh.track_id = t.track_id
       LEFT JOIN performs p ON t.track_id = p.track_id
       LEFT JOIN artist a ON p.artist_id = a.artist_id
       LEFT JOIN genre g ON t.genre_id = g.genre_id
       WHERE lh.user_id = $1
       GROUP BY lh.history_id, lh.user_id, lh.track_id, lh.last_played, lh.rating, t.title, t.bpm, t.duration, g.name, t.cover_image, t.preview_url
       ORDER BY lh.last_played DESC
       LIMIT 50;`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[DB Error in get listen history]:', err.message);
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
  console.log(`\n======================================================`);
  console.log(`🚀 VectorVibe PostgreSQL Bridge running on http://localhost:${PORT}`);
  try {
    const client = await pool.connect();
    const ver = await client.query('SELECT version();');
    console.log(` Connected to: ${ver.rows[0].version}`);
    const ext = await client.query("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';");
    if (ext.rows.length > 0) {
      console.log(` pgvector extension v${ext.rows[0].extversion} active on postgres!`);
    } else {
      console.warn(' Warning: vector extension not detected in this database.');
    }
    client.release();
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`\n❌ Error connecting to PostgreSQL at ${DATABASE_URL}:`, err.message);
    console.log(`======================================================\n`);
  }
});
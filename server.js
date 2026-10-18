// server.js - PostgreSQL + pgvector bridge with rate-limited iTunes enrichment & circuit breaker
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

app.use(cors());
app.use(express.json());

// Fallback high-resolution cover artwork mapped by core genre
const GENRE_COVER_FALLBACKS = {
  'Cyber Techno': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
  'Synthwave': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
  'Nu-Disco / Pop': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
  'Lo-Fi Chill': 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80',
  'Indie Folk': 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80',
  'Neo-Soul / R&B': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
  'Cinematic Ambient': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80',
  'Alt Rock': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&q=80',
};

// ── Media Enrichment Provider (iTunes by default; Deezer optional) ─────
const MEDIA_PROVIDER = (process.env.MEDIA_PROVIDER || 'itunes').toLowerCase();
let mediaCircuitBreakerUntil = 0; // Timestamp until which outbound media API calls are paused
const mediaCache = new Map(); // cacheKey -> { result, expiresAt }
const mediaSearchCache = new Map(); // cacheKey -> { data, expiresAt }

function toPgVector(arr) {
  if (typeof arr === 'string') return arr;
  return `[${arr.join(',')}]`;
}

function cleanTrackTitleAndArtist(title, artist) {
  let cleanArtist = String(artist || '')
    .replace(/^\[['"]?\vert{}['"]?\]$/g, '')
    .replace(/['"]+/g, '')
    .split(/[,;&\/]|(?:\s+feat\.?\s+)/i)[0]
    .replace(/^\[+\vert{}\]+$/g, '')
    .trim();

  if (cleanArtist === 'Unknown Artist' || cleanArtist === 'Various Artists') {
    cleanArtist = '';
  }

  let cleanTitle = String(title || '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/\s*-\s*.*(remaster|radio|live|single|deluxe|version|mono|stereo|bonus|mix).*$/i, '')
    .replace(/\s+feat\..*$/i, '')
    .replace(/['"“”]/g, '')
    .trim();

  return { cleanTitle: cleanTitle || String(title || '').trim(), cleanArtist };
}

// Delay helper to space out outbound requests to the media provider
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Metadata Providers ────────────────────────────────────────────────

function pickBestItunesResult(results, cleanTitle, cleanArtist) {
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const nt = norm(cleanTitle);
  const na = norm(cleanArtist);
  let best = null;
  let bestScore = -1;
  for (const item of results) {
    const rt = norm(item.trackName);
    const ra = norm(item.artistName);
    let score = 0;
    if (nt && (rt === nt || rt.includes(nt) || nt.includes(rt))) score += 2;
    if (!na || ra === na || ra.includes(na) || na.includes(ra)) score += 1;
    if (item.previewUrl) score += 1;
    if (item.artworkUrl100) score += 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  // Reject results that match neither the title nor the artist.
  if (!best || bestScore < 1) return null;
  return best;
}

async function fetchItunesMetadata(cleanTitle, cleanArtist) {
  const candidates = [];
  if (cleanTitle && cleanArtist) candidates.push(`${cleanTitle} ${cleanArtist}`);
  if (cleanTitle) candidates.push(cleanTitle);

  for (const term of candidates) {
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=8`
      );

      // Apple rate-limit (429) or IP block (403): trip a short circuit breaker
      if (res.status === 429 || res.status === 403) {
        console.warn(`[Media API Throttled] iTunes status ${res.status}. Pausing external calls for 120s.`);
        mediaCircuitBreakerUntil = Date.now() + 120 * 1000;
        return null;
      }
      if (!res.ok) continue;

      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const match = pickBestItunesResult(data.results, cleanTitle, cleanArtist);
        if (match) {
          return {
            coverImage: match.artworkUrl100
              ? match.artworkUrl100.replace(/\d+x\d+bb/g, '600x600bb')
              : '',
            previewUrl: match.previewUrl || '',
            artistName: match.artistName || '',
            album: match.collectionName || '',
          };
        }
      }
    } catch {
      // Network glitch or timeout: try the next candidate term
    }
  }
  return null;
}

async function fetchDeezerMetadata(cleanTitle, cleanArtist) {
  const candidates = [];
  if (cleanTitle && cleanArtist) candidates.push(`${cleanTitle} ${cleanArtist}`);
  if (cleanTitle) candidates.push(cleanTitle);

  for (const term of candidates) {
    try {
      const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(term)}&limit=1`);
      if (res.status === 429 || res.status === 403) {
        mediaCircuitBreakerUntil = Date.now() + 120 * 1000;
        return null;
      }
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.error) continue;
      const item = data && data.data && data.data[0];
      if (item) {
        return {
          coverImage:
            item.album?.cover_xl || item.album?.cover_big || item.album?.cover_medium || '',
          previewUrl: item.preview || '',
          artistName: item.artist?.name || '',
          album: item.album?.title || '',
        };
      }
    } catch {
      // ignore and try next candidate
    }
  }
  return null;
}

// Helper: Constrain a number to the [0, 1] audio-feature range
function clamp01(value, fallback = 0.5) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

// Helper: Build a valid 8D feature vector from arbitrary song metadata
function normalizeSongVector(song) {
  const provided = song?.vectorArray;
  if (Array.isArray(provided) && provided.length === 8 && provided.every((n) => Number.isFinite(Number(n)))) {
    return provided.map((n) => clamp01(n));
  }
  const bpm = Number(song?.bpm) || 120;
  const tempoNorm = clamp01((bpm - 60) / 120, 0.5);
  const f = song?.audioFeatures || {};
  return [
    clamp01(f.danceability),
    clamp01(f.energy),
    clamp01(f.valence),
    tempoNorm,
    clamp01(f.energy),
    clamp01(f.acousticness),
    clamp01(f.instrumentalness),
    0.5,
  ];
}

// Helper: Upsert any song (e.g. from search) into tracks/artist/performs/audio_features
// so that it can be liked and appear alongside catalog tracks in playlist views.
async function ensureTrackRecord(song) {
  if (!song || song.id === undefined || song.id === null) return null;

  const trackId = String(song.id).slice(0, 255);
  const title = (song.title || `Track ${trackId}`).slice(0, 150);
  const duration = Math.max(1, Math.round(Number(song.durationSeconds) || 180));
  const bpm = Math.max(1, Math.round(Number(song.bpm) || 120));
  const coverImage = song.coverImage || null;
  const previewUrl = song.previewUrl || null;
  const artistName = (song.artist || 'Unknown Artist').slice(0, 255);
  const vector = normalizeSongVector(song);
  const f = song.audioFeatures || {};

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let genreId = 4; // Nu-Disco / Pop fallback
    if (song.genre) {
      const g = await client.query(
        'INSERT INTO genre (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING genre_id;',
        [String(song.genre).slice(0, 50)]
      );
      genreId = g.rows[0].genre_id;
    }

    await client.query(
      `INSERT INTO tracks (track_id, title, duration, bpm, genre_id, cover_image, preview_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (track_id) DO UPDATE SET
         title = EXCLUDED.title,
         duration = EXCLUDED.duration,
         bpm = EXCLUDED.bpm,
         genre_id = EXCLUDED.genre_id,
         cover_image = COALESCE(EXCLUDED.cover_image, tracks.cover_image),
         preview_url = COALESCE(EXCLUDED.preview_url, tracks.preview_url);`,
      [trackId, title, duration, bpm, genreId, coverImage, previewUrl]
    );

    const findArtist = await client.query('SELECT artist_id FROM artist WHERE name = $1;', [artistName]);
    let artistId;
    if (findArtist.rows.length > 0) {
      artistId = findArtist.rows[0].artist_id;
    } else {
      artistId = (await client.query('INSERT INTO artist (name) VALUES ($1) RETURNING artist_id;', [artistName])).rows[0].artist_id;
    }

    await client.query(
      'INSERT INTO performs (artist_id, track_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;',
      [artistId, trackId, 'main']
    );

    await client.query(
      `INSERT INTO audio_features (
        track_id, energy, danceability, valence, acousticness, instrumentalness, liveness, speechiness, tempo_norm, feature_vector
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector)
      ON CONFLICT (track_id) DO NOTHING;`,
      [
        trackId,
        clamp01(f.energy),
        clamp01(f.danceability),
        clamp01(f.valence),
        clamp01(f.acousticness),
        clamp01(f.instrumentalness),
        0.5,
        0.1,
        vector[3],
        toPgVector(vector),
      ]
    );

    await client.query('COMMIT');
    return trackId;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB Error in ensureTrackRecord]:', err.message);
    return null;
  } finally {
    client.release();
  }
}

// Helper: Run an async mapper over items with a concurrency ceiling
async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

// ── Root Diagnostic Route ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('🚀 VectorVibe Express Bridge API is active!');
});

// ── 1. Health & Vector Verification ─────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const extCheck = await pool.query("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';");
    const tablesCheck = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
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

// ── Users & Taste Vector ─────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, username, email, taste_vector::text, created_at FROM users ORDER BY user_id ASC;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, email = `${(req.body.username || 'user').toLowerCase()}@vectorvibe.local`, tasteVector = [0.75, 0.65, 0.6, 0.5, 0.6, 0.25, 0.5, 0.45] } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  try {
    const vectorStr = toPgVector(tasteVector);
    const result = await pool.query(
      `INSERT INTO users (username, email, created_at, taste_vector)
       VALUES ($1, $2, NOW(), $3::vector)
       RETURNING user_id, username, email, taste_vector::text, created_at;`,
      [username, email, vectorStr]
    );

    const newUser = result.rows[0];
    await pool.query(`INSERT INTO playlists (title, user_id, created_at) VALUES ('Liked Songs', $1, NOW());`, [newUser.user_id]);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:userId/taste-vector', async (req, res) => {
  const { userId } = req.params;
  const { tasteVector } = req.body;
  if (!tasteVector || !Array.isArray(tasteVector)) return res.status(400).json({ error: 'tasteVector must be an array of numbers' });

  try {
    const vectorStr = toPgVector(tasteVector);
    const result = await pool.query(`UPDATE users SET taste_vector = $1::vector WHERE user_id = $2 RETURNING user_id, username, taste_vector::text;`, [vectorStr, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, updatedUser: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Acoustic Recommendations & Tracks ──────────────────────────────
app.post('/api/recommendations', async (req, res) => {
  const { vector, limit = 12, genre = null } = req.body;
  if (!vector || !Array.isArray(vector)) return res.status(400).json({ error: 'vector must be an array of numbers' });

  const vectorStr = toPgVector(vector);
  const startTime = Date.now();

  try {
    let query = `
      SELECT 
        t.track_id, t.title, t.duration, t.bpm,
        COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
        COALESCE(STRING_AGG(a.name, ', '), 'Unknown Artist') AS artist,
        t.cover_image, t.preview_url,
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

    // Enrich recommendations with iTunes metadata if artist or cover image is missing.
    // Concurrency is capped to avoid iTunes 429 rate limiting on large limits (e.g. 50).
    const enrichedRecommendations = await mapWithConcurrency(result.rows, 4, async (row) => {
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
    });

    const executionTimeMs = Date.now() - startTime;

    res.json({
      count: enrichedRecommendations.length,
      executionTimeMs,
      recommendations: enrichedRecommendations,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tracks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    const vectorParam = req.query.vector;

    let vectorStr = null;
    if (vectorParam) {
      try {
        const parsed = typeof vectorParam === 'string' ? JSON.parse(vectorParam) : vectorParam;
        if (Array.isArray(parsed) && parsed.length === 8) vectorStr = toPgVector(parsed);
      } catch {
        if (typeof vectorParam === 'string' && vectorParam.startsWith('[')) vectorStr = vectorParam;
      }
    }

    let query;
    let params;

    if (vectorStr) {
      params = [vectorStr, limit];
      query = `
        SELECT t.track_id, t.title, t.duration, t.bpm,
               COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
               COALESCE(STRING_AGG(a.name, ', '), 'Unknown Artist') AS artist,
               t.cover_image, t.preview_url,
               af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness, af.liveness, af.speechiness, af.tempo_norm, af.feature_vector::text,
               (af.feature_vector <=> $1::vector) AS distance,
               ROUND((1 - (af.feature_vector <=> $1::vector))::numeric, 4) AS similarity
        FROM tracks t
        JOIN audio_features af ON t.track_id = af.track_id
        LEFT JOIN performs p ON t.track_id = p.track_id
        LEFT JOIN artist a ON p.artist_id = a.artist_id
        LEFT JOIN genre g ON t.genre_id = g.genre_id
        GROUP BY t.track_id, t.title, t.duration, t.bpm, g.name, t.cover_image, t.preview_url, af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness, af.liveness, af.speechiness, af.tempo_norm, af.feature_vector
        ORDER BY af.feature_vector <=> $1::vector ASC
        LIMIT $2;
      `;
    } else if (userId) {
      params = [userId, limit];
      query = `
        SELECT t.track_id, t.title, t.duration, t.bpm,
               COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
               COALESCE(STRING_AGG(a.name, ', '), 'Unknown Artist') AS artist,
               t.cover_image, t.preview_url,
               af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness, af.liveness, af.speechiness, af.tempo_norm, af.feature_vector::text,
               (af.feature_vector <=> u.taste_vector) AS distance,
               ROUND((1 - (af.feature_vector <=> u.taste_vector))::numeric, 4) AS similarity
        FROM tracks t
        JOIN audio_features af ON t.track_id = af.track_id
        CROSS JOIN (SELECT taste_vector FROM users WHERE user_id = $1 LIMIT 1) u
        LEFT JOIN performs p ON t.track_id = p.track_id
        LEFT JOIN artist a ON p.artist_id = a.artist_id
        LEFT JOIN genre g ON t.genre_id = g.genre_id
        GROUP BY t.track_id, t.title, t.duration, t.bpm, g.name, t.cover_image, t.preview_url, af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness, af.liveness, af.speechiness, af.tempo_norm, af.feature_vector, u.taste_vector
        ORDER BY af.feature_vector <=> u.taste_vector ASC
        LIMIT $2;
      `;
    } else {
      params = [limit];
      query = `
        SELECT t.track_id, t.title, t.duration, t.bpm,
               COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
               COALESCE(STRING_AGG(a.name, ', '), 'Unknown Artist') AS artist,
               t.cover_image, t.preview_url,
               af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness, af.liveness, af.speechiness, af.tempo_norm, af.feature_vector::text
        FROM tracks t
        LEFT JOIN audio_features af ON t.track_id = af.track_id
        LEFT JOIN performs p ON t.track_id = p.track_id
        LEFT JOIN artist a ON p.artist_id = a.artist_id
        LEFT JOIN genre g ON t.genre_id = g.genre_id
        GROUP BY t.track_id, t.title, t.duration, t.bpm, g.name, t.cover_image, t.preview_url, af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness, af.liveness, af.speechiness, af.tempo_norm, af.feature_vector
        ORDER BY t.track_id ASC
        LIMIT $1;
      `;
    }

    const { rows } = await pool.query(query, params);
    const enriched = await enrichTracksWithiTunes(rows, 6);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lazily enrich a single track with cover art / preview / artist on demand.
app.post('/api/tracks/:trackId/media/enrich', async (req, res) => {
  const { trackId } = req.params;
  try {
    const result = await pool.query(
      `SELECT t.track_id::text AS track_id, t.title, t.cover_image, t.preview_url,
              COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
              COALESCE(STRING_AGG(a.name, ', '), '') AS artist
       FROM tracks t
       LEFT JOIN performs p ON p.track_id = t.track_id
       LEFT JOIN artist a ON a.artist_id = p.artist_id
       LEFT JOIN genre g ON g.genre_id = t.genre_id
       WHERE t.track_id::text = $1
       GROUP BY t.track_id, t.title, t.cover_image, t.preview_url, g.name
       LIMIT 1;`,
      [String(trackId)]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Track not found' });

    // Already fully enriched: return straight from the database.
    if (row.cover_image && row.preview_url) {
      return res.json({
        coverImage: row.cover_image,
        previewUrl: row.preview_url,
        artistName: row.artist || '',
      });
    }

    const data = await fetchMediaMetadata(row.title, row.artist);
    const coverImage =
      row.cover_image ||
      data?.coverImage ||
      GENRE_COVER_FALLBACKS[row.genre] ||
      GENRE_COVER_FALLBACKS['Nu-Disco / Pop'];
    const previewUrl = row.preview_url || data?.previewUrl || '';

    await persistTrackMedia(row, coverImage, previewUrl);
    if (data?.artistName) await linkArtistToTrack(row.track_id, data.artistName);

    res.json({
      coverImage,
      previewUrl,
      artistName:
        (!row.artist || row.artist === 'Unknown Artist') && data?.artistName
          ? data.artistName
          : row.artist || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Search & Playlists ─────────────────────────────────────────────────
app.get('/api/tracks/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
  if (!q) return res.json([]);

  try {
    const params = [`%${q}%`, limit];
    const query = `
      SELECT t.track_id::text AS track_id, t.title, t.duration, t.bpm,
             COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
             COALESCE(STRING_AGG(DISTINCT a.name, ', '), 'Unknown Artist') AS artist,
             t.cover_image, t.preview_url,
             af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness
      FROM tracks t
      LEFT JOIN audio_features af ON af.track_id = t.track_id
      LEFT JOIN performs p ON p.track_id = t.track_id
      LEFT JOIN artist a ON a.artist_id = p.artist_id
      LEFT JOIN genre g ON g.genre_id = t.genre_id
      WHERE (t.title ILIKE $1 OR a.name ILIKE $1)
      GROUP BY t.track_id, t.title, t.duration, t.bpm, g.name, t.cover_image, t.preview_url, af.energy, af.danceability, af.valence, af.acousticness, af.instrumentalness
      ORDER BY t.title ASC LIMIT $2;
    `;
    const { rows } = await pool.query(query, params);
    const enriched = await enrichTracksWithiTunes(rows, 6);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId/playlists', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.playlist_id, p.title, p.created_at, COUNT(pt.track_id)::int AS track_count
       FROM playlists p LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
       WHERE p.user_id = $1 GROUP BY p.playlist_id, p.title, p.created_at ORDER BY p.playlist_id ASC;`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId/likes', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT pt.track_id::text AS track_id FROM playlists p
       JOIN playlist_tracks pt ON pt.playlist_id = p.playlist_id
       WHERE p.user_id = $1 AND p.title IN ('Favorites', 'Liked Songs') ORDER BY track_id;`,
      [req.params.userId]
    );
    res.json(result.rows.map((row) => row.track_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/playlists/:playlistId/tracks', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.track_id::text AS track_id, t.title, t.duration, t.bpm,
              COALESCE(g.name, 'Nu-Disco / Pop') AS genre,
              COALESCE(STRING_AGG(DISTINCT a.name, ', '), 'Unknown Artist') AS artist,
              t.cover_image, t.preview_url, MIN(pt.position) AS position
       FROM playlist_tracks pt
       JOIN tracks t ON t.track_id = pt.track_id
       LEFT JOIN performs p ON p.track_id = t.track_id
       LEFT JOIN artist a ON a.artist_id = p.artist_id
       LEFT JOIN genre g ON g.genre_id = t.genre_id
       WHERE pt.playlist_id = $1
       GROUP BY t.track_id, t.title, t.duration, t.bpm, g.name, t.cover_image, t.preview_url
       ORDER BY MIN(pt.position) ASC;`,
      [req.params.playlistId]
    );
    const enriched = await enrichTracksWithiTunes(result.rows, Math.min(result.rows.length, 10));
    res.json(enriched);
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
    const existing = await pool.query(
      `SELECT pt.playlist_id
       FROM playlist_tracks pt
       JOIN playlists p ON p.playlist_id = pt.playlist_id
       WHERE p.user_id = $1
         AND p.title IN ('Favorites', 'Liked Songs')
         AND pt.track_id = $2
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
           AND pt.track_id = $2;`,
        [userId, strTrackId]
      );
      console.log(`[DB] User ${userId} unliked track "${strTrackId}"`);
      return res.json({ success: true, trackId: strTrackId, isLiked: false });
    }

    // Persist non-catalog songs (e.g. from search) so they resolve in playlist views
    if (song && typeof song === 'object') {
      await ensureTrackRecord({ ...song, id: song.id ?? strTrackId });
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
      const created = await pool.query(`INSERT INTO playlists (title, user_id, created_at) VALUES ('Liked Songs', $1, NOW()) RETURNING playlist_id;`, [userId]);
      playlistId = created.rows[0].playlist_id;
    }

    const existing = await pool.query(`SELECT * FROM playlist_tracks WHERE playlist_id = $1 AND track_id::text = $2;`, [playlistId, String(trackId)]);
    if (existing.rows.length > 0) {
      await pool.query(`DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id::text = $2;`, [playlistId, String(trackId)]);
      return res.json({ success: true, trackId: String(trackId), isLiked: false });
    } else {
      await pool.query(
        `INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
         VALUES ($1, $2, (SELECT COALESCE(MAX(position),0)+1 FROM playlist_tracks WHERE playlist_id = $1), NOW());`,
        [playlistId, String(trackId)]
      );
      return res.json({ success: true, trackId: String(trackId), isLiked: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 VectorVibe PostgreSQL Bridge running on http://localhost:${PORT}`);
  try {
    const client = await pool.connect();
    console.log(` Connected to PostgreSQL container successfully!`);
    client.release();
  } catch (err) {
    console.error(` Error connecting to PostgreSQL:`, err.message);
  }
  console.log(`======================================================\n`);
});
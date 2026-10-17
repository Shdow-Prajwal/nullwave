import fs from 'fs';
import csv from 'csv-parser';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres', // Match container params[cite: 2]
  password: process.env.DB_PASSWORD || 'Dbms@2025', // Match container params[cite: 2]
  port: process.env.DB_PORT || 5432,
  connectionTimeoutMillis: 5000, // Timeout after 5s if DB is unreachable
});

async function seedFromCSV() {
  const csvPath = 'tracks_features.csv'; 

  // 1. Verify File Exists
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}. Check file location in C:\\Users\\Prajwal\\Desktop\\nullwave\\`);
    process.exit(1);
  }

  // 2. Test DB Connection First
  console.log('🔌 Testing PostgreSQL connection...');
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  console.log(`🚀 Stream reading ${csvPath}...`);
  let count = 0;

  const stream = fs.createReadStream(csvPath).pipe(csv());

  for await (const row of stream) {
    const trackId = row.id || row.track_id;
    const title = row.name || row.title || 'Unknown Track';
    const bpm = Math.round(parseFloat(row.tempo) || 120);
    const duration = Math.round((parseFloat(row.duration_ms) || 180000) / 1000);

    const energy = parseFloat(row.energy) || 0;
    const danceability = parseFloat(row.danceability) || 0;
    const valence = parseFloat(row.valence) || 0;
    const acousticness = parseFloat(row.acousticness) || 0;
    const instrumentalness = parseFloat(row.instrumentalness) || 0;
    const liveness = parseFloat(row.liveness) || 0;
    const speechiness = parseFloat(row.speechiness) || 0;
    const tempoNorm = Math.min(bpm / 200, 1.0);

    const vectorStr = `[${energy},${danceability},${valence},${acousticness},${instrumentalness},${liveness},${speechiness},${tempoNorm}]`;

    try {
      await pool.query(
        `INSERT INTO tracks (track_id, title, duration, bpm, genre_id)
         VALUES ($1, $2, $3, $4, 1)
         ON CONFLICT (track_id) DO NOTHING;`,
        [trackId, title, duration, bpm]
      );

      await pool.query(
        `INSERT INTO audio_features (track_id, energy, danceability, valence, acousticness, instrumentalness, liveness, speechiness, tempo_norm, feature_vector)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector)
         ON CONFLICT (track_id) DO NOTHING;`,
        [trackId, energy, danceability, valence, acousticness, instrumentalness, liveness, speechiness, tempoNorm, vectorStr]
      );

      count++;
      if (count % 500 === 0) console.log(`Seeded ${count} tracks...`);
      if (count >= 50000) break;
    } catch (err) {
      console.error(`Row insert error on track ${trackId}:`, err.message);
    }
  }

  console.log(`✅ Complete! Seeded ${count} tracks.`);
  await pool.end();
}

seedFromCSV();
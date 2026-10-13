/**
 * PostgreSQL + pgvector Database Architecture & Schema Specification
 *
 * Implements the normalized relational schema with:
 * - Core entities: users, genre, artist, moods, tracks, playlists
 * - 1:1 audio_features table with 8D vector embedding (feature_vector vector(8))
 * - Junction tables: performs, track_moods, playlist_tracks, listen_history
 * - pgvector indexing: IVFFLAT and HNSW
 */

export const PGVECTOR_SCHEMA_SQL = `-- ============================================================================
-- MUSIC RECOMMENDER DATABASE SCHEMA (8D VECTOR EXPANSION)
-- Requires: PostgreSQL 15+ and pgvector >= 0.5.0
-- Vector Dimension: 8 (energy, danceability, valence, acousticness, instrumentalness, liveness, speechiness, tempo_norm)
-- ============================================================================

-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Strong Entities
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP,
    taste_vector VECTOR(8) -- 8D profile vector
);

CREATE TABLE IF NOT EXISTS genre (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS artist (
    artist_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bio TEXT
);

CREATE TABLE IF NOT EXISTS moods (
    mood_id SERIAL PRIMARY KEY,
    label VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS tracks (
    track_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    duration INT NOT NULL, -- duration in seconds
    bpm INT,
    genre_id INT REFERENCES genre(genre_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS playlists (
    playlist_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP
);

-- 3. 1:1 Audio Features Table (8D Vector Representation)
CREATE TABLE IF NOT EXISTS audio_features (
    track_id INT PRIMARY KEY REFERENCES tracks(track_id) ON DELETE CASCADE,
    energy FLOAT CHECK (energy BETWEEN 0.0 AND 1.0),
    danceability FLOAT CHECK (danceability BETWEEN 0.0 AND 1.0),
    valence FLOAT CHECK (valence BETWEEN 0.0 AND 1.0),
    acousticness FLOAT CHECK (acousticness BETWEEN 0.0 AND 1.0),
    instrumentalness FLOAT CHECK (instrumentalness BETWEEN 0.0 AND 1.0),
    liveness FLOAT CHECK (liveness BETWEEN 0.0 AND 1.0),
    speechiness FLOAT CHECK (speechiness BETWEEN 0.0 AND 1.0),
    tempo_norm FLOAT CHECK (tempo_norm BETWEEN 0.0 AND 1.0),
    feature_vector VECTOR(8) -- 8D track feature vector
);

-- 4. Associative / Junction Tables (M:N Relationships)
CREATE TABLE IF NOT EXISTS performs (
    artist_id INT REFERENCES artist(artist_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    role VARCHAR(50), -- e.g., 'main', 'featured'
    PRIMARY KEY (artist_id, track_id)
);

CREATE TABLE IF NOT EXISTS track_moods (
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    mood_id INT REFERENCES moods(mood_id) ON DELETE CASCADE,
    PRIMARY KEY (track_id, mood_id)
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id INT REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    position INT NOT NULL, -- guarantees sequence ordering inside a playlist
    added_at TIMESTAMP,
    PRIMARY KEY (playlist_id, track_id)
);

CREATE TABLE IF NOT EXISTS listen_history (
    history_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    last_played TIMESTAMP,
    rating INT CHECK (rating BETWEEN 1 AND 5)
);

-- 5. Vector Search Indexes
-- Fast Approximate Nearest Neighbor (ANN) index using IVFFlat
CREATE INDEX IF NOT EXISTS idx_audio_feature_vec_ivfflat 
    ON audio_features USING ivfflat (feature_vector vector_cosine_ops) 
    WITH (lists = 100);

-- Graph-based HNSW Index alternative for sub-millisecond production latency
CREATE INDEX IF NOT EXISTS idx_audio_feature_vec_hnsw 
    ON audio_features USING hnsw (feature_vector vector_cosine_ops) 
    WITH (m = 16, ef_construction = 64);

-- Standard relational indexes for fast JOINs and lookups
CREATE INDEX IF NOT EXISTS idx_tracks_genre_id ON tracks (genre_id);
CREATE INDEX IF NOT EXISTS idx_tracks_bpm ON tracks (bpm);
CREATE INDEX IF NOT EXISTS idx_history_user_track ON listen_history (user_id, track_id);
CREATE INDEX IF NOT EXISTS idx_performs_track ON performs (track_id);

-- ============================================================================
-- Production KNN Vector Search Queries
-- ============================================================================

-- QUERY 1: KNN Vector Search with Relational Multi-Table JOIN
-- Finds top closest tracks to a query vector ($1) with artist, genre, and metadata:
/*
SELECT 
    t.track_id,
    t.title,
    COALESCE(STRING_AGG(a.name, ', '), 'Unknown Artist') AS artist,
    g.name AS genre,
    t.bpm,
    t.duration,
    af.feature_vector,
    1 - (af.feature_vector <=> $1::vector) AS cosine_similarity,
    (af.feature_vector <=> $1::vector) AS cosine_distance
FROM tracks t
JOIN audio_features af ON t.track_id = af.track_id
LEFT JOIN genre g ON t.genre_id = g.genre_id
LEFT JOIN performs p ON t.track_id = p.track_id
LEFT JOIN artist a ON p.artist_id = a.artist_id
GROUP BY t.track_id, t.title, g.name, t.bpm, t.duration, af.feature_vector
ORDER BY af.feature_vector <=> $1::vector
LIMIT $2;
*/

-- QUERY 2: Personalized Recommendation via User's 8D Taste Profile
/*
SELECT 
    t.track_id,
    t.title,
    COALESCE(STRING_AGG(a.name, ', '), 'Unknown Artist') AS artist,
    g.name AS genre,
    1 - (af.feature_vector <=> u.taste_vector) AS match_score
FROM tracks t
JOIN audio_features af ON t.track_id = af.track_id
LEFT JOIN genre g ON t.genre_id = g.genre_id
LEFT JOIN performs p ON t.track_id = p.track_id
LEFT JOIN artist a ON p.artist_id = a.artist_id
CROSS JOIN users u
WHERE u.user_id = $1
  AND t.track_id NOT IN (
      SELECT track_id FROM listen_history 
      WHERE user_id = $1 AND last_played > NOW() - INTERVAL '14 days'
  )
GROUP BY t.track_id, t.title, g.name, af.feature_vector, u.taste_vector
ORDER BY af.feature_vector <=> u.taste_vector
LIMIT 10;
*/

-- QUERY 3: Trigger/Procedure to recalculate user taste vector based on ratings & history
CREATE OR REPLACE FUNCTION recalculate_user_taste_vector(p_user_id INT)
RETURNS vector(8) AS $$
DECLARE
    new_taste vector(8);
BEGIN
    WITH rated_history AS (
        SELECT 
            af.feature_vector,
            COALESCE(lh.rating, 3) / 5.0 AS weight
        FROM listen_history lh
        JOIN audio_features af ON lh.track_id = af.track_id
        WHERE lh.user_id = p_user_id
        ORDER BY lh.last_played DESC
        LIMIT 50
    )
    SELECT AVG(feature_vector) INTO new_taste
    FROM rated_history;

    IF new_taste IS NOT NULL THEN
        UPDATE users 
        SET taste_vector = new_taste 
        WHERE user_id = p_user_id;
    END IF;

    RETURN new_taste;
END;
$$ LANGUAGE plpgsql;

-- QUERY 4: Production Trigger - Recalculate users.taste_vector when tracks are added/removed from playlists
CREATE OR REPLACE FUNCTION trg_fn_update_user_taste_from_playlist()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INT;
    v_new_taste VECTOR(8);
BEGIN
    -- Determine user_id of the modified playlist
    SELECT user_id INTO v_user_id
    FROM playlists
    WHERE playlist_id = COALESCE(NEW.playlist_id, OLD.playlist_id);

    -- Calculate the 8D centroid (mean vector) across all tracks in the user's playlists
    SELECT AVG(af.feature_vector) INTO v_new_taste
    FROM playlist_tracks pt
    JOIN playlists p ON pt.playlist_id = p.playlist_id
    JOIN audio_features af ON pt.track_id = af.track_id
    WHERE p.user_id = v_user_id;

    -- Atomically update users.taste_vector in PostgreSQL
    IF v_new_taste IS NOT NULL THEN
        UPDATE users
        SET taste_vector = v_new_taste
        WHERE user_id = v_user_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_playlist_tracks_taste_update
AFTER INSERT OR DELETE ON playlist_tracks
FOR EACH ROW
EXECUTE FUNCTION trg_fn_update_user_taste_from_playlist();
`;


-- ============================================================================
-- VectorVibe Local PostgreSQL & pgvector Bootstrap Script
-- Automatically mounts into /docker-entrypoint-initdb.d/init.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- DDL: All 11 Tables
CREATE TABLE IF NOT EXISTS genre (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS artist (
    artist_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bio TEXT
);

CREATE TABLE IF NOT EXISTS moods (
    mood_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    taste_vector VECTOR(8)
);

CREATE TABLE IF NOT EXISTS tracks (
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

CREATE TABLE IF NOT EXISTS audio_features (
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

CREATE TABLE IF NOT EXISTS performs (
    artist_id INT REFERENCES artist(artist_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Main',
    PRIMARY KEY (artist_id, track_id)
);

CREATE TABLE IF NOT EXISTS track_moods (
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    mood_id INT REFERENCES moods(mood_id) ON DELETE CASCADE,
    PRIMARY KEY (track_id, mood_id)
);

CREATE TABLE IF NOT EXISTS playlists (
    playlist_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_system BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id INT REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    position INT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, track_id)
);

CREATE TABLE IF NOT EXISTS listen_history (
    history_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    last_played TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rating INT CHECK (rating BETWEEN 1 AND 5)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_audio_features_hnsw ON audio_features 
USING hnsw (feature_vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_users_taste_vector ON users 
USING hnsw (taste_vector vector_cosine_ops);

-- Initial Users Seed
INSERT INTO users (username, email, taste_vector) VALUES
  ('Alex Rivera', 'alex@vectorvibe.local', '[0.82,0.78,0.65,0.48,0.72,0.10,0.75,0.45]'::vector(8)),
  ('Elena Rostova', 'elena@vectorvibe.local', '[0.90,0.85,0.70,0.52,0.88,0.05,0.80,0.50]'::vector(8)),
  ('Marcus Chen', 'marcus@vectorvibe.local', '[0.40,0.35,0.50,0.32,0.20,0.85,0.60,0.75]'::vector(8))
ON CONFLICT DO NOTHING;

-- Initial System Playlist
INSERT INTO playlists (playlist_id, title, user_id, is_system) VALUES
  (1, 'Liked Songs', 1, TRUE)
ON CONFLICT DO NOTHING;

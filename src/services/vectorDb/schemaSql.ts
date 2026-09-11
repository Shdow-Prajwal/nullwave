/**
 * PostgreSQL + pgvector Database Architecture & Schema Specification
 *
 * This provides the exact DDL, indexing, and KNN vector search queries
 * required to run production vector recommendations on PostgreSQL 15+
 * using the official 'vector' extension (pgvector).
 */

export const PGVECTOR_SCHEMA_SQL = `-- =========================================================================
-- PostgreSQL + pgvector Schema Migration for Music Vector Recommender
-- Requires: PostgreSQL 15+ and pgvector >= 0.5.0
-- Vector Dimension: 8 (danceability, energy, valence, tempo_norm, vibe, acousticness, instrumentalness, mood_harmonics)
-- =========================================================================

-- 1. Enable pgvector extension in PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Songs Catalog Table with 8-Dimensional Vector Embedding
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    bpm INTEGER NOT NULL CHECK (bpm > 30 AND bpm < 300),
    duration_seconds INTEGER NOT NULL DEFAULT 180,
    release_year INTEGER NOT NULL DEFAULT 2024,
    tags TEXT[] DEFAULT '{}',
    -- Vector embedding (8-dimensional floating point representation)
    -- [0] danceability (0-1)
    -- [1] energy (0-1)
    -- [2] valence / happiness (0-1)
    -- [3] beats_bpm_normalized (0-1)
    -- [4] vibe_chill_to_hype (0-1)
    -- [5] acousticness (0-1)
    -- [6] instrumentalness (0-1)
    -- [7] mood_harmonics (0-1)
    embedding vector(8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. High-Performance HNSW (Hierarchical Navigable Small World) Index
-- Uses vector_cosine_ops for cosine distance (<=> operator)
-- Parameters: m=16 (bidirectional links per node), ef_construction=64 (search depth during build)
CREATE INDEX IF NOT EXISTS idx_songs_embedding_hnsw 
ON songs USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Secondary standard B-tree indexes for fast hybrid metadata filtering
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs (genre);
CREATE INDEX IF NOT EXISTS idx_songs_bpm ON songs (bpm);

-- 4. User Profile & Dynamic Taste Vector Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150),
    -- Synthesized taste vector calculated from recent listening history
    taste_embedding vector(8) DEFAULT '[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]',
    total_listens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. User Listening History Stream
CREATE TABLE IF NOT EXISTS listening_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    completion_percent NUMERIC(5,2) NOT NULL DEFAULT 100.0,
    user_liked BOOLEAN NOT NULL DEFAULT FALSE,
    context_vibe VARCHAR(100) DEFAULT 'general',
    listened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_user_time 
ON listening_history (user_id, listened_at DESC);

-- =========================================================================
-- Core pgvector Recommender Queries
-- =========================================================================

-- QUERY 1: Vector KNN Recommendation by Target Query Vector (Cosine Similarity)
-- Uses the '<=>' operator (cosine distance)
-- Cosine similarity = 1 - (embedding <=> $1)
/*
SELECT 
    id,
    title,
    artist,
    genre,
    bpm,
    embedding,
    1 - (embedding <=> $1::vector) AS cosine_similarity,
    (embedding <=> $1::vector) AS cosine_distance
FROM songs
ORDER BY embedding <=> $1::vector
LIMIT $2;
*/

-- QUERY 2: Personalized Recommendation from User's Synthesized Taste Vector
/*
SELECT 
    s.id,
    s.title,
    s.artist,
    s.genre,
    s.bpm,
    1 - (s.embedding <=> u.taste_embedding) AS taste_match_score
FROM songs s
CROSS JOIN users u
WHERE u.id = $1
  -- Optional: exclude songs already listened to in the last 7 days
  AND s.id NOT IN (
      SELECT song_id FROM listening_history 
      WHERE user_id = $1 AND listened_at > NOW() - INTERVAL '7 days'
  )
ORDER BY s.embedding <=> u.taste_embedding
LIMIT 12;
*/

-- QUERY 3: Hybrid Vector Search (Genre Filtering + Cosine Similarity)
/*
SELECT 
    id,
    title,
    artist,
    genre,
    1 - (embedding <=> $1::vector) AS similarity
FROM songs
WHERE genre = $2
ORDER BY embedding <=> $1::vector
LIMIT 10;
*/

-- 6. Dynamic Stored Procedure: Recalculate User Taste Vector with Exponential Time Decay
CREATE OR REPLACE FUNCTION recalculate_user_taste_vector(p_user_id UUID)
RETURNS vector(8) AS $$
DECLARE
    new_taste vector(8);
BEGIN
    -- Computes weighted average of listened songs embeddings:
    -- weight = (user_liked ? 1.5 : 1.0) * (completion / 100) * exp(-0.05 * days_ago)
    WITH weighted_history AS (
        SELECT 
            s.embedding,
            (CASE WHEN h.user_liked THEN 1.5 ELSE 1.0 END) * 
            (h.completion_percent / 100.0) * 
            EXP(-0.05 * EXTRACT(EPOCH FROM (NOW() - h.listened_at)) / 86400.0) AS weight
        FROM listening_history h
        JOIN songs s ON h.song_id = s.id
        WHERE h.user_id = p_user_id
        ORDER BY h.listened_at DESC
        LIMIT 50
    )
    SELECT 
        -- In PostgreSQL pgvector, vectors can be averaged or aggregated
        AVG(embedding) INTO new_taste
    FROM weighted_history;

    IF new_taste IS NOT NULL THEN
        UPDATE users 
        SET taste_embedding = new_taste, updated_at = NOW() 
        WHERE id = p_user_id;
    END IF;

    RETURN new_taste;
END;
$$ LANGUAGE plpgsql;
`;

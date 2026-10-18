import { HistoryRecord, MusicGenre, MusicVector, RecommendationResult, Song, UserTasteProfile } from '../../types/music';
import { MOCK_SONG_CATALOG } from '../../data/mockCatalog';
import {
  cosineDistance,
  cosineSimilarity,
  dotProduct,
  euclideanDistance,
  musicVectorToArray,
  arrayToMusicVector,
  vectorToPgVectorString,
  weightedVectorCentroid,
  VECTOR_DIMENSIONS_META,
  VECTOR_DIMENSION_KEYS,
} from './vectorMath';
import { relationalDbService } from './relationalDbService';
import { PgVectorQueryOptions, PgVectorResponse } from './types';

export class PgVectorEngine {
  private songs: Song[];

  constructor(initialCatalog?: Song[]) {
    this.songs = initialCatalog || relationalDbService.getAllSongs();
    if (!this.songs || this.songs.length === 0) {
      this.songs = [...MOCK_SONG_CATALOG];
    }
  }

  public insertSong(song: Song): void {
    if (!this.songs.some((s) => s.id === song.id)) {
      this.songs.unshift(song);
    }
    relationalDbService.insertSong(song);
  }

  public setCatalog(songs: Song[]): void {
    this.songs = [...songs];
  }

  public getCatalog(): Song[] {
    return [...this.songs];
  }

  /**
   * Simulates a PostgreSQL + pgvector KNN query:
   * SELECT *, 1 - (embedding <=> $1) AS cosine_similarity
   * FROM songs
   * WHERE ...
   * ORDER BY embedding <=> $1
   * LIMIT $2;
   */
  public queryKNN(
    targetVector: MusicVector,
    options: PgVectorQueryOptions = {}
  ): PgVectorResponse {
    const startTime = performance.now();
    const queryArr = musicVectorToArray(targetVector);
    const metric = options.metric || 'cosine';
    const limit = options.limit || 8;
    const minSim = options.minSimilarity || 0.0;
    const indexType = options.indexType || 'HNSW';

    let filtered = [...this.songs];

    // Optional SQL WHERE filters
    if (options.filterGenre && options.filterGenre !== 'All') {
      filtered = filtered.filter((s) => s.genre === options.filterGenre);
    }
    if (options.excludeSongIds && options.excludeSongIds.length > 0) {
      const excludeSet = new Set(options.excludeSongIds);
      filtered = filtered.filter((s) => !excludeSet.has(s.id));
    }

    // Distance calculation
    const scored = filtered.map((song) => {
      const songArr = musicVectorToArray(song.vector);
      let dist = 0;
      let sim = 0;

      if (metric === 'cosine') {
        dist = cosineDistance(queryArr, songArr);
        sim = 1.0 - dist;
      } else if (metric === 'l2') {
        dist = euclideanDistance(queryArr, songArr);
        sim = Math.max(0, 1.0 - dist / 2.0);
      } else {
        // inner product
        const dot = dotProduct(queryArr, songArr);
        dist = -dot;
        sim = Math.max(0, Math.min(1, dot));
      }

      return {
        song,
        vector: songArr,
        distance: dist,
        similarity: sim,
      };
    });

    // Sort by distance ASC (closest first)
    scored.sort((a, b) => a.distance - b.distance);

    const filteredScored = scored.filter((item) => item.similarity >= minSim).slice(0, limit);

    const elapsedMs = performance.now() - startTime;
    const simParam = vectorToPgVectorString(queryArr);

    // Build the corresponding realistic PostgreSQL + pgvector SQL query
    let sql = `SELECT t.track_id, t.title, COALESCE(a.name, 'Unknown Artist') AS artist,\n`;
    sql += `       g.name AS genre, t.bpm, t.duration, af.feature_vector,\n`;
    if (metric === 'cosine') {
      sql += `       1 - (af.feature_vector <=> $1::vector) AS cosine_similarity,\n`;
      sql += `       (af.feature_vector <=> $1::vector) AS cosine_distance\n`;
    } else if (metric === 'l2') {
      sql += `       (af.feature_vector <-> $1::vector) AS l2_distance\n`;
    } else {
      sql += `       (af.feature_vector <#> $1::vector) * -1 AS inner_product\n`;
    }
    sql += `FROM tracks t\n`;
    sql += `JOIN audio_features af ON t.track_id = af.track_id\n`;
    sql += `LEFT JOIN genre g ON t.genre_id = g.genre_id\n`;
    sql += `LEFT JOIN performs p ON t.track_id = p.track_id AND p.role = 'main'\n`;
    sql += `LEFT JOIN artist a ON p.artist_id = a.artist_id\n`;

    const whereClauses: string[] = [];
    if (options.filterGenre && options.filterGenre !== 'All') {
      whereClauses.push(`g.name = '${options.filterGenre}'`);
    }
    if (options.excludeSongIds && options.excludeSongIds.length > 0) {
      whereClauses.push(`t.track_id NOT IN (${options.excludeSongIds.map((id) => `'${id}'`).join(', ')})`);
    }

    if (whereClauses.length > 0) {
      sql += `WHERE ${whereClauses.join(' AND ')}\n`;
    }

    const operator = metric === 'cosine' ? '<=>' : metric === 'l2' ? '<->' : '<#>';
    sql += `ORDER BY af.feature_vector ${operator} $1::vector\nLIMIT ${limit};`;

    return {
      items: filteredScored,
      plan: {
        querySql: sql,
        parameters: [simParam, limit],
        indexUsed: indexType === 'HNSW' ? 'idx_audio_feature_vec_hnsw' : 'idx_audio_feature_vec_ivfflat',
        indexMetric: 'vector_cosine_ops',
        estimatedCost: 14.25,
        executionTimeMs: Number((elapsedMs + 0.4).toFixed(2)), // realistic index query time
        rowsScanned: filtered.length,
        rowsReturned: filteredScored.length,
      },
    };
  }

  /**
   * Synthesizes the user's UserTasteProfile vector from both their listening history
   * AND their explicitly liked songs using exponential time decay and engagement weights.
   */
  public synthesizeUserTaste(
    history: HistoryRecord[],
    likedSongs: Song[] = [],
    baseVector?: MusicVector
  ): UserTasteProfile {
    const defaultVector = baseVector || arrayToMusicVector([0.75, 0.65, 0.6, 0.5, 0.6, 0.25, 0.5, 0.45]);

    if (history.length === 0 && likedSongs.length === 0) {
      return {
        tasteVector: defaultVector,
        totalPlays: 0,
        totalListeningMinutes: 0,
        likedSongIds: [],
        genreAffinity: {
          Synthwave: 15,
          'Lo-Fi Chill': 10,
          'Indie Folk': 10,
          'Nu-Disco / Pop': 30,
          'Cyber Techno': 15,
          'Neo-Soul / R&B': 10,
          'Cinematic Ambient': 5,
          'Alt Rock': 5,
        },
        moodTrend: {
          avgValence: defaultVector.valence,
          avgEnergy: defaultVector.energy,
          avgDanceability: defaultVector.danceability,
        },
        dominantVibeDescription: 'Exploring new sounds',
      };
    }

    const now = Date.now();
    const halfLifeDays = 7.0; // Recency decay factor
    const entries: { vector: number[]; weight: number }[] = [];
    const genreCounts: Record<string, number> = {};
    const likedIdsSet = new Set<string>();
    let totalSeconds = 0;

    let sumValence = 0;
    let sumEnergy = 0;
    let sumDance = 0;
    let totalWeightSum = 0;

    // 1. Process explicit Liked Songs (strongest positive signal: weight = 2.5)
    for (const song of likedSongs) {
      likedIdsSet.add(song.id);
      const likedWeight = 2.5;

      entries.push({
        vector: musicVectorToArray(song.vector),
        weight: likedWeight,
      });

      genreCounts[song.genre] = (genreCounts[song.genre] || 0) + 2;
      sumValence += song.vector.valence * likedWeight;
      sumEnergy += song.vector.energy * likedWeight;
      sumDance += song.vector.danceability * likedWeight;
      totalWeightSum += likedWeight;
    }

    // 2. Process Listening History (with recency decay and completion weight)
    for (const record of history) {
      const song = record.song;
      const daysAgo = Math.max(0, (now - new Date(record.listenedAt).getTime()) / (1000 * 3600 * 24));
      // Exponential decay: exp(-ln(2) * t / t_half)
      const recencyWeight = Math.exp((-Math.LN2 * daysAgo) / halfLifeDays);
      const completionWeight = Math.max(0.2, record.completionPercent / 100);
      const likeMultiplier = record.userLiked || likedIdsSet.has(song.id) ? 1.8 : 1.0;

      const totalWeight = recencyWeight * completionWeight * likeMultiplier;

      entries.push({
        vector: musicVectorToArray(song.vector),
        weight: totalWeight,
      });

      genreCounts[song.genre] = (genreCounts[song.genre] || 0) + 1;
      if (record.userLiked) {
        likedIdsSet.add(song.id);
      }
      totalSeconds += (song.durationSeconds * record.completionPercent) / 100;

      sumValence += song.vector.valence * totalWeight;
      sumEnergy += song.vector.energy * totalWeight;
      sumDance += song.vector.danceability * totalWeight;
      totalWeightSum += totalWeight;
    }

    const synthesizedArr = weightedVectorCentroid(entries);
    const tasteVector = arrayToMusicVector(synthesizedArr);

    const safeWeight = totalWeightSum > 0 ? totalWeightSum : 1;
    const avgValence = Number((sumValence / safeWeight).toFixed(2));
    const avgEnergy = Number((sumEnergy / safeWeight).toFixed(2));
    const avgDanceability = Number((sumDance / safeWeight).toFixed(2));

    // Calculate genre affinities
    const genreAffinity: Record<MusicGenre, number> = {
      Synthwave: 0,
      'Lo-Fi Chill': 0,
      'Indie Folk': 0,
      'Nu-Disco / Pop': 0,
      'Cyber Techno': 0,
      'Neo-Soul / R&B': 0,
      'Cinematic Ambient': 0,
      'Alt Rock': 0,
    };

    let totalGenreWeight = 0;
    for (const genre in genreCounts) {
      totalGenreWeight += genreCounts[genre] || 0;
    }
    for (const genre in genreCounts) {
      const count = genreCounts[genre] || 0;
      if (genre in genreAffinity && totalGenreWeight > 0) {
        genreAffinity[genre as MusicGenre] = Math.round((count / totalGenreWeight) * 100);
      }
    }

    // Determine dominant vibe description
    let dominantVibe = 'Balanced Eclectic Mix';
    if (tasteVector.danceability > 0.72 && tasteVector.energy > 0.72) {
      dominantVibe = 'High-Octane Club & Electro Dance';
    } else if (tasteVector.valence > 0.72 && tasteVector.danceability > 0.68) {
      dominantVibe = 'Euphoric Upbeat Nu-Disco Groove';
    } else if (tasteVector.vibeChillToHype < 0.35 && tasteVector.acousticness > 0.45) {
      dominantVibe = 'Deep Lo-Fi Focus & Mellow Coffee';
    } else if (tasteVector.energy > 0.82 && tasteVector.vibeChillToHype > 0.8) {
      dominantVibe = 'Peak Velocity Cyber Techno';
    } else if (tasteVector.acousticness > 0.65) {
      dominantVibe = 'Organic Acoustic & Warm Indie';
    } else if (tasteVector.valence < 0.35 && tasteVector.energy < 0.45) {
      dominantVibe = 'Nocturnal Melancholy & Dark Synth';
    } else if (tasteVector.moodHarmonics > 0.7) {
      dominantVibe = 'Introspective Nocturne & Ambient Depth';
    }

    return {
      tasteVector,
      totalPlays: history.length,
      totalListeningMinutes: Math.round(totalSeconds / 60),
      likedSongIds: Array.from(likedIdsSet),
      genreAffinity,
      moodTrend: {
        avgValence,
        avgEnergy,
        avgDanceability,
      },
      dominantVibeDescription: dominantVibe,
    };
  }

  /**
   * Generates detailed match explanations comparing target/user vector to a candidate song
   */
  public generateRecommendationResults(
    items: { song: Song; similarity: number; distance: number }[],
    queryVector: MusicVector
  ): RecommendationResult[] {
    const queryArr = musicVectorToArray(queryVector);

    return items.map((item) => {
      const songArr = musicVectorToArray(item.song.vector);

      // Analyze which dimensions are closest
      const breakdown = VECTOR_DIMENSION_KEYS.map((key, i) => {
        const meta = VECTOR_DIMENSIONS_META[key];
        const targetVal = queryArr[i] ?? 0.5;
        const songVal = songArr[i] ?? 0.5;
        const diff = Math.abs(targetVal - songVal);
        const closeness = Math.max(0, 1.0 - diff);
        return {
          dimension: meta.label,
          targetVal,
          songVal,
          closeness,
        };
      });

      // Find top matching dimensions
      const sortedCloseness = [...breakdown].sort((a, b) => b.closeness - a.closeness);
      const topMatches = sortedCloseness.slice(0, 2).map((m) => m.dimension);

      const percent = Math.round(item.similarity * 100);
      const matchReason = `${percent}% vector match · High alignment with ${topMatches.join(' & ')}`;

      return {
        song: item.song,
        similarityScore: item.similarity,
        matchReason,
        vectorDistance: item.distance,
        breakdown,
      };
    });
  }

  public getAllSongs(): Song[] {
    return this.songs;
  }

  public getSongById(id: string): Song | undefined {
    return this.songs.find((s) => s.id === id);
  }
}

export const pgVectorService = new PgVectorEngine();

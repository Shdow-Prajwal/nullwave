import { MusicVector, VectorDimensionKey, VectorDimensionMeta } from '../../types/music';

export const VECTOR_DIMENSION_KEYS: VectorDimensionKey[] = [
  'danceability',
  'energy',
  'valence',
  'beatsBpmNormalized',
  'vibeChillToHype',
  'acousticness',
  'instrumentalness',
  'moodHarmonics',
];

export const VECTOR_DIMENSIONS_META: Record<VectorDimensionKey, VectorDimensionMeta> = {
  danceability: {
    key: 'danceability',
    label: 'Danceability',
    description: 'Rhythmic regularity, beat strength, and groove suitable for dancing',
    lowLabel: 'Stationary / Flow',
    highLabel: 'Peak Danceable',
    color: '#EC4899', // rose/pink
  },
  energy: {
    key: 'energy',
    label: 'Energy',
    description: 'Dynamic intensity, perceived loudness, entropy, and drive',
    lowLabel: 'Serene / Mellow',
    highLabel: 'Intense / Explosive',
    color: '#F59E0B', // amber
  },
  valence: {
    key: 'valence',
    label: 'Happiness / Valence',
    description: 'Musical positiveness, optimism, euphoria vs melancholy/sadness',
    lowLabel: 'Melancholic / Dark',
    highLabel: 'Euphoric / Joyful',
    color: '#10B981', // emerald
  },
  beatsBpmNormalized: {
    key: 'beatsBpmNormalized',
    label: 'Beats (Tempo)',
    description: 'Beats per minute normalized from 60 BPM to 180 BPM range',
    lowLabel: '60 BPM (Slow)',
    highLabel: '180+ BPM (Rapid)',
    color: '#6366F1', // indigo
  },
  vibeChillToHype: {
    key: 'vibeChillToHype',
    label: 'Vibe (Chill ↔ Hype)',
    description: 'Atmospheric texture: introspective ambient room vs festival stage hype',
    lowLabel: 'Deep Chillout',
    highLabel: 'Adrenaline Hype',
    color: '#8B5CF6', // purple
  },
  acousticness: {
    key: 'acousticness',
    label: 'Acousticness',
    description: 'Organic instruments, guitar, piano vs synthesized oscillators',
    lowLabel: 'Pure Electronic',
    highLabel: 'Pure Acoustic',
    color: '#14B8A6', // teal
  },
  instrumentalness: {
    key: 'instrumentalness',
    label: 'Instrumentalness',
    description: 'Vocal presence vs rich instrumental, melodic arrangement',
    lowLabel: 'Vocal Dominant',
    highLabel: 'Pure Instrumental',
    color: '#06B6D4', // cyan
  },
  moodHarmonics: {
    key: 'moodHarmonics',
    label: 'Harmonic Mood Depth',
    description: 'Simple diatonic pop progressions vs complex modal/minor jazz voicings',
    lowLabel: 'Bright & Simple',
    highLabel: 'Complex & Deep',
    color: '#E11D48', // crimson
  },
};

/** Converts a MusicVector object to a normalized 8-dimensional float array */
export function musicVectorToArray(vector: MusicVector): number[] {
  return VECTOR_DIMENSION_KEYS.map((k) => vector[k]);
}

/** Converts an 8-dimensional float array back to a MusicVector object */
export function arrayToMusicVector(arr: number[]): MusicVector {
  return {
    danceability: Math.max(0, Math.min(1, arr[0] ?? 0.5)),
    energy: Math.max(0, Math.min(1, arr[1] ?? 0.5)),
    valence: Math.max(0, Math.min(1, arr[2] ?? 0.5)),
    beatsBpmNormalized: Math.max(0, Math.min(1, arr[3] ?? 0.5)),
    vibeChillToHype: Math.max(0, Math.min(1, arr[4] ?? 0.5)),
    acousticness: Math.max(0, Math.min(1, arr[5] ?? 0.5)),
    instrumentalness: Math.max(0, Math.min(1, arr[6] ?? 0.5)),
    moodHarmonics: Math.max(0, Math.min(1, arr[7] ?? 0.5)),
  };
}

/** Formats an array into the PostgreSQL pgvector text format: '[0.12, 0.45, ...]' */
export function vectorToPgVectorString(arr: number[]): string {
  return `[${arr.map((n) => Number(n).toFixed(4)).join(', ')}]`;
}

/** Parses a pgvector string '[0.1, 0.2, ...]' into number[] */
export function pgVectorStringToVector(str: string): number[] {
  try {
    const cleaned = str.trim().replace(/^\[/, '').replace(/\]$/, '');
    return cleaned.split(',').map((val) => parseFloat(val.trim()));
  } catch {
    return new Array(8).fill(0.5);
  }
}

/** Calculates the dot product of two vectors */
export function dotProduct(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/** Calculates vector L2 magnitude (Euclidean norm) */
export function vectorMagnitude(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

/**
 * Calculates Cosine Similarity between vector A and B:
 * CosineSimilarity = (A · B) / (||A|| * ||B||)
 * Returns value between 0.0 and 1.0 (for non-negative feature spaces)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const magA = vectorMagnitude(a);
  const magB = vectorMagnitude(b);
  if (magA === 0 || magB === 0) return 0;
  const dot = dotProduct(a, b);
  const sim = dot / (magA * magB);
  return Math.max(0, Math.min(1, sim));
}

/**
 * Calculates Cosine Distance for pgvector <=> operator:
 * CosineDistance = 1.0 - CosineSimilarity
 */
export function cosineDistance(a: number[], b: number[]): number {
  return 1.0 - cosineSimilarity(a, b);
}

/**
 * Calculates Euclidean (L2) distance for pgvector <-> operator
 */
export function euclideanDistance(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Normalizes a vector so its magnitude is 1.0
 */
export function normalizeVector(v: number[]): number[] {
  const mag = vectorMagnitude(v);
  if (mag === 0) return v.map(() => 0);
  return v.map((x) => x / mag);
}

/**
 * Computes a weighted centroid of multiple vectors with time-decay weights.
 * Used for synthesizing the user's historic taste vector from their listening stream:
 * TasteVector = sum(w_i * v_i) / sum(w_i)
 */
export function weightedVectorCentroid(
  entries: { vector: number[]; weight: number }[]
): number[] {
  if (entries.length === 0) {
    return new Array(8).fill(0.5);
  }

  const dim = entries[0].vector.length;
  const accumulator = new Array(dim).fill(0);
  let totalWeight = 0;

  for (const entry of entries) {
    const w = Math.max(0.01, entry.weight);
    totalWeight += w;
    for (let d = 0; d < dim; d++) {
      accumulator[d] += (entry.vector[d] ?? 0) * w;
    }
  }

  if (totalWeight <= 0) return new Array(dim).fill(0.5);

  return accumulator.map((val) => Math.max(0, Math.min(1, val / totalWeight)));
}

/**
 * Interpolates smoothly between vector A and vector B by factor t in [0, 1]
 */
export function interpolateVectors(a: number[], b: number[], t: number): number[] {
  const clampedT = Math.max(0, Math.min(1, t));
  const len = Math.min(a.length, b.length);
  const result: number[] = [];
  for (let i = 0; i < len; i++) {
    result.push(a[i] * (1 - clampedT) + b[i] * clampedT);
  }
  return result;
}

/** Converts normalized 0.0-1.0 tempo back to BPM display value */
export function normalizedToBpm(val: number): number {
  return Math.round(60 + val * 120);
}

/** Converts actual BPM to normalized 0.0-1.0 vector value */
export function bpmToNormalized(bpm: number): number {
  return Math.max(0, Math.min(1, (bpm - 60) / 120));
}

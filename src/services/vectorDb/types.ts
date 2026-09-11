import { MusicVector, Song } from '../../types/music';

export type VectorDistanceMetric = 'cosine' | 'l2' | 'inner_product';

export interface PgVectorQueryOptions {
  metric?: VectorDistanceMetric;
  limit?: number;
  minSimilarity?: number;
  filterGenre?: string;
  excludeSongIds?: string[];
  indexType?: 'HNSW' | 'IVFFLAT' | 'EXACT_FLAT';
}

export interface PgVectorQueryResultItem {
  song: Song;
  vector: number[];
  distance: number;
  similarity: number; // 1 - distance for cosine
}

export interface PgVectorQueryPlan {
  querySql: string;
  parameters: (string | number)[];
  indexUsed: string;
  indexMetric: string;
  estimatedCost: number;
  executionTimeMs: number;
  rowsScanned: number;
  rowsReturned: number;
}

export interface PgVectorResponse {
  items: PgVectorQueryResultItem[];
  plan: PgVectorQueryPlan;
}

export interface VectorArchitectureSpec {
  postgresVersion: string;
  pgvectorVersion: string;
  dimensions: number;
  tableName: string;
  indexName: string;
  indexType: 'HNSW' | 'IVFFLAT';
  distanceOperator: '<=>' | '<->' | '<#>';
  embeddingColumn: string;
}

export interface MusicVector {
  danceability: number;     // 0.0 (still) to 1.0 (highly danceable)
  energy: number;           // 0.0 (calm/peaceful) to 1.0 (intense/explosive)
  valence: number;          // 0.0 (melancholic/sad) to 1.0 (happy/cheerful)
  beatsBpmNormalized: number; // 0.0 (60 BPM) to 1.0 (180 BPM)
  vibeChillToHype: number;  // 0.0 (deep chill ambient) to 1.0 (peak club hype)
  acousticness: number;     // 0.0 (purely electronic) to 1.0 (pure acoustic)
  instrumentalness: number; // 0.0 (vocal heavy) to 1.0 (purely instrumental)
  moodHarmonics: number;    // 0.0 (bright major keys) to 1.0 (dark complex modal)
}

export type VectorDimensionKey = keyof MusicVector;

export interface VectorDimensionMeta {
  key: VectorDimensionKey;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  color: string;
}

export type MusicGenre =
  | 'Synthwave'
  | 'Lo-Fi Chill'
  | 'Indie Folk'
  | 'Nu-Disco / Pop'
  | 'Cyber Techno'
  | 'Neo-Soul / R&B'
  | 'Cinematic Ambient'
  | 'Alt Rock';

export interface GenreTheme {
  name: MusicGenre;
  primary: string;
  secondary: string;
  accent: string;
  gradientBg: string;
  glowColor: string;
  cardBorder: string;
  badgeBg: string;
}

export interface AudioSynthConfig {
  rootFreq: number; // e.g. 220 (A3)
  scale: number[];  // semitone offsets
  synthType: 'synthwave' | 'lofi' | 'acoustic' | 'pop' | 'techno' | 'soul' | 'ambient' | 'rock';
  bpm: number;
}

export interface SongAudioFeatures {
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
  acousticness: number;
  instrumentalness: number;
  speechiness?: number;
  liveness?: number;
  loudness?: number;
  key?: number;
  mode?: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: MusicGenre;
  bpm: number;
  durationSeconds: number;
  releaseYear: number;
  coverGradient: string;
  coverImage?: string;
  previewUrl?: string; // 30-second studio audio preview
  spotifyId?: string; // Real Spotify track ID
  spotifyUrl?: string; // Direct link to track on Spotify
  datasetSource?: 'Kaggle Spotify 1.2M+' | 'Spotify Web API' | 'Custom Imported';
  audioFeatures?: SongAudioFeatures;
  vector: MusicVector;
  audioConfig?: AudioSynthConfig;
  tags: string[];
}

export interface HistoryRecord {
  id: string;
  songId: string;
  song: Song;
  listenedAt: string; // ISO string
  completionPercent: number; // 0-100
  userLiked: boolean;
  contextVibe: string;
}

export interface UserTasteProfile {
  tasteVector: MusicVector;
  totalPlays: number;
  totalListeningMinutes: number;
  likedSongIds: string[];
  genreAffinity: Record<MusicGenre, number>;
  moodTrend: {
    avgValence: number;
    avgEnergy: number;
    avgDanceability: number;
  };
  dominantVibeDescription: string;
}

export interface RecommendationResult {
  song: Song;
  similarityScore: number; // 0.0 to 1.0 (cosine similarity)
  matchReason: string;
  vectorDistance: number;
  breakdown: {
    dimension: string;
    targetVal: number;
    songVal: number;
    closeness: number;
  }[];
}

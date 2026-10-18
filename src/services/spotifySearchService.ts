// src/services/spotifySearchService.ts
import { MusicGenre, Song, MusicVector } from '../types/music';
import { bpmToNormalized } from './vectorDb/vectorMath';

export interface SpotifySearchResultItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: MusicGenre;
  releaseYear: number;
  bpm: number;
  durationSeconds: number;
  coverImage: string;
  previewUrl: string;
  spotifyId: string;
  spotifyUrl: string;
  audioFeatures: {
    danceability: number;
    energy: number;
    valence: number;
    tempo: number;
    acousticness: number;
    instrumentalness: number;
  };
  vector: MusicVector;
}

// Map Apple/iTunes genres to our 8 core acoustic genres
function mapGenre(rawGenre?: string): MusicGenre {
  if (!rawGenre) return 'Nu-Disco / Pop';
  const g = rawGenre.toLowerCase();
  if (g.includes('electronic') || g.includes('dance') || g.includes('techno') || g.includes('house')) {
    return 'Cyber Techno';
  }
  if (g.includes('r&b') || g.includes('soul') || g.includes('hip-hop') || g.includes('rap')) {
    return 'Neo-Soul / R&B';
  }
  if (g.includes('rock') || g.includes('metal') || g.includes('punk') || g.includes('alternative')) {
    return 'Alt Rock';
  }
  if (g.includes('folk') || g.includes('singer') || g.includes('country') || g.includes('acoustic')) {
    return 'Indie Folk';
  }
  if (g.includes('ambient') || g.includes('classical') || g.includes('soundtrack') || g.includes('score')) {
    return 'Cinematic Ambient';
  }
  if (g.includes('jazz') || g.includes('lo-fi') || g.includes('chill') || g.includes('easy')) {
    return 'Lo-Fi Chill';
  }
  if (g.includes('synth') || g.includes('retro') || g.includes('wave')) {
    return 'Synthwave';
  }
  return 'Nu-Disco / Pop';
}

// Estimate realistic acoustic vector dimensions for imported tracks
function estimateVectorFromTrack(genre: MusicGenre, bpm: number): MusicVector {
  const normBpm = bpmToNormalized(bpm);

  switch (genre) {
    case 'Synthwave':
      return {
        danceability: 0.68,
        energy: 0.72,
        valence: 0.45,
        beatsBpmNormalized: normBpm,
        vibeChillToHype: 0.65,
        acousticness: 0.05,
        instrumentalness: 0.65,
        moodHarmonics: 0.48,
      };
    case 'Cyber Techno':
      return {
        danceability: 0.78,
        energy: 0.88,
        valence: 0.38,
        beatsBpmNormalized: normBpm,
        vibeChillToHype: 0.85,
        acousticness: 0.02,
        instrumentalness: 0.78,
        moodHarmonics: 0.52,
      };
    case 'Nu-Disco / Pop':
      return {
        danceability: 0.76,
        energy: 0.75,
        valence: 0.78,
        beatsBpmNormalized: normBpm,
        vibeChillToHype: 0.72,
        acousticness: 0.15,
        instrumentalness: 0.02,
        moodHarmonics: 0.35,
      };
    case 'Lo-Fi Chill':
      return {
        danceability: 0.65,
        energy: 0.32,
        valence: 0.42,
        beatsBpmNormalized: normBpm,
        vibeChillToHype: 0.28,
        acousticness: 0.75,
        instrumentalness: 0.72,
        moodHarmonics: 0.45,
      };
    case 'Indie Folk':
      return {
        danceability: 0.48,
        energy: 0.45,
        valence: 0.38,
        beatsBpmNormalized: normBpm,
        vibeChillToHype: 0.36,
        acousticness: 0.78,
        instrumentalness: 0.05,
        moodHarmonics: 0.42,
      };
    case 'Neo-Soul / R&B':
      return {
        danceability: 0.66,
        energy: 0.52,
        valence: 0.58,
        beatsBpmNormalized: normBpm,
        vibeChillToHype: 0.50,
        acousticness: 0.42,
        instrumentalness: 0.06,
        moodHarmonics: 0.40,
      };
    case 'Cinematic Ambient':
      return {
        danceability: 0.22,
        energy: 0.18,
        valence: 0.15,
        beatsBpmNormalized: normBpm,
        vibeChillToHype: 0.15,
        acousticness: 0.85,
        instrumentalness: 0.92,
        moodHarmonics: 0.55,
      };
    case 'Alt Rock':
      return {
        danceability: 0.52,
        energy: 0.82,
        valence: 0.48,
        beatsBpmNormalized: normBpm,
        vibeChillToHype: 0.75,
        acousticness: 0.08,
        instrumentalness: 0.05,
        moodHarmonics: 0.46,
      };
  }
}

export class SpotifySearchService {
  /**
   * Transforms raw iTunes thumbnail URLs to 600x600 high-resolution artwork
   */
  private formatCoverImage(rawUrl?: string): string {
    if (!rawUrl) return '';
    return rawUrl.replace(/\d+x\d+bb/g, '600x600bb');
  }

    /**
   * Searches the full PostgreSQL tracks table through the Express bridge
   */
  public async searchDatabase(query: string, limit: number = 12): Promise<SpotifySearchResultItem[]> {
    try {
      const res = await fetch(
        `http://localhost:5000/api/tracks/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`
      );
      if (!res.ok) return [];
      const rows = await res.json();
      if (!Array.isArray(rows)) return [];

      return rows.map((row: any): SpotifySearchResultItem => {
        const id = String(row.track_id);
        const title = row.title || `Track #${id}`;
        const artist = row.artist || 'Unknown Artist';
        const bpm = Number(row.bpm) || 120;
        const energy = Number(row.energy ?? 0.5);
        const danceability = Number(row.danceability ?? 0.5);
        const valence = Number(row.valence ?? 0.5);
        const acousticness = Number(row.acousticness ?? 0.5);
        const instrumentalness = Number(row.instrumentalness ?? 0.1);
        const genre = (row.genre === 'Uncategorized' ? 'Nu-Disco / Pop' : row.genre) as MusicGenre;
        const looksLikeSpotifyId = /^[A-Za-z0-9]{22}$/.test(id);

        return {
          id,
          title,
          artist,
          album: 'Single',
          genre,
          releaseYear: 2022,
          bpm,
          durationSeconds: Number(row.duration) || 180,
          coverImage: this.formatCoverImage(row.cover_image),
          previewUrl: row.preview_url || '',
          spotifyId: id,
          spotifyUrl: looksLikeSpotifyId
            ? `https://open.spotify.com/track/${id}`
            : `https://open.spotify.com/search/${encodeURIComponent(`${artist}${title}`)}`,
          audioFeatures: { danceability, energy, valence, tempo: bpm, acousticness, instrumentalness },
          vector: {
            danceability,
            energy,
            valence,
            beatsBpmNormalized: bpmToNormalized(bpm),
            vibeChillToHype: Number(((energy + danceability) / 2).toFixed(2)),
            acousticness,
            instrumentalness,
            moodHarmonics: 0.5,
          },
        };
      });
    } catch (err) {
      console.warn('Database search failed, falling back to iTunes:', err);
      return [];
    }
  }

  /**
   * Search real songs via global music catalogue API
   */
  public async searchTracks(query: string, limit: number = 8): Promise<SpotifySearchResultItem[]> {
    if (!query.trim()) return [];

        const dbHits = await this.searchDatabase(query, limit);
    if (dbHits.length > 0) return dbHits;

    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
        query.trim()
      )}&entity=song&limit=${limit}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Music search failed: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }

      interface ITunesItem {
        trackId?: number;
        trackName?: string;
        artistName?: string;
        collectionName?: string;
        releaseDate?: string;
        primaryGenreName?: string;
        previewUrl?: string;
        artworkUrl100?: string;
        trackTimeMillis?: number;
      }

      return data.results.map((item: ITunesItem, idx: number) => {
        const title = item.trackName || 'Untitled Track';
        const artist = item.artistName || 'Unknown Artist';
        const album = item.collectionName || `${title} - Single`;
        const releaseYear = item.releaseDate
          ? parseInt(item.releaseDate.substring(0, 4), 10)
          : 2022;
        const genre = mapGenre(item.primaryGenreName);
        const previewUrl = item.previewUrl || '';
        const coverImage = this.formatCoverImage(item.artworkUrl100);
        const durationSeconds = item.trackTimeMillis
          ? Math.round(item.trackTimeMillis / 1000)
          : 210;

        // Estimated BPM based on genre
        const defaultBpmMap: Record<MusicGenre, number> = {
          'Synthwave': 118,
          'Cyber Techno': 128,
          'Nu-Disco / Pop': 120,
          'Lo-Fi Chill': 80,
          'Indie Folk': 105,
          'Neo-Soul / R&B': 92,
          'Cinematic Ambient': 65,
          'Alt Rock': 130,
        };
        const bpm = defaultBpmMap[genre];

        const vector = estimateVectorFromTrack(genre, bpm);
        const spotifyId = `custom-${item.trackId || idx}-${Math.random().toString(36).slice(2, 7)}`;

        return {
          id: `real-${item.trackId || idx}`,
          title,
          artist,
          album,
          genre,
          releaseYear,
          bpm,
          durationSeconds,
          coverImage,
          previewUrl,
          spotifyId,
          spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${artist}${title}`)}`,
          audioFeatures: {
            danceability: vector.danceability,
            energy: vector.energy,
            valence: vector.valence,
            tempo: bpm,
            acousticness: vector.acousticness,
            instrumentalness: vector.instrumentalness,
          },
          vector,
        };
      });
    } catch (err) {
      console.error('Failed to search real songs:', err);
      return [];
    }
  }

  /**
   * Fetches metadata for a single track title and optional artist
   */
  public async fetchSingleTrackMetadata(
    title: string,
    artist?: string
  ): Promise<{ coverImage: string; previewUrl: string; artistName: string } | null> {
    try {
      const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
      const cleanArtist = artist && artist !== 'Unknown Artist' ? artist.trim() : '';
      const searchTerm = cleanArtist ? `${cleanTitle} ${cleanArtist}` : cleanTitle;

      const results = await this.searchTracks(searchTerm, 1);
      if (results.length > 0) {
        const match = results[0]!;
        return {
          coverImage: match.coverImage,
          previewUrl: match.previewUrl,
          artistName: match.artist,
        };
      }
    } catch (err) {
      console.warn(`[iTunes Metadata Lookup Error] for ${title}:`, err);
    }
    return null;
  }

  /**
   * Convert search item to full application Song
   */
  public convertToSong(item: SpotifySearchResultItem): Song {
    return {
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album,
      genre: item.genre,
      bpm: item.bpm,
      durationSeconds: item.durationSeconds,
      releaseYear: item.releaseYear,
      coverGradient: 'from-fuchsia-600 via-purple-700 to-cyan-500',
      coverImage: item.coverImage,
      previewUrl: item.previewUrl,
      spotifyId: item.spotifyId,
      spotifyUrl: item.spotifyUrl,
      datasetSource: 'Spotify Web API',
      audioFeatures: item.audioFeatures,
      vector: item.vector,
      tags: [item.genre.toLowerCase().replace(/[^a-z0-9]/g, '-'), 'spotify-api', 'live-preview'],
    };
  }
}

export const spotifySearchService = new SpotifySearchService();
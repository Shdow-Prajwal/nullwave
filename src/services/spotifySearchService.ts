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

export function cleanTrackTitleAndArtist(title: string, artist?: string) {
  let cleanArtist = String(artist || '')
    .replace(/^\[['"]?|['"]?\]$/g, '') // remove python list brackets ['...']
    .replace(/['"]+/g, '') // remove inner quotes
    .split(/[,;&\/]|(?:\s+feat\.?\s+)/i)[0] // primary artist
    .replace(/^\[+|\]+$/g, '')
    .trim();

  if (cleanArtist === 'Unknown Artist' || cleanArtist === 'Various Artists') {
    cleanArtist = '';
  }

  let cleanTitle = String(title || '')
    .replace(/\(.*?\)|\[.*?\]/g, '') // remove parentheses/brackets
    .replace(/\s*-\s*.*(remaster|radio|live|single|deluxe|version|mono|stereo|bonus|mix).*$/i, '')
    .replace(/\s+feat\..*$/i, '')
    .replace(/['"“”]/g, '')
    .trim();

  return { cleanTitle: cleanTitle || String(title || '').trim(), cleanArtist };
}

export function cleanTrackTitleAndArtist(title: string, artist?: string) {
  let cleanArtist = String(artist || '')
    .replace(/^\[['"]?|['"]?\]$/g, '') // remove python list brackets ['...']
    .replace(/['"]+/g, '') // remove inner quotes
    .split(/[,;&\/]|(?:\s+feat\.?\s+)/i)[0] // primary artist
    .replace(/^\[+|\]+$/g, '')
    .trim();

  if (cleanArtist === 'Unknown Artist' || cleanArtist === 'Various Artists') {
    cleanArtist = '';
  }

  let cleanTitle = String(title || '')
    .replace(/\(.*?\)|\[.*?\]/g, '') // remove parentheses/brackets
    .replace(/\s*-\s*.*(remaster|radio|live|single|deluxe|version|mono|stereo|bonus|mix).*$/i, '')
    .replace(/\s+feat\..*$/i, '')
    .replace(/['"“”]/g, '')
    .trim();

  return { cleanTitle: cleanTitle || String(title || '').trim(), cleanArtist };
}

export class SpotifySearchService {
  private readonly metadataRequests = new Map<
    string,
    Promise<{ coverImage: string; previewUrl: string; artistName: string } | null>
  >();

  /**
   * Transforms raw iTunes thumbnail URLs to 600x600 high-resolution artwork
   */
  private formatCoverImage(rawUrl?: string): string {
    if (!rawUrl) return '';
    return rawUrl.replace(/\d+x\d+bb/g, '600x600bb');
  }

  /**
   * Searches the global media provider catalogue (iTunes/Deezer bridge).
   * Primary search path: returns real posters, artist names and 30s previews.
   */
  public async searchMediaProvider(term: string, limit: number = 8): Promise<SpotifySearchResultItem[]> {
    try {
      const url = `/api/media/search?term=${encodeURIComponent(term.trim())}&limit=${limit}`;

      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Media provider search failed: ${res.status}`);
        return [];
      }

      const data = await res.json();
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }

      interface MediaItem {
        id?: string;
        title?: string;
        artist?: string;
        album?: string;
        releaseYear?: number;
        genre?: string;
        previewUrl?: string;
        coverImage?: string;
        durationSeconds?: number;
      }

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

      return data.results.map((item: MediaItem, idx: number) => {
        const title = item.title || 'Untitled Track';
        const artist = item.artist || 'Unknown Artist';
        const album = item.album || `${title} - Single`;
        const releaseYear = Number(item.releaseYear) || 2022;
        const genre = mapGenre(item.genre);
        const previewUrl = item.previewUrl || '';
        const coverImage = this.formatCoverImage(item.coverImage);
        const durationSeconds = Number(item.durationSeconds) || 210;

        const bpm = defaultBpmMap[genre];
        const vector = estimateVectorFromTrack(genre, bpm);
        const providerId = item.id || String(idx);
        const spotifyId = `custom-${providerId}-${Math.random().toString(36).slice(2, 7)}`;

        return {
          id: `real-${providerId}`,
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
      console.warn('Media provider search error:', err);
      return [];
    }
  }

  /**
   * Searches the full PostgreSQL tracks table (all 50,000 container tracks) through the bridge
   */
  public async searchDatabase(query: string, limit: number = 12): Promise<SpotifySearchResultItem[]> {
    try {
      const res = await fetch(
        `/api/tracks/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`
        `/api/tracks/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`
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
   * Search tracks: First queries the 50,000 container tracks table (case-insensitive).
   * Enriches any matched container song with real iTunes audio preview and artwork.
   * If not found in the container, searches the global iTunes catalogue.
   * Search tracks: First queries the 50,000 container tracks table (case-insensitive).
   * Enriches any matched container song with real iTunes audio preview and artwork.
   * If not found in the container, searches the global iTunes catalogue.
   */
  public async searchTracks(query: string, limit: number = 12): Promise<SpotifySearchResultItem[]> {
  public async searchTracks(query: string, limit: number = 12): Promise<SpotifySearchResultItem[]> {
    if (!query.trim()) return [];

    // 1. Search the media provider first: it returns real posters, artist names
    //    and 30s previews immediately.
    const apiHits = await this.searchMediaProvider(query, limit);
    if (apiHits.length > 0) return apiHits;

    // 2. Fall back to the 50,000-track container only when the provider misses.
    return this.searchDatabase(query, limit);
  }

  /**
   * Fetches metadata for a single track title and optional artist directly from iTunes
   * Fetches metadata for a single track title and optional artist directly from iTunes
   */
  public async fetchSingleTrackMetadata(
    title: string,
    artist?: string
  ): Promise<{ coverImage: string; previewUrl: string; artistName: string } | null> {
    const { cleanTitle, cleanArtist } = cleanTrackTitleAndArtist(title, artist);
    const cacheKey = `${cleanTitle.toLowerCase()}:::${cleanArtist.toLowerCase()}`;
    const cached = this.metadataRequests.get(cacheKey);
    if (cached) return cached;

    const request = this.lookupTrackMetadata(title, artist);
    this.metadataRequests.set(cacheKey, request);
    void request.then((metadata) => {
      if (!metadata) this.metadataRequests.delete(cacheKey);
    });
    return request;
  }

  private async lookupTrackMetadata(
    title: string,
    artist?: string
  ): Promise<{ coverImage: string; previewUrl: string; artistName: string } | null> {
    try {
      const res = await fetch(
        `/api/media/lookup?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist || '')}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.coverImage && !data.previewUrl && !data.artistName) return null;
      return {
        coverImage: data.coverImage || '',
        previewUrl: data.previewUrl || '',
        artistName: data.artistName || '',
      };
    } catch (err) {
      console.warn(`[Media Metadata Lookup Error] for ${title}:`, err);
      return null;
    }
  }

  public async enrichSongsWithItunes(
    songs: Song[],
    onSongEnriched: (song: Song) => void
  ): Promise<void> {
    // Only songs missing cover art / preview / artist need a provider lookup.
    const pending = songs.filter(
      (song) =>
        !song.coverImage || !song.previewUrl || !song.artist || song.artist === 'Unknown Artist'
    );
    if (pending.length === 0) return;

    // Enrich strictly sequentially with a gap: the Apple search API is heavily
    // rate limited and a burst will get the whole IP blocked. Results are
    // persisted server-side, so each track is only fetched once across reloads.
    let nextIndex = 0;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const enrichNextSong = async () => {
      while (nextIndex < pending.length) {
        const song = pending[nextIndex++]!;

        const metadata = await this.fetchTrackMetadataFromBridge(song.id);
        if (metadata) {
          const enrichedSong: Song = {
            ...song,
            coverImage: metadata.coverImage || song.coverImage,
            previewUrl: metadata.previewUrl || song.previewUrl,
            artist:
              (!song.artist || song.artist === 'Unknown Artist' || song.artist === 'Various Artists') &&
              metadata.artistName
                ? metadata.artistName
                : song.artist,
          };
          if (
            enrichedSong.coverImage !== song.coverImage ||
            enrichedSong.previewUrl !== song.previewUrl ||
            enrichedSong.artist !== song.artist
          ) {
            onSongEnriched(enrichedSong);
          }
        }

        await delay(800);
      }
    };

    await enrichNextSong();
  }

  private async fetchTrackMetadataFromBridge(
    trackId: string
  ): Promise<{ coverImage: string; previewUrl: string; artistName: string } | null> {
    try {
      const response = await fetch(
        `/api/tracks/${encodeURIComponent(trackId)}/media/enrich`,
        { method: 'POST' }
      );
      if (!response.ok) {
        console.warn(`Media enrichment failed for track ${trackId}: ${response.status}`);
        return null;
      }

      const metadata = await response.json();
      return {
        coverImage: metadata.coverImage || '',
        previewUrl: metadata.previewUrl || '',
        artistName: metadata.artistName || '',
      };
    } catch (err) {
      console.warn(`Could not reach the media enrichment endpoint for track ${trackId}:`, err);
      return null;
    }
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
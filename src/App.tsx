import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Database,
  BarChart3,
  Music,
  Sparkles,
  Search,
  Sliders,
  Play,
  Heart,
  Activity,
  PlusCircle,
  Radio,
  AudioWaveform,
  Layers,
  ArrowRight,
  User,
  X,
  ChevronRight,
  ListMusic,
} from 'lucide-react';
import { Song, MusicVector, HistoryRecord, RecommendationResult, MusicGenre } from './types/music';
import { MOCK_SONG_CATALOG, INITIAL_LISTENING_HISTORY, GENRE_THEMES } from './data/mockCatalog';
import { pgVectorService } from './services/vectorDb/pgVectorSimulator';
import { audioSynthesizer } from './services/audioSynthesizer';
import {
  interpolateVectors,
  musicVectorToArray,
  arrayToMusicVector,
  bpmToNormalized,
  vectorToPgVectorString,
} from './services/vectorDb/vectorMath';
import { PgVectorQueryPlan, VectorDistanceMetric } from './services/vectorDb/types';
import {
  userDbService,
  UserDbRecord,
  DEFAULT_TASTE_VECTOR_ARRAY,
} from './services/vectorDb/userDbService';
import { DynamicGenreBackground } from './components/DynamicGenreBackground';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { SongCard } from './components/SongCard';
import { VectorTuner } from './components/VectorTuner';
import { DashboardView } from './components/DashboardView';
import { PgVectorArchitectureDrawer } from './components/PgVectorArchitectureDrawer';
import { VectorInspectorModal } from './components/VectorInspectorModal';
import { SpotifyEmbedModal } from './components/SpotifyEmbedModal';
import { RealSongSearchModal } from './components/RealSongSearchModal';
import { LandingPage } from './components/LandingPage';
import { UserHeaderMenu } from './components/UserHeaderMenu';
import { TasteProfileModal } from './components/TasteProfileModal';
import { UserDetailsModal } from './components/UserDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { PlaylistsView } from './components/PlaylistsView';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { relationalDbService } from './services/vectorDb/relationalDbService';
import { spotifySearchService } from './services/spotifySearchService';

// Backend API Base Endpoint (routed via Vite proxy to PostgreSQL Express bridge)
const API_BASE_URL = '/api';

// Helper: Map rows from PostgreSQL /api/tracks into the application's Song model
function mapDbTrackToSong(row: any): Song {
  const id = String(row.id ?? row.track_id);
  const title = row.title || `Track #${id}`;
  const artist = row.artist || row.artist_name || 'Various Artists';
  const album = row.album || 'Single';
  const bpm = Number(row.bpm) || 120;
  const duration = Number(row.duration) || 180;
  const rawGenre = row.genre || 'Nu-Disco / Pop';
  const genre = (rawGenre === 'Uncategorized' ? 'Nu-Disco / Pop' : rawGenre) as MusicGenre;

  // Audio features mapping
  const energy = Number(row.features?.energy ?? row.energy ?? 0.5);
  const danceability = Number(row.features?.danceability ?? row.danceability ?? 0.5);
  const valence = Number(row.features?.valence ?? row.valence ?? 0.5);
  const acousticness = Number(row.features?.acousticness ?? row.acousticness ?? 0.5);
  const instrumentalness = Number(row.features?.instrumentalness ?? row.instrumentalness ?? 0.1);
  const normBpm = bpmToNormalized(bpm);

  let vector: MusicVector;
  if (row.feature_vector) {
    try {
      const parsed = typeof row.feature_vector === 'string'
        ? JSON.parse(row.feature_vector)
        : row.feature_vector;
      if (Array.isArray(parsed) && parsed.length === 8) {
        vector = arrayToMusicVector(parsed);
      } else {
        vector = {
          danceability,
          energy,
          valence,
          beatsBpmNormalized: normBpm,
          vibeChillToHype: energy,
          acousticness,
          instrumentalness,
          moodHarmonics: 0.5,
        };
      }
    } catch {
      vector = {
        danceability,
        energy,
        valence,
        beatsBpmNormalized: normBpm,
        vibeChillToHype: energy,
        acousticness,
        instrumentalness,
        moodHarmonics: 0.5,
      };
    }
  } else {
    vector = {
      danceability,
      energy,
      valence,
      beatsBpmNormalized: normBpm,
      vibeChillToHype: energy,
      acousticness,
      instrumentalness,
      moodHarmonics: 0.5,
    };
  }

  const coverImage = row.cover_image || row.coverImage || undefined;

  return {
    id,
    title,
    artist,
    album,
    genre,
    bpm,
    durationSeconds: duration,
    releaseYear: Number(row.release_year) || 2022,
    coverGradient: 'from-violet-600 via-indigo-600 to-cyan-500',
    coverImage,
    previewUrl: row.preview_url || row.previewUrl || undefined,
    spotifyId: row.spotify_id || row.spotifyId,
    spotifyUrl: row.spotify_url || `https://open.spotify.com/search/${encodeURIComponent(`${artist}${title}`)}`,
    datasetSource: 'Kaggle Spotify 1.2M+',
    audioFeatures: {
      danceability,
      energy,
      valence,
      tempo: bpm,
      acousticness,
      instrumentalness,
    },
    vector,
    tags: [genre, `${bpm} BPM`],
  };
}

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'recommender' | 'dashboard' | 'library' | 'playlists'>('recommender');

  // Landing / Splash screen state
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);

  // Active Relational Database User & All Users List
  const [activeUser, setActiveUser] = useState<UserDbRecord | null>(null);
  const [allUsers, setAllUsers] = useState<UserDbRecord[]>(() => userDbService.getAllUsers());

  // Dynamic Catalog State (Populated directly from PostgreSQL DB container)
  const [catalog, setCatalog] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Vector Tuner & Query state
  const [targetVector, setTargetVector] = useState<MusicVector>(() =>
    arrayToMusicVector(DEFAULT_TASTE_VECTOR_ARRAY)
  );

  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [blendHistoryRatio, setBlendHistoryRatio] = useState<number>(0.35);
  const [vectorMetric, setVectorMetric] = useState<VectorDistanceMetric>('cosine');

  // User Listening History & Liked Songs State
  const [history, setHistory] = useState<HistoryRecord[]>(INITIAL_LISTENING_HISTORY);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(() => new Set());
  const [likesLoadError, setLikesLoadError] = useState<string | null>(null);

  // Modals & Drawers
  const [inspectingSong, setInspectingSong] = useState<Song | null>(null);
  const [spotifyEmbedSong, setSpotifyEmbedSong] = useState<Song | null>(null);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isRealSongSearchOpen, setIsRealSongSearchOpen] = useState(false);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);

  // Top-Right User Dropdown Modals
  const [isTasteProfileModalOpen, setIsTasteProfileModalOpen] = useState(false);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateUserPromptOpen, setIsCreateUserPromptOpen] = useState(false);

  // Search filter for catalog library
  const [librarySearch, setLibrarySearch] = useState('');

  // Prompt state for creating a new user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  // 1. Initialize active user and all users from PostgreSQL Backend
  useEffect(() => {
    async function loadInitialUsers() {
      try {
        const res = await fetch(`${API_BASE_URL}/users`);
        if (res.ok) {
          const rawUsers = await res.json();
          if (Array.isArray(rawUsers) && rawUsers.length > 0) {
            const mappedUsers: UserDbRecord[] = rawUsers.map((u: any) => ({
              user_id: Number(u.user_id),
              username: u.username || `User #${u.user_id}`,
              email: u.email || `${(u.username || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@vectorvibe.local`,
              created_at: u.created_at || new Date().toISOString(),
              taste_vector:
                typeof u.taste_vector === 'string'
                  ? JSON.parse(u.taste_vector)
                  : Array.isArray(u.taste_vector)
                  ? u.taste_vector
                  : DEFAULT_TASTE_VECTOR_ARRAY,
            }));
            setAllUsers(mappedUsers);
            const activeId = userDbService.getActiveUserId();
            const matched = (activeId && mappedUsers.find((u) => u.user_id === activeId)) || mappedUsers[0]!;
            setActiveUser(matched);
            if (matched.taste_vector && matched.taste_vector.length === 8) {
              setTargetVector(arrayToMusicVector(matched.taste_vector));
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Backend server not reachable yet, using local user state:', err);
      }

      const localUsers = userDbService.getAllUsers();
      setAllUsers(localUsers);
      const current = userDbService.getActiveUser();
      if (current) {
        setActiveUser(current);
        if (current.taste_vector && current.taste_vector.length === 8) {
          setTargetVector(arrayToMusicVector(current.taste_vector));
        }
      } else if (localUsers.length > 0) {
        const first = userDbService.setActiveUser(localUsers[0]!.user_id);
        setActiveUser(first);
        if (first?.taste_vector) {
          setTargetVector(arrayToMusicVector(first.taste_vector));
        }
      }
    }

    loadInitialUsers();

    const unsubscribe = userDbService.subscribe(() => {
      const updatedUser = userDbService.getActiveUser();
      setActiveUser(updatedUser);
      setAllUsers(userDbService.getAllUsers());
    });

    return () => unsubscribe();
  }, []);

  const publishDbCatalog = useCallback((rows: any[]) => {
    const mappedSongs = rows.map(mapDbTrackToSong);
    setCatalog(mappedSongs);
    pgVectorService.setCatalog(mappedSongs);
    setCurrentSong((prev) => (prev ? prev : mappedSongs[0]!));

    void spotifySearchService.enrichSongsWithItunes(mappedSongs, (enrichedSong) => {
      setCatalog((current) =>
        current.map((song) => (song.id === enrichedSong.id ? enrichedSong : song))
      );
      setCurrentSong((current) =>
        current?.id === enrichedSong.id ? enrichedSong : current
      );
    }).catch((err) => {
      console.warn('Could not enrich the loaded catalog with iTunes media:', err);
    });
  }, []);

  // 2. Synchronize Catalog: 50 tracks dynamically loaded based on user's taste vector
  const CATALOG_SIZE = 50;
  const loadCatalog = useCallback(async (vectorParam?: MusicVector | number[]) => {
    const vecArr = vectorParam
      ? (Array.isArray(vectorParam) ? vectorParam : musicVectorToArray(vectorParam))
      : (activeUser?.taste_vector || musicVectorToArray(targetVector));

    const uid = activeUser?.user_id || 1;

    try {
      // 1. Query recommendations endpoint (performs pgvector KNN <=> distance to taste vector in postgres)
      const recRes = await fetch(`${API_BASE_URL}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vector: vecArr, limit: CATALOG_SIZE }),
      });
      if (recRes.ok) {
        const recData = await recRes.json();
        const dbTracks = recData.recommendations || recData;
        if (Array.isArray(dbTracks) && dbTracks.length > 0) {
          publishDbCatalog(dbTracks);
          return;
        }
      }

      // 2. Query GET /api/tracks with userId & vector
      const res = await fetch(`${API_BASE_URL}/tracks?limit=${CATALOG_SIZE}&userId=${uid}&vector=${encodeURIComponent(JSON.stringify(vecArr))}`);
      if (res.ok) {
        const dbTracks = await res.json();
        if (Array.isArray(dbTracks) && dbTracks.length > 0) {
          publishDbCatalog(dbTracks);
          return;
        }
      }
    } catch (err) {
      console.warn('PostgreSQL container not reachable for taste-sorted tracks, using fallback:', err);
    }

    // Fallback to local relational simulation sorted by user taste vector
    const songs = relationalDbService.getSongsSortedByTasteVector(vecArr, CATALOG_SIZE);
    setCatalog(songs);
    pgVectorService.setCatalog(songs);
    if (songs.length > 0) setCurrentSong((prev) => (prev ? prev : songs[0]!));
  }, [activeUser?.user_id, activeUser?.taste_vector, publishDbCatalog, targetVector]);

  useEffect(() => {
  useEffect(() => {
    loadCatalog();
  }, [activeUser?.user_id, loadCatalog]);
  }, [activeUser?.user_id, loadCatalog]);

  useEffect(() => {
    let isCurrentUser = true;
    const uid = activeUser?.user_id || 1;
    setLikedSongIds(new Set());
    setLikesLoadError(null);

    const loadLikes = async () => {
      let response: Response;
      try {
        response = await fetch(`${API_BASE_URL}/users/${uid}/likes`);
      } catch (err) {
        console.warn('Could not connect to PostgreSQL likes, using local likes:', err);
        if (isCurrentUser) {
          setLikedSongIds(relationalDbService.getLikedSongCodes(uid));
        }
        return;
      }

      if (!response.ok) {
        const message = `Likes request failed (${response.status})`;
        console.error(message);
        if (isCurrentUser) {
          setLikesLoadError(message);
        }
        return;
      }

      try {
        const trackIds: unknown = await response.json();
        if (!Array.isArray(trackIds)) {
          throw new Error('Likes response was not an array');
        }
        if (isCurrentUser) {
          setLikedSongIds(new Set(trackIds.map(String)));
          setLikesLoadError(null);
        }
      } catch (err) {
        console.error('Could not parse PostgreSQL likes:', err);
        if (isCurrentUser) {
          setLikesLoadError('The likes API returned an invalid response');
        }
      }
    };

    void loadLikes();
    return () => {
      isCurrentUser = false;
    };
  }, [activeUser?.user_id]);

  // 3. Synthesize user taste profile vector from listening history AND liked songs
  // 3. Synthesize user taste profile vector from listening history AND liked songs
  const userTasteProfile = useMemo(() => {
    const likedSongs = Array.from(likedSongIds)
      .map((id) => catalog.find((s) => s.id === id) || relationalDbService.getSongById(id))
      .filter((s): s is Song => Boolean(s));

    return pgVectorService.synthesizeUserTaste(history, likedSongs, targetVector);
  }, [history, likedSongIds, catalog, targetVector]);
    const likedSongs = Array.from(likedSongIds)
      .map((id) => catalog.find((s) => s.id === id) || relationalDbService.getSongById(id))
      .filter((s): s is Song => Boolean(s));

    return pgVectorService.synthesizeUserTaste(history, likedSongs, targetVector);
  }, [history, likedSongIds, catalog, targetVector]);

  // 4. Compute effective query vector by blending target vector with history taste vector
  const effectiveQueryVector = useMemo(() => {
    const targetArr = musicVectorToArray(targetVector);
    const historyArr = musicVectorToArray(userTasteProfile.tasteVector);
    const blendedArr = interpolateVectors(targetArr, historyArr, blendHistoryRatio);
    return arrayToMusicVector(blendedArr);
  }, [targetVector, userTasteProfile.tasteVector, blendHistoryRatio]);

  // 5. Execute Vector KNN Query against pgvector engine
  const { recommendations, queryPlan } = useMemo(() => {
    const response = pgVectorService.queryKNN(effectiveQueryVector, {
      metric: vectorMetric,
      limit: 12,
      filterGenre: selectedGenre,
    });

    const recResults = pgVectorService.generateRecommendationResults(
      response.items,
      effectiveQueryVector
    );

    return {
      recommendations: recResults,
      queryPlan: response.plan,
    };
  }, [effectiveQueryVector, vectorMetric, selectedGenre, catalog]);

  // 6. Connect Sliders to Database
  const handleVectorChange = useCallback(
    async (updated: MusicVector) => {
      setTargetVector(updated);
      if (!activeUser) return;

      const arr = musicVectorToArray(updated);
      userDbService.updateUserTasteVector(activeUser.user_id, arr);

      try {
        await fetch(`${API_BASE_URL}/users/${activeUser.user_id}/taste-vector`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasteVector: arr }),
        });
      } catch (err) {
        console.warn('Backend sync failed, saved locally:', err);
      }
    },
    [activeUser]
  );

  // Create & launch user
  const handleCreateAndLaunchUser = async (username: string, email?: string) => {
    const vectorArr = musicVectorToArray(targetVector);

    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, tasteVector: vectorArr }),
      });
      if (res.ok) {
        const createdRaw = await res.json();
        const created: UserDbRecord = {
          user_id: Number(createdRaw.user_id),
          username: createdRaw.username,
          email: createdRaw.email || `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@vectorvibe.local`,
          created_at: createdRaw.created_at || new Date().toISOString(),
          taste_vector:
            typeof createdRaw.taste_vector === 'string'
              ? JSON.parse(createdRaw.taste_vector)
              : Array.isArray(createdRaw.taste_vector)
              ? createdRaw.taste_vector
              : vectorArr,
        };
        userDbService.createUser(username, email, vectorArr);
        setActiveUser(created);
        setAllUsers((prev) => [...prev.filter((u) => u.user_id !== created.user_id), created]);
        setShowLandingPage(false);
        return;
      }
    } catch (err) {
      console.warn('Backend offline, creating locally:', err);
    }

    const newUser = userDbService.createUser(username, email, vectorArr);
    setActiveUser(newUser);
    setAllUsers(userDbService.getAllUsers());
    setShowLandingPage(false);
  };

  // Switch active user
  const handleSwitchUser = (userId: number) => {
    const target = allUsers.find((u) => u.user_id === userId) || userDbService.setActiveUser(userId);
    if (target) {
      userDbService.setActiveUser(userId);
      setActiveUser(target);
      if (target.taste_vector && target.taste_vector.length === 8) {
        setTargetVector(arrayToMusicVector(target.taste_vector));
      }
    }
  };

  // Reset taste vector
  const handleResetTasteVector = () => {
    const defaultVec = arrayToMusicVector(DEFAULT_TASTE_VECTOR_ARRAY);
    setTargetVector(defaultVec);
    if (activeUser) {
      userDbService.resetUserTasteVector(activeUser.user_id);
    }
  };

  // Record a listen in history when played
  const recordListeningSession = useCallback(
    async (song: Song, completion: number = 100) => {
      const uid = activeUser?.user_id || 1;
      const isLiked = likedSongIds.has(song.id);

      relationalDbService.recordListen(uid, song.id, completion >= 80 ? 5 : undefined);

      setHistory((prev) => {
        const newRecord: HistoryRecord = {
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          songId: song.id,
          song,
          listenedAt: new Date().toISOString(),
          completionPercent: completion,
          userLiked: isLiked,
          contextVibe: song.genre,
        };
        return [newRecord, ...prev.slice(0, 49)];
      });

      try {
        await fetch(`${API_BASE_URL}/listen-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: uid,
            trackId: song.id,
            rating: isLiked ? 5 : (completion >= 80 ? 4 : 3),
          }),
        });
      } catch (err) {
        console.warn('Could not post to listen_history:', err);
      }
    },
    [activeUser?.user_id, likedSongIds]
  );

  // Play / Pause toggle
  const handlePlayToggle = (song: Song) => {
    if (currentSong?.id === song.id && isPlaying) {
      audioSynthesizer.stopPlayback();
      setIsPlaying(false);
    } else {
      setCurrentSong(song);
      audioSynthesizer.playSong(song);
      setIsPlaying(true);
      recordListeningSession(song);
    }
  };

  // Next / Previous track controls
  const handleNextSong = useCallback(() => {
    if (!currentSong || catalog.length === 0) return;
    const currentIndex = catalog.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % catalog.length;
    const nextSong = catalog[nextIndex]!;
    setCurrentSong(nextSong);
    if (isPlaying) {
      audioSynthesizer.playSong(nextSong);
      recordListeningSession(nextSong);
    }
  }, [catalog, currentSong, isPlaying, recordListeningSession]);

  const handlePreviousSong = useCallback(() => {
    if (!currentSong || catalog.length === 0) return;
    const currentIndex = catalog.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + catalog.length) % catalog.length;
    const prevSong = catalog[prevIndex]!;
    setCurrentSong(prevSong);
    if (isPlaying) {
      audioSynthesizer.playSong(prevSong);
      recordListeningSession(prevSong);
    }
  }, [catalog, currentSong, isPlaying, recordListeningSession]);

  // Toggle Like: Liked songs update taste vector without forcing addition to the 100-track catalog
  const handleToggleLike = async (songId: string, songData?: Song) => {
  // Toggle Like: Liked songs update taste vector without forcing addition to the 100-track catalog
  const handleToggleLike = async (songId: string, songData?: Song) => {
    const uid = activeUser?.user_id || 1;
    const targetSong =
      songData ||
      catalog.find((s) => s.id === songId) ||
      relationalDbService.getSongById(songId) ||
      (currentSong?.id === songId ? currentSong : undefined);

    let isNowLiked = false;
    let newTasteVectorFromDb: number[] | null = null;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${uid}/likes`, {
    const targetSong =
      songData ||
      catalog.find((s) => s.id === songId) ||
      relationalDbService.getSongById(songId) ||
      (currentSong?.id === songId ? currentSong : undefined);

    let isNowLiked = false;
    let newTasteVectorFromDb: number[] | null = null;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${uid}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: songId, song: targetSong }),
        body: JSON.stringify({ trackId: songId, song: targetSong }),
      });

      if (response.ok) {
        const result = await response.json();
        if (typeof result.isLiked === 'boolean') {
          isNowLiked = result.isLiked;
          newTasteVectorFromDb = result.newTasteVector || null;
          setLikesLoadError(null);
        }
      } else {
        throw new Error(`Like request failed with status ${response.status}`);
      }
    } catch (err) {
      console.warn('Could not sync like to PostgreSQL, using local relational store:', err);
      isNowLiked = relationalDbService.toggleLikeSong(uid, songId, targetSong);
    }

    // Update likedSongIds state
    setLikedSongIds((current) => {
      const updated = new Set(current);
      if (isNowLiked) {
        updated.add(songId);
      } else {
        updated.delete(songId);
      }
      return updated;
    });

    // Update history liked status
    setHistory((prev) =>
      prev.map((r) => (r.songId === songId ? { ...r, userLiked: isNowLiked } : r))
    );

    // If targetSong exists, ensure local relational store knows about it for Playlists view
    if (targetSong) {
      relationalDbService.insertSongInternal(targetSong, false);
    }

    // Update taste vector in state from backend recalculation or local synthesis
    if (newTasteVectorFromDb && Array.isArray(newTasteVectorFromDb) && newTasteVectorFromDb.length === 8) {
      const newMusicVec = arrayToMusicVector(newTasteVectorFromDb);
      setTargetVector(newMusicVec);
      setActiveUser((prev) => (prev ? { ...prev, taste_vector: newTasteVectorFromDb } : null));
    } else {
      const currentLikedList = Array.from(likedSongIds)
        .filter((id) => (isNowLiked ? true : id !== songId))
        .map((id) => catalog.find((s) => s.id === id) || relationalDbService.getSongById(id))
        .filter((s): s is Song => Boolean(s));

      if (isNowLiked && targetSong && !currentLikedList.some((s) => s.id === targetSong.id)) {
        currentLikedList.push(targetSong);
      }

      const calculated = pgVectorService.synthesizeUserTaste(history, currentLikedList, targetVector);
      setTargetVector(calculated.tasteVector);
      const calculatedArr = musicVectorToArray(calculated.tasteVector);
      setActiveUser((prev) => (prev ? { ...prev, taste_vector: calculatedArr } : null));
      userDbService.updateUserTasteVector(uid, calculatedArr);

      if (response.ok) {
        const result = await response.json();
        if (typeof result.isLiked === 'boolean') {
          isNowLiked = result.isLiked;
          newTasteVectorFromDb = result.newTasteVector || null;
          setLikesLoadError(null);
        }
      } else {
        throw new Error(`Like request failed with status ${response.status}`);
      }
    } catch (err) {
      console.warn('Could not sync like to PostgreSQL, using local relational store:', err);
      isNowLiked = relationalDbService.toggleLikeSong(uid, songId, targetSong);
    }

    // Update likedSongIds state
    setLikedSongIds((current) => {
      const updated = new Set(current);
      if (isNowLiked) {
        updated.add(songId);
      } else {
        updated.delete(songId);
      }
      return updated;
    });

    // Update history liked status
    setHistory((prev) =>
      prev.map((r) => (r.songId === songId ? { ...r, userLiked: isNowLiked } : r))
    );

    // If targetSong exists, ensure local relational store knows about it for Playlists view
    if (targetSong) {
      relationalDbService.insertSongInternal(targetSong, false);
    }

    // Update taste vector in state from backend recalculation or local synthesis
    if (newTasteVectorFromDb && Array.isArray(newTasteVectorFromDb) && newTasteVectorFromDb.length === 8) {
      const newMusicVec = arrayToMusicVector(newTasteVectorFromDb);
      setTargetVector(newMusicVec);
      setActiveUser((prev) => (prev ? { ...prev, taste_vector: newTasteVectorFromDb } : null));
    } else {
      const currentLikedList = Array.from(likedSongIds)
        .filter((id) => (isNowLiked ? true : id !== songId))
        .map((id) => catalog.find((s) => s.id === id) || relationalDbService.getSongById(id))
        .filter((s): s is Song => Boolean(s));

      if (isNowLiked && targetSong && !currentLikedList.some((s) => s.id === targetSong.id)) {
        currentLikedList.push(targetSong);
      }

      const calculated = pgVectorService.synthesizeUserTaste(history, currentLikedList, targetVector);
      setTargetVector(calculated.tasteVector);
      const calculatedArr = musicVectorToArray(calculated.tasteVector);
      setActiveUser((prev) => (prev ? { ...prev, taste_vector: calculatedArr } : null));
      userDbService.updateUserTasteVector(uid, calculatedArr);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleSimulateListen = (song: Song) => {
    recordListeningSession(song, Math.floor(Math.random() * 30 + 70));
  };

  // Dynamically add imported song into catalog and vector memory
  const handleAddSongToCatalog = (newSong: Song) => {
    relationalDbService.insertSong(newSong);
    pgVectorService.insertSong(newSong);
    setCatalog((prev) => [newSong, ...prev.filter((s) => s.id !== newSong.id)]);
  };

  // Expand catalog dynamically
  const handleExpandCatalog = async (count: number = 8) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tracks?limit=${catalog.length + count}`);
      if (res.ok) {
        const dbTracks = await res.json();
        publishDbCatalog(dbTracks);
        return;
      }
    } catch (err) {
      console.warn('Expanding catalog via local seed fallback:', err);
    }

    relationalDbService.expandCatalogWithGeneratedSeeds(count);
    const all = relationalDbService.getAllSongs();
    setCatalog((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const newlyAdded = all.filter((s) => !existingIds.has(s.id));
      return [...prev, ...newlyAdded];
    });
  };

  // Filter catalog for Library tab
  const filteredCatalog = useMemo(() => {
    let list = catalog;
    if (selectedGenre !== 'All') {
      list = list.filter((s) => s.genre === selectedGenre);
    }
    if (librarySearch.trim()) {
      const q = librarySearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.genre.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [catalog, selectedGenre, librarySearch]);

  const displayUser: UserDbRecord = activeUser || {
    user_id: 1,
    username: 'Guest Explorer',
    email: 'guest@vectorvibe.local',
    created_at: new Date().toISOString(),
    taste_vector: DEFAULT_TASTE_VECTOR_ARRAY,
  };

  // 1. Render Landing / Splash Page
  if (showLandingPage) {
    return (
      <>
        <LandingPage
          currentUser={activeUser}
          allUsers={allUsers}
          onSelectUser={handleSwitchUser}
          onLaunchMainApp={() => setShowLandingPage(false)}
          onCreateAndLaunchUser={handleCreateAndLaunchUser}
          onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
          dominantVibe={userTasteProfile.dominantVibeDescription}
          catalogLength={catalog.length}
        />

        <PgVectorArchitectureDrawer
          isOpen={isArchitectureModalOpen}
          onClose={() => setIsArchitectureModalOpen(false)}
          currentQueryPlan={queryPlan}
          targetVector={effectiveQueryVector}
          metric={vectorMetric}
          onChangeMetric={setVectorMetric}
        />
      </>
    );
  }

  // 2. Render Main Studio Application
  return (
    <div className="min-h-screen text-[#f5f3f7] flex flex-col relative pb-36 font-sans aura-app-shell isolate">
      {/* Atmospheric Dynamic Background */}
      <DynamicGenreBackground
        currentGenre={currentSong?.genre || 'Nu-Disco / Pop'}
        isPlaying={isPlaying}
        coverImage={currentSong?.coverImage}
      />

      {/* Sidebar Navigation */}
      <header className="aura-sidebar-shell fixed left-0 top-0 z-40 flex h-screen w-[88px] flex-col items-center border-r border-white/10 px-3 py-5">
        <div
          className="aura-brand-mark group mb-10 flex size-12 cursor-pointer items-center justify-center rounded-2xl"
          onClick={() => setShowLandingPage(true)}
          title="Return to Splash / Landing Page"
        >
          <Activity className="size-5 text-violet-200 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
        </div>
        <nav className="flex flex-1 flex-col items-center gap-3" aria-label="Primary navigation">
          <button aria-label="Discover" title="Discover" onClick={() => setActiveTab('recommender')} className={`aura-nav-item ${activeTab === 'recommender' ? 'is-active' : ''}`}><Sparkles /></button>
          <button aria-label="Taste Profile" title="Taste Profile" onClick={() => setActiveTab('dashboard')} className={`aura-nav-item ${activeTab === 'dashboard' ? 'is-active' : ''}`}><BarChart3 /></button>
          <button aria-label="Catalog" title={`Catalog contains ${catalog.length} PostgreSQL container tracks`} onClick={() => setActiveTab('library')} className={`aura-nav-item ${activeTab === 'library' ? 'is-active' : ''}`}><Music /></button>
          <button aria-label="Playlists" title="Playlists" onClick={() => setActiveTab('playlists')} className={`aura-nav-item ${activeTab === 'playlists' ? 'is-active' : ''}`}><ListMusic /></button>
          <button aria-label="Search songs" title="Search songs" onClick={() => setIsRealSongSearchOpen(true)} className="aura-nav-item"><Search /></button>
          <button aria-label="Database tables" title="Database tables" onClick={() => setIsArchitectureModalOpen(true)} className="aura-nav-item"><Database /></button>
        </nav>
        <UserHeaderMenu
          user={displayUser}
          tasteProfile={userTasteProfile}
          allUsers={allUsers}
          onSwitchUser={handleSwitchUser}
          likedSongsCount={likedSongIds.size}
          playlistsCount={userDbService.getPlaylistsForUser(displayUser.user_id).length}
          onOpenTasteProfileModal={() => setIsTasteProfileModalOpen(true)}
          onOpenUserDetailsModal={() => setIsUserDetailsModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenNewUserPrompt={() => setIsCreateUserPromptOpen(true)}
          onGoToLandingPage={() => setShowLandingPage(true)}
        />
      </header> 

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex-1 w-full space-y-8 pl-28">
        {likesLoadError && (
          <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            Saved likes could not be restored: {likesLoadError}. Restart the backend on port 5000, then reload.
          </div>
        )}
        {/* VIEW 1: Recommender & Vector Explorer */}
        {activeTab === 'recommender' && (
          <div className="space-y-8">
            <div className="relative pt-4 pb-2">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div className="max-w-2xl space-y-3">
                  <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[#f2ece4] leading-[0.95]">
                    Find the feeling.
                  </h1>
                  <p className="text-sm sm:text-base text-white/70 max-w-xl">
                    High-dimensional music discovery that learns your mood, energy, and acoustic taste
                    in milliseconds. Powered by 8D vector embeddings and PostgreSQL pgvector.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRealSongSearchOpen(true)}
                    className="cosmic-button px-6 py-3 min-h-[48px] text-sm text-white font-medium"
                  >
                    <div className="points_wrapper">
                      <i className="point"></i>
                      <i className="point"></i>
                      <i className="point"></i>
                      <i className="point"></i>
                    </div>
                    <span className="relative z-10 flex items-center gap-2">
                      <span>Search Any Song</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                </div>
              </div>

              {/* Metrics Header Cards */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl p-5 backdrop-blur-xl bg-[#0b0b10]/70 border border-white/10 ring-1 ring-white/5 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-1">
                    50,000+
                  </div>
                  <div className="text-xs font-medium text-white/90">PostgreSQL Container Tracks</div>
                  <div className="text-[11px] text-white/50 mt-1">
                    {catalog.length} tracks loaded in active container memory
                  </div>
                </div>

                <div className="rounded-2xl p-5 backdrop-blur-xl bg-[#0b0b10]/70 border border-white/10 ring-1 ring-white/5 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-1">
                    8-Dim
                  </div>
                  <div className="text-xs font-medium text-white/90">pgvector Space</div>
                  <div className="text-[11px] text-white/50 mt-1">
                    Dance, Energy, Valence, BPM, Vibe, Acoustic harmonics
                  </div>
                </div>

                <div className="rounded-2xl p-5 backdrop-blur-xl bg-[#0b0b10]/70 border border-white/10 ring-1 ring-white/5 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-1">
                    &lt; 4ms
                  </div>
                  <div className="text-xs font-medium text-white/90">Cosine KNN Query</div>
                  <div className="text-[11px] text-white/50 mt-1">
                    Time-weighted history centroid blending
                  </div>
                </div>
              </div>
            </div>

            {/* Vector Tuner */}
            <VectorTuner
              targetVector={targetVector}
              onChangeVector={handleVectorChange}
              selectedGenre={selectedGenre}
              onSelectGenre={setSelectedGenre}
              blendHistoryRatio={blendHistoryRatio}
              onChangeBlendRatio={setBlendHistoryRatio}
              userHistoryVector={userTasteProfile.tasteVector}
              isDbSynced={Boolean(activeUser)}
              activeUsername={activeUser?.username}
            />

            {/* Recommendations Grid */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-2 tracking-tight">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <span>Acoustic Recommendations</span>
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    Live cosine similarity matching across PostgreSQL dataset via pgvector KNN
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-white/60 font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                    {recommendations.length} Tracks
                  </span>
                  <button
                    onClick={() => setIsArchitectureModalOpen(true)}
                    className="text-violet-400 hover:text-violet-300 underline underline-offset-4 text-xs font-sans"
                  >
                    SQL Query Plan ({queryPlan.executionTimeMs}ms)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recommendations.map((rec) => (
                  <SongCard
                    key={rec.song.id}
                    song={rec.song}
                    recommendation={rec}
                    isPlaying={isPlaying}
                    isCurrentSong={currentSong?.id === rec.song.id}
                    isLiked={likedSongIds.has(rec.song.id)}
                    onPlayToggle={handlePlayToggle}
                    onLikeToggle={handleToggleLike}
                    onInspectVector={(s) => setInspectingSong(s)}
                    onOpenSpotify={(s) => setSpotifyEmbedSong(s)}
                    onAddToPlaylist={(s) => {
                      setSongToAddToPlaylist(s);
                      setIsAddToPlaylistOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardView
            tasteProfile={userTasteProfile}
            history={history}
            currentSong={currentSong || catalog[0] || MOCK_SONG_CATALOG[0]!}
            isPlaying={isPlaying}
            onPlaySong={handlePlayToggle}
            onToggleLike={handleToggleLike}
            onClearHistory={handleClearHistory}
            onSimulateListen={handleSimulateListen}
            allSongs={catalog}
          />
        )}

        {/* VIEW 3: Container Catalog Library */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl backdrop-blur-xl bg-[#0b0b10]/70 border border-white/10 ring-1 ring-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <span>Taste-Aligned Catalog (100 Tracks)</span>
                  <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <span>Taste-Aligned Catalog (100 Tracks)</span>
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    pgvector Cosine Nearest
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    pgvector Cosine Nearest
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1 max-w-xl">
                  These 50 tracks are dynamically selected from PostgreSQL based on <strong>@{displayUser.username}</strong>'s 8D taste vector (calculated from listening history &amp; liked songs).
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => loadCatalog()}
                  onClick={() => loadCatalog()}
                  className="px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/20"
                  title="Re-query top 50 tracks closest to user's updated taste vector"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Re-align 100 to Taste</span>
                  <Sparkles className="w-4 h-4" />
                  <span>Re-align 100 to Taste</span>
                </button>

                <button
                  onClick={() => setIsRealSongSearchOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-xs transition-all flex items-center gap-2 hover:bg-white/90 shadow-lg shadow-white/10"
                >
                  <Search className="w-4 h-4" />
                  <span>Preview &amp; Like Any Track</span>
                  <span>Preview &amp; Like Any Track</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  'All',
                  'Synthwave',
                  'Nu-Disco / Pop',
                  'Lo-Fi Chill',
                  'Cyber Techno',
                  'Indie Folk',
                  'Neo-Soul / R&B',
                  'Alt Rock',
                  'Cinematic Ambient',
                ].map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors border ${
                      selectedGenre === g
                        ? 'bg-white text-black font-semibold border-white'
                        : 'bg-white/[0.03] text-white/60 border-white/10 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-[11px] font-mono text-white/40 whitespace-nowrap hidden md:inline">
                  {filteredCatalog.length} of {catalog.length} loaded tracks
                </span>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search catalog by title, artist..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-500/80"
                  />
                </div>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCatalog.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isPlaying={isPlaying}
                  isCurrentSong={currentSong?.id === song.id}
                  isLiked={likedSongIds.has(song.id)}
                  onPlayToggle={handlePlayToggle}
                  onLikeToggle={handleToggleLike}
                  onInspectVector={(s) => setInspectingSong(s)}
                  onOpenSpotify={(s) => setSpotifyEmbedSong(s)}
                  onAddToPlaylist={(s) => {
                    setSongToAddToPlaylist(s);
                    setIsAddToPlaylistOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: Playlists */}
        {activeTab === 'playlists' && (
          <PlaylistsView
            currentUser={displayUser}
            currentSong={currentSong || catalog[0] || MOCK_SONG_CATALOG[0]!}
            isPlaying={isPlaying}
            onPlaySong={handlePlayToggle}
            onToggleLike={handleToggleLike}
            likedSongIds={likedSongIds}
            allSongs={catalog}
            onInspectVector={(s) => setInspectingSong(s)}
            onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
          />
        )}
      </main>

      {/* Persistent Audio Player Bar */}
      {currentSong && (
        <AudioPlayerBar
          currentSong={currentSong}
          isPlaying={isPlaying}
          onTogglePlay={() => {
            if (isPlaying) {
              audioSynthesizer.stopPlayback();
              setIsPlaying(false);
            } else {
              audioSynthesizer.playSong(currentSong);
              setIsPlaying(true);
              recordListeningSession(currentSong);
            }
          }}
          onNext={handleNextSong}
          onPrevious={handlePreviousSong}
          isLiked={likedSongIds.has(currentSong.id)}
          onToggleLike={handleToggleLike}
          onInspectVector={(s) => setInspectingSong(s)}
          onOpenSpotify={(s) => setSpotifyEmbedSong(s)}
        />
      )}

      {/* Architecture Drawer */}
      <PgVectorArchitectureDrawer
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
        currentQueryPlan={queryPlan}
        targetVector={effectiveQueryVector}
        metric={vectorMetric}
        onChangeMetric={setVectorMetric}
      />

      {/* Vector Inspector Modal */}
      <VectorInspectorModal
        song={inspectingSong}
        comparisonVector={effectiveQueryVector}
        comparisonLabel="Active Query Target"
        onClose={() => setInspectingSong(null)}
        onOpenSpotify={(s) => setSpotifyEmbedSong(s)}
      />

      {/* Spotify Embed Modal */}
      <SpotifyEmbedModal song={spotifyEmbedSong} onClose={() => setSpotifyEmbedSong(null)} />

      {/* Search Modal */}
      <RealSongSearchModal
        isOpen={isRealSongSearchOpen}
        onClose={() => setIsRealSongSearchOpen(false)}
        onAddSongToCatalog={handleAddSongToCatalog}
        onPlaySong={handlePlayToggle}
        currentPlayingSong={currentSong || catalog[0]!}
        isPlaying={isPlaying}
        likedSongIds={likedSongIds}
        onToggleLike={handleToggleLike}
        likedSongIds={likedSongIds}
        onToggleLike={handleToggleLike}
      />

      {/* Taste Profile Modal */}
      <TasteProfileModal
        isOpen={isTasteProfileModalOpen}
        onClose={() => setIsTasteProfileModalOpen(false)}
        user={activeUser}
        tasteProfile={userTasteProfile}
        onUpdateTasteVector={handleVectorChange}
        onResetTasteVector={handleResetTasteVector}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={isUserDetailsModalOpen}
        onClose={() => setIsUserDetailsModalOpen(false)}
        user={activeUser}
        onUserUpdated={(updated) => setActiveUser(updated)}
        historyCount={history.length}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        vectorMetric={vectorMetric}
        onChangeMetric={setVectorMetric}
        currentUser={activeUser}
        onSwitchUser={handleSwitchUser}
        onOpenNewUserPrompt={() => setIsCreateUserPromptOpen(true)}
        onGoToLandingPage={() => setShowLandingPage(true)}
      />

      {/* Create User Prompt Modal */}
      {isCreateUserPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            className="w-full max-w-md bg-[#0d0d14] border border-white/10 rounded-2xl p-6 text-zinc-100 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Create New User Profile</h3>
              </div>
              <button
                onClick={() => setIsCreateUserPromptOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newUserName.trim()) return;
                handleCreateAndLaunchUser(newUserName.trim(), newUserEmail.trim() || undefined);
                setNewUserName('');
                setNewUserEmail('');
                setIsCreateUserPromptOpen(false);
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs text-white/70">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luna"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/70">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. luna@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserPromptOpen(false)}
                  className="px-3.5 py-2 text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold"
                >
                  Create &amp; Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isAddToPlaylistOpen}
        onClose={() => {
          setIsAddToPlaylistOpen(false);
          setSongToAddToPlaylist(null);
        }}
        song={songToAddToPlaylist}
        currentUser={displayUser}
      />
    </div>
  );
}
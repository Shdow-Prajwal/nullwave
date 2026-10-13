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
  Info,
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
import { ListMusic, Sparkles as SparklesIcon } from 'lucide-react';

export default function App() {
  // Navigation tabs (including Relational Playlists)
  const [activeTab, setActiveTab] = useState<'recommender' | 'dashboard' | 'library' | 'playlists'>('recommender');

  // Landing / Splash screen state
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);

  // Active Relational Database User
  const [activeUser, setActiveUser] = useState<UserDbRecord | null>(null);

  // Dynamic Catalog State (populated from complete relational database)
  const [catalog, setCatalog] = useState<Song[]>(() => relationalDbService.getAllSongs());

  // Playback state
  const [currentSong, setCurrentSong] = useState<Song>(() => {
    const all = relationalDbService.getAllSongs();
    return all.length > 0 ? all[0]! : MOCK_SONG_CATALOG[0]!;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Vector Tuner & Query state (initialized from default or active user's taste vector)
  const [targetVector, setTargetVector] = useState<MusicVector>(() =>
    arrayToMusicVector(DEFAULT_TASTE_VECTOR_ARRAY)
  );

  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [blendHistoryRatio, setBlendHistoryRatio] = useState<number>(0.35); // 35% history blend
  const [vectorMetric, setVectorMetric] = useState<VectorDistanceMetric>('cosine');

  // User Listening History & Liked Songs State (synchronized with relational database)
  const [history, setHistory] = useState<HistoryRecord[]>(INITIAL_LISTENING_HISTORY);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(() =>
    relationalDbService.getLikedSongCodes(1)
  );

  // Modals & Drawers
  const [inspectingSong, setInspectingSong] = useState<Song | null>(null);
  const [spotifyEmbedSong, setSpotifyEmbedSong] = useState<Song | null>(null);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isRealSongSearchOpen, setIsRealSongSearchOpen] = useState(false);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);

  // Dedicated Top-Right User Dropdown Modals
  const [isTasteProfileModalOpen, setIsTasteProfileModalOpen] = useState(false);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateUserPromptOpen, setIsCreateUserPromptOpen] = useState(false);

  // Search filter for catalog library
  const [librarySearch, setLibrarySearch] = useState('');

  // Prompt state for creating a new user from inside the app
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  // 1. Initialize active user from localStorage/relational db service
  useEffect(() => {
    const current = userDbService.getActiveUser();
    if (current) {
      setActiveUser(current);
      if (current.taste_vector && current.taste_vector.length === 8) {
        setTargetVector(arrayToMusicVector(current.taste_vector));
      }
    } else {
      const all = userDbService.getAllUsers();
      if (all.length > 0) {
        const first = userDbService.setActiveUser(all[0]!.user_id);
        setActiveUser(first);
        if (first?.taste_vector) {
          setTargetVector(arrayToMusicVector(first.taste_vector));
        }
      }
    }

    // Subscribe to DB updates
    const unsubscribe = userDbService.subscribe(() => {
      const updatedUser = userDbService.getActiveUser();
      setActiveUser(updatedUser);
    });

    return () => unsubscribe();
  }, []);

  // Synchronize catalog and liked songs from relational database engine
  useEffect(() => {
    const syncDb = () => {
      const songs = relationalDbService.getAllSongs();
      setCatalog(songs);
      pgVectorService.setCatalog(songs);
      const uid = activeUser?.user_id || 1;
      setLikedSongIds(relationalDbService.getLikedSongCodes(uid));
    };
    syncDb();
    const unsub = relationalDbService.subscribe(syncDb);
    return () => unsub();
  }, [activeUser?.user_id]);

  // 2. Synthesize user taste profile vector from listening history
  const userTasteProfile = useMemo(() => {
    return pgVectorService.synthesizeUserTaste(history);
  }, [history]);

  // 3. Compute effective query vector by blending target vector with user's history taste vector
  const effectiveQueryVector = useMemo(() => {
    const targetArr = musicVectorToArray(targetVector);
    const historyArr = musicVectorToArray(userTasteProfile.tasteVector);
    const blendedArr = interpolateVectors(targetArr, historyArr, blendHistoryRatio);
    return arrayToMusicVector(blendedArr);
  }, [targetVector, userTasteProfile.tasteVector, blendHistoryRatio]);

  // 4. Execute Vector KNN Query against pgvector engine
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

  // 5. Connect Sliders to Database: Update targetVector AND write to PostgreSQL users table
  const handleVectorChange = useCallback(
    (updated: MusicVector) => {
      setTargetVector(updated);
      if (activeUser) {
        const arr = musicVectorToArray(updated);
        userDbService.updateUserTasteVector(activeUser.user_id, arr);
      }
    },
    [activeUser]
  );

  // Create & launch user from Landing Page onboarding or In-App prompt
  const handleCreateAndLaunchUser = (username: string, email?: string) => {
    const newUser = userDbService.createUser(
      username,
      email,
      musicVectorToArray(targetVector)
    );
    setActiveUser(newUser);
    setShowLandingPage(false);
  };

  // Switch to another existing database user
  const handleSwitchUser = (userId: number) => {
    const user = userDbService.setActiveUser(userId);
    if (user) {
      setActiveUser(user);
      if (user.taste_vector && user.taste_vector.length === 8) {
        setTargetVector(arrayToMusicVector(user.taste_vector));
      }
    }
  };

  // Reset taste vector from Taste Profile Modal
  const handleResetTasteVector = () => {
    const defaultVec = arrayToMusicVector(DEFAULT_TASTE_VECTOR_ARRAY);
    setTargetVector(defaultVec);
    if (activeUser) {
      userDbService.resetUserTasteVector(activeUser.user_id);
    }
  };

  // Record a listen in history when a song is played (updates state & listen_history table)
  const recordListeningSession = useCallback(
    (song: Song, completion: number = 100) => {
      const uid = activeUser?.user_id || 1;
      relationalDbService.recordListen(uid, song.id, completion >= 80 ? 5 : undefined);

      setHistory((prev) => {
        const newRecord: HistoryRecord = {
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          songId: song.id,
          song,
          listenedAt: new Date().toISOString(),
          completionPercent: completion,
          userLiked: likedSongIds.has(song.id),
          contextVibe: song.genre,
        };
        return [newRecord, ...prev.slice(0, 49)];
      });
    },
    [activeUser?.user_id, likedSongIds]
  );

  // Play / Pause toggle
  const handlePlayToggle = (song: Song) => {
    if (currentSong.id === song.id && isPlaying) {
      audioSynthesizer.stopPlayback();
      setIsPlaying(false);
    } else {
      setCurrentSong(song);
      audioSynthesizer.playSong(song);
      setIsPlaying(true);
      recordListeningSession(song);
    }
  };

  // Next / Previous song handlers
  const handleNextSong = useCallback(() => {
    const currentIndex = catalog.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % catalog.length;
    const nextSong = catalog[nextIndex]!;
    setCurrentSong(nextSong);
    if (isPlaying) {
      audioSynthesizer.playSong(nextSong);
      recordListeningSession(nextSong);
    }
  }, [catalog, currentSong.id, isPlaying, recordListeningSession]);

  const handlePreviousSong = useCallback(() => {
    const currentIndex = catalog.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + catalog.length) % catalog.length;
    const prevSong = catalog[prevIndex]!;
    setCurrentSong(prevSong);
    if (isPlaying) {
      audioSynthesizer.playSong(prevSong);
      recordListeningSession(prevSong);
    }
  }, [catalog, currentSong.id, isPlaying, recordListeningSession]);

  // Like toggle: persists to PostgreSQL playlist_tracks & listen_history tables
  const handleToggleLike = (songId: string) => {
    const uid = activeUser?.user_id || 1;
    const isNowLiked = relationalDbService.toggleLikeSong(uid, songId);
    const updatedLiked = relationalDbService.getLikedSongCodes(uid);
    setLikedSongIds(updatedLiked);

    setHistory((prev) =>
      prev.map((r) => (r.songId === songId ? { ...r, userLiked: isNowLiked } : r))
    );
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleSimulateListen = (song: Song) => {
    recordListeningSession(song, Math.floor(Math.random() * 30 + 70));
  };

  // Dynamically add new real song to 11 relational database tables & pgvector
  const handleAddSongToCatalog = (newSong: Song) => {
    relationalDbService.insertSong(newSong);
    pgVectorService.insertSong(newSong);
    setCatalog(relationalDbService.getAllSongs());
  };

  // Dynamically expand catalog with fresh seeds across genres
  const handleExpandCatalog = (count: number = 8) => {
    relationalDbService.expandCatalogWithGeneratedSeeds(count);
    const all = relationalDbService.getAllSongs();
    setCatalog(all);
    pgVectorService.setCatalog(all);
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

  // Fallback default user for header if user enters app directly
  const displayUser: UserDbRecord = activeUser || {
    user_id: 1,
    username: 'Guest Explorer',
    email: 'guest@vectorvibe.local',
    created_at: new Date().toISOString(),
    taste_vector: DEFAULT_TASTE_VECTOR_ARRAY,
  };

  // ── 1. Render Landing / Splash Page if requested ──
  if (showLandingPage) {
    return (
      <>
        <LandingPage
          currentUser={activeUser}
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

  // ── 2. Render Main Application Studio ──
  return (
    <div className="min-h-screen bg-[#101116] text-[#f5f3f7] flex flex-col relative pb-36 font-sans aura-app-shell">
      {/* Dynamic Atmospheric Background */}
      <DynamicGenreBackground currentGenre={currentSong.genre} isPlaying={isPlaying} />

      {/* Aura-inspired sidebar navigation; the existing views and controls remain unchanged. */}
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
          <button aria-label="Catalog" title={`Catalog contains ${catalog.length} curated tracks`} onClick={() => setActiveTab('library')} className={`aura-nav-item ${activeTab === 'library' ? 'is-active' : ''}`}><Music /></button>
          <button aria-label="Playlists" title="Playlists" onClick={() => setActiveTab('playlists')} className={`aura-nav-item ${activeTab === 'playlists' ? 'is-active' : ''}`}><ListMusic /></button>
          <button aria-label="Search songs" title="Search songs" onClick={() => setIsRealSongSearchOpen(true)} className="aura-nav-item"><Search /></button>
          <button aria-label="Database tables" title="Database tables" onClick={() => setIsArchitectureModalOpen(true)} className="aura-nav-item"><Database /></button>
        </nav>
        <UserHeaderMenu
          user={displayUser}
          tasteProfile={userTasteProfile}
          onOpenTasteProfileModal={() => setIsTasteProfileModalOpen(true)}
          onOpenUserDetailsModal={() => setIsUserDetailsModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenNewUserPrompt={() => setIsCreateUserPromptOpen(true)}
          onGoToLandingPage={() => setShowLandingPage(true)}
        />
      </header> 

      {/* Existing main content keeps its original grid and section order. */}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex-1 w-full space-y-8">
        {/* VIEW 1: Recommender & Vector Explorer */}
        {activeTab === 'recommender' && (
          <div className="space-y-8">
            {/* Hero Intro */}
            <div className="relative pt-4 pb-2">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div className="max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-violet-300">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Acoustic pgvector · Real Studio Previews</span>
                  </div>
                  <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[#f2ece4] leading-[0.95]">
                    Find the feeling.
                  </h1>
                  <p className="text-sm sm:text-base text-white/70 max-w-xl">
                    High-dimensional music discovery that learns your mood, energy, and acoustic taste
                    in milliseconds. Powered by 8D vector embeddings and PostgreSQL pgvector.
                  </p>
                </div>

                {/* Right: Signature Cosmic Button */}
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

              {/* 3 Metrics Cards Row */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl p-5 backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-1">
                    1.2M+
                  </div>
                  <div className="text-xs font-medium text-white/90">Kaggle Spotify Dataset</div>
                  <div className="text-[11px] text-white/50 mt-1">
                    {catalog.length} curated tracks in active memory cache
                  </div>
                </div>

                <div className="rounded-2xl p-5 backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-1">
                    8-Dim
                  </div>
                  <div className="text-xs font-medium text-white/90">pgvector Space</div>
                  <div className="text-[11px] text-white/50 mt-1">
                    Dance, Energy, Valence, BPM, Vibe, Acoustic harmonics
                  </div>
                </div>

                <div className="rounded-2xl p-5 backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 shadow-lg">
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

            {/* Collapsible Vector Tuner (Connected directly to relational DB) */}
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

            {/* Recommendations Grid Section */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-2 tracking-tight">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <span>Acoustic Recommendations</span>
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    Live cosine similarity matching across Spotify dataset via pgvector KNN
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

              {/* Cards Grid in frosted glass */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recommendations.map((rec) => (
                  <SongCard
                    key={rec.song.id}
                    song={rec.song}
                    recommendation={rec}
                    isPlaying={isPlaying}
                    isCurrentSong={currentSong.id === rec.song.id}
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

        {/* VIEW 2: Personalized Taste Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardView
            tasteProfile={userTasteProfile}
            history={history}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={handlePlayToggle}
            onToggleLike={handleToggleLike}
            onClearHistory={handleClearHistory}
            onSimulateListen={handleSimulateListen}
            allSongs={catalog}
          />
        )}

        {/* VIEW 3: Full Song & Vector Catalog Library */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl backdrop-blur-xl bg-[#0b0b10]/70 supports-[backdrop-filter]:bg-[#0b0b10]/50 border border-white/10 ring-1 ring-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-white tracking-tight">
                    Spotify &amp; pgvector Catalog
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/15 text-amber-300 border border-amber-500/25">
                    {catalog.length} In-Memory Tracks
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                    Kaggle 1.2M+ Real Songs
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1 max-w-xl">
                  Curated tracks spanning Daft Punk, The Weeknd, Arctic Monkeys, Kavinsky, SZA, and more.
                  Each track contains real studio audio preview streaming and 8D acoustic embeddings.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => handleExpandCatalog(8)}
                  className="px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/20"
                  title="Generate 8 fresh diverse tracks and insert into tracks and audio_features tables"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Grow Catalog (+8)</span>
                </button>

                <button
                  onClick={() => setIsRealSongSearchOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-xs transition-all flex items-center gap-2 hover:bg-white/90 shadow-lg shadow-white/10"
                >
                  <Search className="w-4 h-4" />
                  <span>Search &amp; Import Any Track</span>
                </button>
              </div>
            </div>

            {/* Clear user-facing explanation of the '39' count and local memory cache purpose */}
            <div className="p-4 sm:p-5 rounded-2xl backdrop-blur-xl bg-amber-500/[0.04] border border-amber-500/20 ring-1 ring-amber-500/10 flex flex-col sm:flex-row items-start gap-3.5 text-xs">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-white text-sm">
                    Why does the Catalog indicate ({catalog.length})?
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30 font-medium">
                    Local Memory Cache &amp; Relational Engine
                  </span>
                </div>
                <p className="text-white/80 leading-relaxed">
                  The <strong className="text-amber-300 font-semibold">{catalog.length}</strong> count represents the active in-memory cached subset of tracks loaded into the PostgreSQL <code className="text-violet-300 font-mono">tracks</code> and <code className="text-violet-300 font-mono">audio_features</code> tables.
                </p>
                <p className="text-white/55 leading-relaxed text-[11px]">
                  Keeping this curated subset directly in active memory guarantees sub-millisecond 8D vector cosine distance queries and instant browser audio synthesis. You can expand variety at any time using <span className="text-white/85 font-medium">"Grow Catalog (+8)"</span> or import real music worldwide via <span className="text-white/85 font-medium">"Search &amp; Import Any Track"</span>. Every new song executes real <code className="text-emerald-300 font-mono">INSERT INTO</code> relational queries!
                </p>
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
                  {filteredCatalog.length} of {catalog.length} cached tracks
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

            {/* Catalog Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCatalog.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isPlaying={isPlaying}
                  isCurrentSong={currentSong.id === song.id}
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

        {/* VIEW 4: Relational Playlists & Collections */}
        {activeTab === 'playlists' && (
          <PlaylistsView
            currentUser={displayUser}
            currentSong={currentSong}
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

      {/* Persistent Bottom Audio Player Bar */}
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

      {/* PostgreSQL + pgvector Architecture Center Drawer */}
      <PgVectorArchitectureDrawer
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
        currentQueryPlan={queryPlan}
        targetVector={effectiveQueryVector}
        metric={vectorMetric}
        onChangeMetric={setVectorMetric}
      />

      {/* Single Song Vector Inspector Modal */}
      <VectorInspectorModal
        song={inspectingSong}
        comparisonVector={effectiveQueryVector}
        comparisonLabel="Active Query Target"
        onClose={() => setInspectingSong(null)}
        onOpenSpotify={(s) => setSpotifyEmbedSong(s)}
      />

      {/* Spotify Player Embed Modal */}
      <SpotifyEmbedModal song={spotifyEmbedSong} onClose={() => setSpotifyEmbedSong(null)} />

      {/* Real Song Live Search & Import Modal */}
      <RealSongSearchModal
        isOpen={isRealSongSearchOpen}
        onClose={() => setIsRealSongSearchOpen(false)}
        onAddSongToCatalog={handleAddSongToCatalog}
        onPlaySong={handlePlayToggle}
        currentPlayingSong={currentSong}
        isPlaying={isPlaying}
      />

      {/* Dedicated Taste Profile Modal Dialog */}
      <TasteProfileModal
        isOpen={isTasteProfileModalOpen}
        onClose={() => setIsTasteProfileModalOpen(false)}
        user={activeUser}
        tasteProfile={userTasteProfile}
        onUpdateTasteVector={handleVectorChange}
        onResetTasteVector={handleResetTasteVector}
      />

      {/* Dedicated User Details Modal Dialog */}
      <UserDetailsModal
        isOpen={isUserDetailsModalOpen}
        onClose={() => setIsUserDetailsModalOpen(false)}
        user={activeUser}
        onUserUpdated={(updated) => setActiveUser(updated)}
        historyCount={history.length}
      />

      {/* Dedicated Settings Modal Dialog */}
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

      {/* In-App Create User Prompt Modal */}
      {isCreateUserPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl p-6 text-zinc-100 ring-1 ring-white/5 relative"
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
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-500/80"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/70">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. luna@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-500/80"
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

      {/* Dedicated Add to Playlist Modal */}
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

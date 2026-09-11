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
  Clock,
  Layers,
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
} from './services/vectorDb/vectorMath';
import { PgVectorQueryPlan, VectorDistanceMetric } from './services/vectorDb/types';
import { DynamicGenreBackground } from './components/DynamicGenreBackground';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { SongCard } from './components/SongCard';
import { VectorTuner } from './components/VectorTuner';
import { DashboardView } from './components/DashboardView';
import { PgVectorArchitectureDrawer } from './components/PgVectorArchitectureDrawer';
import { VectorInspectorModal } from './components/VectorInspectorModal';
import { SpotifyEmbedModal } from './components/SpotifyEmbedModal';
import { RealSongSearchModal } from './components/RealSongSearchModal';
import { NullwaveHero } from './components/NullwaveHero';
import { ScheduleStationsSection } from './components/ScheduleStationsSection';
import { SignalChainSection } from './components/SignalChainSection';
import { AudioBedMixerSection } from './components/AudioBedMixerSection';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'recommender' | 'stations' | 'dashboard' | 'library'>('recommender');

  // Dynamic Catalog State (seeded with Kaggle Spotify 39 real tracks)
  const [catalog, setCatalog] = useState<Song[]>(MOCK_SONG_CATALOG);

  // Playback state
  const [currentSong, setCurrentSong] = useState<Song>(MOCK_SONG_CATALOG[0]!);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Vector Tuner & Query state
  const [targetVector, setTargetVector] = useState<MusicVector>({
    danceability: 0.82,
    energy: 0.78,
    valence: 0.65,
    beatsBpmNormalized: bpmToNormalized(118),
    vibeChillToHype: 0.72,
    acousticness: 0.1,
    instrumentalness: 0.75,
    moodHarmonics: 0.45,
  });

  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [blendHistoryRatio, setBlendHistoryRatio] = useState<number>(0.35); // 35% history blend by default
  const [vectorMetric, setVectorMetric] = useState<VectorDistanceMetric>('cosine');

  // User Listening History State (seeded with realistic past sessions)
  const [history, setHistory] = useState<HistoryRecord[]>(INITIAL_LISTENING_HISTORY);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(
    new Set(['pop-01', 'sw-01', 'lo-01', 'soul-01'])
  );

  // Modals & Drawers
  const [inspectingSong, setInspectingSong] = useState<Song | null>(null);
  const [spotifyEmbedSong, setSpotifyEmbedSong] = useState<Song | null>(null);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isRealSongSearchOpen, setIsRealSongSearchOpen] = useState(false);

  // Search filter for catalog library
  const [librarySearch, setLibrarySearch] = useState('');

  // 1. Synthesize user taste profile vector from listening history
  const userTasteProfile = useMemo(() => {
    return pgVectorService.synthesizeUserTaste(history);
  }, [history]);

  // 2. Compute effective query vector by blending target vector with user's history taste vector
  const effectiveQueryVector = useMemo(() => {
    const targetArr = musicVectorToArray(targetVector);
    const historyArr = musicVectorToArray(userTasteProfile.tasteVector);
    const blendedArr = interpolateVectors(targetArr, historyArr, blendHistoryRatio);
    return arrayToMusicVector(blendedArr);
  }, [targetVector, userTasteProfile.tasteVector, blendHistoryRatio]);

  // 3. Execute Vector KNN Query against pgvector engine
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

  // Record a listen in history when a song is played
  const recordListeningSession = useCallback((song: Song, completion: number = 100) => {
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
      // Keep most recent 50 sessions
      return [newRecord, ...prev.slice(0, 49)];
    });
  }, [likedSongIds]);

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

  // Like toggle
  const handleToggleLike = (songId: string) => {
    setLikedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });

    // Update history record if present
    setHistory((prev) =>
      prev.map((r) => (r.songId === songId ? { ...r, userLiked: !likedSongIds.has(songId) } : r))
    );
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleSimulateListen = (song: Song) => {
    recordListeningSession(song, Math.floor(Math.random() * 30 + 70));
  };

  // Dynamically add new real song to vector database
  const handleAddSongToCatalog = (newSong: Song) => {
    pgVectorService.insertSong(newSong);
    setCatalog((prev) => {
      if (prev.some((s) => s.id === newSong.id)) return prev;
      return [newSong, ...prev];
    });
  };

  // Callback when user clicks "SET" in the VectorTuner
  const handleApplyVector = (newVector: MusicVector, newGenre: string, newBlend: number) => {
    setTargetVector(newVector);
    setSelectedGenre(newGenre);
    setBlendHistoryRatio(newBlend);
  };

  // Station preset select handler from Stations/Schedule view
  const handleSelectStation = (presetVector: MusicVector, genre: string, targetSong?: Song) => {
    setTargetVector(presetVector);
    setSelectedGenre(genre);
    if (targetSong) {
      setCurrentSong(targetSong);
      audioSynthesizer.playSong(targetSong);
      setIsPlaying(true);
      recordListeningSession(targetSong);
    }
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

  const currentTheme = GENRE_THEMES[currentSong.genre] || GENRE_THEMES.Synthwave;

  return (
    <div className="min-h-screen bg-[#0C0E12] text-[#E2E4E7] flex flex-col relative pb-32 font-mono selection:bg-[#FF6B6B]/30 selection:text-white">
      {/* 1. Dynamic Genre Atmospheric Background */}
      <DynamicGenreBackground
        currentGenre={currentSong.genre}
        isPlaying={isPlaying}
      />

      {/* 2. Top Navigation Bar matching NULLWAVE aesthetics */}
      <header className="sticky top-0 z-40 border-b border-[#232733] bg-[#0C0E12]/92 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo with NULLWAVE circle-slash badge */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center relative shrink-0 cursor-pointer"
              onClick={() => setActiveTab('recommender')}
            >
              <div className="w-4 h-[2px] bg-white absolute top-1/2 -translate-y-1/2" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base tracking-[0.2em] uppercase text-white">
                  NULLWAVE
                </span>
                <span className="hidden sm:inline-block font-mono text-[10px] text-neutral-400">
                  // VECTORVIBE
                </span>
              </div>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest -mt-0.5 hidden md:block">
                Music for reading &amp; coding
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1 rounded-2xl bg-[#12141A] border border-[#232733] text-xs">
            <button
              onClick={() => setActiveTab('recommender')}
              className={`px-3.5 py-1.5 rounded-xl font-display font-semibold uppercase tracking-wider text-xs transition-all flex items-center gap-1.5 ${
                activeTab === 'recommender'
                  ? 'bg-[#232733] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B6B]" />
              <span>Recommendations</span>
            </button>

            <button
              onClick={() => setActiveTab('stations')}
              className={`px-3.5 py-1.5 rounded-xl font-display font-semibold uppercase tracking-wider text-xs transition-all flex items-center gap-1.5 ${
                activeTab === 'stations'
                  ? 'bg-[#232733] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Stations &amp; Schedule</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl font-display font-semibold uppercase tracking-wider text-xs transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-[#232733] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Taste Dashboard</span>
              <span className="sm:hidden">Taste</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`px-3.5 py-1.5 rounded-xl font-display font-semibold uppercase tracking-wider text-xs transition-all flex items-center gap-1.5 ${
                activeTab === 'library'
                  ? 'bg-[#232733] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Catalog ({catalog.length})</span>
              <span className="sm:hidden">({catalog.length})</span>
            </button>
          </nav>

          {/* Right Action: Live On-air indicator & Global Search / pgvector modal */}
          <div className="flex items-center gap-2.5">
            {/* Live on air badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12141A] border border-[#232733] text-[11px] font-mono uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" />
              <span className="text-neutral-400">On air:</span>
              <b className="text-white font-semibold truncate max-w-[140px]">
                {currentSong.title}
              </b>
            </div>

            <button
              onClick={() => setIsRealSongSearchOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1DB954]/20 border border-[#1DB954]/40 text-[#1DB954] hover:text-white text-xs font-display uppercase font-bold hover:border-[#1DB954] transition-all shadow-sm"
              title="Search and import any real song worldwide"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search Songs</span>
            </button>

            <button
              onClick={() => setIsArchitectureModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12141A] border border-[#232733] hover:border-cyan-500/40 text-neutral-300 hover:text-cyan-300 text-xs font-mono transition-all"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>pgvector</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex-1 w-full space-y-8">
        {/* VIEW 1: Recommender & Vector Explorer */}
        {activeTab === 'recommender' && (
          <div className="space-y-8">
            {/* Cyberpunk NULLWAVE Hero with Audio Player & Live Waveform */}
            <NullwaveHero
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
              onExploreStations={() => setActiveTab('stations')}
              onSearchRealSongs={() => setIsRealSongSearchOpen(true)}
            />

            {/* Collapsible Acoustic Vector Tuner with "SET" Refresh Button */}
            <VectorTuner
              targetVector={targetVector}
              onApplyVector={handleApplyVector}
              selectedGenre={selectedGenre}
              blendHistoryRatio={blendHistoryRatio}
              userHistoryVector={userTasteProfile.tasteVector}
            />

            {/* Recommendations Grid Section */}
            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232733] pb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FF6B6B]" />
                    <span>Top Real Song Recommendations</span>
                  </h2>
                  <p className="text-xs font-mono text-neutral-400 mt-1">
                    Live cosine similarity matching across Kaggle Spotify dataset via pgvector KNN
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
                  <span className="px-2.5 py-1 rounded-lg bg-[#12141A] border border-[#232733]">
                    {recommendations.length} Results
                  </span>
                  <button
                    onClick={() => setIsArchitectureModalOpen(true)}
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 text-xs font-mono"
                  >
                    SQL Query ({queryPlan.executionTimeMs}ms)
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
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
                  />
                ))}
              </div>
            </div>

            {/* Bottom Quick Stations Teaser */}
            <div className="pt-8 border-t border-[#232733] flex flex-wrap items-center justify-between gap-4">
              <div>
                <b className="font-display uppercase text-sm text-white block">
                  Looking for curated radio channels?
                </b>
                <span className="font-mono text-xs text-neutral-400">
                  Switch to the Stations &amp; Schedule view to tune Focus, Night Drive, Deep Read, and Tape Room.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('stations')}
                className="px-4 py-2 rounded-xl bg-[#12141A] hover:bg-[#181B22] border border-[#232733] hover:border-[#FF6B6B] text-white font-display text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2"
              >
                <Radio className="w-3.5 h-3.5 text-[#FF6B6B]" />
                <span>Open Radio Stations &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: Stations & Schedule + Signal Chain + Audio Bed Mixer */}
        {activeTab === 'stations' && (
          <div className="space-y-12">
            {/* Header banner */}
            <div className="p-6 rounded-3xl bg-[#12141A] border border-[#232733] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#FF6B6B]">
                  Live Net Radio Station
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mt-1">
                  Stations, Schedule &amp; Signal Chain
                </h1>
                <p className="font-mono text-xs text-neutral-400 mt-1 max-w-xl">
                  Rain, drones, slow arpeggios and machine hum. Pick any station or timetable slot
                  to snap the acoustic vector and stream high-fidelity audio.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handlePlayToggle(currentSong);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FF6B6B] text-black font-display font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isPlaying ? 'Streaming Live' : 'Start Stream'}</span>
                </button>
              </div>
            </div>

            {/* 1. Four Stations & Today on Air */}
            <ScheduleStationsSection
              currentSong={currentSong}
              isPlaying={isPlaying}
              onSelectStation={handleSelectStation}
              catalog={catalog}
            />

            {/* 2. Signal Transmission Route & Technical Studio Signal Chain */}
            <SignalChainSection />

            {/* 3. Audio Bed 3-Layer Waveform Mixer */}
            <AudioBedMixerSection />
          </div>
        )}

        {/* VIEW 3: Personalized Taste Dashboard */}
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

        {/* VIEW 4: Full Song & Vector Catalog Library */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="p-6 rounded-3xl bg-[#12141A] border border-[#232733] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-white">
                    Spotify &amp; pgvector Catalog
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Kaggle 1.2M+ Real Songs
                  </span>
                </div>
                <p className="font-mono text-xs text-neutral-400 mt-1 max-w-xl">
                  Curated tracks spanning Daft Punk, The Weeknd, Arctic Monkeys, Kavinsky, SZA, and more.
                  Each track contains real studio audio preview streaming and 8D acoustic embeddings.
                </p>
              </div>

              <button
                onClick={() => setIsRealSongSearchOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-[#1DB954]/20 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search &amp; Import Any Track</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['All', 'Synthwave', 'Nu-Disco / Pop', 'Lo-Fi Chill', 'Cyber Techno', 'Indie Folk', 'Neo-Soul / R&B', 'Alt Rock', 'Cinematic Ambient'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3 py-1.5 rounded-xl font-mono whitespace-nowrap transition-colors border ${
                      selectedGenre === g
                        ? 'bg-[#FF6B6B] text-black font-bold border-[#FF6B6B]'
                        : 'bg-[#12141A] text-neutral-400 border-[#232733] hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search catalog by title, artist..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#12141A] border border-[#232733] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6B6B]/60 font-mono"
                />
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
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 3. Persistent Bottom Audio Player Bar with Real Studio Stream & Live Equalizer */}
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

      {/* 4. PostgreSQL + pgvector Architecture Center Drawer */}
      <PgVectorArchitectureDrawer
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
        currentQueryPlan={queryPlan}
        targetVector={effectiveQueryVector}
        metric={vectorMetric}
        onChangeMetric={setVectorMetric}
      />

      {/* 5. Single Song Vector Inspector Modal */}
      <VectorInspectorModal
        song={inspectingSong}
        comparisonVector={effectiveQueryVector}
        comparisonLabel="Active Query Target"
        onClose={() => setInspectingSong(null)}
        onOpenSpotify={(s) => setSpotifyEmbedSong(s)}
      />

      {/* 6. Spotify Player Embed Modal */}
      <SpotifyEmbedModal
        song={spotifyEmbedSong}
        onClose={() => setSpotifyEmbedSong(null)}
      />

      {/* 7. Real Song Live Search & Import Modal */}
      <RealSongSearchModal
        isOpen={isRealSongSearchOpen}
        onClose={() => setIsRealSongSearchOpen(false)}
        onAddSongToCatalog={handleAddSongToCatalog}
        onPlaySong={handlePlayToggle}
        currentPlayingSong={currentSong}
        isPlaying={isPlaying}
      />
    </div>
  );
}

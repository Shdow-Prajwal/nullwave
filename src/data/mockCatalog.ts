import { GenreTheme, HistoryRecord, MusicGenre, Song } from "../types/music";

export const GENRE_THEMES: Record<MusicGenre, GenreTheme> = {
  Synthwave: {
    name: "Synthwave",
    primary: "#D946EF",
    secondary: "#06B6D4",
    accent: "#F43F5E",
    gradientBg: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(217, 70, 239, 0.28), rgba(6, 182, 212, 0.16) 55%, rgba(10, 10, 15, 0.98) 100%)",
    glowColor: "rgba(217, 70, 239, 0.45)",
    cardBorder: "border-fuchsia-500/30 hover:border-fuchsia-400/60",
    badgeBg: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  },
  "Lo-Fi Chill": {
    name: "Lo-Fi Chill",
    primary: "#A855F7",
    secondary: "#F59E0B",
    accent: "#EC4899",
    gradientBg: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(168, 85, 247, 0.24), rgba(245, 158, 11, 0.14) 55%, rgba(12, 10, 16, 0.98) 100%)",
    glowColor: "rgba(168, 85, 247, 0.4)",
    cardBorder: "border-purple-500/30 hover:border-purple-400/60",
    badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  "Indie Folk": {
    name: "Indie Folk",
    primary: "#10B981",
    secondary: "#D97706",
    accent: "#84CC16",
    gradientBg: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16, 185, 129, 0.22), rgba(217, 119, 6, 0.15) 55%, rgba(8, 14, 11, 0.98) 100%)",
    glowColor: "rgba(16, 185, 129, 0.4)",
    cardBorder: "border-emerald-500/30 hover:border-emerald-400/60",
    badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  "Nu-Disco / Pop": {
    name: "Nu-Disco / Pop",
    primary: "#F43F5E",
    secondary: "#EAB308",
    accent: "#EC4899",
    gradientBg: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(244, 63, 94, 0.28), rgba(234, 179, 8, 0.18) 55%, rgba(16, 10, 12, 0.98) 100%)",
    glowColor: "rgba(244, 63, 94, 0.45)",
    cardBorder: "border-rose-500/30 hover:border-rose-400/60",
    badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  "Cyber Techno": {
    name: "Cyber Techno",
    primary: "#06B6D4",
    secondary: "#3B82F6",
    accent: "#10B981",
    gradientBg: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(6, 182, 212, 0.28), rgba(59, 130, 246, 0.18) 55%, rgba(6, 10, 18, 0.98) 100%)",
    glowColor: "rgba(6, 182, 212, 0.45)",
    cardBorder: "border-cyan-500/30 hover:border-cyan-400/60",
    badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  "Neo-Soul / R&B": {
    name: "Neo-Soul / R&B",
    primary: "#F59E0B",
    secondary: "#D946EF",
    accent: "#FB923C",
    gradientBg: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245, 158, 11, 0.25), rgba(217, 70, 239, 0.14) 55%, rgba(16, 12, 8, 0.98) 100%)",
    glowColor: "rgba(245, 158, 11, 0.4)",
    cardBorder: "border-amber-500/30 hover:border-amber-400/60",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  "Cinematic Ambient": {
    name: "Cinematic Ambient",
    primary: "#6366F1",
    secondary: "#14B8A6",
    accent: "#38BDF8",
    gradientBg: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.24), rgba(20, 184, 166, 0.15) 55%, rgba(8, 10, 18, 0.98) 100%)",
    glowColor: "rgba(99, 102, 241, 0.4)",
    cardBorder: "border-indigo-500/30 hover:border-indigo-400/60",
    badgeBg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  },
  "Alt Rock": {
    name: "Alt Rock",
    primary: "#EF4444",
    secondary: "#64748B",
    accent: "#F97316",
    gradientBg: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(239, 68, 68, 0.26), rgba(100, 116, 139, 0.16) 55%, rgba(18, 8, 8, 0.98) 100%)",
    glowColor: "rgba(239, 68, 68, 0.4)",
    cardBorder: "border-red-500/30 hover:border-red-400/60",
    badgeBg: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export const MOCK_SONG_CATALOG: Song[] = [
  {
    "id": "pop-01",
    "title": "Get Lucky",
    "artist": "Daft Punk, Pharrell Williams & Nile Rodgers",
    "album": "Random Access Memories",
    "genre": "Nu-Disco / Pop",
    "bpm": 116,
    "durationSeconds": 370,
    "releaseYear": 2013,
    "coverGradient": "from-rose-500 via-pink-600 to-amber-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e8/43/5f/e8435ffa-b6b9-b171-40ab-4ff3959ab661/886443919266.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/57/a5/85/57a585aa-f1bc-7619-881b-f8a04a5541d5/mzaf_6906185026678279401.plus.aac.p.m4a",
    "spotifyId": "2Foc5Q5nqNiosCNqttzHof",
    "spotifyUrl": "https://open.spotify.com/track/2Foc5Q5nqNiosCNqttzHof",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.79,
      "energy": 0.81,
      "valence": 0.86,
      "tempo": 116,
      "acousticness": 0.04,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.79,
      "energy": 0.81,
      "valence": 0.86,
      "beatsBpmNormalized": 0.467,
      "vibeChillToHype": 0.8,
      "acousticness": 0.04,
      "instrumentalness": 0,
      "moodHarmonics": 0.48
    },
    "audioConfig": {
      "rootFreq": 261,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "synthType": "pop",
      "bpm": 116
    },
    "tags": [
      "nu-disco---pop",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "pop-02",
    "title": "Levitating",
    "artist": "Dua Lipa",
    "album": "Future Nostalgia",
    "genre": "Nu-Disco / Pop",
    "bpm": 103,
    "durationSeconds": 204,
    "releaseYear": 2020,
    "coverGradient": "from-rose-500 via-pink-600 to-amber-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a",
    "spotifyId": "463CkQjx2Zk1yXoBuierM9",
    "spotifyUrl": "https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.7,
      "energy": 0.82,
      "valence": 0.91,
      "tempo": 103,
      "acousticness": 0.01,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.7,
      "energy": 0.82,
      "valence": 0.91,
      "beatsBpmNormalized": 0.358,
      "vibeChillToHype": 0.78,
      "acousticness": 0.01,
      "instrumentalness": 0,
      "moodHarmonics": 0.47
    },
    "audioConfig": {
      "rootFreq": 261,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "synthType": "pop",
      "bpm": 103
    },
    "tags": [
      "nu-disco---pop",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "pop-03",
    "title": "Blinding Lights (Remix)",
    "artist": "The Weeknd & ROSALÍA",
    "album": "Blinding Lights (Remix) - Single",
    "genre": "Nu-Disco / Pop",
    "bpm": 171,
    "durationSeconds": 216,
    "releaseYear": 2020,
    "coverGradient": "from-rose-500 via-pink-600 to-amber-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a",
    "spotifyId": "0VjIjW4GlUZAMYd2vXMi3b",
    "spotifyUrl": "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.51,
      "energy": 0.73,
      "valence": 0.33,
      "tempo": 171,
      "acousticness": 0,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.51,
      "energy": 0.73,
      "valence": 0.33,
      "beatsBpmNormalized": 0.925,
      "vibeChillToHype": 0.65,
      "acousticness": 0,
      "instrumentalness": 0,
      "moodHarmonics": 0.72
    },
    "audioConfig": {
      "rootFreq": 261,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "synthType": "pop",
      "bpm": 171
    },
    "tags": [
      "nu-disco---pop",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "pop-04",
    "title": "As It Was",
    "artist": "Harry Styles",
    "album": "Harry's House",
    "genre": "Nu-Disco / Pop",
    "bpm": 174,
    "durationSeconds": 167,
    "releaseYear": 2022,
    "coverGradient": "from-rose-500 via-pink-600 to-amber-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/67/10/16/67101606-3869-ca44-6c03-e13d6322cb51/mzaf_1135399237022217274.plus.aac.p.m4a",
    "spotifyId": "4LRPiXqCikLlN15c3yImP7",
    "spotifyUrl": "https://open.spotify.com/track/4LRPiXqCikLlN15c3yImP7",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.52,
      "energy": 0.73,
      "valence": 0.66,
      "tempo": 174,
      "acousticness": 0.34,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.52,
      "energy": 0.73,
      "valence": 0.66,
      "beatsBpmNormalized": 0.95,
      "vibeChillToHype": 0.59,
      "acousticness": 0.34,
      "instrumentalness": 0,
      "moodHarmonics": 0.58
    },
    "audioConfig": {
      "rootFreq": 261,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "synthType": "pop",
      "bpm": 174
    },
    "tags": [
      "nu-disco---pop",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "pop-05",
    "title": "Heat Waves",
    "artist": "Glass Animals",
    "album": "Dreamland",
    "genre": "Nu-Disco / Pop",
    "bpm": 81,
    "durationSeconds": 239,
    "releaseYear": 2020,
    "coverGradient": "from-rose-500 via-pink-600 to-amber-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/da/8b/77/da8b7731-6f4f-eacf-5e74-8b23389eefa1/20UMGIM03371.rgb.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a3/4c/b9/a34cb911-40fc-5f0c-e862-14bd171a77aa/mzaf_384792072030970151.plus.aac.p.m4a",
    "spotifyId": "02MWAaffLxlfxAUY7c5dvx",
    "spotifyUrl": "https://open.spotify.com/track/02MWAaffLxlfxAUY7c5dvx",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.76,
      "energy": 0.52,
      "valence": 0.53,
      "tempo": 81,
      "acousticness": 0.44,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.76,
      "energy": 0.52,
      "valence": 0.53,
      "beatsBpmNormalized": 0.175,
      "vibeChillToHype": 0.52,
      "acousticness": 0.44,
      "instrumentalness": 0,
      "moodHarmonics": 0.61
    },
    "audioConfig": {
      "rootFreq": 261,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "synthType": "pop",
      "bpm": 81
    },
    "tags": [
      "nu-disco---pop",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "pop-06",
    "title": "bad guy",
    "artist": "Billie Eilish",
    "album": "WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?",
    "genre": "Nu-Disco / Pop",
    "bpm": 135,
    "durationSeconds": 194,
    "releaseYear": 2019,
    "coverGradient": "from-rose-500 via-pink-600 to-amber-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/1a/37/d1/1a37d1b1-8508-54f2-f541-bf4e437dda76/19UMGIM05028.rgb.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c3/87/1f/c3871f7e-3260-d615-1c66-5fdca2c3a48f/mzaf_10721331211699880949.plus.aac.p.m4a",
    "spotifyId": "2Fxmhks0bxGSBdJ92vM42m",
    "spotifyUrl": "https://open.spotify.com/track/2Fxmhks0bxGSBdJ92vM42m",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.7,
      "energy": 0.43,
      "valence": 0.56,
      "tempo": 135,
      "acousticness": 0.33,
      "instrumentalness": 0.13
    },
    "vector": {
      "danceability": 0.7,
      "energy": 0.43,
      "valence": 0.56,
      "beatsBpmNormalized": 0.625,
      "vibeChillToHype": 0.46,
      "acousticness": 0.33,
      "instrumentalness": 0.13,
      "moodHarmonics": 0.61
    },
    "audioConfig": {
      "rootFreq": 261,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "synthType": "pop",
      "bpm": 135
    },
    "tags": [
      "nu-disco---pop",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "sw-01",
    "title": "Nightcall",
    "artist": "Kavinsky",
    "album": "Nightcall",
    "genre": "Synthwave",
    "bpm": 92,
    "durationSeconds": 258,
    "releaseYear": 2010,
    "coverGradient": "from-fuchsia-600 via-purple-700 to-cyan-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c1/2d/fe/c12dfe8f-cdf6-e179-d69a-8ec35f760266/00602537248681.rgb.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d2/45/fb/d245fbf9-8570-fdc0-5e6b-aa528c130486/mzaf_11947081694159530687.plus.aac.p.m4a",
    "spotifyId": "0A0BgR30HgtpZknwBvYvS1",
    "spotifyUrl": "https://open.spotify.com/track/0A0BgR30HgtpZknwBvYvS1",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.58,
      "energy": 0.52,
      "valence": 0.13,
      "tempo": 92,
      "acousticness": 0.01,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.58,
      "energy": 0.52,
      "valence": 0.13,
      "beatsBpmNormalized": 0.267,
      "vibeChillToHype": 0.54,
      "acousticness": 0.01,
      "instrumentalness": 0,
      "moodHarmonics": 0.79
    },
    "audioConfig": {
      "rootFreq": 220,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "synthwave",
      "bpm": 92
    },
    "tags": [
      "synthwave",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "sw-02",
    "title": "Midnight City",
    "artist": "M83",
    "album": "Hurry Up, We're Dreaming",
    "genre": "Synthwave",
    "bpm": 105,
    "durationSeconds": 241,
    "releaseYear": 2011,
    "coverGradient": "from-fuchsia-600 via-purple-700 to-cyan-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/cb/7b/a9/cb7ba903-b5f1-cc21-90db-7a81b7aa0997/724596951057.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/24/09/79/2409794c-3d5d-af26-580e-7dc00ee4f207/mzaf_369629549966021675.plus.aac.p.m4a",
    "spotifyId": "1eyzqe2QqGZUmfcPZtrIyt",
    "spotifyUrl": "https://open.spotify.com/track/1eyzqe2QqGZUmfcPZtrIyt",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.52,
      "energy": 0.71,
      "valence": 0.31,
      "tempo": 105,
      "acousticness": 0,
      "instrumentalness": 0.01
    },
    "vector": {
      "danceability": 0.52,
      "energy": 0.71,
      "valence": 0.31,
      "beatsBpmNormalized": 0.375,
      "vibeChillToHype": 0.64,
      "acousticness": 0,
      "instrumentalness": 0.01,
      "moodHarmonics": 0.72
    },
    "audioConfig": {
      "rootFreq": 220,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "synthwave",
      "bpm": 105
    },
    "tags": [
      "synthwave",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "sw-03",
    "title": "Save Your Tears",
    "artist": "The Weeknd",
    "album": "After Hours (Deluxe)",
    "genre": "Synthwave",
    "bpm": 118,
    "durationSeconds": 216,
    "releaseYear": 2020,
    "coverGradient": "from-fuchsia-600 via-purple-700 to-cyan-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/83/3a/f7/833af71b-2e0c-3303-24f5-8f5c546c073b/20UMGIM21167.rgb.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8b/38/17/8b3817e4-c0e9-7e02-2654-3e2ecee93603/mzaf_18415642125637540903.plus.aac.p.m4a",
    "spotifyId": "5QO792alxAvOD9neZ5XG6f",
    "spotifyUrl": "https://open.spotify.com/track/5QO792alxAvOD9neZ5XG6f",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.68,
      "energy": 0.82,
      "valence": 0.64,
      "tempo": 118,
      "acousticness": 0.02,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.68,
      "energy": 0.82,
      "valence": 0.64,
      "beatsBpmNormalized": 0.483,
      "vibeChillToHype": 0.77,
      "acousticness": 0.02,
      "instrumentalness": 0,
      "moodHarmonics": 0.58
    },
    "audioConfig": {
      "rootFreq": 220,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "synthwave",
      "bpm": 118
    },
    "tags": [
      "synthwave",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "sw-04",
    "title": "Resonance",
    "artist": "Home",
    "album": "Odyssey",
    "genre": "Synthwave",
    "bpm": 100,
    "durationSeconds": 213,
    "releaseYear": 2014,
    "coverGradient": "from-fuchsia-600 via-purple-700 to-cyan-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/98/75/dd/9875dd83-34f6-40ef-3987-fd13646409be/5034644208930_homeodyssey.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c5/16/0c/c5160c16-6526-e0f9-778a-671bd15dd7fe/mzaf_3965082100413414016.plus.aac.p.m4a",
    "spotifyId": "1Tu20n7950c7657t592657",
    "spotifyUrl": "https://open.spotify.com/track/1Tu20n7950c7657t592657",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.65,
      "energy": 0.64,
      "valence": 0.42,
      "tempo": 100,
      "acousticness": 0.05,
      "instrumentalness": 0.88
    },
    "vector": {
      "danceability": 0.65,
      "energy": 0.64,
      "valence": 0.42,
      "beatsBpmNormalized": 0.333,
      "vibeChillToHype": 0.63,
      "acousticness": 0.05,
      "instrumentalness": 0.88,
      "moodHarmonics": 0.67
    },
    "audioConfig": {
      "rootFreq": 220,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "synthwave",
      "bpm": 100
    },
    "tags": [
      "synthwave",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "sw-05",
    "title": "Turbo Killer",
    "artist": "Carpenter Brut",
    "album": "Trilogy",
    "genre": "Synthwave",
    "bpm": 130,
    "durationSeconds": 209,
    "releaseYear": 2015,
    "coverGradient": "from-fuchsia-600 via-purple-700 to-cyan-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f3/67/b9/f367b929-406d-ef08-6b62-a4322c62c8da/00602557606782.rgb.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/72/ae/a2/72aea230-30e7-4452-0d87-21ce81bd10f2/mzaf_8745873185334459416.plus.aac.p.m4a",
    "spotifyId": "10qbLEtWffU5kO8Kz9yS9i",
    "spotifyUrl": "https://open.spotify.com/track/10qbLEtWffU5kO8Kz9yS9i",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.47,
      "energy": 0.94,
      "valence": 0.28,
      "tempo": 130,
      "acousticness": 0,
      "instrumentalness": 0.82
    },
    "vector": {
      "danceability": 0.47,
      "energy": 0.94,
      "valence": 0.28,
      "beatsBpmNormalized": 0.583,
      "vibeChillToHype": 0.78,
      "acousticness": 0,
      "instrumentalness": 0.82,
      "moodHarmonics": 0.74
    },
    "audioConfig": {
      "rootFreq": 220,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "synthwave",
      "bpm": 130
    },
    "tags": [
      "synthwave",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "sw-06",
    "title": "Tech Noir",
    "artist": "GUNSHIP",
    "album": "GUNSHIP",
    "genre": "Synthwave",
    "bpm": 95,
    "durationSeconds": 297,
    "releaseYear": 2015,
    "coverGradient": "from-fuchsia-600 via-purple-700 to-cyan-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/14/82/82/14828219-fd3d-531f-2f05-8a40083fb07f/889326256694_Cover.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bd/06/dc/bd06dc70-e2b2-bc99-0947-0d10389a960a/mzaf_16486588803306493542.plus.aac.p.m4a",
    "spotifyId": "5fGq5gX1h0bW0W9Cg3104j",
    "spotifyUrl": "https://open.spotify.com/track/5fGq5gX1h0bW0W9Cg3104j",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.49,
      "energy": 0.68,
      "valence": 0.19,
      "tempo": 95,
      "acousticness": 0.03,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.49,
      "energy": 0.68,
      "valence": 0.19,
      "beatsBpmNormalized": 0.292,
      "vibeChillToHype": 0.61,
      "acousticness": 0.03,
      "instrumentalness": 0,
      "moodHarmonics": 0.78
    },
    "audioConfig": {
      "rootFreq": 220,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "synthwave",
      "bpm": 95
    },
    "tags": [
      "synthwave",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "lo-01",
    "title": "death bed (feat. beabadoobee) [coffee for your head]",
    "artist": "Powfu",
    "album": "death bed (feat. beabadoobee) [coffee for your head] - Single",
    "genre": "Lo-Fi Chill",
    "bpm": 144,
    "durationSeconds": 173,
    "releaseYear": 2020,
    "coverGradient": "from-purple-600 via-amber-600 to-rose-400",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8b/a9/36/8ba936f3-2d8b-1012-89cc-92f75eb76961/886448289180.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8d/14/24/8d1424cd-6046-8148-456f-908d37ab7a29/mzaf_2518440040627256848.plus.aac.p.m4a",
    "spotifyId": "7eJMfftS33KTjuF7lTsMCx",
    "spotifyUrl": "https://open.spotify.com/track/7eJMfftS33KTjuF7lTsMCx",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.73,
      "energy": 0.43,
      "valence": 0.35,
      "tempo": 144,
      "acousticness": 0.73,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.73,
      "energy": 0.43,
      "valence": 0.35,
      "beatsBpmNormalized": 0.7,
      "vibeChillToHype": 0.39,
      "acousticness": 0.73,
      "instrumentalness": 0,
      "moodHarmonics": 0.69
    },
    "audioConfig": {
      "rootFreq": 196,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "lofi",
      "bpm": 144
    },
    "tags": [
      "lo-fi-chill",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "lo-02",
    "title": "controlla",
    "artist": "Idealism",
    "album": "rainy evening - EP",
    "genre": "Lo-Fi Chill",
    "bpm": 75,
    "durationSeconds": 108,
    "releaseYear": 2016,
    "coverGradient": "from-purple-600 via-amber-600 to-rose-400",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b8/b5/26/b8b526e2-956e-bb51-dd2a-f24961a34820/artwork.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/35/45/98/3545986a-4e35-473f-2fc6-784cc06a8aa6/mzaf_1484411353781049225.plus.aac.p.m4a",
    "spotifyId": "70D7804473D7F5734E60B8",
    "spotifyUrl": "https://open.spotify.com/track/70D7804473D7F5734E60B8",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.69,
      "energy": 0.31,
      "valence": 0.45,
      "tempo": 75,
      "acousticness": 0.81,
      "instrumentalness": 0.89
    },
    "vector": {
      "danceability": 0.69,
      "energy": 0.31,
      "valence": 0.45,
      "beatsBpmNormalized": 0.125,
      "vibeChillToHype": 0.28,
      "acousticness": 0.81,
      "instrumentalness": 0.89,
      "moodHarmonics": 0.65
    },
    "audioConfig": {
      "rootFreq": 196,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "lofi",
      "bpm": 75
    },
    "tags": [
      "lo-fi-chill",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "lo-03",
    "title": "Affection",
    "artist": "Jinsang",
    "album": "Life",
    "genre": "Lo-Fi Chill",
    "bpm": 82,
    "durationSeconds": 117,
    "releaseYear": 2016,
    "coverGradient": "from-purple-600 via-amber-600 to-rose-400",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/33/a5/2f/33a52fc2-d77b-9408-6d5b-af389ee28c43/cover_4018939360092.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/27/7f/5a/277f5a90-6ca3-a8e8-931c-8dd7c1d472fd/mzaf_4569701282117560653.plus.aac.p.m4a",
    "spotifyId": "76326E170C8C377519EAE5",
    "spotifyUrl": "https://open.spotify.com/track/76326E170C8C377519EAE5",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.64,
      "energy": 0.28,
      "valence": 0.41,
      "tempo": 82,
      "acousticness": 0.78,
      "instrumentalness": 0.84
    },
    "vector": {
      "danceability": 0.64,
      "energy": 0.28,
      "valence": 0.41,
      "beatsBpmNormalized": 0.183,
      "vibeChillToHype": 0.25,
      "acousticness": 0.78,
      "instrumentalness": 0.84,
      "moodHarmonics": 0.67
    },
    "audioConfig": {
      "rootFreq": 196,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "lofi",
      "bpm": 82
    },
    "tags": [
      "lo-fi-chill",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "lo-04",
    "title": "The Girl I Haven't Met",
    "artist": "Kudasaibeats",
    "album": "Falling",
    "genre": "Lo-Fi Chill",
    "bpm": 80,
    "durationSeconds": 195,
    "releaseYear": 2017,
    "coverGradient": "from-purple-600 via-amber-600 to-rose-400",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/1c/30/b1/1c30b1ce-6c95-7fd4-cc2a-449101a40b48/artwork.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/ea/cb/de/eacbde9c-f7d2-95bd-e2ba-0a1e2c5bf19b/mzaf_4090910961844771940.plus.aac.p.m4a",
    "spotifyId": "0000000000000000000001",
    "spotifyUrl": "https://open.spotify.com/track/0000000000000000000001",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.72,
      "energy": 0.22,
      "valence": 0.38,
      "tempo": 80,
      "acousticness": 0.86,
      "instrumentalness": 0.8
    },
    "vector": {
      "danceability": 0.72,
      "energy": 0.22,
      "valence": 0.38,
      "beatsBpmNormalized": 0.167,
      "vibeChillToHype": 0.22,
      "acousticness": 0.86,
      "instrumentalness": 0.8,
      "moodHarmonics": 0.68
    },
    "audioConfig": {
      "rootFreq": 196,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "lofi",
      "bpm": 80
    },
    "tags": [
      "lo-fi-chill",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "tc-01",
    "title": "Glue",
    "artist": "Bicep",
    "album": "Bicep",
    "genre": "Cyber Techno",
    "bpm": 130,
    "durationSeconds": 269,
    "releaseYear": 2017,
    "coverGradient": "from-cyan-600 via-blue-700 to-emerald-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/79/cf/44/79cf445f-4b04-7a27-54a4-cdf57cf1d6ac/5054429119084.png/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/7c/9c/f6/7c9cf6b3-424a-3cce-96c3-c192b2f6e566/mzaf_4559815962369019993.plus.aac.p.m4a",
    "spotifyId": "2aJDtXrSpq47IRaY9vwhGE",
    "spotifyUrl": "https://open.spotify.com/track/2aJDtXrSpq47IRaY9vwhGE",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.71,
      "energy": 0.79,
      "valence": 0.35,
      "tempo": 130,
      "acousticness": 0.03,
      "instrumentalness": 0.79
    },
    "vector": {
      "danceability": 0.71,
      "energy": 0.79,
      "valence": 0.35,
      "beatsBpmNormalized": 0.583,
      "vibeChillToHype": 0.76,
      "acousticness": 0.03,
      "instrumentalness": 0.79,
      "moodHarmonics": 0.69
    },
    "audioConfig": {
      "rootFreq": 146,
      "scale": [
        0,
        1,
        5,
        7,
        8
      ],
      "synthType": "techno",
      "bpm": 130
    },
    "tags": [
      "cyber-techno",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "tc-02",
    "title": "Breathe",
    "artist": "The Prodigy",
    "album": "The Fat of the Land",
    "genre": "Cyber Techno",
    "bpm": 130,
    "durationSeconds": 336,
    "releaseYear": 1996,
    "coverGradient": "from-cyan-600 via-blue-700 to-emerald-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/96/8b/08/968b08e4-cb2b-54c2-32bb-dba77ad1c2ca/634904912161.png/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9f/2e/9c/9f2e9c57-8666-53a8-6d62-e5647c702e95/mzaf_81861469305734864.plus.aac.p.m4a",
    "spotifyId": "2v4A7Ew69b0B7v2lC4D04C",
    "spotifyUrl": "https://open.spotify.com/track/2v4A7Ew69b0B7v2lC4D04C",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.72,
      "energy": 0.94,
      "valence": 0.45,
      "tempo": 130,
      "acousticness": 0.01,
      "instrumentalness": 0.12
    },
    "vector": {
      "danceability": 0.72,
      "energy": 0.94,
      "valence": 0.45,
      "beatsBpmNormalized": 0.583,
      "vibeChillToHype": 0.86,
      "acousticness": 0.01,
      "instrumentalness": 0.12,
      "moodHarmonics": 0.65
    },
    "audioConfig": {
      "rootFreq": 146,
      "scale": [
        0,
        1,
        5,
        7,
        8
      ],
      "synthType": "techno",
      "bpm": 130
    },
    "tags": [
      "cyber-techno",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "tc-03",
    "title": "I Remember",
    "artist": "Kaskade & deadmau5",
    "album": "Random Album Title",
    "genre": "Cyber Techno",
    "bpm": 128,
    "durationSeconds": 548,
    "releaseYear": 2008,
    "coverGradient": "from-cyan-600 via-blue-700 to-emerald-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/62/64/f2/6264f273-04fa-d05d-a067-22a7ca9bbeec/617465186851.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ca/36/d5/ca36d533-5b34-1aec-ac4e-e7b34ea632b4/mzaf_5466697682586745840.plus.aac.p.m4a",
    "spotifyId": "2O1gU2X7yA1b0A4C8G2E7a",
    "spotifyUrl": "https://open.spotify.com/track/2O1gU2X7yA1b0A4C8G2E7a",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.68,
      "energy": 0.76,
      "valence": 0.49,
      "tempo": 128,
      "acousticness": 0.03,
      "instrumentalness": 0.65
    },
    "vector": {
      "danceability": 0.68,
      "energy": 0.76,
      "valence": 0.49,
      "beatsBpmNormalized": 0.567,
      "vibeChillToHype": 0.73,
      "acousticness": 0.03,
      "instrumentalness": 0.65,
      "moodHarmonics": 0.64
    },
    "audioConfig": {
      "rootFreq": 146,
      "scale": [
        0,
        1,
        5,
        7,
        8
      ],
      "synthType": "techno",
      "bpm": 128
    },
    "tags": [
      "cyber-techno",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "tc-04",
    "title": "Opr",
    "artist": "Gesaffelstein",
    "album": "Conspiracy, Pt. 2 - Single",
    "genre": "Cyber Techno",
    "bpm": 110,
    "durationSeconds": 234,
    "releaseYear": 2011,
    "coverGradient": "from-cyan-600 via-blue-700 to-emerald-500",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/29/62/da/2962dab3-74c3-41a8-f589-f698386c34ff/4250382404866.png/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/74/f8/c2/74f8c279-d228-870e-f058-c265c3ac370f/mzaf_3314973309502691395.plus.aac.p.m4a",
    "spotifyId": "5B099F84714658B43C3A44",
    "spotifyUrl": "https://open.spotify.com/track/5B099F84714658B43C3A44",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.81,
      "energy": 0.89,
      "valence": 0.31,
      "tempo": 110,
      "acousticness": 0,
      "instrumentalness": 0.85
    },
    "vector": {
      "danceability": 0.81,
      "energy": 0.89,
      "valence": 0.31,
      "beatsBpmNormalized": 0.417,
      "vibeChillToHype": 0.86,
      "acousticness": 0,
      "instrumentalness": 0.85,
      "moodHarmonics": 0.7
    },
    "audioConfig": {
      "rootFreq": 146,
      "scale": [
        0,
        1,
        5,
        7,
        8
      ],
      "synthType": "techno",
      "bpm": 110
    },
    "tags": [
      "cyber-techno",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "if-01",
    "title": "Dreams",
    "artist": "Fleetwood Mac",
    "album": "Greatest Hits",
    "genre": "Indie Folk",
    "bpm": 120,
    "durationSeconds": 254,
    "releaseYear": 1987,
    "coverGradient": "from-emerald-600 via-amber-700 to-stone-700",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d2/48/f4/d248f4ae-a7e4-a48e-1588-6617de3e8d76/mzi.izeorbmm.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b6/5a/4b/b65a4b6f-54dd-ee99-0b36-98e27d5b5dd8/mzaf_13813391014293209258.plus.aac.p.m4a",
    "spotifyId": "0ofHAoxe9vBkTCp2UQIavz",
    "spotifyUrl": "https://open.spotify.com/track/0ofHAoxe9vBkTCp2UQIavz",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.82,
      "energy": 0.49,
      "valence": 0.79,
      "tempo": 120,
      "acousticness": 0.06,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.82,
      "energy": 0.49,
      "valence": 0.79,
      "beatsBpmNormalized": 0.5,
      "vibeChillToHype": 0.59,
      "acousticness": 0.06,
      "instrumentalness": 0,
      "moodHarmonics": 0.5
    },
    "audioConfig": {
      "rootFreq": 196,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "synthType": "acoustic",
      "bpm": 120
    },
    "tags": [
      "indie-folk",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "if-02",
    "title": "Skinny Love",
    "artist": "Bon Iver",
    "album": "For Emma, Forever Ago",
    "genre": "Indie Folk",
    "bpm": 76,
    "durationSeconds": 239,
    "releaseYear": 2007,
    "coverGradient": "from-emerald-600 via-amber-700 to-stone-700",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/21/2f/ea/212fea18-5fdc-ba4d-5dd7-1b07aaa88b67/656605211565.tif/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c3/53/ef/c353ef07-9302-e169-0c7d-e9873f99c1db/mzaf_15074454966550904398.plus.aac.p.m4a",
    "spotifyId": "2cbic3TiNESfQZ6fZBh55v",
    "spotifyUrl": "https://open.spotify.com/track/2cbic3TiNESfQZ6fZBh55v",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.39,
      "energy": 0.28,
      "valence": 0.17,
      "tempo": 76,
      "acousticness": 0.88,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.39,
      "energy": 0.28,
      "valence": 0.17,
      "beatsBpmNormalized": 0.133,
      "vibeChillToHype": 0.14,
      "acousticness": 0.88,
      "instrumentalness": 0,
      "moodHarmonics": 0.79
    },
    "audioConfig": {
      "rootFreq": 196,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "synthType": "acoustic",
      "bpm": 76
    },
    "tags": [
      "indie-folk",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "if-03",
    "title": "Take Me to Church",
    "artist": "Hozier",
    "album": "Hozier (Expanded Edition)",
    "genre": "Indie Folk",
    "bpm": 129,
    "durationSeconds": 242,
    "releaseYear": 2013,
    "coverGradient": "from-emerald-600 via-amber-700 to-stone-700",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/5e/1b/f1/5e1bf1de-e5f1-e73e-0752-e7882b4f2d57/886444718820.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/fb/95/fe/fb95fea4-aab2-151d-7e2d-a3b2740de243/mzaf_5007348610386911589.plus.aac.p.m4a",
    "spotifyId": "3d9DChrdcR09pPvhNYyC50",
    "spotifyUrl": "https://open.spotify.com/track/3d9DChrdcR09pPvhNYyC50",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.57,
      "energy": 0.66,
      "valence": 0.44,
      "tempo": 129,
      "acousticness": 0.63,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.57,
      "energy": 0.66,
      "valence": 0.44,
      "beatsBpmNormalized": 0.575,
      "vibeChillToHype": 0.5,
      "acousticness": 0.63,
      "instrumentalness": 0,
      "moodHarmonics": 0.67
    },
    "audioConfig": {
      "rootFreq": 196,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "synthType": "acoustic",
      "bpm": 129
    },
    "tags": [
      "indie-folk",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "if-04",
    "title": "The Night We Met",
    "artist": "Lord Huron",
    "album": "Strange Trails",
    "genre": "Indie Folk",
    "bpm": 87,
    "durationSeconds": 208,
    "releaseYear": 2015,
    "coverGradient": "from-emerald-600 via-amber-700 to-stone-700",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/55/41/4a/55414a18-861a-79d1-e575-5bf8cf205dbe/886445056839_Cover.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/64/b4/f3/64b4f3e5-d4f9-ec10-e6af-b6c26bde9b47/mzaf_8621887946764980860.plus.aac.p.m4a",
    "spotifyId": "0QZ5Rh3YQFCHCiAVRYPHUs",
    "spotifyUrl": "https://open.spotify.com/track/0QZ5Rh3YQFCHCiAVRYPHUs",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.45,
      "energy": 0.37,
      "valence": 0.1,
      "tempo": 87,
      "acousticness": 0.77,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.45,
      "energy": 0.37,
      "valence": 0.1,
      "beatsBpmNormalized": 0.225,
      "vibeChillToHype": 0.24,
      "acousticness": 0.77,
      "instrumentalness": 0,
      "moodHarmonics": 0.82
    },
    "audioConfig": {
      "rootFreq": 196,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "synthType": "acoustic",
      "bpm": 87
    },
    "tags": [
      "indie-folk",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "if-05",
    "title": "Riptide",
    "artist": "Vance Joy",
    "album": "Dream Your Life Away (Special Edition)",
    "genre": "Indie Folk",
    "bpm": 102,
    "durationSeconds": 202,
    "releaseYear": 2013,
    "coverGradient": "from-emerald-600 via-amber-700 to-stone-700",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7a/1c/65/7a1c6571-34e9-bb77-32be-90c72ba003c0/075679920355.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/1e/de/ea/1edeea50-c0f4-9d95-f0b8-b23a1af561db/mzaf_6343110017276582270.plus.aac.p.m4a",
    "spotifyId": "7yq4QjY5AgNpOSx4URXdJv",
    "spotifyUrl": "https://open.spotify.com/track/7yq4QjY5AgNpOSx4URXdJv",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.48,
      "energy": 0.73,
      "valence": 0.51,
      "tempo": 102,
      "acousticness": 0.43,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.48,
      "energy": 0.73,
      "valence": 0.51,
      "beatsBpmNormalized": 0.35,
      "vibeChillToHype": 0.56,
      "acousticness": 0.43,
      "instrumentalness": 0,
      "moodHarmonics": 0.65
    },
    "audioConfig": {
      "rootFreq": 196,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "synthType": "acoustic",
      "bpm": 102
    },
    "tags": [
      "indie-folk",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "soul-01",
    "title": "Kill Bill",
    "artist": "SZA",
    "album": "SOS",
    "genre": "Neo-Soul / R&B",
    "bpm": 89,
    "durationSeconds": 154,
    "releaseYear": 2022,
    "coverGradient": "from-amber-600 via-rose-700 to-purple-800",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/bd/3b/a9/bd3ba9fb-9609-144f-bcfe-ead67b5f6ab3/196589564931.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/45/2b/ea/452bead6-c7f5-82d4-f5f7-ec876014b4cc/mzaf_2905911853279084717.plus.aac.p.m4a",
    "spotifyId": "1Qrg8KqiBpW07V7PNnewww",
    "spotifyUrl": "https://open.spotify.com/track/1Qrg8KqiBpW07V7PNnewww",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.64,
      "energy": 0.73,
      "valence": 0.42,
      "tempo": 89,
      "acousticness": 0.05,
      "instrumentalness": 0.14
    },
    "vector": {
      "danceability": 0.64,
      "energy": 0.73,
      "valence": 0.42,
      "beatsBpmNormalized": 0.242,
      "vibeChillToHype": 0.69,
      "acousticness": 0.05,
      "instrumentalness": 0.14,
      "moodHarmonics": 0.67
    },
    "audioConfig": {
      "rootFreq": 220,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "soul",
      "bpm": 89
    },
    "tags": [
      "neo-soul---r-b",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "soul-02",
    "title": "Redbone (Originally Performed by Childish Gambino) [Karaoke Version]",
    "artist": "Starstruck Backing Tracks",
    "album": "Redbone (Originally Performed by Childish Gambino) [Karaoke Version] - Single",
    "genre": "Neo-Soul / R&B",
    "bpm": 116,
    "durationSeconds": 322,
    "releaseYear": 2017,
    "coverGradient": "from-amber-600 via-rose-700 to-purple-800",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/fe/da/c9/fedac9e7-cd68-8906-f103-a6aeb3319765/Redbone-Childish-Gambino.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/7f/16/cb/7f16cbc5-bbaf-b681-d5fe-88dd56c96a30/mzaf_11014895037301362273.plus.aac.p.m4a",
    "spotifyId": "0wXuerDYILflUK005Rmo5s",
    "spotifyUrl": "https://open.spotify.com/track/0wXuerDYILflUK005Rmo5s",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.74,
      "energy": 0.35,
      "valence": 0.59,
      "tempo": 116,
      "acousticness": 0.17,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.74,
      "energy": 0.35,
      "valence": 0.59,
      "beatsBpmNormalized": 0.467,
      "vibeChillToHype": 0.45,
      "acousticness": 0.17,
      "instrumentalness": 0,
      "moodHarmonics": 0.59
    },
    "audioConfig": {
      "rootFreq": 220,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "soul",
      "bpm": 116
    },
    "tags": [
      "neo-soul---r-b",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "soul-03",
    "title": "Best Part (feat. Daniel Caesar)",
    "artist": "H.E.R.",
    "album": "H.E.R.",
    "genre": "Neo-Soul / R&B",
    "bpm": 75,
    "durationSeconds": 209,
    "releaseYear": 2017,
    "coverGradient": "from-amber-600 via-rose-700 to-purple-800",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/27/40/34/274034b3-42d9-ba59-b22c-dc4f57672ee0/886446799513.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/57/5a/30/575a30e2-83b2-0810-104d-681343521476/mzaf_10862779365075492896.plus.aac.p.m4a",
    "spotifyId": "1RMJO1EuxZ2gqM9iZ61n1n",
    "spotifyUrl": "https://open.spotify.com/track/1RMJO1EuxZ2gqM9iZ61n1n",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.47,
      "energy": 0.38,
      "valence": 0.42,
      "tempo": 75,
      "acousticness": 0.79,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.47,
      "energy": 0.38,
      "valence": 0.42,
      "beatsBpmNormalized": 0.125,
      "vibeChillToHype": 0.25,
      "acousticness": 0.79,
      "instrumentalness": 0,
      "moodHarmonics": 0.68
    },
    "audioConfig": {
      "rootFreq": 220,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "soul",
      "bpm": 75
    },
    "tags": [
      "neo-soul---r-b",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "soul-04",
    "title": "Pink + White",
    "artist": "Frank Ocean",
    "album": "Blonde",
    "genre": "Neo-Soul / R&B",
    "bpm": 160,
    "durationSeconds": 185,
    "releaseYear": 2016,
    "coverGradient": "from-amber-600 via-rose-700 to-purple-800",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bb/45/68/bb4568f3-68cd-619d-fbcb-4e179916545d/BlondCover-Final.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ba/11/dc/ba11dccd-16d2-9cd8-13f0-85b73acc0a09/mzaf_1304250511099243436.plus.aac.p.m4a",
    "spotifyId": "3xKsf9qdS1CyvXS5sbIMgg",
    "spotifyUrl": "https://open.spotify.com/track/3xKsf9qdS1CyvXS5sbIMgg",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.55,
      "energy": 0.55,
      "valence": 0.55,
      "tempo": 160,
      "acousticness": 0.67,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.55,
      "energy": 0.55,
      "valence": 0.55,
      "beatsBpmNormalized": 0.833,
      "vibeChillToHype": 0.42,
      "acousticness": 0.67,
      "instrumentalness": 0,
      "moodHarmonics": 0.62
    },
    "audioConfig": {
      "rootFreq": 220,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "soul",
      "bpm": 160
    },
    "tags": [
      "neo-soul---r-b",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "soul-05",
    "title": "Bad Habit",
    "artist": "Steve Lacy",
    "album": "Gemini Rights",
    "genre": "Neo-Soul / R&B",
    "bpm": 169,
    "durationSeconds": 232,
    "releaseYear": 2022,
    "coverGradient": "from-amber-600 via-rose-700 to-purple-800",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/41/cf/77/41cf7744-535f-3679-0ca6-c1b8d3f98c8f/196874557266.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/fd/df/23/fddf23b3-bc0c-2a6c-b811-e9784e2e8fc2/mzaf_16866686323648484948.plus.aac.p.m4a",
    "spotifyId": "4vug5A0A4wD6v14kSjVl2G",
    "spotifyUrl": "https://open.spotify.com/track/4vug5A0A4wD6v14kSjVl2G",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.69,
      "energy": 0.49,
      "valence": 0.72,
      "tempo": 169,
      "acousticness": 0.61,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.69,
      "energy": 0.49,
      "valence": 0.72,
      "beatsBpmNormalized": 0.908,
      "vibeChillToHype": 0.44,
      "acousticness": 0.61,
      "instrumentalness": 0,
      "moodHarmonics": 0.54
    },
    "audioConfig": {
      "rootFreq": 220,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "synthType": "soul",
      "bpm": 169
    },
    "tags": [
      "neo-soul---r-b",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "amb-01",
    "title": "Time",
    "artist": "Hans Zimmer",
    "album": "Inception (Music from the Motion Picture)",
    "genre": "Cinematic Ambient",
    "bpm": 60,
    "durationSeconds": 276,
    "releaseYear": 2010,
    "coverGradient": "from-indigo-600 via-teal-700 to-slate-800",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2b/62/eb/2b62ebd7-aa99-988a-0fee-714162f6fbeb/093624965008.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e0/1d/a4/e01da4a2-a75f-7ebf-9971-3d49e17efc57/mzaf_10500078769097048384.plus.aac.p.m4a",
    "spotifyId": "6ZFbIcPtKi70whbM1n9y90",
    "spotifyUrl": "https://open.spotify.com/track/6ZFbIcPtKi70whbM1n9y90",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.15,
      "energy": 0.32,
      "valence": 0.07,
      "tempo": 60,
      "acousticness": 0.65,
      "instrumentalness": 0.94
    },
    "vector": {
      "danceability": 0.15,
      "energy": 0.32,
      "valence": 0.07,
      "beatsBpmNormalized": 0,
      "vibeChillToHype": 0.13,
      "acousticness": 0.65,
      "instrumentalness": 0.94,
      "moodHarmonics": 0.86
    },
    "audioConfig": {
      "rootFreq": 174,
      "scale": [
        0,
        4,
        7,
        11
      ],
      "synthType": "ambient",
      "bpm": 60
    },
    "tags": [
      "cinematic-ambient",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "amb-02",
    "title": "Weightless",
    "artist": "Marconi Union",
    "album": "The Ambient Zone Just Music Cafe, Vol. 4",
    "genre": "Cinematic Ambient",
    "bpm": 60,
    "durationSeconds": 480,
    "releaseYear": 2011,
    "coverGradient": "from-indigo-600 via-teal-700 to-slate-800",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c3/3a/d6/c33ad6a3-ec91-62e4-0912-d4a873d4fed0/cover.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/65/69/07/656907c9-eb54-c59c-72b9-dad8489a0165/mzaf_3316991574698499044.plus.aac.p.m4a",
    "spotifyId": "6kkwzB6hXLIONkEk9JciA6",
    "spotifyUrl": "https://open.spotify.com/track/6kkwzB6hXLIONkEk9JciA6",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.22,
      "energy": 0.11,
      "valence": 0.05,
      "tempo": 60,
      "acousticness": 0.88,
      "instrumentalness": 0.96
    },
    "vector": {
      "danceability": 0.22,
      "energy": 0.11,
      "valence": 0.05,
      "beatsBpmNormalized": 0,
      "vibeChillToHype": 0,
      "acousticness": 0.88,
      "instrumentalness": 0.96,
      "moodHarmonics": 0.86
    },
    "audioConfig": {
      "rootFreq": 174,
      "scale": [
        0,
        4,
        7,
        11
      ],
      "synthType": "ambient",
      "bpm": 60
    },
    "tags": [
      "cinematic-ambient",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "amb-03",
    "title": "On The Nature Of Daylight",
    "artist": "Max Richter, Louisa Fuller, Natalia Bonner, John Metcalfe, Philip Sheppard & Chris Worsey",
    "album": "The Blue Notebooks (15 Years)",
    "genre": "Cinematic Ambient",
    "bpm": 66,
    "durationSeconds": 372,
    "releaseYear": 2004,
    "coverGradient": "from-indigo-600 via-teal-700 to-slate-800",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/58/ec/d7/58ecd75d-8df8-c05f-5e1a-b144292c6493/17UM1IM64259.rgb.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/85/ec/31/85ec3121-880e-8d05-70ee-a3f5cad67d29/mzaf_13875593167782602175.plus.aac.p.m4a",
    "spotifyId": "56oDRnqbIiwx40vMR0PAlY",
    "spotifyUrl": "https://open.spotify.com/track/56oDRnqbIiwx40vMR0PAlY",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.24,
      "energy": 0.22,
      "valence": 0.04,
      "tempo": 66,
      "acousticness": 0.93,
      "instrumentalness": 0.92
    },
    "vector": {
      "danceability": 0.24,
      "energy": 0.22,
      "valence": 0.04,
      "beatsBpmNormalized": 0.05,
      "vibeChillToHype": 0.04,
      "acousticness": 0.93,
      "instrumentalness": 0.92,
      "moodHarmonics": 0.86
    },
    "audioConfig": {
      "rootFreq": 174,
      "scale": [
        0,
        4,
        7,
        11
      ],
      "synthType": "ambient",
      "bpm": 66
    },
    "tags": [
      "cinematic-ambient",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "amb-04",
    "title": "Nuvole Bianche",
    "artist": "Ludovico Einaudi",
    "album": "Peaceful Piano",
    "genre": "Cinematic Ambient",
    "bpm": 69,
    "durationSeconds": 358,
    "releaseYear": 2004,
    "coverGradient": "from-indigo-600 via-teal-700 to-slate-800",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/04/00/67/040067ef-a876-c3c5-a4f9-547a8ad1dfd3/17UMGIM88404.rgb.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0b/1e/a5/0b1ea5fb-9bd9-3695-9b04-791c99de975d/mzaf_10126848900834615297.plus.aac.p.m4a",
    "spotifyId": "3weNRklVDfd4kWwfTXW3a5",
    "spotifyUrl": "https://open.spotify.com/track/3weNRklVDfd4kWwfTXW3a5",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.34,
      "energy": 0.27,
      "valence": 0.07,
      "tempo": 69,
      "acousticness": 0.99,
      "instrumentalness": 0.91
    },
    "vector": {
      "danceability": 0.34,
      "energy": 0.27,
      "valence": 0.07,
      "beatsBpmNormalized": 0.075,
      "vibeChillToHype": 0.1,
      "acousticness": 0.99,
      "instrumentalness": 0.91,
      "moodHarmonics": 0.84
    },
    "audioConfig": {
      "rootFreq": 174,
      "scale": [
        0,
        4,
        7,
        11
      ],
      "synthType": "ambient",
      "bpm": 69
    },
    "tags": [
      "cinematic-ambient",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "rock-01",
    "title": "Do I Wanna Know?",
    "artist": "Arctic Monkeys",
    "album": "AM",
    "genre": "Alt Rock",
    "bpm": 85,
    "durationSeconds": 272,
    "releaseYear": 2013,
    "coverGradient": "from-red-600 via-stone-800 to-neutral-900",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/9c/b5/699cb5d6-115c-ff73-9d26-e57ea4350d72/887828031795.png/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/89/ae/42/89ae4206-048a-7eae-3eaf-c3abd02914fb/mzaf_15551176804491638370.plus.aac.p.m4a",
    "spotifyId": "5FVd6KXrgO9B3JPmC8OPst",
    "spotifyUrl": "https://open.spotify.com/track/5FVd6KXrgO9B3JPmC8OPst",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.55,
      "energy": 0.53,
      "valence": 0.41,
      "tempo": 85,
      "acousticness": 0.19,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.55,
      "energy": 0.53,
      "valence": 0.41,
      "beatsBpmNormalized": 0.208,
      "vibeChillToHype": 0.5,
      "acousticness": 0.19,
      "instrumentalness": 0,
      "moodHarmonics": 0.68
    },
    "audioConfig": {
      "rootFreq": 164,
      "scale": [
        0,
        3,
        5,
        6,
        7,
        10
      ],
      "synthType": "rock",
      "bpm": 85
    },
    "tags": [
      "alt-rock",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "rock-02",
    "title": "The Less I Know The Better",
    "artist": "Mau P",
    "album": "The Less I Know The Better - Single",
    "genre": "Alt Rock",
    "bpm": 117,
    "durationSeconds": 176,
    "releaseYear": 2025,
    "coverGradient": "from-red-600 via-stone-800 to-neutral-900",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a0/9a/2c/a09a2ca3-a5a6-814b-0af7-640dc0aef0aa/091012682261.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8b/55/f3/8b55f3a3-3204-8930-f156-82843546950e/mzaf_9370328603131228430.plus.aac.p.m4a",
    "spotifyId": "6K4t31amVTZDgR3sKmwUJJ",
    "spotifyUrl": "https://open.spotify.com/track/6K4t31amVTZDgR3sKmwUJJ",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.64,
      "energy": 0.74,
      "valence": 0.78,
      "tempo": 117,
      "acousticness": 0.01,
      "instrumentalness": 0.01
    },
    "vector": {
      "danceability": 0.64,
      "energy": 0.74,
      "valence": 0.78,
      "beatsBpmNormalized": 0.475,
      "vibeChillToHype": 0.7,
      "acousticness": 0.01,
      "instrumentalness": 0.01,
      "moodHarmonics": 0.52
    },
    "audioConfig": {
      "rootFreq": 164,
      "scale": [
        0,
        3,
        5,
        6,
        7,
        10
      ],
      "synthType": "rock",
      "bpm": 117
    },
    "tags": [
      "alt-rock",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "rock-03",
    "title": "Sweater Weather",
    "artist": "The Neighbourhood",
    "album": "I Love You.",
    "genre": "Alt Rock",
    "bpm": 118,
    "durationSeconds": 240,
    "releaseYear": 2012,
    "coverGradient": "from-red-600 via-stone-800 to-neutral-900",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/28/71/00/287100fb-5c31-0195-5343-e6b3625886d0/886443969834.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8c/37/20/8c372047-2727-8054-9411-0e4867643dd8/mzaf_10169659262182214119.plus.aac.p.m4a",
    "spotifyId": "2QjOHCTQ1Jl3zawyYOpxh6",
    "spotifyUrl": "https://open.spotify.com/track/2QjOHCTQ1Jl3zawyYOpxh6",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.61,
      "energy": 0.81,
      "valence": 0.4,
      "tempo": 118,
      "acousticness": 0.05,
      "instrumentalness": 0.02
    },
    "vector": {
      "danceability": 0.61,
      "energy": 0.81,
      "valence": 0.4,
      "beatsBpmNormalized": 0.483,
      "vibeChillToHype": 0.73,
      "acousticness": 0.05,
      "instrumentalness": 0.02,
      "moodHarmonics": 0.68
    },
    "audioConfig": {
      "rootFreq": 164,
      "scale": [
        0,
        3,
        5,
        6,
        7,
        10
      ],
      "synthType": "rock",
      "bpm": 118
    },
    "tags": [
      "alt-rock",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "rock-04",
    "title": "Reptilia",
    "artist": "The Strokes",
    "album": "Room On Fire",
    "genre": "Alt Rock",
    "bpm": 158,
    "durationSeconds": 220,
    "releaseYear": 2003,
    "coverGradient": "from-red-600 via-stone-800 to-neutral-900",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/f7/e9/2a/f7e92a48-0e20-8286-bbbf-80bd85fbb1af/mzi.gcledsjj.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/82/1c/f2/821cf232-955e-ace3-b24e-9e944f0d000b/mzaf_13672834633152538860.plus.aac.p.m4a",
    "spotifyId": "57igFFucqTFiV6KNFg5AGS",
    "spotifyUrl": "https://open.spotify.com/track/57igFFucqTFiV6KNFg5AGS",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.44,
      "energy": 0.9,
      "valence": 0.73,
      "tempo": 158,
      "acousticness": 0,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.44,
      "energy": 0.9,
      "valence": 0.73,
      "beatsBpmNormalized": 0.817,
      "vibeChillToHype": 0.74,
      "acousticness": 0,
      "instrumentalness": 0,
      "moodHarmonics": 0.56
    },
    "audioConfig": {
      "rootFreq": 164,
      "scale": [
        0,
        3,
        5,
        6,
        7,
        10
      ],
      "synthType": "rock",
      "bpm": 158
    },
    "tags": [
      "alt-rock",
      "kaggle-spotify",
      "verified-audio"
    ]
  },
  {
    "id": "rock-05",
    "title": "Smells Like Teen Spirit",
    "artist": "Nirvana",
    "album": "Nevermind",
    "genre": "Alt Rock",
    "bpm": 117,
    "durationSeconds": 301,
    "releaseYear": 1991,
    "coverGradient": "from-red-600 via-stone-800 to-neutral-900",
    "coverImage": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/95/fd/b9/95fdb9b2-6d2b-92a6-97f2-51c1a6d77f1a/00602527874609.rgb.jpg/600x600bb.jpg",
    "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/65/49/4e/65494e02-b6d3-26d8-6b0c-9bd98dcf4d5d/mzaf_7665413316386155700.plus.aac.p.m4a",
    "spotifyId": "5ghIJDhubRg0gecyY2TY5L",
    "spotifyUrl": "https://open.spotify.com/track/5ghIJDhubRg0gecyY2TY5L",
    "datasetSource": "Kaggle Spotify 1.2M+",
    "audioFeatures": {
      "danceability": 0.5,
      "energy": 0.91,
      "valence": 0.72,
      "tempo": 117,
      "acousticness": 0,
      "instrumentalness": 0
    },
    "vector": {
      "danceability": 0.5,
      "energy": 0.91,
      "valence": 0.72,
      "beatsBpmNormalized": 0.475,
      "vibeChillToHype": 0.77,
      "acousticness": 0,
      "instrumentalness": 0,
      "moodHarmonics": 0.56
    },
    "audioConfig": {
      "rootFreq": 164,
      "scale": [
        0,
        3,
        5,
        6,
        7,
        10
      ],
      "synthType": "rock",
      "bpm": 117
    },
    "tags": [
      "alt-rock",
      "kaggle-spotify",
      "verified-audio"
    ]
  }
];

export const INITIAL_LISTENING_HISTORY: HistoryRecord[] = [
  {
    id: "hist-1",
    songId: "pop-01",
    song: MOCK_SONG_CATALOG[0]!, // Daft Punk - Get Lucky
    listenedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    completionPercent: 100,
    userLiked: true,
    contextVibe: "summer-groove",
  },
  {
    id: "hist-2",
    songId: "pop-03",
    song: MOCK_SONG_CATALOG[2]!, // The Weeknd - Blinding Lights
    listenedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    completionPercent: 95,
    userLiked: true,
    contextVibe: "night-run",
  },
  {
    id: "hist-3",
    songId: "sw-01",
    song: MOCK_SONG_CATALOG[6]!, // Kavinsky - Nightcall
    listenedAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
    completionPercent: 100,
    userLiked: true,
    contextVibe: "outrun-coding",
  },
  {
    id: "hist-4",
    songId: "lo-01",
    song: MOCK_SONG_CATALOG[12]!, // Powfu - death bed
    listenedAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    completionPercent: 85,
    userLiked: true,
    contextVibe: "deep-focus",
  },
  {
    id: "hist-5",
    songId: "soul-01",
    song: MOCK_SONG_CATALOG[25]!, // SZA - Kill Bill
    listenedAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    completionPercent: 100,
    userLiked: true,
    contextVibe: "late-night-chill",
  },
  {
    id: "hist-6",
    songId: "rock-01",
    song: MOCK_SONG_CATALOG[34]!, // Arctic Monkeys - Do I Wanna Know?
    listenedAt: new Date(Date.now() - 3600 * 1000 * 96).toISOString(),
    completionPercent: 90,
    userLiked: true,
    contextVibe: "driving-mood",
  }
];

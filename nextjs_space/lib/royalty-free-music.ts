/**
 * Royalty-Free Music Library
 * Real working music from Pixabay Audio (CC0 License)
 */

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  genre: string;
  mood: string;
  tempo: 'slow' | 'medium' | 'fast';
  url: string;
  previewUrl?: string;
}

/**
 * Curated list of royalty-free music tracks from Pixabay Audio
 * All tracks are CC0 Licensed (free to use, no attribution required)
 */
export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: 'upbeat-1',
    title: 'Sunny Day',
    artist: 'Upbeat Collection',
    duration: 120,
    genre: 'Pop',
    mood: 'Happy',
    tempo: 'fast',
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8a0c32f9c.mp3',
    previewUrl: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8a0c32f9c.mp3',
  },
  {
    id: 'chill-1',
    title: 'Peaceful Morning',
    artist: 'Chill Vibes',
    duration: 180,
    genre: 'Ambient',
    mood: 'Calm',
    tempo: 'slow',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_5a2c09de24.mp3',
    previewUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_5a2c09de24.mp3',
  },
  {
    id: 'corporate-1',
    title: 'Professional Talk',
    artist: 'Corporate Sound',
    duration: 150,
    genre: 'Corporate',
    mood: 'Professional',
    tempo: 'medium',
    url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3',
    previewUrl: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3',
  },
  {
    id: 'energetic-1',
    title: 'Motivation Boost',
    artist: 'Energy Tracks',
    duration: 90,
    genre: 'Electronic',
    mood: 'Energetic',
    tempo: 'fast',
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    previewUrl: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  },
  {
    id: 'dramatic-1',
    title: 'Epic Journey',
    artist: 'Cinematic',
    duration: 200,
    genre: 'Orchestral',
    mood: 'Dramatic',
    tempo: 'medium',
    url: 'https://cdn.pixabay.com/audio/2022/03/22/audio_ef299c5c39.mp3',
    previewUrl: 'https://cdn.pixabay.com/audio/2022/03/22/audio_ef299c5c39.mp3',
  },
  {
    id: 'lofi-1',
    title: 'Lo-Fi Study Beats',
    artist: 'Chill Studio',
    duration: 140,
    genre: 'Lo-Fi',
    mood: 'Relaxed',
    tempo: 'slow',
    url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe25a21.mp3',
    previewUrl: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe25a21.mp3',
  },
  {
    id: 'motivational-1',
    title: 'Rise Up',
    artist: 'Inspire Music',
    duration: 155,
    genre: 'Pop',
    mood: 'Inspirational',
    tempo: 'medium',
    url: 'https://cdn.pixabay.com/audio/2022/10/17/audio_04d791c3db.mp3',
    previewUrl: 'https://cdn.pixabay.com/audio/2022/10/17/audio_04d791c3db.mp3',
  },
  {
    id: 'tech-1',
    title: 'Tech Innovation',
    artist: 'Future Sounds',
    duration: 130,
    genre: 'Electronic',
    mood: 'Modern',
    tempo: 'medium',
    url: 'https://cdn.pixabay.com/audio/2023/02/28/audio_5111db11ad.mp3',
    previewUrl: 'https://cdn.pixabay.com/audio/2023/02/28/audio_5111db11ad.mp3',
  },
];

/**
 * Zoekt muziek tracks op basis van filters
 */
export function searchMusicTracks(filters: {
  genre?: string;
  mood?: string;
  tempo?: 'slow' | 'medium' | 'fast';
  maxDuration?: number;
  minDuration?: number;
}): MusicTrack[] {
  let results = [...MUSIC_LIBRARY];

  if (filters.genre) {
    results = results.filter(track => 
      track.genre.toLowerCase().includes(filters.genre!.toLowerCase())
    );
  }

  if (filters.mood) {
    results = results.filter(track => 
      track.mood.toLowerCase().includes(filters.mood!.toLowerCase())
    );
  }

  if (filters.tempo) {
    results = results.filter(track => track.tempo === filters.tempo);
  }

  if (filters.maxDuration) {
    results = results.filter(track => track.duration <= filters.maxDuration!);
  }

  if (filters.minDuration) {
    results = results.filter(track => track.duration >= filters.minDuration!);
  }

  return results;
}

/**
 * Haalt een specifieke track op
 */
export function getMusicTrack(id: string): MusicTrack | undefined {
  return MUSIC_LIBRARY.find(track => track.id === id);
}

/**
 * Recommended tracks based on video mood/style
 */
export function getRecommendedMusic(videoStyle: string, videoDuration: number): MusicTrack[] {
  const styleMapping: { [key: string]: { genre?: string; mood?: string; tempo?: 'slow' | 'medium' | 'fast' } } = {
    'Cinematic': { genre: 'Orchestral', mood: 'Dramatic' },
    'Anime': { genre: 'Electronic', mood: 'Energetic' },
    'Futuristic': { genre: 'Electronic', tempo: 'fast' },
    'Realistic': { mood: 'Professional', tempo: 'medium' },
    '3D': { genre: 'Electronic', mood: 'Energetic' },
  };

  const filters = styleMapping[videoStyle] || {};
  return searchMusicTracks({
    ...filters,
    maxDuration: videoDuration + 30, // Allow tracks slightly longer than video
  }).slice(0, 5);
}

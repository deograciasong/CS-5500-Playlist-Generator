import type { Song, MoodProfile, PlaylistResult } from '../types/song.types';
import { MoodAnalyzer } from '../services/mood.service';

export class SongRecommendationService {
  private songs: Song[] = [];

  constructor(songs: Song[]) {
    this.songs = songs;
  }

  /**
   * Generates a playlist based on user mood input
   */
  generatePlaylist(
    moodInput: string,
    playlistSize: number = 20
  ): PlaylistResult {
    const moodProfile = MoodAnalyzer.analyzeMood(moodInput);
    const matchedSongs = this.filterSongsByMood(moodProfile);
    const selectedSongs = this.selectTopSongs(matchedSongs, playlistSize);
    
    return {
      mood: moodProfile.name,
      songs: selectedSongs,
      description: MoodAnalyzer.generateDescription(moodProfile, moodInput),
    };
  }

  /**
   * Filters songs based on mood profile criteria
   */
  private filterSongsByMood(profile: MoodProfile): Song[] {
    return this.songs.filter(song => {
      // Check valence (happiness)
      if (!this.isInRange(song.valence, profile.valence)) {
        return false;
      }

      // Check energy
      if (!this.isInRange(song.energy, profile.energy)) {
        return false;
      }

      // Check optional criteria
      if (profile.danceability && !this.isInRange(song.danceability, profile.danceability)) {
        return false;
      }

      if (profile.acousticness && !this.isInRange(song.acousticness, profile.acousticness)) {
        return false;
      }

      if (profile.tempo && !this.isInRange(song.tempo, profile.tempo)) {
        return false;
      }

      if (profile.instrumentalness && !this.isInRange(song.instrumentalness, profile.instrumentalness)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Checks if a value is within a specified range
   */
  private isInRange(value: number, range: [number, number]): boolean {
    return value >= range[0] && value <= range[1];
  }

  /**
   * Selects top songs based on popularity and variety
   */
  private selectTopSongs(songs: Song[], count: number): Song[] {
    if (songs.length === 0) {
      return [];
    }

    // Sort by popularity and get diverse genres
    const sortedByPopularity = [...songs].sort((a, b) => b.popularity - a.popularity);
    
    // Try to get variety in genres
    const selectedSongs: Song[] = [];
    const genreCount = new Map<string, number>();
    const maxPerGenre = Math.ceil(count / 5); // Max 20% from same genre

    for (const song of sortedByPopularity) {
      if (selectedSongs.length >= count) break;

      const genreCounter = genreCount.get(song.track_genre) || 0;
      if (genreCounter < maxPerGenre) {
        selectedSongs.push(song);
        genreCount.set(song.track_genre, genreCounter + 1);
      }
    }

    // If we still need more songs, fill with remaining popular tracks
    if (selectedSongs.length < count) {
      for (const song of sortedByPopularity) {
        if (selectedSongs.length >= count) break;
        if (!selectedSongs.find(s => s.track_id === song.track_id)) {
          selectedSongs.push(song);
        }
      }
    }

    return selectedSongs.slice(0, count);
  }

  /**
   * Gets song statistics for debugging
   */
  getStats(): {
    totalSongs: number;
    genres: string[];
  } {
    const genres = new Set(this.songs.map(s => s.track_genre));
    return {
      totalSongs: this.songs.length,
      genres: Array.from(genres),
    };
  }
}
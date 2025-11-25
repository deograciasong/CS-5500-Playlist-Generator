import type { Song, MoodProfile } from '../types/song.types';

/**
 * Checks if a value is within a given range
 */
function isInRange(value: number, range: [number, number] | undefined): boolean {
  if (!range) return true;
  return value >= range[0] && value <= range[1];
}

/**
 * Calculates how well a song matches the mood profile (0-1 score)
 */
function calculateMatchScore(song: Song, profile: MoodProfile): number {
  let score = 0;
  let factors = 0;
  
  // Valence (happiness) - most important
  if (profile.valence) {
    const valenceMid = (profile.valence[0] + profile.valence[1]) / 2;
    const valenceScore = 1 - Math.abs(song.valence - valenceMid);
    score += valenceScore * 2; // Weight valence more
    factors += 2;
  }
  
  // Energy
  if (profile.energy) {
    const energyMid = (profile.energy[0] + profile.energy[1]) / 2;
    const energyScore = 1 - Math.abs(song.energy - energyMid);
    score += energyScore * 1.5; // Weight energy
    factors += 1.5;
  }
  
  // Danceability
  if (profile.danceability) {
    const danceMid = (profile.danceability[0] + profile.danceability[1]) / 2;
    const danceScore = 1 - Math.abs(song.danceability - danceMid);
    score += danceScore;
    factors += 1;
  }
  
  // Acousticness
  if (profile.acousticness) {
    const acousticMid = (profile.acousticness[0] + profile.acousticness[1]) / 2;
    const acousticScore = 1 - Math.abs(song.acousticness - acousticMid);
    score += acousticScore;
    factors += 1;
  }
  
  // Instrumentalness
  if (profile.instrumentalness) {
    const instrumentalMid = (profile.instrumentalness[0] + profile.instrumentalness[1]) / 2;
    const instrumentalScore = 1 - Math.abs(song.instrumentalness - instrumentalMid);
    score += instrumentalScore;
    factors += 1;
  }
  
  // Tempo
  if (profile.tempo && song.tempo) {
    const tempoMid = (profile.tempo[0] + profile.tempo[1]) / 2;
    const tempoRange = profile.tempo[1] - profile.tempo[0];
    const tempoScore = Math.max(0, 1 - Math.abs(song.tempo - tempoMid) / tempoRange);
    score += tempoScore;
    factors += 1;
  }
  
  return factors > 0 ? score / factors : 0;
}

/**
 * Filters songs based on mood profile and returns top matches
 */
export function filterSongsByMood(
  songs: Song[],
  profile: MoodProfile,
  limit: number = 20
): Song[] {
  console.log(`Filtering ${songs.length} songs for mood: ${profile.name}`);
  
  // Step 1: Filter songs that meet the basic criteria
  const matchingSongs = songs.filter(song => {
    // Must match valence range
    if (!isInRange(song.valence, profile.valence)) return false;
    
    // Must match energy range
    if (!isInRange(song.energy, profile.energy)) return false;
    
    // Check optional criteria
    if (profile.danceability && !isInRange(song.danceability, profile.danceability)) {
      return false;
    }
    
    if (profile.acousticness && !isInRange(song.acousticness, profile.acousticness)) {
      return false;
    }
    
    if (profile.instrumentalness && !isInRange(song.instrumentalness, profile.instrumentalness)) {
      return false;
    }
    
    if (profile.tempo && song.tempo && !isInRange(song.tempo, profile.tempo)) {
      return false;
    }
    
    if (profile.loudness && song.loudness && !isInRange(song.loudness, profile.loudness)) {
      return false;
    }
    
    return true;
  });
  
  console.log(`Found ${matchingSongs.length} matching songs`);
  
  if (matchingSongs.length === 0) {
    return [];
  }
  
  // Step 2: Calculate match scores for all matching songs
  const songsWithScores = matchingSongs.map(song => ({
    song,
    score: calculateMatchScore(song, profile),
  }));
  
  // Step 3: Sort by score (highest first)
  songsWithScores.sort((a, b) => b.score - a.score);
  
  // Step 4: Ensure genre diversity and prevent duplicates
  const selectedSongs: Song[] = [];
  const addedTrackIds = new Set<string>(); // Track which songs we've added
  const genreCounts: Record<string, number> = {};
  const maxPerGenre = Math.ceil(limit * 0.2); // Max 20% from same genre
  
  for (const { song } of songsWithScores) {
    if (selectedSongs.length >= limit) break;
    
    // Skip if we've already added this track
    if (addedTrackIds.has(song.track_id)) continue;
    
    const genre = song.track_genre || 'unknown';
    const genreCount = genreCounts[genre] || 0;
    
    // Add song if we haven't hit genre limit or if we're running out of options
    if (genreCount < maxPerGenre || selectedSongs.length >= limit * 0.7) {
      selectedSongs.push(song);
      addedTrackIds.add(song.track_id);
      genreCounts[genre] = genreCount + 1;
    }
  }
  
  // Step 5: If we still need more songs, add the best remaining ones
  if (selectedSongs.length < limit) {
    for (const { song } of songsWithScores) {
      if (selectedSongs.length >= limit) break;
      
      // Skip if we've already added this track
      if (addedTrackIds.has(song.track_id)) continue;
      
      selectedSongs.push(song);
      addedTrackIds.add(song.track_id);
    }
  }
  
  console.log(`Selected ${selectedSongs.length} unique songs for playlist`);
  
  return selectedSongs.slice(0, limit);
}
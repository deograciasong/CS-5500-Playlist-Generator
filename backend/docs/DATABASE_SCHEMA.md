# Playlist Generator Database Schema

This document describes the complete database schema for the Playlist Generator application, implemented using MongoDB and Mongoose.

## Models Overview

### 1. **User** (`users` collection)
Stores user profile information and preferences.

**Key Fields:**
- `spotifyUserId`: Unique Spotify user identifier
- `displayName`, `email`, `country`, `product`: User profile data
- `images[]`: User profile images
- `preferences`: User settings for playlist generation
- `capabilities`: Available features for the user

### 2. **AuthToken** (`authtokens` collection) 
Manages OAuth tokens for external services.

**Key Fields:**
- `userId`: Reference to User
- `provider`: Service provider (currently 'spotify')
- `accessToken`, `refreshToken`: OAuth tokens
- `expiresAt`: Token expiration timestamp

### 3. **Track** (`tracks` collection)
Stores track metadata and audio features.

**Key Fields:**
- `spotifyTrackId`: Unique Spotify track identifier
- `name`, `artists[]`, `album`: Basic track information
- `audioFeatures`: Spotify audio features (tempo, energy, valence, etc.)
- `featureVector[]`: Processed feature vector for ML operations
- `analysis`: Analysis metadata and status

### 4. **UserLibrary** (`userlibraries` collection)
Tracks user's saved songs and listening behavior.

**Key Fields:**
- `userId`, `trackId`: References to User and Track
- `savedAt`, `removedAt`: Timeline of library changes
- `like`: User preference indicator
- `skipCount`, `lastHeardAt`: Listening behavior metrics

### 5. **MoodQuery** (`moodqueries` collection)
Stores user mood/vibe queries for playlist generation.

**Key Fields:**
- `userId`: Reference to User
- `rawText`: Original user input
- `parsed`: Processed mood parameters (tempo, energy, brightness ranges)
- `modelVersion`: Version of NLP model used

### 6. **GenerationSession** (`generationsessions` collection)
Tracks playlist generation process and results.

**Key Fields:**
- `userId`, `moodQueryId`: References to User and MoodQuery
- `candidates[]`: Potential tracks with scores and reasons
- `ordering[]`: Final track ordering
- `algorithms`: Algorithm configurations used
- `status`: Generation status (pending, processing, completed, failed)

### 7. **Playlist** (`playlists` collection)
Stores generated playlists.

**Key Fields:**
- `userId`: Reference to User
- `spotifyPlaylistId`: Spotify playlist ID (if exported)
- `name`, `description`: Playlist metadata
- `tracks[]`: Ordered list of tracks with positions
- `sourceSessionId`: Reference to GenerationSession

### 8. **FeedbackEvent** (`feedbackevents` collection)
Captures user interactions for learning and analytics.

**Key Fields:**
- `userId`, `trackId`, `playlistId`: Context references
- `event`: Type of interaction (play, skip, like, etc.)
- `position`, `elapsedMs`: Playback position data
- `contextJson`: Additional interaction context

### 9. **Mood** (`moods` collection)
Predefined mood categories with default parameters.

**Key Fields:**
- `key`: Unique mood identifier
- `label`: Display name
- `defaults`: Default audio feature ranges
- `icon`: Emoji representation
- `order`: Display ordering

### 10. **ModelRegistry** (`modelregistries` collection)
Tracks ML model versions and performance.

**Key Fields:**
- `name`, `version`: Model identification
- `artifact`: Model file location
- `metricsJson`: Performance metrics
- `activatedAt`: Deployment timestamp

## Relationships

### User-Centric Relations
- User → AuthTokens (1:many)
- User → UserLibrary (1:many) 
- User → MoodQueries (1:many)
- User → GenerationSessions (1:many)
- User → Playlists (1:many)
- User → FeedbackEvents (1:many)

### Content Relations
- Track → UserLibrary (1:many)
- Track → FeedbackEvents (1:many)
- Track → GenerationSession.candidates (1:many)
- Track → Playlist.tracks (1:many)

### Process Flow Relations
- MoodQuery → GenerationSession (1:many)
- GenerationSession → Playlist (1:1)
- Playlist → FeedbackEvents (1:many)

## Indexes

Each model includes strategic indexes for query performance:

- **User**: `spotifyUserId` (unique)
- **AuthToken**: `userId + provider`, `expiresAt`
- **Track**: `spotifyTrackId` (unique), `artists.name`, `album.name`
- **UserLibrary**: `userId + trackId` (unique), `userId + savedAt`
- **MoodQuery**: `userId + createdAt`
- **GenerationSession**: `userId + createdAt`, `moodQueryId`
- **Playlist**: `userId + updatedAt`, `spotifyPlaylistId`
- **FeedbackEvent**: `userId + createdAt`, `trackId + event`
- **Mood**: `key` (unique), `order`
- **ModelRegistry**: `name + version` (unique), `activatedAt`

## Sample Data

The database includes seeded mood data:
- 😊 Happy (energetic, bright, upbeat)
- 😢 Sad (low energy, darker, slower)
- ⚡ Energetic (high energy, fast tempo)
- 😌 Chill (relaxed, moderate brightness)
- 🎯 Focus (balanced, moderate tempo)
- 🎉 Party (high energy, bright, danceable)

## Usage Notes

1. **Authentication Flow**: User → AuthToken storage → Session management
2. **Content Discovery**: Spotify API → Track storage → Feature extraction
3. **Playlist Generation**: MoodQuery → GenerationSession → Playlist
4. **Learning Loop**: FeedbackEvent collection → Model improvement
5. **Personalization**: UserLibrary + FeedbackEvents → User preferences

All models support automatic timestamps and are optimized for the application's query patterns.

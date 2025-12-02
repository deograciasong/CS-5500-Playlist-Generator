"use strict";
import mongoose from "mongoose";
const artistSchema = new mongoose.Schema({
    id: String,
    name: String
}, { _id: false });
const imageSchema = new mongoose.Schema({
    url: String,
    width: Number,
    height: Number
}, { _id: false });
const albumSchema = new mongoose.Schema({
    id: String,
    name: String,
    images: [imageSchema]
}, { _id: false });
const audioFeaturesSchema = new mongoose.Schema({
    source: { type: String, enum: ['spotify', 'custom'], default: 'spotify' },
    tempo: Number,
    energy: Number,
    valence: Number,
    brightness: Number,
    acousticness: Number,
    instrumentalness: Number,
    danceability: Number,
    key: Number,
    mode: Number,
    timeSignature: Number,
    confidence: Number
}, { _id: false });
const analysisMetaSchema = new mongoose.Schema({
    previewAvailable: Boolean,
    previewUrl: String,
    pipelineVersion: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    error: String,
    analyzedAt: Date
}, { _id: false });
const trackSchema = new mongoose.Schema({
    spotifyTrackId: { type: String, required: true },
    name: { type: String, required: true },
    artists: [artistSchema],
    album: albumSchema,
    durationMs: Number,
    explicit: Boolean,
    popularity: Number,
    audioFeatures: audioFeaturesSchema,
    featureVector: [Number],
    fetchedAt: { type: Date, default: Date.now },
    source: { type: String, enum: ['spotify', 'user_upload'], default: 'spotify' },
    analysis: analysisMetaSchema
});
trackSchema.index({ spotifyTrackId: 1 }, { unique: true });
trackSchema.index({ 'artists.name': 1 });
trackSchema.index({ 'album.name': 1 });
export default mongoose.model("Track", trackSchema);

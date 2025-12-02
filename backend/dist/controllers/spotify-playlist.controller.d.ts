/**
 * Spotify Playlist Controller
 * -----------------------------
 * - POST   /playlists                     → createPlaylistHandler
 * - POST   /playlists/:playlistId/tracks  → addPlaylistTracksHandler
 * - PUT    /playlists/:playlistId/tracks  → replacePlaylistTracksHandler
 * - PUT    /playlists/:playlistId/tracks/reorder → reorderPlaylistTracksHandler
 */
import type { Request, Response } from "express";
/** Creates a new playlist for the user. */
export declare const createPlaylistForUser: (req: Request, res: Response) => Promise<void>;
/** Adds tracks to an existing playlist. */
export declare const addTracksToPlaylistHandler: (req: Request, res: Response) => Promise<void>;
/** Replaces tracks in an existing playlist. */
export declare const replacePlaylistTracksHandler: (req: Request, res: Response) => Promise<void>;
/** Reorders tracks in an existing playlist. */
export declare const reorderPlaylistTracksHandler: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=spotify-playlist.controller.d.ts.map
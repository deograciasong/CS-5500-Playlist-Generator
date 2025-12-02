import type { Request, Response } from "express";
export declare const createSavedPlaylist: (req: Request, res: Response) => Promise<void>;
export declare const listSavedPlaylists: (req: Request, res: Response) => Promise<void>;
export declare const getSavedPlaylistById: (req: Request, res: Response) => Promise<void>;
export declare const deleteSavedPlaylist: (req: Request, res: Response) => Promise<void>;
declare const _default: {
    createSavedPlaylist: (req: Request, res: Response) => Promise<void>;
    listSavedPlaylists: (req: Request, res: Response) => Promise<void>;
    getSavedPlaylistById: (req: Request, res: Response) => Promise<void>;
    deleteSavedPlaylist: (req: Request, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=user-playlists.controller.d.ts.map
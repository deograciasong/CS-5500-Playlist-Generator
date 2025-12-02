import type { Request, Response } from "express";
/**
 * Debug endpoints to inspect LocalUser documents.
 * Only allowed when NODE_ENV !== 'production'.
 */
export declare const getUserByEmailOrId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getUserByEmailOrId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
//# sourceMappingURL=debug.controller.d.ts.map
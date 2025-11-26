import type { Request, Response } from "express";
export declare const getCurrentAuthUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getCurrentAuthUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
/**
 * PUT /auth/me
 * Update current local user (name, email)
 */
export declare const updateCurrentAuthUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PUT /auth/me/password
 * Change password for current local user
 * Body: { currentPassword, newPassword }
 */
export declare const changeCurrentUserPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth-me.controller.d.ts.map
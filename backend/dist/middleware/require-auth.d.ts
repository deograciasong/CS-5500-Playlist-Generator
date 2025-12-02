import type { NextFunction, Request, Response } from "express";
export interface AuthenticatedRequest extends Request {
    authUserId?: string;
}
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default requireAuth;
//# sourceMappingURL=require-auth.d.ts.map
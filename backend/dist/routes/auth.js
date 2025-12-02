import express from "express";
import { login, callback, refreshToken } from "../controllers/spotify-auth.controller.js";
import { register } from "../controllers/local-auth.controller.js";
import { loginLocal } from "../controllers/local-login.controller.js";
import { getCurrentAuthUser } from "../controllers/auth-me.controller.js";
const router = express.Router();
router.get("/login", login);
router.get("/callback", callback);
router.post("/refresh", refreshToken);
// Update current authenticated local user
router.put('/me', (req, res, next) => {
    // lazy require to avoid circular imports in some TS setups
    import('../controllers/auth-me.controller.js').then(mod => mod.updateCurrentAuthUser(req, res)).catch(next);
});
router.put('/me/password', (req, res, next) => {
    import('../controllers/auth-me.controller.js').then(mod => mod.changeCurrentUserPassword(req, res)).catch(next);
});
// Local registration endpoint (creates a LocalUser)
router.post("/register", register);
// Local login (email/password)
router.post("/login-local", loginLocal);
// Get current authenticated user (checks cookie or Authorization header)
router.get('/me', getCurrentAuthUser);
// Debug: fetch a LocalUser by email or id (disabled in production)
router.get('/debug/user', (req, res, next) => {
    // lazy import to avoid circular issues and keep behavior consistent with other routes
    import('../controllers/debug.controller.js').then(mod => mod.getUserByEmailOrId(req, res)).catch(next);
});
export default router;
//# sourceMappingURL=auth.js.map
import express from "express";
import { login, callback, refreshToken } from "../controllers/spotify-auth.controller.js";
import { register } from "../controllers/local-auth.controller.js";
import { loginLocal } from "../controllers/local-login.controller.js";
import { getCurrentAuthUser } from "../controllers/auth-me.controller.js";
const router = express.Router();
router.get("/login", login);
router.get("/callback", callback);
router.post("/refresh", refreshToken);
// Local registration endpoint (creates a LocalUser)
router.post("/register", register);
// Local login (email/password)
router.post("/login-local", loginLocal);
// Get current authenticated user (checks cookie or Authorization header)
router.get('/me', getCurrentAuthUser);
export default router;
//# sourceMappingURL=auth.js.map
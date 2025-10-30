import express from "express";
import { loginSpotify, callbackSpotify } from "../controllers/authController.js";
const router = express.Router();

router.get("/spotify", loginSpotify);
router.get("/callback", callbackSpotify);

export default router;
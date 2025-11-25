import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import spotifyUserRoutes from "./routes/spotify-user.js";
import spotifyPlaylistRoutes from "./routes/spotify-playlists.js";
dotenv.config();
const app = express();
// Configure CORS to allow the frontend origin and allow credentials (cookies)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? process.env.APP_REDIRECT_AFTER_LOGIN ?? "http://localhost:5173,http://localhost:5174";
const allowedOrigins = FRONTEND_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // Let CORS reflect requested headers to avoid blocking custom ones
};
// Replace automatic `cors` for a simple explicit middleware to ensure
// Access-Control headers are always present for allowed origins and
// to correctly handle OPTIONS preflight requests in this ESM setup.
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) {
        return next();
    }
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        const reqHeaders = req.headers["access-control-request-headers"];
        res.setHeader("Access-Control-Allow-Headers", reqHeaders ?? "Content-Type, Authorization, X-Requested-With");
        if (req.method === "OPTIONS") {
            res.sendStatus(204);
            return;
        }
    }
    next();
});
app.use(express.json());
app.use(cookieParser());
connectDB();
app.use("/api/auth", authRoutes);
app.use("/api/spotify", spotifyUserRoutes);
app.use("/api/spotify/playlists", spotifyPlaylistRoutes);
const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map
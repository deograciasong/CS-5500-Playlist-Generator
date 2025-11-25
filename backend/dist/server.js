import "./config/env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import spotifyUserRoutes from "./routes/spotify-user.js";
import spotifyPlaylistRoutes from "./routes/spotify-playlists.js";
const app = express();
const frontendOrigin = process.env.FRONTEND_URL ?? process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const allowedOrigins = frontendOrigin.split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
connectDB();
app.use("/api/auth", authRoutes);
app.use("/api/spotify", spotifyUserRoutes);
app.use("/api/spotify/playlists", spotifyPlaylistRoutes);
const PORT = process.env.PORT ?? 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map
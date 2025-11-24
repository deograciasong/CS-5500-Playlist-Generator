import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import spotifyUserRoutes from "./routes/spotify-user.js";
import spotifyPlaylistRoutes from "./routes/spotify-playlists.js";

dotenv.config();

const app = express();

app.use(cors());
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

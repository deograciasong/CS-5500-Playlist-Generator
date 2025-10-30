import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const loginSpotify = (req, res) => {
  const scopes = "user-read-email user-library-read playlist-modify-public playlist-modify-private";
  const redirectUri = encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI);
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=${scopes}&redirect_uri=${redirectUri}`;
  res.redirect(authUrl);
};

export const callbackSpotify = async (req, res) => {
  const code = req.query.code;
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  const { access_token, refresh_token } = response.data;
  res.json({ accessToken: access_token, refreshToken: refresh_token });
};
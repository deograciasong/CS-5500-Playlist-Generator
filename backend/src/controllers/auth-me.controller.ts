import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import LocalUser from "../models/LocalUser.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret";

export const getCurrentAuthUser = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.auth_token || (req.headers.authorization || "").split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "unauthenticated", message: "Not authenticated" });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return res.status(401).json({ error: "invalid_token", message: "Invalid token" });
    }

    const userId = payload?.sub;
    if (!userId) {
      return res.status(401).json({ error: "invalid_token", message: "Invalid token payload" });
    }

    const user = await LocalUser.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ error: "not_found", message: "User not found" });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        displayName: user.name,
        spotifyId: (user as any).spotifyId ?? null,
        spotifyProfile: (user as any).spotifyProfile ?? null,
      },
    });
  } catch (err: any) {
    console.error('getCurrentAuthUser error', err);
    return res.status(500).json({ error: 'internal_error', message: 'Failed to fetch user' });
  }
};

export default { getCurrentAuthUser };

/**
 * PUT /auth/me
 * Update current local user (name, email)
 */
export const updateCurrentAuthUser = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.auth_token || (req.headers.authorization || "").split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "unauthenticated", message: "Not authenticated" });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return res.status(401).json({ error: "invalid_token", message: "Invalid token" });
    }

    const userId = payload?.sub;
    if (!userId) {
      return res.status(401).json({ error: "invalid_token", message: "Invalid token payload" });
    }

    const user = await LocalUser.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ error: "not_found", message: "User not found" });
    }

    const { name, email } = req.body ?? {};
    if (typeof name === 'string' && name.trim().length > 0) {
      user.name = name.trim();
    }

    if (typeof email === 'string' && email.trim().length > 0 && email !== user.email) {
      // ensure unique
      const exists = await LocalUser.findOne({ email: email.trim() }).exec();
      if (exists && String(exists._id) !== String(user._id)) {
        return res.status(409).json({ error: 'email_exists', message: 'An account with that email already exists' });
      }
      user.email = email.trim();
    }

    await user.save();

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        displayName: user.name,
        createdAt: user.createdAt,
        spotifyId: (user as any).spotifyId ?? null,
        spotifyProfile: (user as any).spotifyProfile ?? null,
      },
    });
  } catch (err: any) {
    console.error('updateCurrentAuthUser error', err);
    return res.status(500).json({ error: 'internal_error', message: 'Failed to update user' });
  }
};

/**
 * PUT /auth/me/password
 * Change password for current local user
 * Body: { currentPassword, newPassword }
 */
export const changeCurrentUserPassword = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.auth_token || (req.headers.authorization || "").split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "unauthenticated", message: "Not authenticated" });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return res.status(401).json({ error: "invalid_token", message: "Invalid token" });
    }

    const userId = payload?.sub;
    if (!userId) {
      return res.status(401).json({ error: "invalid_token", message: "Invalid token payload" });
    }

    const user = await LocalUser.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ error: "not_found", message: "User not found" });
    }

    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'missing_fields', message: 'currentPassword and newPassword are required' });
    }

    // Verify current password
    const ok = await user.verifyPassword(currentPassword);
    if (!ok) {
      return res.status(401).json({ error: 'invalid_credentials', message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'weak_password', message: 'New password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    user.passwordHash = hash;
    await user.save();

    return res.status(204).send();
  } catch (err: any) {
    console.error('changeCurrentUserPassword error', err);
    return res.status(500).json({ error: 'internal_error', message: 'Failed to change password' });
  }
};

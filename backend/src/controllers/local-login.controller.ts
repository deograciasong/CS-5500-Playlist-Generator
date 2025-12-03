import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { secureCookieDefaults } from "../lib/auth.js";
import LocalUser from "../models/LocalUser.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret";

export const loginLocal = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "missing_fields", message: "email and password required" });
  }

  try {
    const user = await LocalUser.findOne({ email }).exec();
    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
    }

    const payload = { sub: String(user._id), email: user.email, provider: "local" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    // Set httpOnly cookie for session
    res.cookie("auth_token", token, {
      ...secureCookieDefaults,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err: any) {
    console.error("Login error", err);
    return res.status(500).json({ error: "internal_error", message: "Login failed" });
  }
};

export default { loginLocal };

import type { Request, Response } from "express";
import localUserSchema from "../models/LocalUser.js";

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "missing_fields", message: "name, email and password are required" });
  }

  try {
    // Check existing
    const exists = await localUserSchema.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ error: "email_exists", message: "An account with that email already exists" });
    }

    const user = await localUserSchema.createWithPassword({ name, email, password });

    // Don't return passwordHash
    const out = { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt };
    return res.status(201).json({ user: out });
  } catch (err: any) {
    console.error("Error creating local user", err);
    return res.status(500).json({ error: "internal_error", message: "Failed to create user" });
  }
};

export default { register };

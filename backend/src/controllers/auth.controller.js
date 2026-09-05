import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "../models/User.js";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

const TOKEN_TTL = "7d";
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    config.jwtSecret,
    { expiresIn: TOKEN_TTL }
  );
}

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
}

/**
 * POST /api/auth/signup
 * body: { name, email, password }
 */
export async function signup(req, res) {
  try {
    const { name, email, password } = req.body || {};

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = signToken(user);

    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    logger.error("signup failed", err);
    res.status(500).json({ error: "Failed to create account" });
  }
}

/**
 * POST /api/auth/login
 * body: { email, password }
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user);

    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    logger.error("login failed", err);
    res.status(500).json({ error: "Failed to log in" });
  }
}

/**
 * GET /api/auth/me
 * Requires requireAuth middleware — returns the current user's profile.
 */
export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    logger.error("me failed", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
}

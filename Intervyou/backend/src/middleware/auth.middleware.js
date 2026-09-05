import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

/**
 * requireAuth
 *
 * Reads "Authorization: Bearer <token>" from the request,
 * verifies it, and attaches the decoded payload to req.user.
 *
 * Use this on any route that should only work for a logged-in user
 * (e.g. starting an interview, fetching interview history).
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

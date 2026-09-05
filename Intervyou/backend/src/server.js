import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import http from "http";

import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { attachSessionSocket } from "./sockets/sessionSocket.js";

import authRoutes from "./routes/auth.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import resumeRoutes from "./routes/resume.routes.js";

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());
app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "intervyou-backend", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/resume", resumeRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const server = http.createServer(app);
attachSessionSocket(server);

function connectMongo() {
  if (!config.mongoUri) return;
  mongoose
    .connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 })
    .then(() => logger.info("MongoDB connected"))
    .catch((err) =>
      logger.warn("MongoDB not connected (continuing without persistence):", err.message)
    );
}

function start() {
  // Don't block server start on Mongo — the orchestrator/session flow works
  // in-memory even without a DB, which keeps local dev/demo friction-free.
  connectMongo();
  server.listen(config.port, () => {
    logger.info(`Intervyou backend listening on port ${config.port}`);
    logger.info(`WebSocket session endpoint: ws://localhost:${config.port}/ws/session`);
  });
}

start();

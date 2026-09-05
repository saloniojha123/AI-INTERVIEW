

import { WebSocketServer } from "ws";
import { orchestratorService } from "../services/orchestrator/OrchestratorService.js";
import { logger } from "../utils/logger.js";

/**
 * Native WebSocket layer for control and UI coordination.
 * Path: /ws/session
 */
export function attachSessionSocket(server) {
  const wss = new WebSocketServer({ server, path: "/ws/session" });

  // Map of sessionId -> Set of active WebSocket clients
  const rooms = new Map();

  function broadcastToSession(sessionId, payload) {
    const clients = rooms.get(sessionId);
    if (!clients) return;
    const data = JSON.stringify(payload);
    for (const client of clients) {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(data);
      }
    }
  }

  wss.on("connection", (ws) => {
    logger.info("WebSocket client connected to /ws/session");

    ws.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return ws.send(JSON.stringify({ type: "error", message: "Invalid JSON format" }));
      }

      try {
        switch (msg.type) {
          case "join": {
            const { sessionId } = msg;
            ws.sessionId = sessionId;

            if (!rooms.has(sessionId)) {
              rooms.set(sessionId, new Set());
            }
            rooms.get(sessionId).add(ws);

            ws.send(JSON.stringify({ type: "joined", sessionId }));
            logger.info(`Client joined session room: ${sessionId}`);
            break;
          }

          case "candidate_final_transcript": {
            const { sessionId, text } = msg;
            if (!sessionId || !text) {
              return ws.send(JSON.stringify({ type: "error", message: "Missing sessionId or text" }));
            }

            // Optional: Broadcast candidate transcript to room for live rendering
            broadcastToSession(sessionId, {
              type: "candidate_utterance",
              text,
              timestamp: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
            });

            // Handle turn through multi-persona orchestrator
            const response = await orchestratorService.handleCandidateTurn(
              sessionId,
              text,
              (eventType, eventData) => {
                broadcastToSession(sessionId, { type: eventType, ...eventData });
              }
            );

            // Broadcast persona handoff and text response to the session
            broadcastToSession(sessionId, {
              type: "persona_response",
              ...response,
              timestamp: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
            });
            break;
          }

          default:
            ws.send(JSON.stringify({ type: "error", message: `Unknown message type: ${msg.type}` }));
        }
      } catch (err) {
        logger.error("WebSocket message handling error:", err);
        ws.send(JSON.stringify({ type: "error", message: err.message }));
      }
    });

    ws.on("close", () => {
      if (ws.sessionId && rooms.has(ws.sessionId)) {
        rooms.get(ws.sessionId).delete(ws);
        if (rooms.get(ws.sessionId).size === 0) {
          rooms.delete(ws.sessionId);
        }
      }
      logger.info("WebSocket client disconnected");
    });
  });

  return wss;
}
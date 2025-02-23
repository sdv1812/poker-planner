import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { insertParticipantSchema, type WSMessage } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/socket' });

  // Map of sessionId -> Map of participantId -> WebSocket connection
  const sessions = new Map<string, Map<number, WebSocket>>();

  function broadcastToSession(sessionId: string, message: WSMessage) {
    const participants = sessions.get(sessionId);
    if (!participants) return;

    const data = JSON.stringify(message);
    participants.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  async function broadcastSessionState(sessionId: string) {
    const session = await storage.getSession(sessionId);
    if (!session) return;

    const participants = await storage.getParticipants(sessionId);
    broadcastToSession(sessionId, {
      type: "state_update",
      session,
      participants,
    });
  }

  // Create new session
  app.post("/api/sessions", async (_req, res) => {
    const session = await storage.createSession({ id: nanoid() });
    res.json(session);
  });

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get("sessionId");
    let participantId: number | null = null;

    // Validate session
    if (!sessionId) {
      ws.send(JSON.stringify({ type: "error", message: "Session ID required" }));
      ws.close();
      return;
    }

    const session = await storage.getSession(sessionId);
    if (!session) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid session" }));
      ws.close();
      return;
    }

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;

        switch (message.type) {
          case "join": {
            const result = insertParticipantSchema.safeParse({
              sessionId,
              name: message.name,
            });

            if (!result.success) {
              ws.send(JSON.stringify({ type: "error", message: "Invalid name" }));
              return;
            }

            const participant = await storage.addParticipant(result.data);
            participantId = participant.id;

            if (!sessions.has(sessionId)) {
              sessions.set(sessionId, new Map());
            }
            sessions.get(sessionId)!.set(participantId, ws);
            await broadcastSessionState(sessionId);
            break;
          }

          case "vote": {
            if (!participantId) return;
            await storage.updateParticipant(participantId, { vote: message.vote });
            await broadcastSessionState(sessionId);
            break;
          }

          case "reveal": {
            await storage.updateSession(sessionId, { revealed: true });
            await broadcastSessionState(sessionId);
            break;
          }

          case "reset": {
            await storage.updateSession(sessionId, { revealed: false });
            const participants = await storage.getParticipants(sessionId);
            await Promise.all(
              participants.map(p => storage.updateParticipant(p.id, { vote: null }))
            );
            await broadcastSessionState(sessionId);
            break;
          }
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
        ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
      }
    });

    ws.on("close", async () => {
      if (participantId) {
        await storage.removeParticipant(participantId);
        const participants = sessions.get(sessionId);
        if (participants) {
          participants.delete(participantId);
          if (participants.size === 0) {
            sessions.delete(sessionId);
          }
        }
        await broadcastSessionState(sessionId);
      }
    });
  });

  return httpServer;
}
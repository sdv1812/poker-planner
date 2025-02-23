import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { insertParticipantSchema, type WSMessage, type Session, type Participant } from "@shared/schema";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Map of sessionId -> Map of participantId -> WebSocket connection
  const sessions = new Map<string, Map<number, WebSocket>>();

  function broadcastToSession(sessionId: string, message: WSMessage) {
    const participants = sessions.get(sessionId);
    if (!participants) {
      log(`No participants found for session ${sessionId}`);
      return;
    }

    const data = JSON.stringify(message);
    log(`Broadcasting to session ${sessionId}: ${data}`);
    for (const ws of participants.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  async function broadcastSessionState(sessionId: string) {
    const session = await storage.getSession(sessionId);
    if (!session) {
      log(`Session ${sessionId} not found during state broadcast`);
      return;
    }

    const participants = await storage.getParticipants(sessionId);
    log(`Broadcasting state update for session ${sessionId} with ${participants.length} participants`);
    broadcastToSession(sessionId, {
      type: "state_update",
      session,
      participants,
    });
  }

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get("sessionId");
    log(`New WebSocket connection attempt for session: ${sessionId}`);

    if (!sessionId) {
      log("Connection rejected: No session ID provided");
      ws.send(JSON.stringify({ type: "error", message: "No session ID provided" }));
      ws.close();
      return;
    }

    // Validate session exists
    const session = await storage.getSession(sessionId);
    if (!session) {
      log(`Connection rejected: Invalid session ID ${sessionId}`);
      ws.send(JSON.stringify({ type: "error", message: "Invalid session ID" }));
      ws.close();
      return;
    }

    log(`WebSocket connection established for session ${sessionId}`);
    let participantId: number | null = null;

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        log(`Received message from session ${sessionId}: ${JSON.stringify(message)}`);

        switch (message.type) {
          case "join": {
            const result = insertParticipantSchema.safeParse({
              sessionId,
              name: message.name
            });

            if (!result.success) {
              log(`Join validation failed: ${JSON.stringify(result.error)}`);
              ws.send(JSON.stringify({ 
                type: "error", 
                message: "Invalid join data" 
              }));
              return;
            }

            const participant = await storage.addParticipant(result.data);
            participantId = participant.id;
            log(`New participant joined: ${participant.name} (ID: ${participant.id})`);

            // Add to session clients
            if (!sessions.has(sessionId)) {
              sessions.set(sessionId, new Map());
            }
            sessions.get(sessionId)!.set(participantId, ws);

            await broadcastSessionState(sessionId);
            break;
          }

          case "vote": {
            if (!participantId) {
              log(`Vote rejected: No participant ID`);
              return;
            }
            await storage.updateParticipant(participantId, { vote: message.vote });
            log(`Participant ${participantId} voted: ${message.vote}`);
            await broadcastSessionState(sessionId);
            break;
          }

          case "reveal": {
            await storage.updateSession(sessionId, { revealed: true });
            log(`Votes revealed in session ${sessionId}`);
            await broadcastSessionState(sessionId);
            break;
          }

          case "reset": {
            await storage.updateSession(sessionId, { revealed: false });
            const participants = await storage.getParticipants(sessionId);
            await Promise.all(
              participants.map(p => storage.updateParticipant(p.id, { vote: null }))
            );
            log(`Session ${sessionId} reset, all votes cleared`);
            await broadcastSessionState(sessionId);
            break;
          }
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    const cleanup = async () => {
      if (participantId) {
        await storage.removeParticipant(participantId);
        const participants = sessions.get(sessionId);
        if (participants) {
          participants.delete(participantId);
          if (participants.size === 0) {
            sessions.delete(sessionId);
          }
        }
        log(`Participant ${participantId} left session ${sessionId}`);
        await broadcastSessionState(sessionId);
      }
    };

    ws.on("close", () => {
      log(`WebSocket connection closed for participant ${participantId} in session ${sessionId}`);
      cleanup();
    });

    ws.on("error", (err) => {
      log(`WebSocket error for participant ${participantId} in session ${sessionId}: ${err.message}`);
      cleanup();
    });
  });

  // Create new session
  app.post("/api/sessions", async (_req, res) => {
    const sessionId = nanoid();
    log(`Creating new session with ID: ${sessionId}`);
    const session = await storage.createSession({ id: sessionId });
    res.json(session);
  });

  return httpServer;
}
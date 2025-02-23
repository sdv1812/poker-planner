import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { insertParticipantSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Create new session
  app.post("/api/sessions", async (_req, res) => {
    const session = await storage.createSession({ id: nanoid() });
    res.json(session);
  });

  // Get session state
  app.get("/api/sessions/:id", async (req, res) => {
    const session = await storage.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    const participants = await storage.getParticipants(req.params.id);
    res.json({ session, participants });
  });

  // Join session
  app.post("/api/sessions/:id/join", async (req, res) => {
    const session = await storage.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const result = insertParticipantSchema.safeParse({
      sessionId: req.params.id,
      name: req.body.name,
    });

    if (!result.success) {
      return res.status(400).json({ message: "Invalid name" });
    }

    const participant = await storage.addParticipant(result.data);
    res.json(participant);
  });

  // Submit vote
  app.post("/api/sessions/:id/vote", async (req, res) => {
    const { participantId, vote } = req.body;
    await storage.updateParticipant(participantId, { vote });
    res.json({ success: true });
  });

  // Reveal votes
  app.post("/api/sessions/:id/reveal", async (req, res) => {
    const session = await storage.updateSession(req.params.id, { revealed: true });
    res.json(session);
  });

  // Reset session
  app.post("/api/sessions/:id/reset", async (req, res) => {
    const session = await storage.updateSession(req.params.id, { revealed: false });
    const participants = await storage.getParticipants(req.params.id);
    await Promise.all(
      participants.map(p => storage.updateParticipant(p.id, { vote: null }))
    );
    res.json({ success: true });
  });

  return httpServer;
}
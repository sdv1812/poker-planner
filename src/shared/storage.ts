import { Session, Participant, InsertSession, InsertParticipant } from "@/shared/schema";

const SESSION_TIMEOUT = 1000 * 60 * 60; // 1 hour

export interface IStorage {
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session>;
  deleteSession(id: string): Promise<void>;

  addParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipants(sessionId: string): Promise<Participant[]>;
  updateParticipant(id: number, updates: Partial<Participant>): Promise<Participant>;
  removeParticipant(id: number): Promise<void>;

  cleanup(): Promise<void>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private participants: Map<number, Participant>;
  private currentParticipantId: number;

  constructor() {
    this.sessions = new Map();
    this.participants = new Map();
    this.currentParticipantId = 1;

    // Run cleanup every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  async createSession(session: InsertSession): Promise<Session> {
    const newSession = {
      ...session,
      createdAt: new Date(),
      lastActive: new Date(),
      revealed: false,
      ticketNumber: null,
    };
    this.sessions.set(session.id, newSession);
    return newSession;
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const session = await this.getSession(id);
    if (!session) throw new Error("Session not found");

    const updated = { ...session, ...updates, lastActive: new Date() };
    this.sessions.set(id, updated);
    return updated;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
    // Delete all participants in session
    for (const [pid, p] of this.participants) {
      if (p.sessionId === id) {
        this.participants.delete(pid);
      }
    }
  }

  async addParticipant(participant: InsertParticipant): Promise<Participant> {
    const id = this.currentParticipantId++;
    const newParticipant = {
      ...participant,
      id,
      vote: null,
      lastActive: new Date(),
    };
    this.participants.set(id, newParticipant);
    return newParticipant;
  }

  async getParticipants(sessionId: string): Promise<Participant[]> {
    return Array.from(this.participants.values())
      .filter(p => p.sessionId === sessionId);
  }

  async updateParticipant(id: number, updates: Partial<Participant>): Promise<Participant> {
    const participant = this.participants.get(id);
    if (!participant) throw new Error("Participant not found");

    const updated = { ...participant, ...updates, lastActive: new Date() };
    this.participants.set(id, updated);
    return updated;
  }

  async removeParticipant(id: number): Promise<void> {
    this.participants.delete(id);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();

    // Remove inactive sessions and their participants
    for (const [sid, session] of this.sessions) {
      if (now - session.lastActive.getTime() > SESSION_TIMEOUT) {
        await this.deleteSession(sid);
      }
    }

    // Remove inactive participants
    for (const [pid, participant] of this.participants) {
      if (now - participant.lastActive.getTime() > SESSION_TIMEOUT) {
        await this.removeParticipant(pid);
      }
    }
  }
}

export const storage = new MemStorage();
# Planning Poker Application

A real-time Planning Poker application for agile estimation, built with React and Express. Uses polling for real-time updates.

## Project Structure

```
├── shared/
│   └── schema.ts           # Shared types and data models
├── server/
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # In-memory storage
│   └── index.ts           # Server setup
└── client/
    └── src/
        ├── components/     # React components
        │   ├── join-dialog.tsx
        │   ├── voting-cards.tsx
        │   └── participants-list.tsx
        └── pages/
            ├── home.tsx    # Landing page
            └── session.tsx # Game interface
```

## Core Files Implementation

### 1. Shared Types (shared/schema.ts)

```typescript
import { z } from "zod";

// Session schema
export const sessionSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  lastActive: z.date(),
  revealed: z.boolean(),
});

export const insertSessionSchema = sessionSchema.omit({
  createdAt: true,
  lastActive: true,
  revealed: true,
});

export type Session = z.infer<typeof sessionSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Participant schema
export const participantSchema = z.object({
  id: z.number(),
  sessionId: z.string(),
  name: z.string().min(1),
  vote: z.string().nullable(),
  lastActive: z.date(),
});

export const insertParticipantSchema = participantSchema.omit({
  id: true,
  vote: true,
  lastActive: true,
});

export type Participant = z.infer<typeof participantSchema>;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export const VALID_VOTES = ["0", "1", "2", "3", "5", "8", "13", "21", "?"] as const;
export type ValidVote = typeof VALID_VOTES[number];
```

### 2. Server Implementation

#### Storage (server/storage.ts)
```typescript
import { Session, Participant, InsertSession, InsertParticipant } from "@shared/schema";

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

  // Implementation of IStorage methods...
}

export const storage = new MemStorage();
```

#### API Routes (server/routes.ts)
```typescript
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
    // Implementation...
  });

  // Submit vote
  app.post("/api/sessions/:id/vote", async (req, res) => {
    // Implementation...
  });

  // Reveal votes
  app.post("/api/sessions/:id/reveal", async (req, res) => {
    // Implementation...
  });

  // Reset session
  app.post("/api/sessions/:id/reset", async (req, res) => {
    // Implementation...
  });

  return httpServer;
}
```

### 3. Client Implementation

#### Session Page (client/src/pages/session.tsx)
```typescript
import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Session, Participant, ValidVote } from "@shared/schema";

export default function SessionPage() {
  const [, params] = useRoute("/session/:id");
  const queryClient = useQueryClient();
  const [showJoin, setShowJoin] = useState(true);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);

  // Fetch session state with polling
  const { data, isLoading } = useQuery({
    queryKey: [`/api/sessions/${params?.id}`],
    refetchInterval: 1000, // Poll every second
    enabled: !!params?.id,
    queryFn: () => apiRequest("GET", `//api/sessions/${params?.id}`)
      .then(res => res.json())
  });

  // Mutations for join, vote, reveal, and reset actions...

  return (
    // UI Implementation...
  );
}
```

#### Components

1. Join Dialog (client/src/components/join-dialog.tsx)
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Props {
  open: boolean;
  onJoin: (name: string) => void;
}

export function JoinDialog({ open, onJoin }: Props) {
  const [name, setName] = useState("");

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button 
            onClick={() => onJoin(name)}
            disabled={!name.trim()}
          >
            Join
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

2. Voting Cards (client/src/components/voting-cards.tsx)
```typescript
import { Button } from "@/components/ui/button";
import { VALID_VOTES, type ValidVote } from "@shared/schema";

interface Props {
  selectedVote: ValidVote | null;
  revealed: boolean;
  onVote: (vote: ValidVote) => void;
}

export function VotingCards({ selectedVote, revealed, onVote }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {VALID_VOTES.map((vote) => (
        <Button
          key={vote}
          variant={selectedVote === vote ? "default" : "outline"}
          onClick={() => onVote(vote)}
          disabled={revealed}
        >
          {vote}
        </Button>
      ))}
    </div>
  );
}
```

## Key Features

1. **Session Management**
   - Create new sessions
   - Join existing sessions
   - Auto cleanup of inactive sessions

2. **Real-time Updates**
   - Polling-based updates every second
   - Immediate state updates after actions
   - Optimistic UI updates

3. **Voting System**
   - Submit and update votes
   - Reveal/hide votes
   - Reset voting

4. **Participant Tracking**
   - Join with custom names
   - See all participants
   - Track voting status

## Technical Details

- Uses React Query for data fetching and caching
- In-memory storage with automatic cleanup
- REST API endpoints for all actions
- Real-time updates via polling

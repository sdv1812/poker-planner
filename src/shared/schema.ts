import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // Random ID for sharing
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActive: timestamp("last_active").notNull().defaultNow(),
  revealed: boolean("revealed").notNull().default(false),
  ticketNumber: text("ticket_number"),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  name: text("name").notNull(),
  vote: text("vote"),
  lastActive: timestamp("last_active").notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessions);
export const insertParticipantSchema = createInsertSchema(participants).pick({
  sessionId: true,
  name: true,
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export const VALID_VOTES = ["0", "1", "2", "3", "5", "8", "13", "21", "?"] as const;
export type ValidVote = typeof VALID_VOTES[number];
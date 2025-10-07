import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  hostId: varchar("host_id").notNull(),
  settings: json("settings").$type<{
    undercoverCount: number;
    mrWhiteCount: number;
  }>().notNull(),
  phase: varchar("phase", { length: 20 }).notNull().default("lobby"),
  currentRound: integer("current_round").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  name: text("name").notNull(),
  role: varchar("role", { length: 20 }),
  word: text("word"),
  isAlive: boolean("is_alive").notNull().default(true),
  isHost: boolean("is_host").notNull().default(false),
  currentTurnOrder: integer("current_turn_order"),
  hasSubmittedDescription: boolean("has_submitted_description").notNull().default(false),
  hasVoted: boolean("has_voted").notNull().default(false),
  score: integer("score").notNull().default(0),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const gameDescriptions = pgTable("game_descriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  playerId: varchar("player_id").notNull(),
  description: text("description").notNull(),
  round: integer("round").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gameVotes = pgTable("game_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  voterId: varchar("voter_id").notNull(),
  targetId: varchar("target_id").notNull(),
  round: integer("round").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  code: true,
  hostId: true,
  settings: true,
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  roomId: true,
  name: true,
});

export const insertDescriptionSchema = createInsertSchema(gameDescriptions).pick({
  roomId: true,
  playerId: true,
  description: true,
  round: true,
});

export const insertVoteSchema = createInsertSchema(gameVotes).pick({
  roomId: true,
  voterId: true,
  targetId: true,
  round: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertDescription = z.infer<typeof insertDescriptionSchema>;
export type GameDescription = typeof gameDescriptions.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type GameVote = typeof gameVotes.$inferSelect;

export type GamePhase = "lobby" | "descriptive" | "voting" | "mrWhiteGuess" | "gameOver";
export type PlayerRole = "civilian" | "undercover" | "mrWhite";

export interface GameState {
  room: Room;
  players: Player[];
  descriptions: GameDescription[];
  votes: GameVote[];
  currentTurn?: string;
  eliminatedPlayer?: Player;
  winner?: {
    team: "civilians" | "undercovers" | "mrWhite";
    players: Player[];
  };
}

export interface WordPair {
  civilian: string;
  undercover: string;
}

export const WORD_PAIRS: WordPair[] = [
  { civilian: "Ocean", undercover: "Sea" },
  { civilian: "Car", undercover: "Bus" },
  { civilian: "Apple", undercover: "Orange" },
  { civilian: "Book", undercover: "Magazine" },
  { civilian: "Coffee", undercover: "Tea" },
  { civilian: "Dog", undercover: "Cat" },
  { civilian: "Summer", undercover: "Winter" },
  { civilian: "Mountain", undercover: "Hill" },
  { civilian: "Piano", undercover: "Guitar" },
  { civilian: "Football", undercover: "Basketball" },
];

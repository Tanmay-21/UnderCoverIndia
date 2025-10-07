import { type User, type InsertUser, type Room, type InsertRoom, type Player, type InsertPlayer, type GameDescription, type InsertDescription, type GameVote, type InsertVote, type GameState, type PlayerRole, WORD_PAIRS } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  getRoomById(id: string): Promise<Room | undefined>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined>;
  
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayersByRoomId(roomId: string): Promise<Player[]>;
  getPlayerById(id: string): Promise<Player | undefined>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
  removePlayer(id: string): Promise<void>;
  
  createDescription(description: InsertDescription): Promise<GameDescription>;
  getDescriptionsByRoom(roomId: string, round: number): Promise<GameDescription[]>;
  
  createVote(vote: InsertVote): Promise<GameVote>;
  getVotesByRoom(roomId: string, round: number): Promise<GameVote[]>;
  clearVotes(roomId: string, round: number): Promise<void>;
  
  getGameState(roomId: string): Promise<GameState | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private rooms: Map<string, Room>;
  private players: Map<string, Player>;
  private descriptions: Map<string, GameDescription>;
  private votes: Map<string, GameVote>;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.players = new Map();
    this.descriptions = new Map();
    this.votes = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    const room: Room = {
      ...insertRoom,
      id,
      phase: "lobby",
      currentRound: 1,
      createdAt: new Date(),
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(room => room.code === code);
  }

  async getRoomById(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = {
      ...insertPlayer,
      id,
      role: null,
      word: null,
      isAlive: true,
      isHost: false,
      currentTurnOrder: null,
      hasSubmittedDescription: false,
      hasVoted: false,
      score: 0,
      joinedAt: new Date(),
    };
    this.players.set(id, player);
    return player;
  }

  async getPlayersByRoomId(roomId: string): Promise<Player[]> {
    return Array.from(this.players.values()).filter(player => player.roomId === roomId);
  }

  async getPlayerById(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...updates };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async removePlayer(id: string): Promise<void> {
    this.players.delete(id);
  }

  async createDescription(insertDescription: InsertDescription): Promise<GameDescription> {
    const id = randomUUID();
    const description: GameDescription = {
      ...insertDescription,
      id,
      createdAt: new Date(),
    };
    this.descriptions.set(id, description);
    return description;
  }

  async getDescriptionsByRoom(roomId: string, round: number): Promise<GameDescription[]> {
    return Array.from(this.descriptions.values()).filter(
      desc => desc.roomId === roomId && desc.round === round
    );
  }

  async createVote(insertVote: InsertVote): Promise<GameVote> {
    const id = randomUUID();
    const vote: GameVote = {
      ...insertVote,
      id,
      createdAt: new Date(),
    };
    this.votes.set(id, vote);
    return vote;
  }

  async getVotesByRoom(roomId: string, round: number): Promise<GameVote[]> {
    return Array.from(this.votes.values()).filter(
      vote => vote.roomId === roomId && vote.round === round
    );
  }

  async clearVotes(roomId: string, round: number): Promise<void> {
    const votesToRemove = Array.from(this.votes.entries()).filter(
      ([_, vote]) => vote.roomId === roomId && vote.round === round
    );
    votesToRemove.forEach(([id, _]) => this.votes.delete(id));
  }

  async getGameState(roomId: string): Promise<GameState | undefined> {
    const room = await this.getRoomById(roomId);
    if (!room) return undefined;

    const players = await this.getPlayersByRoomId(roomId);
    const descriptions = await this.getDescriptionsByRoom(roomId, room.currentRound);
    const votes = await this.getVotesByRoom(roomId, room.currentRound);

    return {
      room,
      players,
      descriptions,
      votes,
    };
  }

  // Game logic helpers
  async assignRoles(roomId: string): Promise<void> {
    const room = await this.getRoomById(roomId);
    const players = await this.getPlayersByRoomId(roomId);
    
    if (!room || players.length < 3) return;

    const { undercoverCount, mrWhiteCount } = room.settings;
    const wordPair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    
    // Shuffle players
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    // Assign roles
    let roleIndex = 0;
    
    // Assign undercovers
    for (let i = 0; i < undercoverCount && roleIndex < shuffledPlayers.length; i++) {
      await this.updatePlayer(shuffledPlayers[roleIndex].id, {
        role: "undercover",
        word: wordPair.undercover,
      });
      roleIndex++;
    }
    
    // Assign Mr. White
    for (let i = 0; i < mrWhiteCount && roleIndex < shuffledPlayers.length; i++) {
      await this.updatePlayer(shuffledPlayers[roleIndex].id, {
        role: "mrWhite",
        word: null,
      });
      roleIndex++;
    }
    
    // Assign civilians
    for (let i = roleIndex; i < shuffledPlayers.length; i++) {
      await this.updatePlayer(shuffledPlayers[i].id, {
        role: "civilian",
        word: wordPair.civilian,
      });
    }
  }

  async assignTurnOrder(roomId: string): Promise<string | undefined> {
    const players = await this.getPlayersByRoomId(roomId);
    const alivePlayers = players.filter(p => p.isAlive);
    
    if (alivePlayers.length === 0) return undefined;

    // Shuffle alive players
    const shuffledPlayers = [...alivePlayers].sort(() => Math.random() - 0.5);
    
    // Ensure Mr. White goes after at least 2 players
    const mrWhiteIndex = shuffledPlayers.findIndex(p => p.role === "mrWhite");
    if (mrWhiteIndex !== -1 && mrWhiteIndex < 2 && shuffledPlayers.length > 2) {
      // Move Mr. White to position 2 or later
      const mrWhite = shuffledPlayers.splice(mrWhiteIndex, 1)[0];
      const insertIndex = Math.max(2, Math.floor(Math.random() * (shuffledPlayers.length + 1)));
      shuffledPlayers.splice(insertIndex, 0, mrWhite);
    }
    
    // Update turn order
    for (let i = 0; i < shuffledPlayers.length; i++) {
      await this.updatePlayer(shuffledPlayers[i].id, {
        currentTurnOrder: i,
      });
    }
    
    return shuffledPlayers[0].id;
  }

  async checkWinCondition(roomId: string): Promise<{ team: "civilians" | "undercovers" | "mrWhite"; players: Player[] } | null> {
    const players = await this.getPlayersByRoomId(roomId);
    const alivePlayers = players.filter(p => p.isAlive);
    
    const aliveCivilians = alivePlayers.filter(p => p.role === "civilian");
    const aliveUndercovers = alivePlayers.filter(p => p.role === "undercover");
    const aliveMrWhite = alivePlayers.filter(p => p.role === "mrWhite");
    
    // Civilians win if all undercovers and Mr. White are eliminated
    if (aliveUndercovers.length === 0 && aliveMrWhite.length === 0) {
      return { team: "civilians", players: aliveCivilians };
    }
    
    // Undercovers win if they outnumber civilians
    if (aliveUndercovers.length >= aliveCivilians.length && aliveMrWhite.length === 0) {
      return { team: "undercovers", players: aliveUndercovers };
    }
    
    // Mr. White wins if only one civilian and Mr. White remain
    if (aliveCivilians.length === 1 && aliveMrWhite.length === 1 && aliveUndercovers.length === 0) {
      return { team: "mrWhite", players: aliveMrWhite };
    }
    
    // Mr. White and Undercovers win if they jointly outnumber civilians
    if (aliveUndercovers.length + aliveMrWhite.length >= aliveCivilians.length && aliveMrWhite.length > 0) {
      return { team: "undercovers", players: [...aliveUndercovers, ...aliveMrWhite] };
    }
    
    return null;
  }

  async updateScores(roomId: string, winningTeam: "civilians" | "undercovers" | "mrWhite"): Promise<void> {
    const players = await this.getPlayersByRoomId(roomId);
    
    for (const player of players) {
      let points = 0;
      
      if (winningTeam === "civilians" && player.role === "civilian") {
        points = 2;
      } else if (winningTeam === "undercovers" && player.role === "undercover") {
        points = 10;
      } else if (winningTeam === "mrWhite" && player.role === "mrWhite") {
        points = 6;
      }
      
      await this.updatePlayer(player.id, {
        score: player.score + points,
      });
    }
  }
}

export const storage = new MemStorage();

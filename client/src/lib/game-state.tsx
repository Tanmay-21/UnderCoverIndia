import { createContext, useContext, useState, ReactNode } from "react";
import type { GameState } from "@shared/schema";

interface GameStateContextType {
  gameState: GameState | null;
  playerId: string | null;
  setGameState: (state: GameState | null) => void;
  setPlayerId: (id: string | null) => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

interface GameStateProviderProps {
  children: ReactNode;
}

export function GameStateProvider({ children }: GameStateProviderProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem("playerId");
  });

  const updatePlayerId = (id: string | null) => {
    setPlayerId(id);
    if (id) {
      localStorage.setItem("playerId", id);
    } else {
      localStorage.removeItem("playerId");
    }
  };

  return (
    <GameStateContext.Provider
      value={{
        gameState,
        playerId,
        setGameState,
        setPlayerId: updatePlayerId,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return context;
}

// Helper functions for game state queries
export function getCurrentPlayer(gameState: GameState | null, playerId: string | null) {
  if (!gameState || !playerId) return null;
  return gameState.players.find(p => p.id === playerId);
}

export function getAlivePlayers(gameState: GameState | null) {
  if (!gameState) return [];
  return gameState.players.filter(p => p.isAlive);
}

export function getPlayerByTurn(gameState: GameState | null, turnId: string | undefined) {
  if (!gameState || !turnId) return null;
  return gameState.players.find(p => p.id === turnId);
}

export function isPlayersTurn(gameState: GameState | null, playerId: string | null) {
  return gameState?.currentTurn === playerId;
}

export function getDescriptionsByRound(gameState: GameState | null, round?: number) {
  if (!gameState) return [];
  const targetRound = round ?? gameState.room.currentRound;
  return gameState.descriptions.filter(d => d.round === targetRound);
}

export function getVotesByRound(gameState: GameState | null, round?: number) {
  if (!gameState) return [];
  const targetRound = round ?? gameState.room.currentRound;
  return gameState.votes.filter(v => v.round === targetRound);
}

export function hasPlayerVoted(gameState: GameState | null, playerId: string | null) {
  if (!gameState || !playerId) return false;
  const player = gameState.players.find(p => p.id === playerId);
  return player?.hasVoted ?? false;
}

export function getPlayerVote(gameState: GameState | null, playerId: string | null) {
  if (!gameState || !playerId) return null;
  const votes = getVotesByRound(gameState);
  return votes.find(v => v.voterId === playerId);
}

export function canPlayerVote(gameState: GameState | null, playerId: string | null, targetId: string) {
  if (!gameState || !playerId) return false;
  if (gameState.room.phase !== "voting") return false;
  if (playerId === targetId) return false;
  
  const player = gameState.players.find(p => p.id === playerId);
  const target = gameState.players.find(p => p.id === targetId);
  
  return player?.isAlive && target?.isAlive;
}

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useGameState } from "@/lib/game-state";
import { useToast } from "@/hooks/use-toast";
import type { GameState } from "@shared/schema";

interface WebSocketMessage {
  type: string;
  data?: any;
  roomId?: string;
  playerId?: string;
}

export function useWebSocket() {
  const [, setLocation] = useLocation();
  const { setGameState, setPlayerId } = useGameState();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);

  const connect = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Try to reconnect if we have a stored player ID
      const storedPlayerId = localStorage.getItem("playerId");
      if (storedPlayerId) {
        sendMessage({
          type: "reconnect",
          data: { playerId: storedPlayerId },
        });
      }
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "room_created":
        const { roomCode, playerId: newPlayerId, roomId } = message.data;
        localStorage.setItem("playerId", newPlayerId);
        setPlayerId(newPlayerId);
        setLocation(`/lobby/${roomCode}`);
        toast({
          title: "Room Created",
          description: `Room ${roomCode} created successfully!`,
        });
        break;

      case "room_joined":
        localStorage.setItem("playerId", message.data.playerId);
        setPlayerId(message.data.playerId);
        toast({
          title: "Joined Room",
          description: "Successfully joined the game!",
        });
        break;

      case "game_state":
      case "player_joined":
      case "player_left":
      case "game_started":
      case "description_submitted":
      case "vote_cast":
      case "next_round":
        setGameState(message.data);
        break;

      case "mr_white_eliminated":
        setGameState(message.data);
        toast({
          title: "Mr. White Eliminated",
          description: "Mr. White has been eliminated and can now make a guess!",
        });
        break;

      case "mr_white_wins":
        setGameState(message.data);
        toast({
          title: "Mr. White Wins!",
          description: "Mr. White correctly guessed the civilian word!",
          variant: "default",
        });
        break;

      case "game_over":
        setGameState(message.data);
        const winner = message.data.winner;
        toast({
          title: "Game Over!",
          description: `${winner.team === "civilians" ? "Civilians" : winner.team === "undercovers" ? "Undercovers" : "Mr. White"} win!`,
        });
        break;

      case "reconnected":
        setGameState(message.data.gameState);
        setPlayerId(message.data.playerId);
        
        // Navigate to appropriate page based on game state
        const gameState: GameState = message.data.gameState;
        if (gameState.room.phase === "lobby") {
          setLocation(`/lobby/${gameState.room.code}`);
        } else {
          setLocation(`/game/${gameState.room.id}`);
        }
        break;

      case "error":
        toast({
          title: "Error",
          description: message.data.message,
          variant: "destructive",
        });
        break;

      default:
        console.log("Unhandled message type:", message.type);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
      toast({
        title: "Connection Error",
        description: "Not connected to server. Reconnecting...",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    sendMessage,
    isConnected,
  };
}

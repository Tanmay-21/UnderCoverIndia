import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/use-websocket";
import { useGameState } from "@/lib/game-state";
import { useToast } from "@/hooks/use-toast";
import { VenetianMask, Users, Settings, Play, DoorOpen, Copy, Crown, Minus, Plus } from "lucide-react";
import type { GameState } from "@shared/schema";

interface LobbyProps {
  params: {
    roomCode: string;
  };
}

export default function Lobby({ params }: LobbyProps) {
  const [, setLocation] = useLocation();
  const { sendMessage } = useWebSocket();
  const { gameState, playerId } = useGameState();
  const { toast } = useToast();
  const [undercoverCount, setUndercoverCount] = useState(2);
  const [mrWhiteCount, setMrWhiteCount] = useState(1);

  const isHost = gameState?.players.find(p => p.id === playerId)?.isHost;
  const totalPlayers = gameState?.players.length || 0;
  const civilianCount = Math.max(0, totalPlayers - undercoverCount - mrWhiteCount);

  useEffect(() => {
    // Redirect if game started
    if (gameState?.room.phase !== "lobby" && gameState?.room.id) {
      setLocation(`/game/${gameState.room.id}`);
    }
  }, [gameState?.room.phase, gameState?.room.id, setLocation]);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(params.roomCode);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy room code",
        variant: "destructive",
      });
    }
  };

  const updateUndercoverCount = (delta: number) => {
    const newCount = Math.max(0, Math.min(totalPlayers - 1, undercoverCount + delta));
    if (newCount + mrWhiteCount < totalPlayers) {
      setUndercoverCount(newCount);
    }
  };

  const updateMrWhiteCount = (delta: number) => {
    const newCount = Math.max(0, Math.min(totalPlayers - 1, mrWhiteCount + delta));
    if (undercoverCount + newCount < totalPlayers) {
      setMrWhiteCount(newCount);
    }
  };

  const startGame = () => {
    if (totalPlayers < 3) {
      toast({
        title: "Error",
        description: "Need at least 3 players to start",
        variant: "destructive",
      });
      return;
    }

    sendMessage({
      type: "start_game",
      data: {
        roomId: gameState?.room.id,
        settings: {
          undercoverCount,
          mrWhiteCount,
        },
      },
    });
  };

  const exitRoom = () => {
    sendMessage({
      type: "exit_room",
      data: {
        playerId,
        roomId: gameState?.room.id,
      },
    });
    setLocation("/");
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <VenetianMask className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VenetianMask className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-serif font-bold text-foreground">Undercover</h1>
          </div>
          <Button 
            onClick={exitRoom}
            variant="destructive"
            className="flex items-center gap-2"
            data-testid="button-exit-room"
          >
            <DoorOpen className="w-4 h-4" />
            Exit Room
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <VenetianMask className="w-20 h-20 text-primary mx-auto mb-6" />
          <h1 className="text-5xl font-serif font-bold text-foreground mb-4">Undercover</h1>
          <p className="text-xl text-muted-foreground">Real-time Multiplayer Word Game</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Room Info & Players */}
          <div className="space-y-6">
            <Card className="border-2 border-primary">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DoorOpen className="w-5 h-5 text-primary" />
                  Room Code
                </h3>
                <div className="bg-background border-2 border-border rounded-lg p-6 text-center">
                  <p className="text-5xl font-bold font-mono tracking-wider text-primary mb-4">
                    {params.roomCode}
                  </p>
                  <Button
                    onClick={copyRoomCode}
                    variant="ghost"
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2"
                    data-testid="button-copy-code"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Players
                  <span className="ml-auto text-sm text-muted-foreground">
                    {totalPlayers}/8
                  </span>
                </h3>
                <div className="space-y-2">
                  {gameState.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 bg-background rounded-lg p-3"
                    >
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground" data-testid={`text-player-${player.name}`}>
                        {player.name}
                      </span>
                      {player.isHost && (
                        <div className="ml-auto bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Host
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Game Settings */}
          <div className="space-y-6">
            {isHost && (
              <Card className="border border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Game Settings
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Number of Undercovers
                      </label>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUndercoverCount(-1)}
                          disabled={undercoverCount <= 0}
                          data-testid="button-decrease-undercovers"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 bg-background border-2 border-border rounded-lg p-4 text-center">
                          <span className="text-3xl font-bold text-primary">
                            {undercoverCount}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUndercoverCount(1)}
                          disabled={undercoverCount + mrWhiteCount >= totalPlayers - 1}
                          data-testid="button-increase-undercovers"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Number of Mr. Whites
                      </label>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateMrWhiteCount(-1)}
                          disabled={mrWhiteCount <= 0}
                          data-testid="button-decrease-mr-whites"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 bg-background border-2 border-border rounded-lg p-4 text-center">
                          <span className="text-3xl font-bold text-primary">
                            {mrWhiteCount}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateMrWhiteCount(1)}
                          disabled={undercoverCount + mrWhiteCount >= totalPlayers - 1}
                          data-testid="button-increase-mr-whites"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-accent/10 border border-accent rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-accent-foreground mt-1" />
                        <div className="text-sm">
                          <p className="text-foreground font-medium mb-2">
                            <strong>Civilians:</strong>{" "}
                            <span className="text-foreground font-semibold">
                              {civilianCount}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Calculated based on total players
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isHost && (
              <Button
                onClick={startGame}
                disabled={totalPlayers < 3}
                className="w-full bg-primary text-primary-foreground px-8 py-4 text-xl font-bold hover:bg-primary/90 flex items-center justify-center gap-3"
                data-testid="button-start-game"
              >
                <Play className="w-6 h-6" />
                Start Game
              </Button>
            )}

            <Card className="bg-card/50 border border-border">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <VenetianMask className="w-4 h-4 text-accent-foreground" />
                  Quick Rules
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Civilians get the same word</li>
                  <li>• Undercovers get a similar but different word</li>
                  <li>• Mr. White gets no word</li>
                  <li>• Describe your word to find the imposters!</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

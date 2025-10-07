import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { VenetianMask, Users, Play, DoorOpen } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { sendMessage } = useWebSocket();
  const { toast } = useToast();

  const createRoom = () => {
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name first",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    sendMessage({
      type: "create_room",
      data: {
        playerName: playerName.trim(),
        settings: {
          undercoverCount: 2,
          mrWhiteCount: 1,
        },
      },
    });

    // Store player name in localStorage
    localStorage.setItem("playerName", playerName.trim());
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name first",
        variant: "destructive",
      });
      return;
    }

    if (!roomCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    sendMessage({
      type: "join_room",
      data: {
        roomCode: roomCode.trim().toUpperCase(),
        playerName: playerName.trim(),
      },
    });

    // Store player name in localStorage
    localStorage.setItem("playerName", playerName.trim());
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-12">
        {/* Header */}
        <div className="text-center">
          <VenetianMask className="w-20 h-20 text-primary mx-auto mb-6" />
          <h1 className="text-6xl font-serif font-bold text-foreground mb-4">
            Undercover
          </h1>
          <p className="text-xl text-muted-foreground">
            Real-time Multiplayer Word Game
          </p>
        </div>

        {/* Player Name */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Enter Your Name
                </h2>
              </div>
              <Input
                type="text"
                placeholder="Your display name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="text-lg py-3"
                data-testid="input-player-name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Game Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room */}
          <Card className="border border-border hover:border-primary/50 cursor-pointer transition-colors">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Play className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-xl font-semibold text-foreground">
                  Create Room
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start a new game and invite friends
                </p>
                <Button
                  onClick={createRoom}
                  disabled={isCreating || !playerName.trim()}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-create-room"
                >
                  {isCreating ? "Creating..." : "Create Game"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="border border-border hover:border-primary/50 cursor-pointer transition-colors">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <DoorOpen className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-xl font-semibold text-foreground">
                  Join Room
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter a room code to join an existing game
                </p>
                <Input
                  type="text"
                  placeholder="Room code..."
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="mb-2"
                  data-testid="input-room-code"
                />
                <Button
                  onClick={joinRoom}
                  disabled={isJoining || !playerName.trim() || !roomCode.trim()}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-join-room"
                >
                  {isJoining ? "Joining..." : "Join Game"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules */}
        <Card className="bg-card/50 border border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <VenetianMask className="w-5 h-5 text-accent-foreground" />
              Quick Rules
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong>Civilians</strong> get the same word</li>
              <li>• <strong>Undercovers</strong> get a similar but different word</li>
              <li>• <strong>Mr. White</strong> gets no word at all</li>
              <li>• Describe your word to find the imposters!</li>
              <li>• Vote to eliminate suspected undercovers</li>
              <li>• Win by eliminating all opposing team members</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

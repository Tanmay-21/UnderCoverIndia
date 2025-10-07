import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/use-websocket";
import { useGameState } from "@/lib/game-state";
import { useToast } from "@/hooks/use-toast";
import PlayerCard from "@/components/player-card";
import WordCard from "@/components/word-card";
import Leaderboard from "@/components/leaderboard";
import GameOverModal from "@/components/game-over-modal";
import MrWhiteGuessModal from "@/components/mr-white-guess-modal";
import { 
  VenetianMask, 
  DoorOpen, 
  Gamepad2, 
  Clock, 
  Eye, 
  MessageCircle, 
  NotebookPen,
  Lightbulb
} from "lucide-react";

interface GameProps {
  params: {
    roomId: string;
  };
}

export default function Game({ params }: GameProps) {
  const [, setLocation] = useLocation();
  const { sendMessage } = useWebSocket();
  const { gameState, playerId } = useGameState();
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [selectedVote, setSelectedVote] = useState<string>("");

  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const isCurrentTurn = gameState?.currentTurn === playerId;
  const alivePlayers = gameState?.players.filter(p => p.isAlive) || [];
  const descriptions = gameState?.descriptions || [];

  useEffect(() => {
    if (!gameState && playerId) {
      // Try to reconnect
      sendMessage({
        type: "reconnect",
        data: { playerId },
      });
    }
  }, [gameState, playerId, sendMessage]);

  const submitDescription = () => {
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description",
        variant: "destructive",
      });
      return;
    }

    sendMessage({
      type: "submit_description",
      data: {
        roomId: gameState?.room.id,
        playerId,
        description: description.trim(),
      },
    });

    setDescription("");
  };

  const castVote = (targetId: string) => {
    if (selectedVote === targetId) {
      setSelectedVote("");
      return;
    }

    setSelectedVote(targetId);
    sendMessage({
      type: "cast_vote",
      data: {
        roomId: gameState?.room.id,
        voterId: playerId,
        targetId,
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
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  const getPhaseDescription = () => {
    switch (gameState.room.phase) {
      case "descriptive":
        return "Players take turns describing their word with a single clue";
      case "voting":
        return "Vote to eliminate a suspected undercover or Mr. White";
      case "mrWhiteGuess":
        return "Mr. White has one chance to guess the civilian word";
      case "gameOver":
        return "Game completed! Check the leaderboard for final scores";
      default:
        return "";
    }
  };

  const getCurrentTurnPlayer = () => {
    return gameState.players.find(p => p.id === gameState.currentTurn);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VenetianMask className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-serif font-bold text-foreground">Undercover</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border">
              <DoorOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                ROOM: {gameState.room.code}
              </span>
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Game State Display */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-l-4 border-primary px-6 py-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-1">
                  <Gamepad2 className="inline w-5 h-5 mr-2 text-primary" />
                  {gameState.room.phase === "descriptive" && "Descriptive Round"}
                  {gameState.room.phase === "voting" && "Voting Phase"}
                  {gameState.room.phase === "mrWhiteGuess" && "Mr. White's Guess"}
                  {gameState.room.phase === "gameOver" && "Game Over"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {getPhaseDescription()}
                </p>
              </div>
              <div className="bg-card px-4 py-2 rounded-lg border border-border">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Round</span>
                <span className="text-2xl font-bold text-primary ml-2">
                  {gameState.room.currentRound}
                </span>
              </div>
            </div>
          </div>

          {/* Turn Indicator */}
          {gameState.room.phase === "descriptive" && getCurrentTurnPlayer() && (
            <div className="bg-accent/10 border border-accent px-6 py-3 rounded-lg flex items-center justify-center gap-3">
              <Clock className="w-5 h-5 text-accent-foreground" />
              <span className="text-foreground font-medium">Current Turn:</span>
              <span className="text-accent-foreground font-bold text-lg">
                {getCurrentTurnPlayer()?.name}
              </span>
            </div>
          )}
        </section>

        {/* Word Reveal Card */}
        <section className="mb-12">
          <h3 className="text-lg font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Your Secret Word
          </h3>
          <WordCard player={currentPlayer} />
        </section>

        {/* Player Cards Grid */}
        <section className="mb-12">
          <h3 className="text-lg font-serif font-semibold text-foreground mb-6 flex items-center gap-2">
            <VenetianMask className="w-5 h-5 text-primary" />
            All Players
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gameState.players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentTurn={gameState.currentTurn === player.id}
                gamePhase={gameState.room.phase}
                onVote={() => castVote(player.id)}
                isVoted={selectedVote === player.id}
                canVote={gameState.room.phase === "voting" && player.id !== playerId && player.isAlive}
              />
            ))}
          </div>
        </section>

        {/* Description Input Form */}
        {isCurrentTurn && gameState.room.phase === "descriptive" && (
          <section className="mb-12">
            <div className="max-w-2xl mx-auto bg-gradient-to-br from-accent/10 to-primary/5 border-2 border-primary rounded-lg p-8">
              <div className="text-center mb-6">
                <NotebookPen className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
                  It's Your Turn!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Describe your word with a single clue that helps your team identify you
                </p>
              </div>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitDescription();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Description
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter a one-word clue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-lg py-3"
                    maxLength={50}
                    data-testid="input-description"
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={!description.trim()}
                  className="w-full bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 flex items-center justify-center gap-2"
                  data-testid="button-submit-description"
                >
                  <NotebookPen className="w-4 h-4" />
                  Submit Description
                </Button>
              </form>

              <div className="mt-6 bg-card/50 rounded-lg p-4 border border-border">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-accent-foreground mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Tips:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Be specific enough to help your allies</li>
                      <li>• Avoid being too obvious if you suspect undercovers</li>
                      <li>• Mr. White: Pay attention to others' clues!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Descriptions Timeline */}
        {descriptions.length > 0 && (
          <section className="mb-12">
            <h3 className="text-lg font-serif font-semibold text-foreground mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Player Descriptions
            </h3>
            <div className="space-y-3">
              {descriptions.map((desc) => {
                const player = gameState.players.find(p => p.id === desc.playerId);
                return (
                  <div
                    key={desc.id}
                    className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-primary/50"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <VenetianMask className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-semibold text-foreground text-sm">
                        {player?.name || "Unknown"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Round {desc.round}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="bg-accent/20 px-4 py-2 rounded-lg">
                        <p className="text-lg font-semibold text-foreground">
                          "{desc.description}"
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Leaderboard - Only show when game is over */}
        {gameState.room.phase === "gameOver" && (
          <Leaderboard players={gameState.players} currentRound={gameState.room.currentRound} />
        )}
      </main>

      {/* Modals */}
      <GameOverModal 
        isOpen={gameState.room.phase === "gameOver"}
        winner={gameState.winner}
        onPlayAgain={() => {/* TODO: Implement */}}
        onViewLeaderboard={() => {/* TODO: Implement */}}
      />

      <MrWhiteGuessModal
        isOpen={gameState.room.phase === "mrWhiteGuess" && gameState.eliminatedPlayer?.id === playerId}
        onSubmitGuess={(guess) => {
          sendMessage({
            type: "mr_white_guess",
            data: {
              roomId: gameState.room.id,
              playerId,
              guess,
            },
          });
        }}
      />
    </div>
  );
}

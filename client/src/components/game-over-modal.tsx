import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, BarChart3, User } from "lucide-react";
import type { Player } from "@shared/schema";

interface GameOverModalProps {
  isOpen: boolean;
  winner?: {
    team: "civilians" | "undercovers" | "mrWhite";
    players: Player[];
  };
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
}

export default function GameOverModal({ 
  isOpen, 
  winner, 
  onPlayAgain, 
  onViewLeaderboard 
}: GameOverModalProps) {
  if (!winner) return null;

  const getTeamName = () => {
    switch (winner.team) {
      case "civilians": return "Civilians";
      case "undercovers": return "Undercovers"; 
      case "mrWhite": return "Mr. White";
      default: return "Unknown";
    }
  };

  const getTeamColor = () => {
    switch (winner.team) {
      case "civilians": return "text-chart-2 border-chart-2 from-chart-2/20 to-primary/10";
      case "undercovers": return "text-chart-3 border-chart-3 from-chart-3/20 to-primary/10";
      case "mrWhite": return "text-chart-5 border-chart-5 from-chart-5/20 to-primary/10";
      default: return "text-primary border-primary from-primary/20 to-primary/10";
    }
  };

  const getWinMessage = () => {
    switch (winner.team) {
      case "civilians": return "All undercovers and Mr. White have been eliminated!";
      case "undercovers": return "The undercovers have successfully infiltrated!";
      case "mrWhite": return "Mr. White correctly guessed the civilian word!";
      default: return "Game completed!";
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className={`celebration max-w-3xl bg-gradient-to-br border-4 rounded-lg shadow-2xl ${getTeamColor()}`}
        data-testid="modal-game-over"
      >
        <div className="text-center p-8">
          <div className="mb-8">
            <Trophy className={`w-20 h-20 mx-auto mb-6 animate-bounce ${winner.team === "civilians" ? "text-chart-2" : winner.team === "undercovers" ? "text-chart-3" : "text-chart-5"}`} />
            <h2 className="text-5xl font-serif font-bold text-foreground mb-4">
              {getTeamName()} Win!
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              {getWinMessage()}
            </p>
            
            <div className="inline-block bg-card px-8 py-4 rounded-lg border-2 border-primary mb-8">
              <h3 className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Winning Team
              </h3>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {winner.players.map((player) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {player.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onPlayAgain}
              className="w-full bg-primary text-primary-foreground px-8 py-4 text-lg font-bold hover:bg-primary/90 flex items-center justify-center gap-2"
              data-testid="button-play-again"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </Button>
            <Button
              onClick={onViewLeaderboard}
              variant="outline"
              className="w-full border-2 border-border text-foreground px-8 py-4 text-lg font-bold hover:border-primary flex items-center justify-center gap-2"
              data-testid="button-view-leaderboard"
            >
              <BarChart3 className="w-5 h-5" />
              View Final Leaderboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

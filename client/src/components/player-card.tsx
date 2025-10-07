import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Player } from "@shared/schema";
import { Crown, User, UserX, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: Player;
  isCurrentTurn?: boolean;
  gamePhase?: string;
  onVote?: () => void;
  isVoted?: boolean;
  canVote?: boolean;
}

export default function PlayerCard({ 
  player, 
  isCurrentTurn, 
  gamePhase, 
  onVote, 
  isVoted, 
  canVote 
}: PlayerCardProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "civilian": return "text-chart-2 bg-chart-2/20";
      case "undercover": return "text-chart-3 bg-chart-3/20";
      case "mrWhite": return "text-chart-5 bg-chart-5/20";
      default: return "text-muted-foreground bg-muted/20";
    }
  };

  const getStatusText = () => {
    if (!player.isAlive) return "Eliminated";
    if (isCurrentTurn) return "Your Turn";
    if (gamePhase === "voting") return "Voting";
    return "Waiting";
  };

  return (
    <Card 
      className={cn(
        "text-center relative overflow-hidden transition-all duration-300",
        isCurrentTurn && "border-2 border-primary pulse-glow",
        !player.isAlive && "opacity-40 grayscale eliminated",
        isVoted && "border-2 border-primary",
        canVote && "cursor-pointer hover:border-primary/50 hover:shadow-lg"
      )}
      onClick={canVote ? onVote : undefined}
      data-testid={`card-player-${player.name}`}
    >
      <CardContent className="p-6">
        {/* Host Badge */}
        {player.isHost && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Host
          </div>
        )}

        {/* Avatar */}
        <div className="mb-4 relative">
          <div className={cn(
            "w-24 h-24 mx-auto rounded-full flex items-center justify-center",
            isCurrentTurn ? "bg-primary/20" : "bg-muted",
            !player.isAlive && "relative"
          )}>
            {player.isAlive ? (
              <User className={cn(
                "text-4xl",
                isCurrentTurn ? "text-primary" : "text-muted-foreground"
              )} />
            ) : (
              <>
                <UserX className="text-muted-foreground text-4xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <UserX className="text-destructive text-5xl" />
                </div>
              </>
            )}
          </div>

          {/* Turn Indicator */}
          {isCurrentTurn && player.isAlive && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Your Turn
            </div>
          )}
        </div>

        {/* Player Name */}
        <h4 className="font-semibold text-foreground mb-2" data-testid={`text-player-name-${player.name}`}>
          {player.name}
        </h4>
        
        {/* Status */}
        <p className="text-xs text-muted-foreground mb-3">
          {getStatusText()}
        </p>

        {/* Role (if eliminated) */}
        {!player.isAlive && player.role && (
          <div className={cn(
            "inline-block px-3 py-1 rounded-full text-xs font-semibold",
            getRoleColor(player.role)
          )}>
            {player.role === "civilian" && "Civilian"}
            {player.role === "undercover" && "Undercover"}
            {player.role === "mrWhite" && "Mr. White"}
          </div>
        )}

        {/* Vote Checkbox */}
        {gamePhase === "voting" && canVote && (
          <div className="mt-4">
            <label className="flex items-center justify-center gap-2 cursor-pointer">
              <Checkbox
                checked={isVoted}
                className="vote-checkbox"
                data-testid={`checkbox-vote-${player.name}`}
              />
              <span className={cn(
                "text-sm",
                isVoted ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {isVoted && (
                  <>
                    <Check className="inline w-4 h-4 mr-1" />
                    Voted
                  </>
                )}
                {!isVoted && "Vote"}
              </span>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

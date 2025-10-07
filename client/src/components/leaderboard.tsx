import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Player } from "@shared/schema";
import { Trophy, Crown, User, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  players: Player[];
  currentRound: number;
  onStartNextRound?: () => void;
}

export default function Leaderboard({ players, currentRound, onStartNextRound }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getRoleColor = (role?: string | null) => {
    switch (role) {
      case "civilian": return "bg-chart-2/20 text-chart-2";
      case "undercover": return "bg-chart-3/20 text-chart-3";
      case "mrWhite": return "bg-chart-5/20 text-chart-5";
      default: return "bg-muted/20 text-muted-foreground";
    }
  };

  const getRolePoints = (role?: string | null) => {
    switch (role) {
      case "civilian": return "+2";
      case "undercover": return "+10";
      case "mrWhite": return "+6";
      default: return "+0";
    }
  };

  return (
    <section className="mb-12">
      <Card className="bg-gradient-to-br from-accent/10 to-primary/5 border-2 border-primary">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-serif font-bold text-foreground flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              Leaderboard
            </h3>
            <div className="bg-card px-4 py-2 rounded-lg border border-border">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Rounds
              </span>
              <span className="text-xl font-bold text-primary ml-2">
                {currentRound}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Player
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Last Role
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Round Points
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Total Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player, index) => (
                  <tr 
                    key={player.id}
                    className={cn(
                      "leaderboard-row border-b border-border hover:bg-card/50",
                      index === 0 && "bg-primary/10"
                    )}
                    style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Crown className="w-5 h-5 text-primary" />}
                        <span className={cn(
                          "text-lg font-bold",
                          index === 0 ? "text-primary" : "text-muted-foreground"
                        )}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          index === 0 ? "bg-primary/20" : "bg-muted"
                        )}>
                          <User className={cn(
                            "w-5 h-5",
                            index === 0 ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <span 
                          className="font-semibold text-foreground"
                          data-testid={`text-leaderboard-player-${player.name}`}
                        >
                          {player.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        "inline-block px-3 py-1 rounded-full text-xs font-semibold",
                        getRoleColor(player.role)
                      )}>
                        {player.role === "civilian" && "Civilian"}
                        {player.role === "undercover" && "Undercover"}
                        {player.role === "mrWhite" && "Mr. White"}
                        {!player.role && "Unknown"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        "text-lg font-bold",
                        player.role === "civilian" && "text-chart-2",
                        player.role === "undercover" && "text-chart-3",
                        player.role === "mrWhite" && "text-chart-5",
                        !player.role && "text-muted-foreground"
                      )}>
                        {getRolePoints(player.role)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        "text-2xl font-bold",
                        index === 0 ? "text-primary" : "text-foreground"
                      )}>
                        {player.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {onStartNextRound && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={onStartNextRound}
                className="bg-primary text-primary-foreground px-8 py-3 font-bold hover:bg-primary/90 flex items-center gap-2"
                data-testid="button-start-next-round"
              >
                <Play className="w-4 h-4" />
                Start Next Round
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

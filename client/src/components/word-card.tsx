import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Player } from "@shared/schema";
import { HelpCircle, Eye, VenetianMask } from "lucide-react";
import { cn } from "@/lib/utils";

interface WordCardProps {
  player?: Player;
}

export default function WordCard({ player }: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!player) {
    return (
      <div className="max-w-md mx-auto h-64 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const getRoleColor = () => {
    switch (player.role) {
      case "civilian": return "from-chart-2/20 to-accent/20 border-chart-2";
      case "undercover": return "from-chart-3/20 to-accent/20 border-chart-3";
      case "mrWhite": return "from-chart-5/20 to-destructive/20 border-chart-5";
      default: return "from-primary/20 to-accent/20 border-primary";
    }
  };

  return (
    <div 
      className={cn("flip-card max-w-md mx-auto h-64", isFlipped && "flipped")}
      onClick={toggleFlip}
      data-testid="card-word-flip"
    >
      <div className="flip-card-inner">
        {/* Front (Hidden) */}
        <Card className="flip-card-front bg-gradient-to-br from-card to-card/80 border-2 border-primary flex items-center justify-center">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Click to reveal your word</p>
          </div>
        </Card>
        
        {/* Back (Revealed) */}
        <Card className={cn(
          "flip-card-back bg-gradient-to-br border-2 flex items-center justify-center",
          getRoleColor()
        )}>
          <div className="text-center p-8">
            {player.role === "mrWhite" ? (
              <>
                <VenetianMask className="w-16 h-16 text-chart-5 mx-auto mb-4" />
                <h2 className="text-4xl font-serif font-bold text-foreground mb-3">
                  You are Mr. White
                </h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  You don't have a word. Listen carefully to others and try to blend in!
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  Your Word
                </p>
                <h2 className="text-5xl font-serif font-bold text-foreground">
                  {player.word?.toUpperCase() || "NO WORD"}
                </h2>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

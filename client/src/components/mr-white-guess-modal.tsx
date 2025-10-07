import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VenetianMask, CheckCircle, Info } from "lucide-react";

interface MrWhiteGuessModalProps {
  isOpen: boolean;
  onSubmitGuess: (guess: string) => void;
}

export default function MrWhiteGuessModal({ isOpen, onSubmitGuess }: MrWhiteGuessModalProps) {
  const [guess, setGuess] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onSubmitGuess(guess.trim());
      setGuess("");
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="celebration max-w-2xl bg-gradient-to-br from-chart-5/20 to-primary/10 border-2 border-chart-5 rounded-lg shadow-2xl"
        data-testid="modal-mr-white-guess"
      >
        <div className="text-center p-8">
          <div className="mb-6">
            <VenetianMask className="w-16 h-16 text-chart-5 mx-auto mb-4" />
            <h2 className="text-3xl font-serif font-bold text-foreground mb-3">
              Mr. White's Final Chance!
            </h2>
            <p className="text-muted-foreground">
              You've been eliminated. Guess the civilian word correctly to win instantly!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                What is the civilian word?
              </label>
              <Input
                type="text"
                placeholder="Enter your guess..."
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="text-lg font-semibold text-center py-4"
                data-testid="input-mr-white-guess"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={!guess.trim()}
              className="w-full bg-chart-5 text-white px-6 py-4 text-lg font-bold hover:bg-chart-5/90 flex items-center justify-center gap-2"
              data-testid="button-submit-guess"
            >
              <CheckCircle className="w-5 h-5" />
              Submit Guess
            </Button>
          </form>

          <div className="mt-6 bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                <strong>Reminder:</strong> You only get one guess. If correct, you win immediately. 
                If wrong, the game continues.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { VALID_VOTES, type ValidVote } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VotingCardsProps {
  selectedVote: ValidVote | null;
  revealed: boolean;
  onVote: (vote: ValidVote) => void;
}

export function VotingCards({ selectedVote, revealed, onVote }: VotingCardsProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 p-4">
      {VALID_VOTES.map((vote) => (
        <Button
          key={vote}
          variant={selectedVote === vote ? "default" : "outline"}
          className={cn(
            "h-24 text-2xl font-bold",
            revealed && selectedVote === vote && "ring-2 ring-primary"
          )}
          onClick={() => onVote(vote)}
        >
          {vote}
        </Button>
      ))}
    </div>
  );
}

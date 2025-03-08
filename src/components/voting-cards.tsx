import { VALID_VOTES, type ValidVote } from "@/shared/schema";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { cn } from "@/lib/utils";

interface VotingCardsProps {
  selectedVote: ValidVote | null;
  revealed: boolean;
  onVote: (vote: ValidVote) => void;
  isSubmitting?: boolean;
}

export function VotingCards({ selectedVote, revealed, onVote, isSubmitting = false }: VotingCardsProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 p-4">
      {VALID_VOTES.map((vote) => (
        <Button
          key={vote}
          variant={selectedVote === vote ? "contained" : "outlined"}
          className={cn(
            "h-24 text-2xl font-bold relative",
            revealed && selectedVote === vote && "ring-2 ring-primary",
            isSubmitting && "cursor-not-allowed"
          )}
          onClick={() => onVote(vote)}
          disabled={isSubmitting || revealed}
        >
          {isSubmitting && selectedVote === vote ? (
            <CircularProgress size={24} className="absolute" />
          ) : (
            vote
          )}
        </Button>
      ))}
    </div>
  );
}
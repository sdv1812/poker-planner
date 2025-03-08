import { type Participant } from "@/shared/schema";
import Card from "@mui/material/Card";
import Badge from "@mui/material/Badge";
import Typography from "@mui/material/Typography";
import { Check, Clock } from "lucide-react";

interface ParticipantsListProps {
  participants: Participant[];
  revealed: boolean;
  average: string | null;
}


export function ParticipantsList({ participants, revealed, average }: ParticipantsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Typography variant="h6">Participants ({participants.length})</Typography>
        {revealed && average && (
          <div className="flex items-center gap-2">
            <Typography variant="body2" color="textSecondary">Average:</Typography>
            <Badge badgeContent={average} color="secondary" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {participants.map((participant) => (
          <Card key={participant.id} className="p-4 flex items-center justify-between">
            <Typography variant="body1">{participant.name}</Typography>
            {participant.vote ? (
              revealed ? (
                <Badge badgeContent={participant.vote} color="default" />
              ) : (
                <Check className="h-5 w-5 text-green-500" />
              )
            ) : (
              <Clock className="h-5 w-5 text-gray-400" />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
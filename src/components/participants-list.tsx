import { type Participant } from "@/shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <h2 className="text-lg font-semibold">Participants ({participants.length})</h2>
        {revealed && average && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Average:</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">{average}</Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {participants.map((participant) => (
          <Card key={participant.id} className="p-4 flex items-center justify-between">
            <span className="font-medium">{participant.name}</span>
            {participant.vote ? (
              revealed ? (
                <Badge variant="default">{participant.vote}</Badge>
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
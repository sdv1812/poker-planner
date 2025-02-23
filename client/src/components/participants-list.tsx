import { type Participant } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, HelpCircle, Clock } from "lucide-react";

interface ParticipantsListProps {
  participants: Participant[];
  revealed: boolean;
}

export function ParticipantsList({ participants, revealed }: ParticipantsListProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Participants ({participants.length})</h2>
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

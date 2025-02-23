import { useState, useCallback } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout, Copy, Eye, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JoinDialog } from "@/components/join-dialog";
import { VotingCards } from "@/components/voting-cards";
import { ParticipantsList } from "@/components/participants-list";
import type { Session, Participant, ValidVote } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function SessionPage() {
  const [, params] = useRoute("/session/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showJoin, setShowJoin] = useState(true);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Fetch session state with polling
  const { data, isLoading } = useQuery({
    queryKey: [`/api/sessions/${params?.id}`],
    refetchInterval: 1000,
    enabled: !!params?.id,
    queryFn: () => apiRequest("GET", `/api/sessions/${params?.id}`)
      .then(res => res.json())
  });

  const session = data?.session as Session;
  const participants = data?.participants as Participant[];

  // Calculate average of numeric votes
  const calculateAverage = useCallback((participants: Participant[]) => {
    const numericVotes = participants
      .map(p => p.vote)
      .filter((vote): vote is string => vote !== null && vote !== "?")
      .map(Number)
      .filter(n => !isNaN(n));

    if (numericVotes.length === 0) return null;

    const sum = numericVotes.reduce((a, b) => a + b, 0);
    return (sum / numericVotes.length).toFixed(1);
  }, []);

  // Mutations
  const joinMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", `/api/sessions/${params?.id}/join`, { name });
      return res.json();
    },
    onSuccess: (participant) => {
      setCurrentParticipant(participant);
      setShowJoin(false);
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${params?.id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (vote: ValidVote) => {
      await apiRequest("POST", `/api/sessions/${params?.id}/vote`, {
        participantId: currentParticipant?.id,
        vote,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${params?.id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const revealMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/sessions/${params?.id}/reveal`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${params?.id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reveal votes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/sessions/${params?.id}/reset`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${params?.id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleJoin = (name: string) => {
    joinMutation.mutate(name);
  };

  const handleVote = (vote: ValidVote) => {
    voteMutation.mutate(vote);
  };

  const handleReveal = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          revealMutation.mutate();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Copied!",
      description: "Session link copied to clipboard",
    });
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const average = session.revealed ? calculateAverage(participants || []) : null;

  return (
    <>
      <JoinDialog open={showJoin} onJoin={handleJoin} />

      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-6 w-6" />
                Planning Poker
              </CardTitle>
              <Button variant="outline" size="icon" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              <ParticipantsList 
                participants={participants || []}
                revealed={session.revealed}
                average={average}
              />

              <VotingCards
                selectedVote={currentParticipant?.vote as ValidVote}
                revealed={session.revealed}
                onVote={handleVote}
              />

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => resetMutation.mutate()}
                  disabled={!session.revealed}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Votes
                </Button>

                <Button
                  onClick={handleReveal}
                  disabled={session.revealed || countdown !== null}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {countdown !== null 
                    ? `Revealing in ${countdown}...` 
                    : "Reveal Votes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
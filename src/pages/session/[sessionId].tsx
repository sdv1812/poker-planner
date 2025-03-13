import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, ThemeProvider } from "@mui/material";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { Copy, Eye, RotateCcw } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { JoinDialog } from "@/components/join-dialog";
import { VotingCards } from "@/components/voting-cards";
import { ParticipantsList } from "@/components/participants-list";
import axios from "axios";
import { Participant, Session, ValidVote } from "@/shared/schema";
import "@/app/globals.css";
import theme from '@/theme';

export default function SessionPage() {
  const { query: { sessionId: param } } = useRouter();
  const [showJoin, setShowJoin] = useState(true);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    if (!param) return;
    try {
      const res = await axios.get(`/api/sessions/${param}`);
      console.log('res data', res.data);
      setSession(res.data.session);
      setParticipants(res.data.participants);
      setCurrentParticipant(res.data.participants.find(p => p.id === currentParticipant?.id) || null);
    } catch (error) {
      console.error("Failed to fetch session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 1000);
    return () => clearInterval(interval);
  }, [param]);

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

  const handleJoin = async (name: string) => {
    try {
      const res = await axios.post(`/api/sessions/${param}/join`, { name });
      setCurrentParticipant(res.data);
      setShowJoin(false);
      fetchSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to join session. Please try again.");
    }
  };

  const handleVote = async (vote: ValidVote) => {
    try {
      await axios.post(`/api/sessions/${param}/vote`, {
        participantId: currentParticipant?.id,
        vote,
      });
      fetchSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to submit vote. Please try again.");
    }
  };

  const handleReveal = async () => {
    setCountdown(3);
    const timer = setInterval(async () => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          axios.post(`/api/sessions/${param}/reveal`).then(fetchSession);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTicketUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketNumber.trim()) {
      try {
        await axios.post(`/api/sessions/${param}/ticket`, { ticketNumber: ticketNumber.trim() });
        fetchSession();
        toast.success("Ticket number updated");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Failed to update ticket number. Please try again.");
      }
    }
  };

  const handleReset = async () => {
    try {
      await axios.post(`/api/sessions/${param}/reset`);
      fetchSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to reset session. Please try again.");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Session link copied to clipboard");
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
    <ThemeProvider theme={theme}>
      <JoinDialog open={showJoin} onJoin={handleJoin} />
      <ToastContainer />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Card>
            <CardHeader title='Planning Poker' className="flex flex-row items-center justify-between"
            action={
              <Button variant="outlined" size="small" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            } />

            <CardContent className="space-y-6">
              <form onSubmit={handleTicketUpdate} className="flex gap-2">
                <TextField
                  placeholder="Enter ticket number (e.g. PROJ-123)"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="outlined">
                  Update Ticket
                </Button>
              </form>

              {session.ticketNumber && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">Currently discussing:</p>
                  <p className="text-lg">{session.ticketNumber}</p>
                </div>
              )}

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
                  variant="outlined"
                  onClick={handleReset}
                  disabled={!session.revealed}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Votes
                </Button>

                <Button
                  variant="contained"
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
    </ThemeProvider>
  );
}

import { useState } from "react";
import { useRouter } from 'next/router';
import { Button, Card, CardContent, CardHeader, CircularProgress, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import axios from "axios";
import theme from '@/theme';
import '@/app/globals.css';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createSession = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/sessions");
      const session = res.data;
      router.push(`/session/${session.id}`);
    } catch (err) {
      console.error("Failed to create session:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader
            className="flex flex-row items-center justify-between"
            title="Planning Poker"
          />
          <CardContent className="flex flex-col items-center space-y-4">
            <Typography variant="body2" color="textSecondary" className="mb-4">
              Create a new planning poker session to estimate user stories with your team.
            </Typography>
            <Button 
              variant="contained"
              color="primary"
              className="w-half" 
              size="medium"
              onClick={createSession}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Create New Session
            </Button>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
}

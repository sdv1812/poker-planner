import { useState } from "react";
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "lucide-react";
import axios from "axios";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-6 w-6" />
            Planning Poker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Create a new planning poker session to estimate user stories with your team.
          </p>
          <Button 
            className="w-full" 
            size="lg"
            onClick={createSession}
            disabled={loading}
          >
            Create New Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

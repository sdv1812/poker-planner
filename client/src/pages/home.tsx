import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const createSession = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/sessions");
      const session = await res.json();
      setLocation(`/session/${session.id}`);
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

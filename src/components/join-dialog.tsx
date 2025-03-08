import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface JoinDialogProps {
  open: boolean;
  onJoin: (name: string) => void;
}

export function JoinDialog({ open, onJoin }: JoinDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    onJoin(name.trim());
  };

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogTitle>Join Planning Poker</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <TextField
              id="name"
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              fullWidth
            />
          </div>
          <Button type="submit" variant="contained" fullWidth>Join Session</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { NextApiRequest, NextApiResponse } from 'next';
import { insertParticipantSchema } from '@/shared/schema';
import { storage } from '@/shared/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid session ID' });
    }
    const session = await storage.getSession(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const result = insertParticipantSchema.safeParse({
      sessionId: id,
      name: req.body.name,
    });

    if (!result.success) {
      return res.status(400).json({ message: 'Invalid name' });
    }

    const participant = await storage.addParticipant(result.data);
    res.status(201).json(participant);
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

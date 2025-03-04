import { storage } from '@/shared/storage';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid session ID' });
    }
    await storage.updateSession(id, { revealed: false });
    const participants = await storage.getParticipants(id);
    await Promise.all(
      participants.map(p => storage.updateParticipant(p.id, { vote: null }))
    );
    res.status(200).json({ success: true });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

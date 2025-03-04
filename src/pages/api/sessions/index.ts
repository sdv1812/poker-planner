import { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { storage } from '@/shared/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create new session
    const session = await storage.createSession({ id: nanoid() });
    res.status(201).json(session);
  } else if (req.method === 'GET') {
    // Get session state
    const { id } = req.query;
    console.log('id', id);
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid session ID' });
    }
    const session = await storage.getSession(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    const participants = await storage.getParticipants(id);
    res.status(200).json({ session, participants });
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

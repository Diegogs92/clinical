import { NextApiRequest, NextApiResponse } from 'next';
import { requireUserId } from '@/lib/serverAuth';
import { hasRefreshToken } from '@/lib/googleCalendarAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uid = await requireUserId(req);
    const connected = await hasRefreshToken(uid);
    return res.status(200).json({ connected });
  } catch (error) {
    return res.status(401).json({ connected: false });
  }
}

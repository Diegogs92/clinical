import { NextApiRequest } from 'next';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export async function requireUserId(req: NextApiRequest) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new Error('Missing authorization');
  }
  const decoded = await getAdminAuth().verifyIdToken(match[1]);
  return decoded.uid;
}

import { NextApiRequest, NextApiResponse } from 'next';
import { requireUserId } from '@/lib/serverAuth';
import {
  createOAuthState,
  getBaseUrlFromRequest,
  getCalendarScopes,
  getOAuthClient,
} from '@/lib/googleCalendarAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uid = await requireUserId(req);
    const baseUrl = getBaseUrlFromRequest(req);
    const redirectUri = `${baseUrl}/api/google/calendar/callback`;
    const oauth2Client = getOAuthClient(redirectUri);
    const state = await createOAuthState(uid);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: getCalendarScopes(),
      state,
    });

    return res.status(200).json({ url: authUrl });
  } catch (error: any) {
    console.error('[CalendarConnect] Error:', error);
    return res.status(401).json({ error: 'No autorizado' });
  }
}

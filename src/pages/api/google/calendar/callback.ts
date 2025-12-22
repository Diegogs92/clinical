import { NextApiRequest, NextApiResponse } from 'next';
import {
  consumeOAuthState,
  getBaseUrlFromRequest,
  getOAuthClient,
  getRefreshToken,
  storeRefreshToken,
} from '@/lib/googleCalendarAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = getBaseUrlFromRequest(req);
  const redirectUri = `${baseUrl}/api/google/calendar/callback`;
  const oauth2Client = getOAuthClient(redirectUri);

  const { code, state, error } = req.query;
  if (error) {
    return res.redirect(`${baseUrl}/login?calendar=error`);
  }
  if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
    return res.redirect(`${baseUrl}/login?calendar=invalid`);
  }

  try {
    const uid = await consumeOAuthState(state);
    if (!uid) {
      return res.redirect(`${baseUrl}/login?calendar=state`);
    }

    const { tokens } = await oauth2Client.getToken(code);
    if (tokens.refresh_token) {
      await storeRefreshToken(uid, tokens.refresh_token);
    } else {
      const existing = await getRefreshToken(uid);
      if (!existing) {
        return res.redirect(`${baseUrl}/login?calendar=refresh_missing`);
      }
    }
    return res.redirect(`${baseUrl}/agenda?calendar=connected`);
  } catch (err) {
    console.error('[CalendarCallback] Error:', err);
    return res.redirect(`${baseUrl}/login?calendar=error`);
  }
}

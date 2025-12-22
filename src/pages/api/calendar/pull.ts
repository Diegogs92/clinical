import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { requireUserId } from '@/lib/serverAuth';
import { getOAuthClient, getRefreshToken } from '@/lib/googleCalendarAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeMin, timeMax } = req.body as {
      timeMin?: string;
      timeMax?: string;
    };

    const uid = await requireUserId(req);
    const refreshToken = await getRefreshToken(uid);
    if (!refreshToken) {
      return res.status(401).json({ error: 'Google Calendar no esta conectado', code: 'calendar_not_connected' });
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'updated',
      showDeleted: true,
    });

    return res.status(200).json({ items: response.data.items || [] });
  } catch (error: any) {
    console.error('Calendar pull error:', error);
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return res.status(401).json({
        error: 'Conexion con Google Calendar expirada. Reconecta tu cuenta.',
        code: 'calendar_reauth'
      });
    }

    if (error.code === 403) {
      return res.status(403).json({
        error: 'No tienes permisos para acceder a Google Calendar. Verifica los scopes.'
      });
    }

    return res.status(500).json({
      error: 'Error al leer eventos de Google Calendar',
      details: error.message
    });
  }
}

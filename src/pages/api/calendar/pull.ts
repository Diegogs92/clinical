import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken, timeMin, timeMax } = req.body as {
      accessToken?: string;
      timeMin?: string;
      timeMax?: string;
    };

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token requerido' });
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

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
        error: 'Token de acceso expirado. Por favor, vuelve a iniciar sesiИn.'
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

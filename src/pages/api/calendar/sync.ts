import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { Appointment } from '@/types';
import { combineDateAndTime } from '@/lib/dateUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { appointment, action, accessToken, officeColorId } = req.body as {
      appointment: Appointment;
      action: 'create' | 'update' | 'delete';
      accessToken?: string;
      officeColorId?: string;
    };

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token requerido' });
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    if (action === 'delete' && appointment.googleCalendarEventId) {
      await calendar.events.delete({
        calendarId,
        eventId: appointment.googleCalendarEventId,
      });
      return res.status(200).json({ success: true, eventId: null });
    }

    // Convert appointment to calendar event
    // Extraer la fecha base (YYYY-MM-DD) del campo date
    const dateStr = typeof appointment.date === 'string'
      ? appointment.date.split('T')[0]
      : appointment.date;

    // Combinar fecha con startTime y endTime usando la utilidad correcta
    const startDateTime = combineDateAndTime(dateStr, appointment.startTime);
    const endDateTime = combineDateAndTime(dateStr, appointment.endTime);

    // Crear strings ISO en hora local (sin conversión UTC)
    // Formato: YYYY-MM-DDTHH:mm:ss
    const formatDateTimeForCalendar = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    // Diferenciar entre eventos personales y turnos de pacientes
    const isPersonalEvent = appointment.appointmentType === 'personal';
    const eventSummary = isPersonalEvent
      ? `🔒 ${appointment.title || 'Evento Personal'}`
      : `👤 Turno: ${appointment.patientName || 'Sin nombre'}`;

    const event: any = {
      summary: eventSummary,
      description: appointment.notes || '',
      extendedProperties: {
        private: {
          appointmentId: appointment.id,
          userId: appointment.userId,
          appointmentType: appointment.appointmentType,
          patientId: appointment.patientId || '',
          patientName: appointment.patientName || '',
        },
      },
      start: {
        dateTime: formatDateTimeForCalendar(startDateTime),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: formatDateTimeForCalendar(endDateTime),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
    };

    // Agregar color si se especificó el consultorio
    if (officeColorId) {
      event.colorId = officeColorId;
    }

    if (action === 'update' && appointment.googleCalendarEventId) {
      const response = await calendar.events.update({
        calendarId,
        eventId: appointment.googleCalendarEventId,
        requestBody: event,
      });
      return res.status(200).json({ success: true, eventId: response.data.id });
    }

    // Create new event
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return res.status(200).json({ success: true, eventId: response.data.id });
  } catch (error: any) {
    console.error('Calendar sync error:', error);

    // Manejo específico de errores de Google Calendar
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return res.status(401).json({
        error: 'Token de acceso expirado. Por favor, vuelve a iniciar sesión.'
      });
    }

    if (error.code === 403) {
      return res.status(403).json({
        error: 'No tienes permisos para acceder a Google Calendar. Verifica los scopes.'
      });
    }

    return res.status(500).json({
      error: 'Error al sincronizar con Google Calendar',
      details: error.message
    });
  }
}

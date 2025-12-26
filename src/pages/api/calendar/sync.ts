import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { Appointment } from '@/types';
import { combineDateAndTime } from '@/lib/dateUtils';
import { requireUserId } from '@/lib/serverAuth';
import { getOAuthClient, getRefreshToken } from '@/lib/googleCalendarAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { appointment, action, officeColorId } = req.body as {
      appointment: Appointment;
      action: 'create' | 'update' | 'delete';
      officeColorId?: string;
    };

    const uid = await requireUserId(req);
    const refreshToken = await getRefreshToken(uid);
    if (!refreshToken) {
      return res.status(401).json({ error: 'Google Calendar no esta conectado', code: 'calendar_not_connected' });
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

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

    // Construir descripción con información de pago y tratamiento
    const buildDescription = () => {
      if (isPersonalEvent) {
        return appointment.notes || '';
      }

      const parts: string[] = [];

      // Agregar tratamiento
      if (appointment.type) {
        const treatmentNames: { [key: string]: string } = {
          'odontologia-general': 'Odontología General',
          'ortodoncia': 'Ortodoncia',
          'endodoncia': 'Endodoncia',
          'armonizacion': 'Armonización'
        };
        const treatmentName = treatmentNames[appointment.type] || appointment.type;
        parts.push(`Tratamiento: ${treatmentName}`);
      }

      // Calcular monto pendiente
      const fee = appointment.fee || 0;
      const deposit = appointment.deposit || 0;
      const pending = fee - deposit;

      if (fee > 0) {
        parts.push(`Honorarios: $${fee.toLocaleString('es-AR')}`);
        if (deposit > 0) {
          parts.push(`Seña: $${deposit.toLocaleString('es-AR')}`);
        }
        if (pending > 0) {
          parts.push(`Pendiente: $${pending.toLocaleString('es-AR')}`);
        } else if (pending === 0 && fee > 0) {
          parts.push('Estado: Pagado ✓');
        }
      }

      // Agregar notas si existen
      if (appointment.notes) {
        parts.push(`\nNotas: ${appointment.notes}`);
      }

      return parts.join('\n');
    };

    const event: any = {
      summary: eventSummary,
      description: buildDescription(),
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
      error: 'Error al sincronizar con Google Calendar',
      details: error.message
    });
  }
}

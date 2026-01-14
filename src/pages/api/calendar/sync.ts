import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { Appointment } from '@/types';
import { combineDateAndTime } from '@/lib/dateUtils';
import { requireUserId } from '@/lib/serverAuth';
import { getOAuthClient, getRefreshToken } from '@/lib/googleCalendarAuth';
import { listPaymentsByAppointment } from '@/lib/payments';
import { formatCurrency } from '@/lib/formatCurrency';

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

    const requesterUid = await requireUserId(req);
    const targetUid = appointment?.userId || requesterUid;
    const refreshToken = await getRefreshToken(targetUid);
    if (!refreshToken) {
      return res.status(401).json({ error: 'Google Calendar no esta conectado', code: 'calendar_not_connected' });
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarId = 'primary';

    if (action === 'delete' && appointment.googleCalendarEventId) {
      await calendar.events.delete({
        calendarId,
        eventId: appointment.googleCalendarEventId,
      });
      return res.status(200).json({ success: true, eventId: null });
    }

    // Convert appointment to calendar event
    // Send local date+time with an explicit time zone to avoid offsets.
    const dateOnly = appointment.date.includes('T')
      ? appointment.date.split('T')[0]
      : appointment.date;
    const safeStartTime = appointment.startTime || '00:00';
    const safeEndTime = appointment.endTime || '';
    const durationMinutes = Number(appointment.duration || 0);

    const startLocal = combineDateAndTime(dateOnly, safeStartTime);
    const endLocal = safeEndTime
      ? combineDateAndTime(dateOnly, safeEndTime)
      : new Date(startLocal.getTime() + durationMinutes * 60000);

    const formatLocalDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const startDateTime = formatLocalDateTime(startLocal);
    const endDateTime = formatLocalDateTime(endLocal);

    // Diferenciar entre eventos personales y turnos de pacientes
    const isPersonalEvent = appointment.appointmentType === 'personal';
    const eventSummary = isPersonalEvent
      ? `Evento: ${appointment.title || 'Evento Personal'}`
      : `Turno: ${appointment.patientName || 'Sin nombre'}`;

    // Construir descripcion con informacion de pago y tratamiento
    const buildDescription = async () => {
      if (isPersonalEvent) {
        return appointment.notes || '';
      }

      const parts: string[] = [];

      // Agregar tratamiento
      if (appointment.type) {
        const treatmentNames: { [key: string]: string } = {
          'odontologia-general': 'Odontologia General',
          'ortodoncia': 'Ortodoncia',
          'endodoncia': 'Endodoncia',
          'armonizacion': 'Armonizacion'
        };
        const treatmentName = treatmentNames[appointment.type] || appointment.type;
        parts.push(`Tratamiento: ${treatmentName}`);
      }

      // Calcular monto pendiente incluyendo pagos registrados
      const fee = appointment.fee || 0;
      const deposit = appointment.deposit || 0;

      // Obtener pagos registrados para este turno
      let paymentsTotal = 0;
      try {
        const appointmentPayments = await listPaymentsByAppointment(appointment.id);
        paymentsTotal = appointmentPayments
          .filter(p => p.status === 'completed' || p.status === 'pending')
          .reduce((sum, p) => sum + p.amount, 0);
      } catch (error) {
        console.error('[calendar/sync] Error obteniendo pagos:', error);
      }

      const totalPaid = deposit + paymentsTotal;
      const pending = Math.max(0, fee - totalPaid);

      if (fee > 0) {
        parts.push(`Honorarios: $${formatCurrency(fee)}`);
        if (deposit > 0) {
          parts.push(`Sena: $${formatCurrency(deposit)}`);
        }
        if (paymentsTotal > 0) {
          parts.push(`Pagos: $${formatCurrency(paymentsTotal)}`);
        }
        if (pending > 0) {
          parts.push(`Pendiente: $${formatCurrency(pending)}`);
        } else if (totalPaid >= fee) {
          parts.push('Estado: Pagado');
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
      description: await buildDescription(),
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
        dateTime: startDateTime,
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Argentina/Buenos_Aires',
      },
    };

    // Agregar color si se especifico el consultorio
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

    // Manejo especifico de errores de Google Calendar
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

import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { Appointment } from '@/types';
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
    // El appointment.date viene como ISO string UTC (ej: "2026-01-30T13:00:00.000Z")
    // que representa 10:00 AM Argentina convertido a UTC
    const startUtc = new Date(appointment.date);
    if (!Number.isFinite(startUtc.getTime())) {
      throw new Error('Invalid appointment date');
    }

    // Para Google Calendar, debemos enviar la hora local de Argentina
    // Extraer la fecha del appointment.date
    const dateStr = typeof appointment.date === 'string'
      ? appointment.date.split('T')[0]
      : appointment.date;

    // Usar startTime y endTime directamente (ya están en hora local)
    const startDateTime = `${dateStr}T${appointment.startTime}:00`;
    const endDateTime = `${dateStr}T${appointment.endTime}:00`;
    const timeZone = 'America/Argentina/Buenos_Aires';

    const durationMinutes = Number(appointment.duration || 0);

    // Diferenciar entre eventos personales y turnos de pacientes
    const isPersonalEvent = appointment.appointmentType === 'personal';
    const eventSummary = isPersonalEvent
      ? `🔒 ${appointment.title || 'Evento Personal'}`
      : `👤 Turno: ${appointment.patientName || 'Sin nombre'}`;

    // Construir descripción con información de pago y tratamiento
    const buildDescription = async () => {
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
          parts.push(`Seña: $${formatCurrency(deposit)}`);
        }
        if (paymentsTotal > 0) {
          parts.push(`Pagos: $${formatCurrency(paymentsTotal)}`);
        }
        if (pending > 0) {
          parts.push(`Pendiente: $${formatCurrency(pending)}`);
        } else if (totalPaid >= fee) {
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
        timeZone: timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: timeZone,
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

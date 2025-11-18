'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import CalendarView from '@/components/agenda/Calendar';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAppointmentsByUser } from '@/lib/appointments';
import { Appointment } from '@/types';
import { downloadCalendarIcs } from '@/lib/calendarSync';
import { useToast } from '@/contexts/ToastContext';
export const dynamic = 'force-dynamic';

export default function AgendaPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await getAppointmentsByUser(user.uid);
        setAppointments(data);
      } catch (e) { console.error(e); }
    })();
  }, [user]);

  const handleCalendarSync = () => {
    if (!appointments.length) {
      toast.info('Agrega al menos un turno antes de sincronizar');
      return;
    }

    try {
      downloadCalendarIcs(appointments);
      toast.success('Archivo .ics descargado. Cárgalo en Google Calendar para mantener tu agenda actualizada.');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo generar el archivo para Google Calendar.');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-primary-dark">Agenda</h1>
            <div className="flex flex-wrap gap-2">
              <Link href="/agenda/new" className="btn-primary hover:shadow-lg hover:scale-105 transition-all">Nuevo Turno</Link>
              <button
                type="button"
                onClick={handleCalendarSync}
                disabled={!appointments.length}
                className="btn-secondary flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Sincronizar con Google Calendar
              </button>
            </div>
          </div>
          <CalendarView appointments={appointments} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

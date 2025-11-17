'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import CalendarView from '@/components/agenda/Calendar';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAppointmentsByUser } from '@/lib/appointments';
import { Appointment } from '@/types';
export const dynamic = 'force-dynamic';

export default function AgendaPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await getAppointmentsByUser(user.uid);
        setAppointments(data);
      } catch (e) { console.error(e); }
    })();
  }, [user]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-primary-dark">Agenda</h1>
            <Link href="/agenda/new" className="btn-primary hover:shadow-lg hover:scale-105 transition-all">Nuevo Turno</Link>
          </div>
          <CalendarView appointments={appointments} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

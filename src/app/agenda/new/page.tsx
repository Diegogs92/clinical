'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import AppointmentForm from '@/components/agenda/AppointmentForm';
export const dynamic = 'force-dynamic';

export default function NewAppointmentPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-primary-dark">Nuevo Turno</h1>
          <AppointmentForm />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

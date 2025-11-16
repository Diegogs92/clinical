'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import AppointmentForm from '@/components/agenda/AppointmentForm';
import { useParams } from 'next/navigation';
import Link from 'next/link';
export const dynamic = 'force-dynamic';

export default function AppointmentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-dark">Editar Turno</h1>
            <Link href="/agenda" className="text-sm text-primary-dark hover:underline">Volver</Link>
          </div>
          <AppointmentForm appointmentId={id} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

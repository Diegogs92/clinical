'use client';

import { useParams } from 'next/navigation';
export const dynamic = 'force-dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import PatientForm from '@/components/patients/PatientForm';
import Link from 'next/link';

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params?.id as string;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-dark">Editar Paciente</h1>
            <Link href="/patients" className="text-sm text-primary-dark hover:underline">Volver</Link>
          </div>
          <PatientForm patientId={patientId} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

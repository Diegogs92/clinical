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
            <h1 className="text-xl md:text-2xl font-bold text-primary-dark">Editar Paciente</h1>
            <Link href="/patients" className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-primary-dark hover:text-primary dark:text-primary-light dark:hover:text-white transition-colors min-h-[44px]">
              Volver
            </Link>
          </div>
          <PatientForm patientId={patientId} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

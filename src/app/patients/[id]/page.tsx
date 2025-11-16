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
          <div className="grid md:grid-cols-2 gap-6 pt-8">
            <div className="card">
              <h2 className="font-semibold text-primary-dark mb-3">Archivos</h2>
              <p className="text-sm text-secondary mb-2">(Funcionalidad de subida pendiente de configuración Firebase Storage)</p>
              <ul className="text-sm space-y-1 text-secondary">
                <li>No hay archivos aún.</li>
              </ul>
            </div>
            <div className="card">
              <h2 className="font-semibold text-primary-dark mb-3">Historial Clínico</h2>
              <p className="text-sm text-secondary">(Se implementará tras agenda y autorizaciones)</p>
              <ul className="text-sm space-y-1 text-secondary">
                <li>Sin consultas registradas.</li>
              </ul>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

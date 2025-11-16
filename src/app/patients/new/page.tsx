'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
export const dynamic = 'force-dynamic';
import DashboardLayout from '@/components/DashboardLayout';
import PatientForm from '@/components/patients/PatientForm';

export default function NewPatientPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl">
          <h1 className="text-2xl font-bold text-primary-dark">Nuevo Paciente</h1>
          <PatientForm />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

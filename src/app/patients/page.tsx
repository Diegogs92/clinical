'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
export const dynamic = 'force-dynamic';
import DashboardLayout from '@/components/DashboardLayout';
import PatientList from '@/components/patients/PatientList';

export default function PatientsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-primary-dark">Pacientes</h1>
          <PatientList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

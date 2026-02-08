"use client"

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PatientList from '@/components/patients/PatientList';

export default function PatientsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Pacientes</h1>
          <PatientList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

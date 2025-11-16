'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import InsuranceForm from '@/components/insurances/InsuranceForm';
export const dynamic = 'force-dynamic';

export default function NewInsurancePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl">
          <h1 className="text-2xl font-bold text-primary-dark">Nueva Obra Social / Prepaga</h1>
          <InsuranceForm />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

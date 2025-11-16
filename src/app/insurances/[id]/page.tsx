'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import InsuranceForm from '@/components/insurances/InsuranceForm';
import { useParams } from 'next/navigation';
import Link from 'next/link';
export const dynamic = 'force-dynamic';

export default function InsuranceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-dark">Editar Obra Social / Prepaga</h1>
            <Link href="/insurances" className="text-sm text-primary-dark hover:underline">Volver</Link>
          </div>
          <InsuranceForm insuranceId={id} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

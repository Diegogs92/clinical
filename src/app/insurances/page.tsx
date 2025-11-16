'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { listInsurances } from '@/lib/insurances';
import { Insurance } from '@/types';
import Link from 'next/link';
export const dynamic = 'force-dynamic';

export default function InsurancesPage() {
  const { user } = useAuth();
  const [insurances, setInsurances] = useState<Insurance[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const data = await listInsurances(user.uid);
      setInsurances(data);
    })();
  }, [user]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-primary-dark">Obras Sociales / Prepagas</h1>
            <Link href="/insurances/new" className="btn-primary">Nueva</Link>
          </div>
          <div className="card overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-secondary-lighter">
                <tr className="text-left text-primary-dark">
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Teléfono</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {insurances.map(i => (
                  <tr key={i.id} className="border-t border-secondary-lighter">
                    <td className="p-2 font-medium">{i.name}</td>
                    <td className="p-2">{i.type}</td>
                    <td className="p-2">{i.phone}</td>
                    <td className="p-2">{i.email}</td>
                    <td className="p-2"><Link href={`/insurances/${i.id}`} className="text-primary-dark hover:underline">Editar</Link></td>
                  </tr>
                ))}
                {insurances.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-secondary">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

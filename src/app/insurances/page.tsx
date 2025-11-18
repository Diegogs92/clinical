'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { listInsurances } from '@/lib/insurances';
import { Insurance } from '@/types';
import Modal from '@/components/ui/Modal';
import InsuranceForm from '@/components/insurances/InsuranceForm';
import { Plus, Edit2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
export const dynamic = 'force-dynamic';

export default function InsurancesPage() {
  const { user } = useAuth();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const toast = useToast();

  const loadInsurances = async () => {
    if (!user) return;
    const data = await listInsurances(user.uid);
    setInsurances(data);
  };

  useEffect(() => {
    loadInsurances();
  }, [user]);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingId(null);
    loadInsurances();
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Obras Sociales / Prepagas</h1>
            <button
              onClick={() => {
                setEditingId(null);
                setShowModal(true);
              }}
              className="btn-primary hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva
            </button>
          </div>
          <div className="card overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-secondary-lighter dark:bg-[#27272a]">
                <tr className="text-left text-primary-dark dark:text-white">
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Teléfono</th>
                  <th className="p-2">Email</th>
                  <th className="p-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-900 dark:text-gray-100">
                {insurances.map(i => (
                  <tr key={i.id} className="border-t border-secondary-lighter dark:border-gray-700 hover:bg-secondary-lighter/40 dark:hover:bg-[#27272a] transition-colors">
                    <td className="p-2 font-medium">{i.name}</td>
                    <td className="p-2 capitalize">{i.type === 'obra-social' ? 'Obra Social' : 'Prepaga'}</td>
                    <td className="p-2">{i.phone}</td>
                    <td className="p-2">{i.email}</td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => handleEdit(i.id)}
                        className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white hover:scale-110 transition-all inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {insurances.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-secondary dark:text-gray-400">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Modal
            open={showModal}
            onClose={handleClose}
            title={editingId ? 'Editar Obra Social / Prepaga' : 'Nueva Obra Social / Prepaga'}
          >
            <InsuranceForm
              insuranceId={editingId || undefined}
              onSuccess={() => {
                toast.success(editingId ? 'Actualizado correctamente' : 'Creado correctamente');
                handleClose();
              }}
              onCancel={handleClose}
            />
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

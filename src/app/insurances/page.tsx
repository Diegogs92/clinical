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
import { usePatients } from '@/contexts/PatientsContext';
export const dynamic = 'force-dynamic';

export default function InsurancesPage() {
  const { user } = useAuth();
  const { patients } = usePatients();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const toast = useToast();

  // Función para contar pacientes por obra social
  const getPatientCount = (insuranceId: string) => {
    return patients.filter(p => p.insuranceId === insuranceId).length;
  };

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
              Nueva Obra Social
            </button>
          </div>
          <div className="card overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-primary/20 to-primary-light/20 dark:bg-gradient-to-r dark:from-primary/30 dark:to-primary-light/30">
                <tr className="text-left">
                  <th className="p-3 font-bold text-navy-darkest dark:text-white">Código</th>
                  <th className="p-3 font-bold text-navy-darkest dark:text-white">Sigla</th>
                  <th className="p-3 font-bold text-navy-darkest dark:text-white">Contacto</th>
                  <th className="p-3 font-bold text-navy-darkest dark:text-white">Denominación</th>
                  <th className="p-3 font-bold text-navy-darkest dark:text-white">Pacientes</th>
                  <th className="p-3 text-right font-bold text-navy-darkest dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-black dark:text-white">
                {insurances.map(i => {
                  const patientCount = getPatientCount(i.id);
                  return (
                    <tr key={i.id} className="border-t border-elegant-100 dark:border-elegant-800 hover:bg-secondary-lighter/40 dark:hover:bg-[#27272a] transition-colors">
                      <td className="p-2">{i.code || '-'}</td>
                      <td className="p-2 font-medium">{i.acronym || '-'}</td>
                      <td className="p-2">{i.phone || i.email || i.website || '-'}</td>
                      <td className="p-2">{i.name}</td>
                      <td className="p-2">
                        {patientCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                            {patientCount}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleEdit(i.id)}
                          className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white hover:scale-110 hover:shadow-sm transition-all duration-200 inline-flex items-center gap-1 font-medium"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {insurances.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-black dark:text-white">Sin registros</td></tr>
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

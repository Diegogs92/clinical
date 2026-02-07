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
          <div className="card">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table-skin">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Sigla</th>
                    <th>Contacto</th>
                    <th>Denominación</th>
                    <th>Pacientes</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {insurances.map(i => {
                    const patientCount = getPatientCount(i.id);
                    return (
                      <tr key={i.id}>
                        <td>{i.code || '-'}</td>
                        <td className="font-medium">{i.acronym || '-'}</td>
                        <td>{i.phone || i.email || i.website || '-'}</td>
                        <td>{i.name}</td>
                        <td>
                          {patientCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                              {patientCount}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="text-right">
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

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {insurances.map(i => {
                const patientCount = getPatientCount(i.id);
                return (
                  <div key={i.id} className="bg-white dark:bg-elegant-900 border border-elegant-200/60 dark:border-elegant-800/60 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-elegant-900 dark:text-white text-base">
                          {i.name}
                        </h4>
                        <p className="text-sm text-elegant-600 dark:text-elegant-400 mt-1">
                          {i.acronym ? `${i.acronym}` : 'Sin sigla'} {i.code ? `• Código: ${i.code}` : ''}
                        </p>
                      </div>
                      {patientCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                          {patientCount} pacientes
                        </span>
                      )}
                    </div>

                    {(i.phone || i.email || i.website) && (
                      <div className="mb-3 pt-2 border-t border-elegant-100 dark:border-elegant-800">
                        <div className="text-xs text-muted-foreground mb-1">Contacto</div>
                        <div className="text-sm text-elegant-700 dark:text-elegant-300">
                          {i.phone || i.email || i.website}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-elegant-100 dark:border-elegant-800">
                      <button
                        onClick={() => handleEdit(i.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                    </div>
                  </div>
                );
              })}
              {insurances.length === 0 && (
                <div className="p-8 text-center text-black dark:text-white text-sm">Sin registros</div>
              )}
            </div>
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

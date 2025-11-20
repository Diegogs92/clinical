'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deletePatient } from '@/lib/patients';
import { listPayments } from '@/lib/payments';
import { Payment } from '@/types';
import { Trash2, Edit, Search } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import ECGLoader from '@/components/ui/ECGLoader';
import Modal from '@/components/ui/Modal';
import PatientForm from './PatientForm';
import { usePatients } from '@/contexts/PatientsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';

export default function PatientList() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const { patients, loading: patientsLoading, refreshPatients } = usePatients();
  const { appointments } = useAppointments();
  const toast = useToast();
  const confirm = useConfirm();

  // Helper function to count appointments for a patient
  const getPatientAppointments = (patientId: string) => {
    return appointments.filter(a => a.patientId === patientId);
  };

  // Helper function to calculate patient debt
  const getPatientDebt = (patientId: string) => {
    const patientPayments = payments.filter(p => p.patientId === patientId);
    const pending = patientPayments.filter(p => p.status === 'pending');
    return pending.reduce((sum, p) => sum + p.amount, 0);
  };

  // Helper function to calculate total paid
  const getPatientPaid = (patientId: string) => {
    const patientPayments = payments.filter(p => p.patientId === patientId);
    const completed = patientPayments.filter(p => p.status === 'completed');
    return completed.reduce((sum, p) => sum + p.amount, 0);
  };

  const loadData = useCallback(async ({ showLoading = false } = {}) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const paymentsData = await listPayments(user.uid);
      setPayments(paymentsData);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    loadData({ showLoading: true });
  }, [loadData]);

  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  const filtered = patients.filter(p =>
    `${p.lastName} ${p.firstName}`.toLowerCase().includes(search.toLowerCase()) || p.dni.includes(search)
  );

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar paciente',
      description: 'Esta acción es irreversible. ¿Deseas continuar?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deletePatient(id);
      toast.success('Paciente eliminado correctamente');
      await refreshPatients();
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Error al eliminar paciente');
    }
  };

  if (loading || patientsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-primary dark:text-white">
        <ECGLoader />
        <p className="mt-4 text-sm">Cargando pacientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="relative md:max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary dark:text-gray-400" />
          <input
            placeholder="Buscar por nombre o DNI..."
            className="input-field pl-10 w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setIsNewPatientModalOpen(true)}
          className="btn-primary inline-block text-center hover:shadow-lg hover:scale-105 transition-all"
        >
          + Nuevo Paciente
        </button>
      </div>
      <Modal
        open={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        title="Nuevo paciente"
        maxWidth="max-w-2xl"
      >
        <PatientForm
          onSuccess={async () => {
            setIsNewPatientModalOpen(false);
            await refreshPatients();
            loadData();
          }}
        />
      </Modal>
      {/* Vista Desktop: Tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-[#18181b] rounded-lg">
          <thead className="bg-gradient-to-r from-primary/20 to-primary-light/20 dark:bg-gradient-to-r dark:from-primary/30 dark:to-primary-light/30">
            <tr className="text-left text-sm">
              <th className="p-3 font-bold text-navy-darkest dark:text-white">Apellido</th>
              <th className="p-3 font-bold text-navy-darkest dark:text-white">Nombre</th>
              <th className="p-3 font-bold text-navy-darkest dark:text-white">DNI</th>
              <th className="p-3 font-bold text-navy-darkest dark:text-white">Teléfono</th>
              <th className="p-3 font-bold text-navy-darkest dark:text-white">Turnos</th>
              <th className="p-3 font-bold text-navy-darkest dark:text-white">Pagado</th>
              <th className="p-3 font-bold text-navy-darkest dark:text-white">Deuda</th>
              <th className="p-3 text-right font-bold text-navy-darkest dark:text-white">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm text-black dark:text-white">
            {filtered.map(p => {
              const patientAppts = getPatientAppointments(p.id);
              const totalPaid = getPatientPaid(p.id);
              const debt = getPatientDebt(p.id);

              return (
                <tr key={p.id} className="border-t border-elegant-100 dark:border-elegant-800 hover:bg-secondary-lighter/40 dark:hover:bg-[#27272a] transition-colors">
                  <td className="p-2 font-medium">{p.lastName}</td>
                  <td className="p-2">{p.firstName}</td>
                  <td className="p-2">{p.dni}</td>
                  <td className="p-2">{p.phone}</td>
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                      {patientAppts.length}
                    </span>
                  </td>
                  <td className="p-2">
                    {totalPaid > 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        ${totalPaid.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-secondary dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-2">
                    {debt > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-semibold">
                        ${debt.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-secondary dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/patients/${p.id}`} className="text-primary-dark dark:text-blue-400 hover:underline hover:scale-110 transition-all flex items-center gap-1"><Edit className="w-4 h-4" /> Editar</Link>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600 dark:text-red-400 hover:underline hover:scale-110 transition-all flex items-center gap-1"><Trash2 className="w-4 h-4" /> Borrar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-black dark:text-white">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Vista Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(p => {
          const patientAppts = getPatientAppointments(p.id);
          const totalPaid = getPatientPaid(p.id);
          const debt = getPatientDebt(p.id);

          return (
            <div
              key={p.id}
              className="bg-white dark:bg-[#18181b] border border-secondary-lighter dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-primary-dark dark:text-white text-base">
                    {p.lastName}, {p.firstName}
                  </h3>
                  <p className="text-sm text-secondary dark:text-gray-400 mt-1">
                    DNI: {p.dni}
                  </p>
                  <p className="text-sm text-secondary dark:text-gray-400">
                    Tel: {p.phone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 py-3 border-y border-secondary-lighter dark:border-gray-700">
                <div className="text-center">
                  <div className="text-xs text-secondary dark:text-gray-400 mb-1">Turnos</div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                    {patientAppts.length}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-xs text-secondary dark:text-gray-400 mb-1">Pagado</div>
                  {totalPaid > 0 ? (
                    <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                      ${totalPaid.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-secondary dark:text-gray-500">-</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs text-secondary dark:text-gray-400 mb-1">Deuda</div>
                  {debt > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-semibold">
                      ${debt.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-secondary dark:text-gray-500">-</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/patients/${p.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-black dark:text-white">
            Sin resultados
          </div>
        )}
      </div>
    </div>
  );
}

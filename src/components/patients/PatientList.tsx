'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientsByUser, deletePatient } from '@/lib/patients';
import { getAppointmentsByUser } from '@/lib/appointments';
import { listPayments } from '@/lib/payments';
import { Patient, Appointment, Payment } from '@/types';
import { Trash2, Edit, Search } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import ECGLoader from '@/components/ui/ECGLoader';
import Modal from '@/components/ui/Modal';
import PatientForm from './PatientForm';

export default function PatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
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
      const [patientsData, appointmentsData, paymentsData] = await Promise.all([
        getPatientsByUser(user.uid),
        getAppointmentsByUser(user.uid),
        listPayments(user.uid),
      ]);
      setPatients(patientsData);
      setAppointments(appointmentsData);
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
      setPatients(prev => prev.filter(p => p.id !== id));
      toast.success('Paciente eliminado correctamente');
    } catch (e) {
      console.error(e);
      toast.error('Error al eliminar paciente');
    }
  };

  if (loading) {
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
        maxWidth="max-w-3xl"
      >
        <PatientForm
          onSuccess={() => {
            setIsNewPatientModalOpen(false);
            loadData();
          }}
        />
      </Modal>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-secondary-lighter dark:border-gray-700 bg-white dark:bg-[#18181b] rounded-lg">
          <thead className="bg-secondary-lighter dark:bg-[#27272a]">
            <tr className="text-left text-sm text-primary-dark dark:text-white">
              <th className="p-2">Apellido</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">DNI</th>
              <th className="p-2">Teléfono</th>
              <th className="p-2">Turnos</th>
              <th className="p-2">Pagado</th>
              <th className="p-2">Deuda</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-900 dark:text-gray-100">
            {filtered.map(p => {
              const patientAppts = getPatientAppointments(p.id);
              const totalPaid = getPatientPaid(p.id);
              const debt = getPatientDebt(p.id);

              return (
                <tr key={p.id} className="border-t border-secondary-lighter dark:border-gray-700 hover:bg-secondary-lighter/40 dark:hover:bg-[#27272a] transition-colors">
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
                <td colSpan={8} className="p-4 text-center text-secondary dark:text-gray-400">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

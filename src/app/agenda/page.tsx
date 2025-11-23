'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import CalendarView from '@/components/agenda/Calendar';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { downloadCalendarIcs } from '@/lib/calendarSync';
import { useToast } from '@/contexts/ToastContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import ECGLoader from '@/components/ui/ECGLoader';
import Modal from '@/components/ui/Modal';
import { useState } from 'react';
import { Appointment } from '@/types';
import { useConfirm } from '@/contexts/ConfirmContext';
import { deleteAppointment, updateAppointment } from '@/lib/appointments';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { createPayment } from '@/lib/payments';
import { usePayments } from '@/contexts/PaymentsContext';
import { useAuth } from '@/contexts/AuthContext';
export const dynamic = 'force-dynamic';

export default function AgendaPage() {
  const { appointments, loading: appointmentsLoading, refreshAppointments } = useAppointments();
  const { refreshPayments, refreshPendingPayments } = usePayments();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const handleCalendarSync = () => {
    if (!appointments.length) {
      toast.info('Agrega al menos un turno antes de sincronizar');
      return;
    }

    try {
      downloadCalendarIcs(appointments);
      toast.success('Archivo .ics descargado. Cárgalo en Google Calendar para mantener tu agenda actualizada.');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo generar el archivo para Google Calendar.');
    }
  };

  const handleDelete = async (appt: Appointment) => {
    const ok = await confirm({
      title: 'Eliminar turno',
      description: `¿Seguro deseas eliminar el turno de ${appt.patientName}?`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteAppointment(appt.id);
      await refreshAppointments();
      toast.success('Turno eliminado');
    } catch (e) {
      toast.error('No se pudo eliminar el turno');
    }
  };

  const handlePayment = async (appt: Appointment, status: 'completed' | 'pending') => {
    if (!user) return;
    if (!appt.fee) {
      toast.error('Este turno no tiene honorarios asignados');
      return;
    }
    const confirmed = await confirm({
      title: status === 'completed' ? 'Registrar pago' : 'Registrar deuda',
      description: status === 'completed'
        ? `¿Confirmar el pago de $${appt.fee.toLocaleString()} de ${appt.patientName}?`
        : `¿Registrar como deuda pendiente $${appt.fee.toLocaleString()} de ${appt.patientName}?`,
      confirmText: status === 'completed' ? 'Registrar pago' : 'Registrar deuda',
      tone: status === 'completed' ? 'success' : 'danger',
    });
    if (!confirmed) return;

    try {
      await createPayment({
        appointmentId: appt.id,
        patientId: appt.patientId,
        patientName: appt.patientName,
        amount: appt.fee,
        method: 'cash',
        status,
        date: new Date().toISOString(),
        consultationType: appt.type,
        userId: user.uid,
      });

      if (status === 'completed' && appt.status !== 'completed') {
        await updateAppointment(appt.id, { status: 'completed' });
      }

      await refreshAppointments();
      await refreshPayments();
      await refreshPendingPayments();
      toast.success(status === 'completed' ? 'Pago registrado' : 'Deuda registrada');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo registrar la operación');
    }
  };

  const handleEdit = (appt: Appointment) => {
    setEditingAppointment(appt);
    setShowForm(true);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-elegant-500">Agenda</p>
              <h1 className="text-3xl font-bold text-primary-dark dark:text-white">Turnos y horarios</h1>
              <p className="text-sm text-elegant-500 dark:text-elegant-400">Vista limpia para organizar tus turnos.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/agenda/new" className="btn-primary hover:shadow-lg hover:scale-105 transition-all">Nuevo Turno</Link>
              <button
                type="button"
                onClick={handleCalendarSync}
                disabled={!appointments.length}
                className="btn-secondary flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Descargar .ics
              </button>
            </div>
          </div>
          {appointmentsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-primary dark:text-white">
              <ECGLoader />
              <p className="mt-4 text-sm">Cargando agenda...</p>
            </div>
          ) : (
            <div className="glass-panel p-4 sm:p-6 border border-elegant-200/60 dark:border-elegant-800/60 shadow-md">
              <CalendarView
                appointments={appointments}
                onPay={(appt) => handlePayment(appt, 'completed')}
                onDebt={(appt) => handlePayment(appt, 'pending')}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>

        <Modal
          open={showForm}
          onClose={() => { setShowForm(false); setEditingAppointment(null); }}
          title={editingAppointment ? 'Editar Turno' : 'Nuevo Turno'}
          maxWidth="max-w-2xl"
        >
          <AppointmentForm
            initialData={editingAppointment || undefined}
            onCreated={() => {
              setShowForm(false);
              setEditingAppointment(null);
              refreshAppointments();
              toast.success('Turno actualizado');
            }}
            onCancel={() => { setShowForm(false); setEditingAppointment(null); }}
          />
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

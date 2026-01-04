'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { usePayments } from '@/contexts/PaymentsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePatients } from '@/contexts/PatientsContext';
import { useEffect, useMemo, useState } from 'react';
import { Appointment, Payment, UserProfile } from '@/types';
import { createPayment } from '@/lib/payments';
import { useToast } from '@/contexts/ToastContext';
import { DollarSign } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/formatCurrency';
import { listProfessionals } from '@/lib/users';
export const dynamic = 'force-dynamic';

export default function FeesPage() {
  const { user } = useAuth();
  const { payments, pendingPayments: pending, refreshPayments, refreshPendingPayments } = usePayments();
  const { appointments } = useAppointments();
  const { patients } = usePatients();
  const [professionals, setProfessionals] = useState<UserProfile[]>([]);
  const [filters, setFilters] = useState({
    query: '',
    professionalId: '',
    startDate: '',
    endDate: '',
  });
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; appointment?: Appointment; mode: 'total' | 'partial'; amount: string }>({
    open: false,
    appointment: undefined,
    mode: 'total',
    amount: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        const list = await listProfessionals();
        setProfessionals(list);
      } catch (error) {
        console.error('[Fees] Error loading professionals:', error);
      }
    };

    loadProfessionals();
  }, []);

  // Calcular ingresos totales: pagos + señas
  const paymentsRevenue = payments
    .filter(p => p.status === 'completed' || p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const depositsRevenue = appointments
    .filter(a => a.deposit && a.deposit > 0)
    .reduce((sum, a) => sum + (a.deposit || 0), 0);

  const totalRevenue = paymentsRevenue + depositsRevenue;

  const allPayments = [...payments, ...pending].reduce((acc, payment) => {
    acc.set(payment.id, payment);
    return acc;
  }, new Map<string, Payment>());

  const paymentTotalsByAppointment = Array.from(allPayments.values()).reduce((acc, payment) => {
    if (!payment.appointmentId) return acc;
    if (payment.status !== 'completed' && payment.status !== 'pending') return acc;
    const prev = acc.get(payment.appointmentId) || 0;
    acc.set(payment.appointmentId, prev + payment.amount);
    return acc;
  }, new Map<string, number>());

  const getRemainingForAppointment = (appointment: Appointment) => {
    const paid = paymentTotalsByAppointment.get(appointment.id) || 0;
    const deposit = appointment.deposit || 0;
    return Math.max(0, (appointment.fee || 0) - deposit - paid);
  };

  const patientsById = useMemo(() => {
    return patients.reduce((acc, patient) => {
      acc.set(patient.id, patient);
      return acc;
    }, new Map<string, (typeof patients)[number]>());
  }, [patients]);

  const cobros = useMemo(() => {
    const paymentRows = payments
      .filter(p => p.status === 'completed' || p.status === 'pending')
      .map((payment) => {
        const patient = payment.patientId ? patientsById.get(payment.patientId) : undefined;
        const patientName = patient ? `${patient.lastName} ${patient.firstName}` : payment.patientName || 'Paciente';
        return {
          id: payment.id,
          type: 'payment' as const,
          patientId: payment.patientId,
          patientName,
          patientDni: patient?.dni || '',
          amount: payment.amount,
          date: payment.date,
          userId: payment.userId,
        };
      });

    const depositRows = appointments
      .filter((appointment) => appointment.appointmentType === 'patient' && appointment.deposit && appointment.deposit > 0)
      .map((appointment) => {
        const patient = appointment.patientId ? patientsById.get(appointment.patientId) : undefined;
        const patientName = appointment.patientName || (patient ? `${patient.lastName} ${patient.firstName}` : 'Paciente');
        return {
          id: `deposit-${appointment.id}`,
          type: 'deposit' as const,
          patientId: appointment.patientId,
          patientName,
          patientDni: patient?.dni || '',
          amount: appointment.deposit || 0,
          date: appointment.date,
          userId: appointment.userId,
        };
      });

    return [...paymentRows, ...depositRows];
  }, [appointments, patientsById, payments]);

  const filteredCobros = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
    const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : null;

    return cobros
      .filter((row) => {
        if (filters.professionalId && row.userId !== filters.professionalId) {
          return false;
        }
        if (start || end) {
          const rowDate = new Date(row.date);
          if (start && rowDate < start) return false;
          if (end && rowDate > end) return false;
        }
        if (!query) return true;
        const patient = row.patientId ? patientsById.get(row.patientId) : undefined;
        const patientLabel = patient
          ? `${patient.lastName} ${patient.firstName} ${patient.dni}`.toLowerCase()
          : `${row.patientName} ${row.patientDni}`.toLowerCase();
        return patientLabel.includes(query);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cobros, filters, patientsById]);

  const pendingAppointments = appointments
    .filter(appointment => appointment.fee && appointment.status === 'completed')
    .map(appointment => ({
      appointment,
      remaining: getRemainingForAppointment(appointment)
    }))
    .filter(({ remaining }) => remaining > 0)
    .sort((a, b) => {
      const aTime = new Date(a.appointment.date).getTime();
      const bTime = new Date(b.appointment.date).getTime();
      return bTime - aTime;
    });

  const pendingSummary = pendingAppointments.reduce(
    (acc, item) => {
      acc.amount += item.remaining;
      acc.count += 1;
      return acc;
    },
    { amount: 0, count: 0 }
  );

  const patientsWithDebt = new Set(
    pendingAppointments
      .map(({ appointment }) => appointment.patientId)
      .filter((id): id is string => Boolean(id))
  );

  const openPaymentDialog = (appointment: Appointment) => {
    if (!appointment.fee) {
      toast.error('Este turno no tiene honorarios asignados');
      return;
    }
    const remainingAmount = getRemainingForAppointment(appointment);
    if (remainingAmount <= 0) {
      toast.error('Este turno no tiene saldo pendiente');
      return;
    }
    setPaymentDialog({
      open: true,
      appointment,
      mode: 'total',
      amount: remainingAmount.toString(),
    });
  };

  const submitPayment = async () => {
    const appt = paymentDialog.appointment;
    if (!appt) return;
    if (!user) {
      toast.error('Debes iniciar sesión para registrar pagos');
      return;
    }

    const sanitized = paymentDialog.amount.replace(/\./g, '').replace(',', '.');
    const amountNum = Number(sanitized);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (appt.appointmentType !== 'patient' || !appt.patientId || !appt.patientName) {
      toast.error('No se puede registrar pago para este tipo de evento');
      return;
    }

    const remainingAmount = getRemainingForAppointment(appt);
    if (amountNum > remainingAmount) {
      toast.error(`El monto ingresado ($${formatCurrency(amountNum)}) supera el monto restante ($${formatCurrency(remainingAmount)})`);
      return;
    }

    const isTotal = amountNum >= remainingAmount;
    const status: 'completed' | 'pending' = isTotal ? 'completed' : 'pending';

    try {
      setSubmittingPayment(true);
      await createPayment({
        appointmentId: appt.id,
        patientId: appt.patientId,
        patientName: appt.patientName,
        amount: amountNum,
        method: 'cash',
        status,
        date: new Date().toISOString(),
        consultationType: appt.type || '',
        userId: user.uid,
      });

      await refreshPayments();
      await refreshPendingPayments();
      setPaymentDialog({ open: false, appointment: undefined, mode: 'total', amount: '' });
      toast.success(isTotal ? 'Pago registrado' : 'Pago parcial registrado');
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error('Error al registrar el pago');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-navy-darkest dark:text-white">Honorarios</h1>
          </div>
          <div className="grid gap-2.5 md:gap-3 grid-cols-2 lg:grid-cols-4">
            <div className="relative overflow-hidden bg-white/95 dark:bg-elegant-900/95 rounded-xl p-3 md:p-4 border border-elegant-200/80 dark:border-elegant-800/80 backdrop-blur-lg">
              <div className="relative z-10">
                <div className="text-[12px] md:text-xs uppercase tracking-wide font-bold text-elegant-600 dark:text-elegant-400 mb-1 truncate">Total Ingresos</div>
                <div className="text-xl md:text-3xl font-bold tabular-nums text-black dark:text-white mb-0.5 md:mb-1">
                  ${formatCurrency(totalRevenue)}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white/95 dark:bg-elegant-900/95 rounded-xl p-3 md:p-4 border border-elegant-200/80 dark:border-elegant-800/80 backdrop-blur-lg">
              <div className="relative z-10">
                <div className="text-[12px] md:text-xs uppercase tracking-wide font-bold text-elegant-600 dark:text-elegant-400 mb-1 truncate">Saldo Pendiente</div>
                <div className="text-xl md:text-3xl font-bold tabular-nums text-black dark:text-white mb-0.5 md:mb-1">
                  ${formatCurrency(pendingSummary.amount)}
                </div>
                <div className="text-xs text-elegant-500 dark:text-elegant-400 truncate">
                  Atendidos con saldo sin completar
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white/95 dark:bg-elegant-900/95 rounded-xl p-3 md:p-4 border border-elegant-200/80 dark:border-elegant-800/80 backdrop-blur-lg">
              <div className="relative z-10">
                <div className="text-[12px] md:text-xs uppercase tracking-wide font-bold text-elegant-600 dark:text-elegant-400 mb-1 truncate">Cobros</div>
                <div className="text-xl md:text-3xl font-bold tabular-nums text-black dark:text-white mb-0.5 md:mb-1">
                  {cobros.length}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white/95 dark:bg-elegant-900/95 rounded-xl p-3 md:p-4 border border-elegant-200/80 dark:border-elegant-800/80 backdrop-blur-lg">
              <div className="relative z-10">
                <div className="text-[12px] md:text-xs uppercase tracking-wide font-bold text-elegant-600 dark:text-elegant-400 mb-1 truncate">Atendidos con Saldo</div>
                <div className="text-xl md:text-3xl font-bold tabular-nums text-black dark:text-white mb-0.5 md:mb-1">
                  {pendingSummary.count}
                </div>
                <div className="text-xs text-elegant-500 dark:text-elegant-400 truncate">
                  Pacientes atendidos sin pago total
                </div>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card overflow-x-auto">
              <h2 className="font-semibold text-primary-dark dark:text-white mb-3">Cobros</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Paciente (apellido, nombre o DNI)"
                  className="input-field text-sm"
                  value={filters.query}
                  onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                />
                <select
                  className="input-field text-sm"
                  value={filters.professionalId}
                  onChange={(event) => setFilters((prev) => ({ ...prev, professionalId: event.target.value }))}
                >
                  <option value="">Todos los profesionales</option>
                  {professionals.map((professional) => (
                    <option key={professional.uid} value={professional.uid}>
                      {professional.displayName || professional.email || professional.uid}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="input-field text-sm"
                    value={filters.startDate}
                    onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
                  />
                  <input
                    type="date"
                    className="input-field text-sm"
                    value={filters.endDate}
                    onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
                  />
                </div>
              </div>
              <table className="table-skin">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th>Deuda</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCobros.slice(0, 20).map((row) => (
                    <tr key={row.id}>
                      <td>{row.patientName}</td>
                      <td>${formatCurrency(row.amount)}</td>
                      <td>{new Date(row.date).toLocaleDateString()}</td>
                      <td>
                        {row.patientId && patientsWithDebt.has(row.patientId)
                          ? 'Con deuda'
                          : 'Sin deuda'}
                      </td>
                    </tr>
                  ))}
                  {filteredCobros.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-black dark:text-white">Sin registros</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="card overflow-x-auto">
              <div className="mb-4">
                <h2 className="font-semibold text-primary-dark dark:text-white">Pendientes de pago</h2>
                <p className="text-xs text-elegant-500 dark:text-elegant-400">
                  Pacientes atendidos con saldo sin completar
                </p>
              </div>
              <table className="table-skin">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Saldo pendiente</th>
                    <th>Fecha</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAppointments.slice(0, 10).map(({ appointment, remaining }) => {
                    return (
                    <tr key={appointment.id}>
                      <td>{appointment.patientName}</td>
                      <td>${formatCurrency(remaining)}</td>
                      <td>{new Date(appointment.date).toLocaleDateString()}</td>
                      <td className="text-right">
                        <button
                          onClick={() => openPaymentDialog(appointment)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                          aria-label="Registrar pago"
                          title="Registrar pago"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Registrar pago
                        </button>
                      </td>
                    </tr>
                  );
                  })}
                  {pendingAppointments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-black dark:text-white">Sin pendientes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Modal
          open={paymentDialog.open}
          onClose={() => setPaymentDialog({ open: false, appointment: undefined, mode: 'total', amount: '' })}
          title="Registrar pago"
          maxWidth="max-w-md"
        >
          {paymentDialog.appointment && (() => {
            const appt = paymentDialog.appointment;
            const remainingAmount = getRemainingForAppointment(appt);
            const deposit = appt.deposit || 0;

            return (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-elegant-600 dark:text-elegant-300">
                    {appt.patientName || appt.title || 'Evento'}
                  </p>
                  <p className="text-lg font-semibold text-primary-dark dark:text-white">
                    Honorarios: ${appt.fee ? formatCurrency(appt.fee) : '0'}
                  </p>
                  {deposit > 0 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Seña pagada: ${formatCurrency(deposit)}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Monto restante: ${formatCurrency(remainingAmount)}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-elegant-100 dark:bg-elegant-800/60 p-2 rounded-full">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${paymentDialog.mode === 'total' ? 'bg-primary text-white shadow' : 'text-elegant-600 dark:text-elegant-200'}`}
                    onClick={() => setPaymentDialog(p => ({ ...p, mode: 'total', amount: remainingAmount.toString() }))}
                  >
                    Pago total
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${paymentDialog.mode === 'partial' ? 'bg-primary text-white shadow' : 'text-elegant-600 dark:text-elegant-200'}`}
                    onClick={() => setPaymentDialog(p => ({ ...p, mode: 'partial', amount: '' }))}
                  >
                    Pago parcial
                  </button>
                </div>

                {paymentDialog.mode === 'partial' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-elegant-600 dark:text-elegant-300">
                      Monto a pagar (máximo: ${formatCurrency(remainingAmount)})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={remainingAmount}
                      value={paymentDialog.amount}
                      onChange={(e) => setPaymentDialog(p => ({ ...p, amount: e.target.value }))}
                      className="input-field text-sm py-2"
                      placeholder="Ingresar monto"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn-secondary text-sm px-4 py-2"
                    onClick={() => setPaymentDialog({ open: false, appointment: undefined, mode: 'total', amount: '' })}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary text-sm px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={submitPayment}
                    disabled={submittingPayment}
                  >
                    {submittingPayment ? 'Registrando...' : 'Registrar'}
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>

      </DashboardLayout>
    </ProtectedRoute>
  );
}

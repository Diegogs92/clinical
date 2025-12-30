'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { usePayments } from '@/contexts/PaymentsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useState } from 'react';
import { Payment } from '@/types';
import { updatePayment, deletePayment } from '@/lib/payments';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { Edit2, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { combineDateAndTime } from '@/lib/dateUtils';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { formatCurrency } from '@/lib/formatCurrency';
export const dynamic = 'force-dynamic';

export default function FeesPage() {
  const { payments, pendingPayments: pending, refreshPayments, refreshPendingPayments } = usePayments();
  const { appointments } = useAppointments();
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

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

  const pendingSummary = appointments.reduce(
    (acc, appointment) => {
      if (!appointment.fee) return acc;
      const paid = paymentTotalsByAppointment.get(appointment.id) || 0;
      const deposit = appointment.deposit || 0;
      if (appointment.status === 'cancelled' && paid === 0 && deposit === 0) return acc;
      const remaining = Math.max(0, appointment.fee - deposit - paid);
      if (remaining > 0) {
        acc.amount += remaining;
        acc.count += 1;
      }
      return acc;
    },
    { amount: 0, count: 0 }
  );

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setEditAmount(payment.amount.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingPayment) return;
    const sanitized = editAmount.replace(/\./g, '').replace(',', '.');
    const amountNum = Number(sanitized);

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    const confirmed = await confirm({
      title: 'Confirmar cambios',
      description: `¿Actualizar el honorario de ${editingPayment.patientName} de $${formatCurrency(editingPayment.amount)} a $${formatCurrency(amountNum)}?`,
      confirmText: 'Guardar cambios',
      tone: 'success',
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await updatePayment(editingPayment.id, { amount: amountNum });
      await refreshPayments();
      await refreshPendingPayments();
      toast.success('Honorario actualizado correctamente');
      setEditingPayment(null);
      setEditAmount('');
    } catch (error) {
      console.error('Error al actualizar honorario:', error);
      toast.error('Error al actualizar honorario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (payment: Payment) => {
    const confirmed = await confirm({
      title: 'Eliminar honorario',
      description: `¿Eliminar el honorario de $${formatCurrency(payment.amount)} de ${payment.patientName}?`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await deletePayment(payment.id);
      await refreshPayments();
      await refreshPendingPayments();
      toast.success('Honorario eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar honorario:', error);
      toast.error('Error al eliminar honorario');
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
            <div className="relative overflow-hidden bg-white/95 dark:bg-elegant-900/95 rounded-xl p-3 md:p-4 border border-elegant-200/80 dark:border-elegant-800/80 transition-all duration-200 transition-spring hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer group backdrop-blur-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-[10px] md:text-xs uppercase tracking-wide font-bold text-elegant-600 dark:text-elegant-400 mb-1 truncate">Total Ingresos</div>
                <div className="text-xl md:text-3xl font-bold font-mono text-black dark:text-white mb-0.5 md:mb-1 transition-all duration-300 group-hover:scale-105">
                  <AnimatedCounter end={totalRevenue} prefix="$" duration={1200} />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-300 group-hover:scale-125" />
            </div>

            <div className="relative overflow-hidden bg-white/95 dark:bg-elegant-900/95 rounded-xl p-3 md:p-4 border border-elegant-200/80 dark:border-elegant-800/80 transition-all duration-200 transition-spring hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer group backdrop-blur-lg" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-[10px] md:text-xs uppercase tracking-wide font-bold text-elegant-600 dark:text-elegant-400 mb-1 truncate">Pendientes</div>
                <div className="text-xl md:text-3xl font-bold font-mono text-black dark:text-white mb-0.5 md:mb-1 transition-all duration-300 group-hover:scale-105">
                  <AnimatedCounter end={pendingSummary.amount} prefix="$" duration={1200} />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-300 group-hover:scale-125" />
            </div>

            <div className="relative overflow-hidden bg-white/95 dark:bg-elegant-900/95 rounded-xl p-3 md:p-4 border border-elegant-200/80 dark:border-elegant-800/80 transition-all duration-200 transition-spring hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer group backdrop-blur-lg" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-[10px] md:text-xs uppercase tracking-wide font-bold text-elegant-600 dark:text-elegant-400 mb-1 truncate">Cobros</div>
                <div className="text-xl md:text-3xl font-bold font-mono text-black dark:text-white mb-0.5 md:mb-1 transition-all duration-300 group-hover:scale-105">
                  <AnimatedCounter end={payments.length} duration={1000} />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-300 group-hover:scale-125" />
            </div>

            <div className="relative overflow-hidden bg-white/95 dark:bg-elegant-900/95 rounded-xl p-3 md:p-4 border border-elegant-200/80 dark:border-elegant-800/80 transition-all duration-200 transition-spring hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer group backdrop-blur-lg" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-[10px] md:text-xs uppercase tracking-wide font-bold text-elegant-600 dark:text-elegant-400 mb-1 truncate">Pendientes Cobro</div>
                <div className="text-xl md:text-3xl font-bold font-mono text-black dark:text-white mb-0.5 md:mb-1 transition-all duration-300 group-hover:scale-105">
                  <AnimatedCounter end={pendingSummary.count} duration={1000} />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-300 group-hover:scale-125" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card overflow-x-auto">
              <h2 className="font-semibold text-primary-dark dark:text-white mb-3">Últimos Cobros</h2>
              <table className="table-skin">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map(p => (
                    <tr key={p.id}>
                      <td>{p.patientName}</td>
                      <td>${formatCurrency(p.amount)}</td>
                      <td>{new Date(p.date).toLocaleDateString()}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            aria-label="Editar honorario"
                            title="Editar honorario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            aria-label="Eliminar honorario"
                            title="Eliminar honorario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-black dark:text-white">Sin registros</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="card overflow-x-auto">
              <h2 className="font-semibold text-primary-dark dark:text-white mb-4">Pendientes</h2>
              <table className="table-skin">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.slice(0, 10).map(p => (
                    <tr key={p.id}>
                      <td>{p.patientName}</td>
                      <td>${formatCurrency(p.amount)}</td>
                      <td>{new Date(p.date).toLocaleDateString()}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            aria-label="Editar honorario"
                            title="Editar honorario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            aria-label="Eliminar honorario"
                            title="Eliminar honorario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pending.length === 0 && (
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
          open={!!editingPayment}
          onClose={() => { setEditingPayment(null); setEditAmount(''); }}
          title="Editar honorario"
          maxWidth="max-w-md"
        >
          {editingPayment && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-elegant-600 dark:text-elegant-300">{editingPayment.patientName}</p>
                <p className="text-xs text-elegant-500 dark:text-elegant-400">
                  Fecha: {new Date(editingPayment.date).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-elegant-600 dark:text-elegant-300">Monto</label>
                <input
                  type="number"
                  min={0}
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="Ingresar monto"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary text-sm px-4 py-2"
                  onClick={() => { setEditingPayment(null); setEditAmount(''); }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary text-sm px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleSaveEdit}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

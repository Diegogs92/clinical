'use client';

import { useMemo } from 'react';
import { usePatients } from '@/contexts/PatientsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { usePayments } from '@/contexts/PaymentsContext';
import { combineDateAndTime } from '@/lib/dateUtils';
import { formatCurrency } from '@/lib/formatCurrency';

interface Stat {
  label: string;
  value: string | number;
  numericValue?: number;
  isMonetary?: boolean;
  sub?: string;
  color?: string;
}

export default function StatsOverview() {
  const { patients } = usePatients();
  const { appointments } = useAppointments();
  const { payments, pendingPayments } = usePayments();

  // Memoizar fecha actual para evitar recalcular en cada render
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const currentMonth = useMemo(() => new Date().getMonth(), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Memoizar turnos de hoy
  const todayAppointments = useMemo(() =>
    appointments.filter(a => a.date.startsWith(today) && a.status !== 'cancelled'),
    [appointments, today]
  );

  // Memoizar ingresos del mes
  const monthlyIncome = useMemo(() => {
    // Calcular ingresos de pagos del mes
    const paymentsIncome = payments
      .filter(p => {
        const d = new Date(p.date);
        return (p.status === 'completed' || p.status === 'pending') &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // Calcular ingresos de señas del mes
    const depositsIncome = appointments
      .filter(a => {
        const d = new Date(a.date);
        return a.deposit && a.deposit > 0 &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear;
      })
      .reduce((sum, a) => sum + (a.deposit || 0), 0);

    return paymentsIncome + depositsIncome;
  }, [payments, appointments, currentMonth, currentYear]);

  // Memoizar mapa de pagos totales por turno
  const paymentTotalsByAppointment = useMemo(() => {
    const allPayments = [...payments, ...pendingPayments].reduce((acc, payment) => {
      acc.set(payment.id, payment);
      return acc;
    }, new Map<string, typeof payments[number]>());

    return Array.from(allPayments.values()).reduce((acc, payment) => {
      if (!payment.appointmentId) return acc;
      if (payment.status !== 'completed' && payment.status !== 'pending') return acc;
      const prev = acc.get(payment.appointmentId) || 0;
      acc.set(payment.appointmentId, prev + payment.amount);
      return acc;
    }, new Map<string, number>());
  }, [payments, pendingPayments]);

  // Memoizar resumen de pendientes de cobro
  const pendingSummary = useMemo(() =>
    appointments.reduce(
      (acc, appointment) => {
        if (!appointment.fee) return acc;
        if (appointment.status !== 'completed') return acc;
        const paid = paymentTotalsByAppointment.get(appointment.id) || 0;
        const deposit = appointment.deposit || 0;
        const remaining = Math.max(0, appointment.fee - deposit - paid);
        if (remaining > 0) {
          acc.amount += remaining;
          acc.count += 1;
        }
        return acc;
      },
      { amount: 0, count: 0 }
    ),
    [appointments, paymentTotalsByAppointment]
  );

  // Memoizar array de stats para evitar recrearlo en cada render
  const stats: Stat[] = useMemo(() => [
    {
      label: 'Pacientes',
      value: patients.length,
      numericValue: patients.length,
      sub: patients.length === 0 ? 'Sin registros' : `${patients.length} registrado${patients.length !== 1 ? 's' : ''}`,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Turnos Hoy',
      value: todayAppointments.length,
      numericValue: todayAppointments.length,
      sub: todayAppointments.length === 0 ? 'Sin turnos' : `${todayAppointments.length} turno${todayAppointments.length !== 1 ? 's' : ''}`,
      color: 'from-primary to-primary-light'
    },
    {
      label: 'Ingresos Mes',
      value: `$${formatCurrency(monthlyIncome)}`,
      numericValue: monthlyIncome,
      isMonetary: true,
      sub: '',
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Pendientes Cobro',
      value: `$${formatCurrency(pendingSummary.amount)}`,
      numericValue: pendingSummary.amount,
      isMonetary: true,
      sub: `${pendingSummary.count} pendiente${pendingSummary.count !== 1 ? 's' : ''}`,
      color: 'from-amber-500 to-amber-600'
    },
  ], [patients.length, todayAppointments.length, monthlyIncome, pendingSummary]);

  return (
    <div className="grid gap-2 md:gap-2.5 grid-cols-2 lg:grid-cols-4">
      {stats.map((s, index) => (
        <div
          key={s.label}
          className="relative overflow-hidden bg-white/95 dark:bg-elegant-900/95 rounded-xl p-2.5 md:p-3 border border-elegant-200/80 dark:border-elegant-800/80 transition-all duration-200 transition-spring hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer group backdrop-blur-lg"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

          <div className="relative z-10">
            <div className="text-[11px] md:text-xs uppercase tracking-wide font-bold text-elegant-600 dark:text-elegant-400 mb-0.5 truncate">
              {s.label}
            </div>
            <div className="text-lg md:text-2xl font-bold tabular-nums text-black dark:text-white mb-0.5">
              {s.numericValue !== undefined
                ? s.isMonetary
                  ? `$${formatCurrency(s.numericValue)}`
                  : s.numericValue
                : s.value}
            </div>
            {s.sub && (
              <div className="text-[11px] md:text-xs text-elegant-500 dark:text-elegant-400 font-medium truncate">
                {s.sub}
              </div>
            )}
          </div>

          <div className={`absolute -right-4 -bottom-4 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${s.color} rounded-full opacity-0 group-hover:opacity-20 transition-all duration-300 group-hover:scale-125`} />
        </div>
      ))}
    </div>
  );
}

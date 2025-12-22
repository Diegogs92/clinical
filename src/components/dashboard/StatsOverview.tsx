'use client';

import { usePatients } from '@/contexts/PatientsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { usePayments } from '@/contexts/PaymentsContext';
import { combineDateAndTime } from '@/lib/dateUtils';

interface Stat {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export default function StatsOverview() {
  const { patients } = usePatients();
  const { appointments } = useAppointments();
  const { payments, pendingPayments } = usePayments();

  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter(a => a.date.startsWith(today) && a.status !== 'cancelled');

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyIncome = payments
    .filter(p => {
      const d = new Date(p.date);
      return (p.status === 'completed' || p.status === 'pending') &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const allPayments = [...payments, ...pendingPayments].reduce((acc, payment) => {
    acc.set(payment.id, payment);
    return acc;
  }, new Map<string, typeof payments[number]>());

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
      if (appointment.status === 'cancelled' && paid === 0) return acc;
      const remaining = Math.max(0, appointment.fee - paid);
      if (remaining > 0) {
        acc.amount += remaining;
        acc.count += 1;
      }
      return acc;
    },
    { amount: 0, count: 0 }
  );

  const stats: Stat[] = [
    {
      label: 'Pacientes',
      value: patients.length,
      sub: patients.length === 0 ? 'Sin registros' : `${patients.length} registrado${patients.length !== 1 ? 's' : ''}`,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Turnos Hoy',
      value: todayAppointments.length,
      sub: todayAppointments.length === 0 ? 'Sin turnos' : `${todayAppointments.length} turno${todayAppointments.length !== 1 ? 's' : ''}`,
      color: 'from-primary to-primary-light'
    },
    {
      label: 'Ingresos Mes',
      value: `$${monthlyIncome.toLocaleString()}`,
      sub: `${payments.filter(p => (p.status === 'completed' || p.status === 'pending') && new Date(p.date).getMonth() === currentMonth && new Date(p.date).getFullYear() === currentYear).length} pago(s)`,
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Pendientes Cobro',
      value: `$${pendingSummary.amount.toLocaleString()}`,
      sub: `${pendingSummary.count} pendiente${pendingSummary.count !== 1 ? 's' : ''}`,
      color: 'from-amber-500 to-amber-600'
    },
  ];

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map(s => (
        <div
          key={s.label}
          className="relative overflow-hidden bg-white/95 dark:bg-elegant-900/95 rounded-2xl p-4 md:p-6 border border-elegant-200/80 dark:border-elegant-800/80 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] md:hover:scale-105 hover:-translate-y-0.5 md:hover:-translate-y-1 cursor-pointer group backdrop-blur-lg"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

          <div className="relative z-10">
            <div className="text-[10px] md:text-xs uppercase tracking-wide font-bold text-elegant-600 dark:text-elegant-400 mb-1.5 md:mb-2 truncate">
              {s.label}
            </div>
            <div className="text-2xl md:text-4xl font-bold text-black dark:text-white mb-1 md:mb-2 transition-all duration-300 group-hover:scale-110">
              {s.value}
            </div>
            {s.sub && (
              <div className="text-[10px] md:text-xs text-elegant-500 dark:text-elegant-400 font-medium truncate">
                {s.sub}
              </div>
            )}
          </div>

          <div className={`absolute -right-4 -bottom-4 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br ${s.color} rounded-full opacity-0 group-hover:opacity-20 transition-all duration-300 group-hover:scale-150`} />
        </div>
      ))}
    </div>
  );
}

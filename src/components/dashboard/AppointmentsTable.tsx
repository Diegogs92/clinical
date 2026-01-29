
import { memo, useMemo } from 'react';
import { Appointment, Payment } from '@/types';
import { Edit, Trash2, CalendarX } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

import { translateAppointmentStatus } from '@/lib/translations';
import { formatCurrency } from '@/lib/formatCurrency';
import ECGLoader from '@/components/ui/ECGLoader';

interface AppointmentsTableProps {
    appointments: Appointment[];
    loading: boolean;
    user: any;
    userProfile: any;
    professionals: any[];
    payments: Payment[];
    pendingPayments: Payment[];
    onEdit: (a: Appointment) => void;
    onDelete: (a: Appointment) => void;
    onCancel: (a: Appointment) => void;
    onOpenPayment: (a: Appointment) => void;
    canModifyAppointment: (a: Appointment, u: any, p: any) => boolean;
    canViewFees: (a: Appointment) => boolean;
}

// Helper para calcular estado de pagos
const getPaymentState = (appointment: Appointment, payments: Payment[], pendingPayments: Payment[]) => {
    if (!appointment.fee) {
        return { color: 'text-elegant-900 dark:text-white', status: 'none', remainingAmount: 0, isDue: false };
    }

    const deposit = appointment.deposit || 0;
    const completed = payments
        .filter(p => p.appointmentId === appointment.id && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

    const pending = (() => {
        const seen = new Set<string>();
        let sum = 0;
        for (const payment of [...payments, ...pendingPayments]) {
            if (payment.appointmentId !== appointment.id || payment.status !== 'pending') continue;
            if (seen.has(payment.id)) continue;
            seen.add(payment.id);
            sum += payment.amount;
        }
        return sum;
    })();

    const totalPaid = deposit + completed + pending;
    const remainingAmount = Math.max(0, (appointment.fee || 0) - totalPaid);
    const isAttended = appointment.status === 'completed';

    if (totalPaid >= (appointment.fee || 0)) {
        return { color: 'text-green-600 dark:text-green-400', status: 'paid', remainingAmount: 0, isDue: false };
    }
    if (!isAttended) {
        return { color: 'text-elegant-900 dark:text-white', status: 'none', remainingAmount, isDue: false };
    }
    if (totalPaid > 0) {
        return { color: 'text-amber-500', status: 'partial', remainingAmount, isDue: true };
    }
    return { color: 'text-red-500', status: 'unpaid', remainingAmount: appointment.fee, isDue: true };
};

const AppointmentTableRow = memo(function AppointmentTableRow({
    appointment,
    professional,
    paymentState,
    canSeeFees,
    canEdit,
    canDelete,
    payments,
    onEdit,
    onDelete,
    onCancel,
    onOpenPayment,
    canRegisterPayments
}: {
    appointment: Appointment;
    professional: any;
    paymentState: any;
    canSeeFees: boolean;
    canEdit: boolean;
    canDelete: boolean;
    payments: any[];
    onEdit: (a: Appointment) => void;
    onDelete: (a: Appointment) => void;
    onCancel: (a: Appointment) => void;
    onOpenPayment: (a: Appointment) => void;
    canRegisterPayments: boolean;
}) {
    const fecha = useMemo(() => new Date(appointment.date).toLocaleDateString(), [appointment.date]);

    const getPaymentStatusLabel = useMemo(() => {
        if (!appointment.fee) return 'Sin honorarios';

        const deposit = appointment.deposit || 0;
        const completed = payments
            .filter(p => p.appointmentId === appointment.id && p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);
        const totalPaid = deposit + completed;
        const remaining = paymentState.remainingAmount;

        if (paymentState.status === 'paid') {
            return `Pagado: $${formatCurrency(totalPaid)}`;
        }

        if (!paymentState.isDue && paymentState.status !== 'paid') {
            return totalPaid > 0 ? `Pagado: $${formatCurrency(totalPaid)}` : 'Sin deuda';
        }

        if (totalPaid > 0 && remaining > 0) {
            return `Pagado: $${formatCurrency(totalPaid)} | Falta: $${formatCurrency(remaining)}`;
        }

        return `Pendiente: $${formatCurrency(remaining)}`;
    }, [appointment.fee, appointment.deposit, appointment.id, payments, paymentState]);

    return (
        <tr>
            <td>
                <div className="flex items-center gap-1">
                    {canEdit && (
                        <button
                            onClick={() => onEdit(appointment)}
                            className="icon-btn-primary"
                            aria-label="Editar turno"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => onDelete(appointment)}
                            className="icon-btn-danger"
                            aria-label="Eliminar turno"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </td>
            <td className="font-medium">{fecha}</td>
            <td>{appointment.startTime} - {appointment.endTime}</td>
            <td>{appointment.patientName || appointment.title || 'Evento'}</td>
            <td>
                {professional ? (
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        {professional.displayName || professional.email}
                    </span>
                ) : (
                    <span className="text-gray-400 text-xs">-</span>
                )}
            </td>
            <td>
                {canSeeFees && appointment.fee ? (
                    <span className="font-semibold text-elegant-900 dark:text-white">
                        ${formatCurrency(appointment.fee)}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
            <td>
                {canEdit ? (
                    <button
                        onClick={() => onCancel(appointment)}
                        disabled={appointment.status === 'cancelled'}
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100 ${appointment.status === 'completed' ? 'bg-green-100/80 text-green-800 dark:bg-green-900/60 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800/60' :
                            appointment.status === 'cancelled' ? 'bg-red-100/80 text-red-800 dark:bg-red-900/60 dark:text-red-200' :
                                appointment.status === 'no-show' ? 'bg-gray-100/80 text-gray-800 dark:bg-gray-700/60 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600/60' :
                                    'bg-blue-100/80 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/60'
                            }`}
                    >
                        {translateAppointmentStatus(appointment.status)}
                    </button>
                ) : (
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${appointment.status === 'completed' ? 'bg-green-100/80 text-green-800 dark:bg-green-900/60 dark:text-green-200' :
                        appointment.status === 'cancelled' ? 'bg-red-100/80 text-red-800 dark:bg-red-900/60 dark:text-red-200' :
                            appointment.status === 'no-show' ? 'bg-gray-100/80 text-gray-800 dark:bg-gray-700/60 dark:text-gray-200' :
                                'bg-blue-100/80 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                        }`}>
                        {translateAppointmentStatus(appointment.status)}
                    </span>
                )}
            </td>
            <td>
                {canSeeFees && appointment.fee && canRegisterPayments ? (
                    <button
                        onClick={() => onOpenPayment(appointment)}
                        disabled={paymentState.status === 'paid'}
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100 ${!paymentState.isDue && paymentState.status !== 'paid'
                            ? 'bg-elegant-100/80 text-elegant-700 dark:bg-elegant-800/60 dark:text-elegant-300'
                            : paymentState.status === 'paid'
                                ? 'bg-green-100/80 text-green-800 dark:bg-green-900/60 dark:text-green-200'
                                : (appointment.deposit || 0) > 0 && paymentState.remainingAmount > 0
                                    ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/60'
                                    : paymentState.status === 'partial'
                                        ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/60'
                                        : 'bg-red-100/80 text-red-800 dark:bg-red-900/60 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/60'
                            }`}
                    >
                        {getPaymentStatusLabel}
                    </button>
                ) : canSeeFees && appointment.fee ? (
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${!paymentState.isDue && paymentState.status !== 'paid'
                        ? 'bg-elegant-100/80 text-elegant-700 dark:bg-elegant-800/60 dark:text-elegant-300'
                        : paymentState.status === 'paid'
                            ? 'bg-green-100/80 text-green-800 dark:bg-green-900/60 dark:text-green-200'
                            : (appointment.deposit || 0) > 0 && paymentState.remainingAmount > 0
                                ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                : paymentState.status === 'partial'
                                    ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                    : 'bg-red-100/80 text-red-800 dark:bg-red-900/60 dark:text-red-200'
                        }`}>
                        {getPaymentStatusLabel}
                    </span>
                ) : (
                    <span className="text-gray-400 text-xs">-</span>
                )}
            </td>
        </tr>
    );
});

export default function AppointmentsTable({
    appointments,
    loading,
    user,
    userProfile,
    professionals,
    payments,
    pendingPayments,
    onEdit,
    onDelete,
    onCancel,
    onOpenPayment,
    canModifyAppointment,
    canViewFees
}: AppointmentsTableProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-primary dark:text-white">
                <ECGLoader />
                <p className="mt-4 text-sm">Cargando turnos...</p>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="bg-white dark:bg-elegant-900 rounded-xl border border-elegant-200/60 dark:border-elegant-800/60">
                <EmptyState
                    icon={CalendarX}
                    title="No hay turnos"
                    description="No se encontraron turnos para el periodo o filtros seleccionados."
                />
            </div>
        );
    }


    return (
        <div className="overflow-x-auto rounded-xl border border-elegant-200/60 dark:border-elegant-800/60">
            <table className="table-skin">
                <thead>
                    <tr>
                        <th className="w-20">Acciones</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Paciente / Título</th>
                        <th>Profesional</th>
                        <th>Honorarios</th>
                        <th>Estado</th>
                        <th>Pago</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-elegant-100 dark:divide-elegant-800">
                    {appointments.map((appointment) => {
                        const professional = professionals.find(p => p.uid === appointment.userId);
                        const paymentState = getPaymentState(appointment, payments, pendingPayments);
                        const hasPermission = canModifyAppointment(appointment, user, userProfile);
                        const canSee = canViewFees(appointment);

                        // Check if can edit/delete based on role and ownership
                        // Admin can do everything. Owner usage is common.
                        // Simplified logic passed from parent:
                        const canEdit = hasPermission;
                        const canDelete = hasPermission;

                        return (
                            <AppointmentTableRow
                                key={appointment.id}
                                appointment={appointment}
                                professional={professional}
                                paymentState={paymentState}
                                canSeeFees={canSee}
                                canEdit={canEdit}
                                canDelete={canDelete}
                                payments={payments}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onCancel={onCancel}
                                onOpenPayment={onOpenPayment}
                                canRegisterPayments={true} // Se asume que si puede ver pagos, puede registrar (logica mejorable)
                            />
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

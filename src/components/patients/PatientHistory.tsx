"use client";

import { useMemo, useState } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { usePatients } from '@/contexts/PatientsContext';
import { Payment } from '@/types';
import { formatCurrency } from '@/lib/formatCurrency';
import { combineDateAndTime } from '@/lib/dateUtils';
import { translateAppointmentType } from '@/lib/translations';
import { Calendar, Edit, CheckCircle, XCircle, Clock, DollarSign, FileText, ArrowUpDown } from 'lucide-react';

interface PatientHistoryProps {
    patientId: string;
    payments: Payment[];
}

export default function PatientHistory({ patientId, payments }: PatientHistoryProps) {
    const { appointments } = useAppointments();
    const { patients } = usePatients();
    const [historyOrder, setHistoryOrder] = useState<'asc' | 'desc'>('desc');

    const patient = patients.find(p => p.id === patientId);

    const events = useMemo(() => {
        if (!patient) return [];

        const patientAppts = appointments
            .filter(a => a.patientId === patientId)
            .sort((a, b) => {
                const dateCompare = b.date.localeCompare(a.date);
                if (dateCompare !== 0) return dateCompare;
                return b.startTime.localeCompare(a.startTime);
            });

        const patientPayments = payments
            .filter(p => p.patientId === patientId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Crear timeline de eventos
        const timeline: Array<{
            date: string;
            time?: string;
            type: 'appointment' | 'payment' | 'status_change';
            icon: any;
            color: string;
            title: string;
            description: string;
            amount?: number;
            notes?: string;
            sortKey: number;
        }> = [];

        const getEventDateTime = (value?: string, fallbackDate?: string, fallbackTime?: string) => {
            if (value) {
                const parsed = new Date(value);
                if (!Number.isNaN(parsed.getTime())) {
                    return {
                        date: parsed.toISOString().split('T')[0],
                        time: parsed.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                    };
                }
            }
            return { date: fallbackDate || '', time: fallbackTime };
        };

        const getSortKey = (value?: string, fallbackDate?: string, fallbackTime?: string) => {
            if (value) {
                const parsed = new Date(value);
                if (!Number.isNaN(parsed.getTime())) {
                    return parsed.getTime();
                }
            }
            if (fallbackDate && fallbackTime) {
                const combined = combineDateAndTime(fallbackDate, fallbackTime);
                return combined.getTime();
            }
            if (fallbackDate) {
                const parsed = new Date(`${fallbackDate}T00:00:00`);
                return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
            }
            return 0;
        };

        // Agregar turnos
        patientAppts.forEach(appt => {
            const typeLabel = translateAppointmentType(appt.type) || 'Consulta';
            const createdEventTime = getEventDateTime(appt.createdAt, appt.date, appt.startTime);
            timeline.push({
                date: createdEventTime.date,
                time: createdEventTime.time,
                type: 'appointment',
                icon: Calendar,
                color: 'blue',
                title: 'Turno creado',
                description: `${typeLabel} - ${appt.startTime} a ${appt.endTime}`,
                amount: appt.fee,
                notes: appt.notes,
                sortKey: getSortKey(appt.createdAt, appt.date, appt.startTime),
            });

            if (appt.updatedAt && appt.updatedAt !== appt.createdAt) {
                const updatedEventTime = getEventDateTime(appt.updatedAt, appt.date, appt.endTime);
                timeline.push({
                    date: updatedEventTime.date,
                    time: updatedEventTime.time,
                    type: 'status_change',
                    icon: Edit,
                    color: 'amber',
                    title: 'Turno actualizado',
                    description: `${typeLabel} - ${appt.startTime} a ${appt.endTime}`,
                    sortKey: getSortKey(appt.updatedAt, appt.date, appt.endTime),
                });
            }

            if (appt.status === 'completed') {
                const statusEventTime = getEventDateTime(appt.updatedAt, appt.date, appt.endTime);
                timeline.push({
                    date: statusEventTime.date,
                    time: statusEventTime.time,
                    type: 'status_change',
                    icon: CheckCircle,
                    color: 'green',
                    title: 'Asistencia registrada',
                    description: 'Paciente presente',
                    sortKey: getSortKey(appt.updatedAt, appt.date, appt.endTime),
                });
            } else if (appt.status === 'no-show') {
                const statusEventTime = getEventDateTime(appt.updatedAt, appt.date, appt.endTime);
                timeline.push({
                    date: statusEventTime.date,
                    time: statusEventTime.time,
                    type: 'status_change',
                    icon: XCircle,
                    color: 'red',
                    title: 'Asistencia registrada',
                    description: 'Paciente ausente',
                    sortKey: getSortKey(appt.updatedAt, appt.date, appt.endTime),
                });
            } else if (appt.status === 'cancelled') {
                const statusEventTime = getEventDateTime(appt.updatedAt, appt.date, appt.endTime);
                timeline.push({
                    date: statusEventTime.date,
                    time: statusEventTime.time,
                    type: 'status_change',
                    icon: XCircle,
                    color: 'red',
                    title: 'Turno cancelado',
                    description: `${typeLabel} - ${appt.startTime} a ${appt.endTime}`,
                    sortKey: getSortKey(appt.updatedAt, appt.date, appt.endTime),
                });
            }

            if (appt.followUpDate) {
                const reminderEventTime = getEventDateTime(appt.followUpDate);
                const reason = appt.followUpReason ? `Motivo: ${appt.followUpReason}` : 'Recordatorio de seguimiento';
                timeline.push({
                    date: reminderEventTime.date,
                    time: reminderEventTime.time,
                    type: 'status_change',
                    icon: Clock,
                    color: 'purple',
                    title: 'Recordatorio programado',
                    description: reason,
                    sortKey: getSortKey(appt.followUpDate, reminderEventTime.date, reminderEventTime.time),
                });
            }

            // Si tiene seña, agregarla
            if (appt.deposit && appt.deposit > 0) {
                const depositEventTime = getEventDateTime(appt.date, appt.date, appt.startTime);
                timeline.push({
                    date: depositEventTime.date,
                    time: depositEventTime.time,
                    type: 'payment',
                    icon: DollarSign,
                    color: 'amber',
                    title: 'Seña pagada',
                    description: `Seña del turno del ${new Date(appt.date).toLocaleDateString('es-AR')}`,
                    amount: appt.deposit,
                    sortKey: getSortKey(appt.date, appt.date, appt.startTime),
                });
            }
        });

        if (patient?.panoramicUploadedAt) {
            const panoramicEventTime = getEventDateTime(patient.panoramicUploadedAt);
            timeline.push({
                date: panoramicEventTime.date,
                time: panoramicEventTime.time,
                type: 'status_change',
                icon: FileText,
                color: 'amber',
                title: 'Panorámica cargada',
                description: patient.panoramicName || 'Archivo cargado',
                sortKey: getSortKey(patient.panoramicUploadedAt),
            });
        }

        // Agregar pagos
        patientPayments.forEach(payment => {
            timeline.push({
                date: payment.date.split('T')[0],
                time: new Date(payment.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                type: 'payment',
                icon: payment.status === 'completed' ? CheckCircle : Clock,
                color: payment.status === 'completed' ? 'green' : 'yellow',
                title: payment.status === 'completed' ? 'Pago completado' : 'Pago parcial',
                description: payment.consultationType || 'Pago',
                amount: payment.amount,
                sortKey: new Date(payment.date).getTime(),
            });
        });

        return timeline.sort((a, b) => (
            historyOrder === 'asc' ? a.sortKey - b.sortKey : b.sortKey - a.sortKey
        ));
    }, [patient, patientId, appointments, payments, historyOrder]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Historial Clínico y Financiero</h3>
                <button
                    type="button"
                    onClick={() => setHistoryOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                >
                    <ArrowUpDown className="w-4 h-4" />
                    {historyOrder === 'asc' ? 'Más antiguos primero' : 'Más recientes primero'}
                </button>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-gray-500 dark:text-gray-400">No hay movimientos registrados para este paciente</p>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Fecha</th>
                                    <th className="px-4 py-3 font-semibold">Evento</th>
                                    <th className="px-4 py-3 font-semibold">Descripción</th>
                                    <th className="px-4 py-3 font-semibold text-right">Monto</th>
                                    <th className="px-4 py-3 font-semibold text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {events.map((event, index) => {
                                    const Icon = event.icon;
                                    const colorClasses: Record<string, string> = {
                                        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
                                        green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
                                        amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
                                        yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
                                        red: 'text-red-600 bg-red-50 dark:bg-red-900/20',
                                        purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
                                    };

                                    return (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {new Date(event.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {event.time}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-full ${colorClasses[event.color] || 'bg-gray-100 text-gray-600'}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {event.title}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={event.description + (event.notes ? `\nNotas: ${event.notes}` : '')}>
                                                {event.description}
                                                {event.notes && (
                                                    <div className="text-xs text-gray-500 italic mt-0.5 truncate">
                                                        Nota: {event.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {event.amount !== undefined ? (
                                                    <span className={`font-medium ${event.type === 'payment' ? 'text-green-600' : 'text-gray-900 dark:text-gray-100'}`}>
                                                        {event.type === 'payment' ? '+' : ''}${formatCurrency(event.amount)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${event.color === 'green' ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' :
                                                    event.color === 'red' ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' :
                                                        event.color === 'blue' ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' :
                                                            'border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {event.type === 'appointment' ? 'Programado' :
                                                        event.type === 'payment' ? 'Pago' :
                                                            'Registro'}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                        {events.map((event, index) => {
                            const Icon = event.icon;
                            const colorClasses: Record<string, string> = {
                                blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
                                green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
                                amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
                                yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
                                red: 'text-red-600 bg-red-50 dark:bg-red-900/20',
                                purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
                            };

                            return (
                                <div key={index} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${colorClasses[event.color] || 'bg-gray-100 text-gray-600'}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{event.title}</h4>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(event.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {event.time}
                                                </span>
                                            </div>
                                        </div>
                                        {event.amount !== undefined && (
                                            <span className={`font-semibold text-sm ${event.type === 'payment' ? 'text-green-600' : 'text-gray-900 dark:text-gray-100'}`}>
                                                {event.type === 'payment' ? '+' : ''}${formatCurrency(event.amount)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="pl-8 sm:pl-12">
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{event.description}</p>
                                        {event.notes && (
                                            <div className="mt-2 text-xs text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                                                Nota: {event.notes}
                                            </div>
                                        )}
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${event.color === 'green' ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' :
                                                event.color === 'red' ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' :
                                                    event.color === 'blue' ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' :
                                                        'border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                                }`}>
                                                {event.type === 'appointment' ? 'Programado' :
                                                    event.type === 'payment' ? 'Pago' :
                                                        'Registro'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

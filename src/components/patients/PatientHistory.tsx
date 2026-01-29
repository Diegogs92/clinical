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
            <div className="flex items-center justify-between rounded-lg border border-elegant-200/70 dark:border-elegant-800/70 bg-elegant-50/70 dark:bg-elegant-900/40 px-3 py-2">
                <div className="text-xs font-semibold text-elegant-600 dark:text-elegant-300">
                    Orden: {historyOrder === 'asc' ? 'menos recientes primero' : 'más recientes primero'}
                </div>
                <button
                    type="button"
                    onClick={() => setHistoryOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark"
                >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {historyOrder === 'asc' ? 'Ver más recientes' : 'Ver más antiguos'}
                </button>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No hay movimientos registrados para este paciente
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                    {/* Events */}
                    <div className="space-y-6">
                        {events.map((event, index) => {
                            const Icon = event.icon;
                            const colorClasses: Record<string, string> = {
                                blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                                green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                                amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                                yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
                                red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                                purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                            };

                            return (
                                <div key={index} className="relative flex gap-4 items-start">
                                    {/* Icon */}
                                    <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white dark:border-elegant-950 ${colorClasses[event.color]}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 bg-white dark:bg-elegant-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-800">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                                                {event.notes && (
                                                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
                                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notas:</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{event.notes}</p>
                                                    </div>
                                                )}
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                    {new Date(event.date).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    {event.time && ` • ${event.time}`}
                                                </p>
                                            </div>
                                            {event.amount !== undefined && (
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-primary dark:text-primary-light">
                                                        ${formatCurrency(event.amount)}
                                                    </p>
                                                </div>
                                            )}
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

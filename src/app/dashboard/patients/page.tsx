"use client"

import { useState, useMemo, useEffect, useCallback } from 'react';
import { usePatients } from '@/contexts/PatientsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { usePermissions } from '@/hooks/usePermissions';
import { listPayments } from '@/lib/payments';
import { Payment } from '@/types';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Search, UserPlus, FileText, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PatientPanoramicControls from '@/components/patients/PatientPanoramicControls';
import { formatCurrency } from '@/lib/formatCurrency';
import { differenceInYears, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PatientsPage() {
    const { patients, loading: patientsLoading } = usePatients();
    const { user } = useAuth();
    const { appointments } = useAppointments();
    const { canViewAllPayments } = usePermissions();
    const [search, setSearch] = useState('');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const router = useRouter();

    // Load payments
    useEffect(() => {
        const fetchPayments = async () => {
            if (!user) return;
            setLoadingPayments(true);
            try {
                const data = await listPayments(user.uid, canViewAllPayments);
                setPayments(data);
            } catch (error) {
                console.error("Error loading payments", error);
            } finally {
                setLoadingPayments(false);
            }
        };
        fetchPayments();
    }, [user, canViewAllPayments]);

    // Calculate stats (Same logic as old PatientList)
    const patientStats = useMemo(() => {
        const stats = new Map<string, {
            appointmentsCount: number;
            debt: number;
            paid: number;
            pending: number;
        }>();

        const paymentsByAppointment = new Map<string, number>();
        payments.forEach(payment => {
            if (!payment.appointmentId) return;
            if (payment.status !== 'completed' && payment.status !== 'pending') return;
            const prev = paymentsByAppointment.get(payment.appointmentId) || 0;
            paymentsByAppointment.set(payment.appointmentId, prev + payment.amount);
        });

        patients.forEach(patient => {
            const patientAppointments = appointments.filter(a => a.patientId === patient.id);
            const completedAppointments = patientAppointments.filter(a => a.fee && a.status === 'completed');
            const scheduledAppointments = patientAppointments.filter(
                a => a.fee && (a.status === 'scheduled' || a.status === 'confirmed')
            );

            const debt = completedAppointments.reduce((sum, appt) => {
                const paid = paymentsByAppointment.get(appt.id) || 0;
                const deposit = appt.deposit || 0;
                if (appt.status === 'cancelled' && paid === 0 && deposit === 0) return sum;
                const totalPaid = paid + deposit;
                const remaining = Math.max(0, (appt.fee || 0) - totalPaid);
                return sum + remaining;
            }, 0);

            const paymentsTotal = payments
                .filter(p => p.patientId === patient.id && p.status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0);

            const depositsTotal = patientAppointments
                .filter(a => a.fee && a.fee > 0)
                .reduce((sum, appt) => sum + (appt.deposit || 0), 0);

            const paid = paymentsTotal + depositsTotal;

            const pending = scheduledAppointments.reduce((sum, appt) => {
                const paidForAppt = paymentsByAppointment.get(appt.id) || 0;
                const deposit = appt.deposit || 0;
                const remaining = Math.max(0, (appt.fee || 0) - deposit - paidForAppt);
                return sum + remaining;
            }, 0);

            stats.set(patient.id, {
                appointmentsCount: patientAppointments.length,
                debt,
                paid,
                pending
            });
        });

        return stats;
    }, [patients, appointments, payments]);

    const filteredPatients = patients.filter(p => {
        const term = search.toLowerCase();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return fullName.includes(term) ||
            p.email?.toLowerCase().includes(term) ||
            p.dni.includes(term);
    });

    // Helper function to get formatted birthdate and next birthday
    const getBirthdateInfo = (birthDate?: string) => {
        if (!birthDate) return { age: '-', nextBirthday: '-' };
        try {
            const birth = parseISO(birthDate);
            const today = new Date();
            const age = differenceInYears(today, birth);
            const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
            if (nextBirthday < today) {
                nextBirthday.setFullYear(today.getFullYear() + 1);
            }
            return {
                age: `${age} años`,
                nextBirthday: format(nextBirthday, 'dd MMM', { locale: es })
            };
        } catch (e) {
            return { age: '-', nextBirthday: '-' };
        }
    };

    const loading = patientsLoading || loadingPayments;

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pacientes</h1>
                            <p className="text-gray-500 dark:text-gray-400">Gestiona las historias clínicas y odontogramas</p>
                        </div>
                        <button className="btn-primary flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Nuevo Paciente
                        </button>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, email o DNI..."
                                    className="pl-9 w-full md:w-[300px] h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium w-40">Adjuntar Panorámica</th>
                                            <th className="px-4 py-3 font-medium">Paciente</th>
                                            <th className="px-4 py-3 font-medium">DNI</th>
                                            <th className="px-4 py-3 font-medium">Edad</th>
                                            <th className="px-4 py-3 font-medium">Teléfono</th>
                                            <th className="px-4 py-3 font-medium text-center">Turnos</th>
                                            <th className="px-4 py-3 font-medium text-center">Pagado</th>
                                            <th className="px-4 py-3 font-medium text-center">Pendiente</th>
                                            <th className="px-4 py-3 font-medium text-center">Deuda</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                                    Cargando pacientes...
                                                </td>
                                            </tr>
                                        ) : filteredPatients.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                                    No se encontraron pacientes.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPatients.map((patient) => {
                                                const stats = patientStats.get(patient.id) || { appointmentsCount: 0, debt: 0, paid: 0, pending: 0 };
                                                const { age } = getBirthdateInfo(patient.birthDate);

                                                return (
                                                    <tr
                                                        key={patient.id}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                                        onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                                                    >
                                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                            <PatientPanoramicControls
                                                                patientId={patient.id}
                                                                panoramicUrl={patient.panoramicUrl}
                                                                panoramicName={patient.panoramicName}
                                                                compact
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                            {patient.firstName} {patient.lastName}
                                                            <div className="text-xs text-gray-500 font-normal">{patient.email}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500">{patient.dni}</td>
                                                        <td className="px-4 py-3 text-gray-500">{age}</td>
                                                        <td className="px-4 py-3 text-gray-500 text-xs">{patient.phone}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                                {stats.appointmentsCount}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-green-600 font-medium text-xs">
                                                            {stats.paid > 0 ? `$${formatCurrency(stats.paid)}` : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-amber-600 font-medium text-xs">
                                                            {stats.pending > 0 ? `$${formatCurrency(stats.pending)}` : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-red-600 font-medium text-xs">
                                                            {stats.debt > 0 ? `$${formatCurrency(stats.debt)}` : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

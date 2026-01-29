import { useMemo } from 'react';
import { Appointment, Payment, Patient } from '@/types';
import { isSameMonth, parseISO } from 'date-fns';

interface UseDashboardStatsProps {
    appointments: Appointment[];
    payments: Payment[];
    patients: Patient[];
    currentDate?: Date;
}

export function useDashboardStats({
    appointments,
    payments,
    patients,
    currentDate = new Date()
}: UseDashboardStatsProps) {
    return useMemo(() => {
        // 1. Monthly Revenue
        const monthlyRevenue = payments
            .filter(p => {
                if (p.status !== 'completed') return false;
                try {
                    const paymentDate = parseISO(p.date as string); // Assuming string ISO
                    return isSameMonth(paymentDate, currentDate);
                } catch (e) {
                    return false;
                }
            })
            .reduce((sum, p) => sum + p.amount, 0);

        // 2. Monthly Appointments
        const monthlyAppointments = appointments.filter(a => {
            try {
                const appointmentDate = parseISO(a.date);
                return isSameMonth(appointmentDate, currentDate);
            } catch (e) {
                return false;
            }
        });

        const totalAppointments = monthlyAppointments.length;

        // 3. New Patients (This month)
        const newPatients = patients.filter(p => {
            try {
                const createdAt = parseISO(p.createdAt);
                return isSameMonth(createdAt, currentDate);
            } catch (e) {
                return false;
            }
        }).length;

        // 4. Growth Calculation (Mocked for now or simple comparison if we had prev month data)
        // For now returning static growth to avoid complexity without historical data store
        const revenueGrowth = 0;
        const patientsGrowth = 0;

        return {
            monthlyRevenue,
            totalAppointments,
            newPatients,
            revenueGrowth,
            patientsGrowth
        };
    }, [appointments, payments, patients, currentDate]);
}

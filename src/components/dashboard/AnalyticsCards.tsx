import { CreditCard, Calendar, Users, Activity } from 'lucide-react';
import { StatCard } from './StatCard';
import { formatCurrency } from '@/lib/formatCurrency';

interface AnalyticsCardsProps {
    stats: {
        monthlyRevenue: number;
        totalAppointments: number;
        newPatients: number;
        revenueGrowth: number;
        patientsGrowth: number;
    };
}

export function AnalyticsCards({ stats }: AnalyticsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Ingresos Mes"
                value={`$${formatCurrency(stats.monthlyRevenue)}`}
                icon={CreditCard}
                description="Ingresos registrados este mes"
                trend={{
                    value: stats.revenueGrowth,
                    label: "vs mes anterior",
                    positive: stats.revenueGrowth >= 0
                }}
            />
            <StatCard
                title="Turnos Totales"
                value={stats.totalAppointments}
                icon={Calendar}
                description="Turnos este mes"
            />
            <StatCard
                title="Nuevos Pacientes"
                value={stats.newPatients}
                icon={Users}
                description="Pacientes registrados este mes"
                trend={{
                    value: stats.patientsGrowth,
                    label: "vs mes anterior",
                    positive: stats.patientsGrowth >= 0
                }}
            />
            <StatCard
                title="Tasa Mensual"
                value="+2.5"
                icon={Activity}
                description="Promedio turnos/día"
            />
        </div>
    );
}

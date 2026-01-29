"use client"

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Appointment } from '@/types';
import { translateAppointmentStatus } from '@/lib/translations';

interface StatusDistributionChartProps {
    appointments: Appointment[];
}

const COLORS = ['#0ea5e9', '#22c55e', '#ef4444', '#f59e0b']; // Sky, Green, Red, Amber

export function StatusDistributionChart({ appointments }: StatusDistributionChartProps) {
    const data = useMemo(() => {
        const counts = appointments.reduce((acc, curr) => {
            const status = curr.status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([key, value]) => ({
            name: translateAppointmentStatus(key),
            value: value,
            originalStatus: key
        })).sort((a, b) => b.value - a.value);
    }, [appointments]);

    return (
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>Estado de Turnos</CardTitle>
                <CardDescription>Distribución general de estados</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

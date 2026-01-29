"use client"

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Payment } from '@/types';
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface RevenueChartProps {
    payments: Payment[];
}

export function RevenueChart({ payments }: RevenueChartProps) {
    const data = useMemo(() => {
        const today = new Date();
        const last6Months = Array.from({ length: 6 }).map((_, i) => {
            return subMonths(today, 5 - i); // From 5 months ago to today
        });

        return last6Months.map(date => {
            const start = startOfMonth(date);
            const end = endOfMonth(date);
            const monthName = format(date, 'MMM', { locale: es });

            const total = payments
                .filter(p => p.status === 'completed')
                .filter(p => {
                    try {
                        const pDate = parseISO(p.date as string);
                        return isWithinInterval(pDate, { start, end });
                    } catch (e) {
                        return false;
                    }
                })
                .reduce((sum, p) => sum + p.amount, 0);

            return {
                name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                total: total
            };
        });
    }, [payments]);

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Ingresos</CardTitle>
                <CardDescription>Resumen de ingresos de los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar
                            dataKey="total"
                            fill="currentColor"
                            radius={[4, 4, 0, 0]}
                            className="fill-primary"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

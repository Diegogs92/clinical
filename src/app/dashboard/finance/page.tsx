"use client"

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useExpenses } from '@/hooks/useExpenses';
import { usePayments } from '@/contexts/PaymentsContext';
import { ExpensesTable } from '@/components/finance/ExpensesTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming this exists or using native
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { ExpenseCategory } from '@/types/finance';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function FinancePage() {
    const { expenses, addExpense, deleteExpense, stats: expenseStats } = useExpenses();
    const { payments } = usePayments();

    // Calculate total revenue from payments (completed only)
    const totalRevenue = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

    const netIncome = totalRevenue - expenseStats.totalExpenses;

    // Form state
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'insumos' as ExpenseCategory,
        isRecurring: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || !formData.amount) return;

        await addExpense({
            description: formData.description,
            amount: Number(formData.amount),
            category: formData.category,
            isRecurring: formData.isRecurring,
            date: new Date().toISOString()
        });

        setFormData({ description: '', amount: '', category: 'insumos', isRecurring: false });
        setOpen(false);
    };

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finanzas</h1>
                            <p className="text-gray-500">Balance general y gestión de gastos</p>
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Registrar Gasto
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nuevo Gasto</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Descripción</label>
                                        <input
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            placeholder="Ej: Insumos descartables"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Monto</label>
                                            <input
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                type="number"
                                                placeholder="0.00"
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Categoría</label>
                                            <select
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                                            >
                                                <option value="insumos">Insumos</option>
                                                <option value="laboratorio">Laboratorio</option>
                                                <option value="alquiler">Alquiler</option>
                                                <option value="servicios">Servicios</option>
                                                <option value="personal">Personal</option>
                                                <option value="mantenimiento">Mantenimiento</option>
                                                <option value="impuestos">Impuestos</option>
                                                <option value="otros">Otros</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full">Guardar Gasto</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    ${formatCurrency(totalRevenue)}
                                </div>
                                <p className="text-xs text-muted-foreground">Histórico acumulado</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    ${formatCurrency(expenseStats.totalExpenses)}
                                </div>
                                <p className="text-xs text-muted-foreground">Gastos registrados</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
                                <DollarSign className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    ${formatCurrency(netIncome)}
                                </div>
                                <p className="text-xs text-muted-foreground">Rentabilidad actual</p>
                            </CardContent>
                        </Card>
                    </div>

                    <ExpensesTable expenses={expenses} onDelete={deleteExpense} />
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

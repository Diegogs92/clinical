"use client"

import { Expense, ExpenseCategory } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatCurrency';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface ExpensesTableProps {
    expenses: Expense[];
    onDelete: (id: string) => void;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    insumos: 'Insumos',
    laboratorio: 'Laboratorio',
    alquiler: 'Alquiler',
    servicios: 'Servicios',
    personal: 'Personal',
    otros: 'Otros',
    mantenimiento: 'Mantenimiento',
    impuestos: 'Impuestos'
};

export function ExpensesTable({ expenses, onDelete }: ExpensesTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Historial de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Descripción</th>
                                    <th className="px-6 py-3">Categoría</th>
                                    <th className="px-6 py-3 text-right">Monto</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                            No hay gastos registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map((expense) => (
                                        <tr key={expense.id} className="bg-white dark:bg-elegant-900">
                                            <td className="px-6 py-4">
                                                {format(new Date(expense.date), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {expense.description}
                                                {expense.isRecurring && (
                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                        Recurrente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800">
                                                    {CATEGORY_LABELS[expense.category]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-red-600 dark:text-red-400">
                                                - ${formatCurrency(expense.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => onDelete(expense.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
                        {expenses.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No hay gastos registrados.
                            </div>
                        ) : (
                            expenses.map((expense) => (
                                <div key={expense.id} className="bg-white dark:bg-elegant-900 border border-gray-100 dark:border-gray-800 rounded-lg p-3 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                {expense.description}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {format(new Date(expense.date), 'dd/MM/yyyy')}
                                            </div>
                                        </div>
                                        <span className="font-semibold text-red-600 dark:text-red-400 text-sm">
                                            - ${formatCurrency(expense.amount)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                {CATEGORY_LABELS[expense.category]}
                                            </span>
                                            {expense.isRecurring && (
                                                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-100">
                                                    Recurrente
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onDelete(expense.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

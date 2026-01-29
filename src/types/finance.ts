export type ExpenseCategory = 'insumos' | 'laboratorio' | 'alquiler' | 'servicios' | 'personal' | 'otros' | 'mantenimiento' | 'impuestos';

export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: ExpenseCategory;
    date: string; // ISO Date
    isRecurring: boolean;
    recurrence?: 'monthly' | 'yearly';
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface FinanceSummary {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    expensesByCategory: Record<ExpenseCategory, number>;
}

import { useState, useMemo, useEffect } from 'react';
import { Expense, ExpenseCategory, FinanceSummary } from '@/types/finance';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

// Mock data for initial dev
const MOCK_EXPENSES: Expense[] = [
    {
        id: '1',
        description: 'Alquiler Consultorio',
        amount: 50000,
        category: 'alquiler',
        date: new Date().toISOString(),
        isRecurring: true,
        recurrence: 'monthly',
        userId: 'demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        description: 'Compra de Insumos (Guantes, Gasas)',
        amount: 15000,
        category: 'insumos',
        date: new Date().toISOString(),
        isRecurring: false,
        userId: 'demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

export function useExpenses() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    // Load from localStorage or Mock
    useEffect(() => {
        const load = () => {
            setLoading(true);
            try {
                const stored = localStorage.getItem('dentify_expenses');
                if (stored) {
                    setExpenses(JSON.parse(stored));
                } else {
                    setExpenses(MOCK_EXPENSES);
                }
            } catch (e) {
                console.error("Failed to load expenses", e);
                setExpenses(MOCK_EXPENSES);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const saveExpenses = (newExpenses: Expense[]) => {
        localStorage.setItem('dentify_expenses', JSON.stringify(newExpenses));
        setExpenses(newExpenses);
    };

    const addExpense = async (data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;
        const newExpense: Expense = {
            ...data,
            id: uuidv4(),
            userId: user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        saveExpenses([newExpense, ...expenses]);
        return newExpense;
    };

    const deleteExpense = async (id: string) => {
        const filtered = expenses.filter(e => e.id !== id);
        saveExpenses(filtered);
    };

    const stats: FinanceSummary = useMemo(() => {
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        // This would ideally come from PaymentsContext, but for now we focus on expenses part
        // We will accept revenue as a prop in the UI component or fetch it here if we import the context
        const totalRevenue = 0;

        const expensesByCategory = expenses.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {} as Record<ExpenseCategory, number>);

        return {
            totalRevenue, // Placeholder, will update in composition
            totalExpenses,
            netIncome: totalRevenue - totalExpenses,
            expensesByCategory
        };
    }, [expenses]);

    return {
        expenses,
        loading,
        addExpense,
        deleteExpense,
        stats
    };
}

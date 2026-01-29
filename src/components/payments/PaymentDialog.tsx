
import Modal from '@/components/ui/Modal';
import { Appointment } from '@/types';
import { formatCurrency } from '@/lib/formatCurrency';
import { useState } from 'react';

interface PaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: string, mode: 'total' | 'partial') => Promise<void>;
    appointment?: Appointment;
    initialAmount: string;
    initialMode: 'total' | 'partial';
    isSubmitting: boolean;
    onAmountChange: (amount: string) => void;
    onModeChange: (mode: 'total' | 'partial') => void;
    remainingAmount: number;
}

export default function PaymentDialog({
    isOpen,
    onClose,
    onSubmit,
    appointment,
    initialAmount,
    initialMode,
    isSubmitting,
    onAmountChange,
    onModeChange,
    remainingAmount
}: PaymentDialogProps) {
    const [amount, setAmount] = useState(initialAmount);
    const [mode, setMode] = useState(initialMode);

    // Sync internal state when external props change (could be improved)
    // For now, relies on parent controlling state mostly

    const handleSubmit = () => {
        onSubmit(amount, mode);
    };

    if (!appointment) return null;

    return (
        <Modal
            open={isOpen}

            onClose={onClose}
            title="Registrar Pago"
        >
            <div className="space-y-4">
                <div className="p-4 bg-elegant-50 dark:bg-elegant-800/50 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-elegant-600 dark:text-elegant-400">Paciente:</span>
                        <span className="font-medium text-elegant-900 dark:text-white">{appointment.patientName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-elegant-600 dark:text-elegant-400">Honorarios Totales:</span>
                        <span className="font-medium text-elegant-900 dark:text-white">${formatCurrency(appointment.fee || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-elegant-600 dark:text-elegant-400">Restante a Pagar:</span>
                        <span className="font-bold text-primary dark:text-primary-light">${formatCurrency(remainingAmount)}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="label-text">Tipo de Pago</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                onModeChange('total');
                                onAmountChange(remainingAmount.toString());
                            }}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${initialMode === 'total'
                                ? 'bg-primary/10 border-primary text-primary dark:text-white'
                                : 'bg-white dark:bg-elegant-900 border-elegant-200 dark:border-elegant-800 text-elegant-600 dark:text-elegant-400 hover:border-primary/50'
                                }`}
                        >
                            <span className="font-semibold">Total Restante</span>
                            <span className="text-sm opacity-80">${formatCurrency(remainingAmount)}</span>
                        </button>
                        <button
                            onClick={() => onModeChange('partial')}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${initialMode === 'partial'
                                ? 'bg-primary/10 border-primary text-primary dark:text-white'
                                : 'bg-white dark:bg-elegant-900 border-elegant-200 dark:border-elegant-800 text-elegant-600 dark:text-elegant-400 hover:border-primary/50'
                                }`}
                        >
                            <span className="font-semibold">Pago Parcial</span>
                            <span className="text-sm opacity-80">Ingresar monto</span>
                        </button>
                    </div>
                </div>

                {initialMode === 'partial' && (
                    <div className="space-y-2 animate-fade-in-down">
                        <label className="label-text">Monto a pagar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-elegant-500">$</span>
                            <input
                                type="number"
                                value={initialAmount}
                                onChange={(e) => onAmountChange(e.target.value)}
                                className="input-field pl-8"
                                placeholder="0.00"
                                min="0"
                                max={remainingAmount}
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-elegant-500">
                            Ingresa el monto que el paciente está abonando el día de hoy.
                        </p>
                    </div>
                )}

                <div className="pt-2 flex gap-3">
                    <button
                        onClick={onClose}
                        className="btn-secondary flex-1"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSubmit(initialAmount, initialMode)}
                        disabled={isSubmitting || !initialAmount || Number(initialAmount) <= 0 || Number(initialAmount) > remainingAmount}
                        className="btn-primary flex-1"
                    >
                        {isSubmitting ? 'Registrando...' : 'Confirmar Pago'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

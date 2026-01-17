"use client";

import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  fee?: number;
  paid?: number;
  deposit?: number;
  className?: string;
  showProgress?: boolean;
}

export default function PaymentStatusBadge({
  fee = 0,
  paid = 0,
  deposit = 0,
  className = '',
  showProgress = false
}: PaymentStatusBadgeProps) {
  const totalPaid = (paid || 0) + (deposit || 0);
  const remaining = Math.max(0, fee - totalPaid);
  const percentage = fee > 0 ? Math.min(100, (totalPaid / fee) * 100) : 0;

  // Determine payment status
  const isPaid = fee > 0 && totalPaid >= fee;
  const isPartial = totalPaid > 0 && totalPaid < fee;
  const isPending = fee > 0 && totalPaid === 0;

  // Badge styling based on status
  const getBadgeStyles = () => {
    if (isPaid) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    }
    if (isPartial) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
    if (isPending) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    }
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  };

  const getIcon = () => {
    if (isPaid) return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (isPartial) return <Clock className="w-3.5 h-3.5" />;
    if (isPending) return <AlertCircle className="w-3.5 h-3.5" />;
    return null;
  };

  const getLabel = () => {
    if (isPaid) return 'Pagado';
    if (isPartial) return `Parcial: $${totalPaid.toLocaleString()} de $${fee.toLocaleString()}`;
    if (isPending) return 'Pendiente';
    return 'Sin honorarios';
  };

  if (fee === 0) return null;

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeStyles()} transition-all duration-200`}>
        {getIcon()}
        <span>{getLabel()}</span>
      </div>

      {showProgress && !isPaid && fee > 0 && (
        <div className="w-full">
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                isPartial
                  ? 'bg-amber-500 dark:bg-amber-400'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {isPartial && (
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
              Restante: ${remaining.toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from 'react';
import { Check, X, Trash2, CheckCircle, XCircle, DollarSign } from 'lucide-react';

interface BatchActionsProps<T> {
  selectedItems: T[];
  totalItems: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  actions?: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    onClick: (items: T[]) => void;
  }>;
  className?: string;
}

export default function BatchActions<T>({
  selectedItems,
  totalItems,
  onSelectAll,
  onDeselectAll,
  actions = [],
  className = ''
}: BatchActionsProps<T>) {
  const selectedCount = selectedItems.length;
  const allSelected = selectedCount === totalItems && totalItems > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalItems;

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white';
      case 'secondary':
        return 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white';
      default:
        return 'bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white';
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 ${className}`}>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className={`w-6 h-6 rounded-md border-2 transition-all duration-200 ${
                allSelected || someSelected
                  ? 'bg-sky-500 border-sky-500'
                  : 'border-slate-300 dark:border-slate-600 hover:border-sky-500'
              }`}
              aria-label={allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
            >
              {allSelected && <Check className="w-4 h-4 text-white absolute top-0.5 left-0.5" />}
              {someSelected && (
                <div className="w-3 h-0.5 bg-white absolute top-2.5 left-1.5" />
              )}
            </button>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {selectedCount} {selectedCount === 1 ? 'elemento seleccionado' : 'elementos seleccionados'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              de {totalItems} {totalItems === 1 ? 'total' : 'totales'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => action.onClick(selectedItems)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 ${getVariantStyles(action.variant)}`}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}

          <button
            onClick={onDeselectAll}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Cancelar selección"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Checkbox Component for individual items
interface BatchCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function BatchCheckbox({ checked, onChange, className = '' }: BatchCheckboxProps) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <div
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded border-2 transition-all duration-200 cursor-pointer ${
          checked
            ? 'bg-sky-500 border-sky-500'
            : 'border-slate-300 dark:border-slate-600 hover:border-sky-500 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-500 peer-focus-visible:ring-offset-2'
        }`}
      >
        {checked && <Check className="w-4 h-4 text-white absolute top-0 left-0" />}
      </div>
    </div>
  );
}

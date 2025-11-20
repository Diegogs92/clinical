"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'default' | 'danger' | 'success';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const close = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  const toneClass = (tone: ConfirmOptions['tone']) => {
    switch (tone) {
      case 'danger': return 'bg-red-600 hover:bg-red-700';
      case 'success': return 'bg-green-600 hover:bg-green-700';
      default: return 'bg-primary hover:bg-primary-dark';
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal open={!!pending} onClose={() => close(false)} title={pending?.options.title || 'Confirmar acción'}>
        <p className="text-base text-elegant-600 dark:text-elegant-300 mb-6 leading-relaxed">
          {pending?.options.description || '¿Deseas continuar?'}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            className="px-4 py-2.5 rounded-lg font-medium text-elegant-700 dark:text-elegant-200 bg-elegant-100 dark:bg-elegant-800 hover:bg-elegant-200 dark:hover:bg-elegant-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-elegant-300 dark:focus:ring-elegant-600"
            onClick={() => close(false)}
          >
            {pending?.options.cancelText || 'Cancelar'}
          </button>
          <button
            className={`px-4 py-2.5 rounded-lg font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              pending?.options.tone === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : pending?.options.tone === 'success'
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : 'bg-primary hover:bg-primary-dark focus:ring-primary'
            }`}
            onClick={() => close(true)}
          >
            {pending?.options.confirmText || 'Confirmar'}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}

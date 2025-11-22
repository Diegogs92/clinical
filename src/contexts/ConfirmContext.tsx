"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const close = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  const tone = pending?.options.tone || 'default';

  useEffect(() => {
    if (pending && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [pending]);

  const baseButtonClass =
    'w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2';
  const cancelButtonClass = `${baseButtonClass} bg-elegant-100 text-elegant-700 hover:bg-elegant-200 focus:ring-elegant-300 dark:bg-elegant-800/80 dark:text-elegant-50 dark:hover:bg-elegant-700/80 dark:focus:ring-elegant-600`;

  const TONE_CLASSES: Record<string, string> = {
    danger: `${baseButtonClass} bg-white text-danger border border-danger/40 hover:bg-danger/10 hover:text-danger-dark focus:ring-danger/30 dark:bg-transparent dark:text-danger-light dark:border-danger/50 dark:hover:bg-danger/10 dark:focus:ring-danger/40`,
    success: `${baseButtonClass} bg-green-600 text-white hover:bg-green-500 focus:ring-green-400`,
    default: `${baseButtonClass} bg-primary text-white hover:bg-primary-dark focus:ring-primary/40`
  };
  const confirmButtonClass = TONE_CLASSES[tone] || TONE_CLASSES.default;
  const confirmLabel = pending?.options.confirmText || (tone === 'danger' ? 'Eliminar' : tone === 'success' ? 'Registrar' : 'Confirmar');

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal open={!!pending} onClose={() => close(false)} title={pending?.options.title || 'Confirmar acción'}>
        <div className="space-y-5">
          <p className="text-base text-elegant-700 dark:text-elegant-300 leading-relaxed">
            {pending?.options.description || '¿Deseas continuar?'}
          </p>
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 ">
            <button
              onClick={() => close(false)}
              className={cancelButtonClass}
              type="button"
            >
              {pending?.options.cancelText || 'Cancelar'}
            </button>
            <button
              ref={confirmRef}
              onClick={() => close(true)}
              className={confirmButtonClass}
              type="button"
              aria-label={confirmLabel}
            >
              {confirmLabel}
            </button>
          </div>
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

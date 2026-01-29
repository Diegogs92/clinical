// Deprecated: This file is kept for backward compatibility only
// New code should use @/hooks/useToast instead
'use client';

import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
}

const SUCCESS_DURATION_MS = 1200;
const DEFAULT_DURATION_MS = 2500;

interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
}

// Wrapper for backward compatibility
export function useToast(): ToastContextType {
  return {
    showToast: (message: string, type: ToastType = 'info', options?: ToastOptions) => {
      const duration = options?.duration || (type === 'success' ? SUCCESS_DURATION_MS : DEFAULT_DURATION_MS);
      switch (type) {
        case 'success':
          sonnerToast.success(message, { duration });
          break;
        case 'error':
          sonnerToast.error(message, { duration });
          break;
        case 'warning':
          sonnerToast.warning(message, { duration });
          break;
        case 'info':
        default:
          sonnerToast.info(message, { duration });
          break;
      }
    },
    success: (message: string, options?: ToastOptions) => {
      sonnerToast.success(message, { duration: options?.duration || SUCCESS_DURATION_MS });
    },
    error: (message: string, options?: ToastOptions) => {
      sonnerToast.error(message, { duration: options?.duration || DEFAULT_DURATION_MS });
    },
    info: (message: string, options?: ToastOptions) => {
      sonnerToast.info(message, { duration: options?.duration || DEFAULT_DURATION_MS });
    },
    warning: (message: string, options?: ToastOptions) => {
      sonnerToast.warning(message, { duration: options?.duration || DEFAULT_DURATION_MS });
    },
  };
}

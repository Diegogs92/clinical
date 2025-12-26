// Deprecated: This file is kept for backward compatibility only
// New code should use @/hooks/useToast instead
'use client';

import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
}

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
      const duration = options?.duration || 2500;
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
      sonnerToast.success(message, { duration: options?.duration || 2500 });
    },
    error: (message: string, options?: ToastOptions) => {
      sonnerToast.error(message, { duration: options?.duration || 2500 });
    },
    info: (message: string, options?: ToastOptions) => {
      sonnerToast.info(message, { duration: options?.duration || 2500 });
    },
    warning: (message: string, options?: ToastOptions) => {
      sonnerToast.warning(message, { duration: options?.duration || 2500 });
    },
  };
}

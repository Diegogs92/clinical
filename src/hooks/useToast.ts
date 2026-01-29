import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  duration?: number;
}

const SUCCESS_DURATION_MS = 1200;
const DEFAULT_DURATION_MS = 2500;

export function useToast() {
  return {
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

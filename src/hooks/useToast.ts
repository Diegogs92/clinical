import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  duration?: number;
}

export function useToast() {
  return {
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

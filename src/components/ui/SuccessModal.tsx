'use client';

import { CheckCircle2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  duration?: number; // en milisegundos, default 2000
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  duration = 2000
}: SuccessModalProps) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onCloseRef.current();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="bg-white dark:bg-elegant-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-elegant-900 dark:text-white mb-2">
            {title}
          </h3>
          {message && (
            <p className="text-elegant-600 dark:text-elegant-300">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

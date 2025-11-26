"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ReactDOM from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open && !isVisible) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9998] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
      onTransitionEnd={() => {
        if (!open) setIsVisible(false);
      }}
    >
      <div className="absolute inset-0" onClick={onClose} aria-label="Cerrar modal" />

      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] md:max-h-[85vh] bg-white/95 dark:bg-elegant-900/95 rounded-t-3xl md:rounded-2xl shadow-2xl border border-elegant-200/70 dark:border-elegant-800/70 backdrop-blur overflow-hidden flex flex-col transition-all duration-200 ${
          open ? 'translate-y-0 opacity-100' : 'translate-y-full md:translate-y-2 md:scale-95 opacity-0'
        }`}
      >
        <div className="flex-shrink-0 flex items-start justify-between gap-3 p-4 md:pb-3 border-b border-elegant-200/70 dark:border-elegant-800/70 bg-white/95 dark:bg-elegant-900/95 sticky top-0 z-10">
          <div className="flex-1">
            <div className="md:hidden w-12 h-1 bg-elegant-300 dark:bg-elegant-700 rounded-full mx-auto mb-3" />
            {title && (
              <h3 className="text-base md:text-lg font-semibold text-elegant-900 dark:text-white leading-tight">
                {title}
              </h3>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 md:w-8 md:h-8 rounded-full text-elegant-500 hover:text-elegant-800 hover:bg-elegant-100 dark:text-elegant-300 dark:hover:text-white dark:hover:bg-elegant-800 transition touch-manipulation"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5 md:w-4 md:h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:pt-3">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
}

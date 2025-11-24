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
      className={`fixed inset-0 z-[9998] flex items-center justify-center px-3 py-6 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
      onTransitionEnd={() => {
        if (!open) setIsVisible(false);
      }}
    >
      <div className="absolute inset-0" onClick={onClose} aria-label="Cerrar modal" />

      <div
        className={`relative w-full ${maxWidth} bg-white/95 dark:bg-elegant-900/95 rounded-2xl shadow-2xl border border-elegant-200/70 dark:border-elegant-800/70 backdrop-blur p-4 transition-all duration-200 ${
          open ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-2'
        }`}
      >
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-elegant-200/70 dark:border-elegant-800/70">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-elegant-900 dark:text-white leading-tight">
                {title}
              </h3>
            )}
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-elegant-500 hover:text-elegant-800 hover:bg-elegant-100 dark:text-elegant-300 dark:hover:text-white dark:hover:bg-elegant-800 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-3">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
}

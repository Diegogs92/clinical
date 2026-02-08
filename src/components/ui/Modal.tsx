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
      className={`fixed inset-0 z-[9998] flex items-center justify-center p-1 sm:p-4 bg-black/40 backdrop-blur-md transition-opacity duration-[180ms] ${
        open ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onTransitionEnd={() => {
        if (!open) setIsVisible(false);
      }}
    >
      <div className="absolute inset-0" onClick={onClose} aria-label="Cerrar modal" />

      <div
        className={`relative w-full ${maxWidth} max-h-[96vh] sm:max-h-[85vh] bg-white dark:bg-elegant-900 rounded-xl sm:rounded-2xl shadow-xl border border-elegant-200/60 dark:border-elegant-800/60 overflow-hidden flex flex-col transition-all duration-[180ms] ${
          open ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-elegant-200/60 dark:border-elegant-800/60 bg-elegant-50/50 dark:bg-elegant-900/50">
          {title && (
            <h3 className="text-base font-semibold text-elegant-900 dark:text-white">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-elegant-500 hover:text-elegant-800 hover:bg-elegant-200/80 dark:text-elegant-300 dark:hover:text-white dark:hover:bg-elegant-800/80 transition-all duration-150 active:scale-95"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
}

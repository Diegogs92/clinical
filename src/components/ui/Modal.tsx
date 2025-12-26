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
      className={`fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
      onTransitionEnd={() => {
        if (!open) setIsVisible(false);
      }}
    >
      <div className="absolute inset-0" onClick={onClose} aria-label="Cerrar modal" />

      <div
        className={`relative w-full ${maxWidth} max-h-[85vh] bg-white dark:bg-elegant-900 rounded-xl shadow-2xl border border-elegant-200 dark:border-elegant-800 overflow-hidden flex flex-col transition-all duration-300 transition-bounce-subtle ${
          open ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-elegant-200 dark:border-elegant-800">
          {title && (
            <h3 className="text-lg font-semibold text-elegant-900 dark:text-white">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-elegant-500 hover:text-elegant-800 hover:bg-elegant-100 dark:text-elegant-300 dark:hover:text-white dark:hover:bg-elegant-800 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
}

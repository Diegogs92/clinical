"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; maxWidth?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
      onTransitionEnd={() => {
        if (!open) setIsVisible(false);
      }}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-elegant-900 rounded-xl shadow-2xl p-6 border border-elegant-200 dark:border-elegant-800 transform transition-all duration-200 ${
        open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-elegant-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

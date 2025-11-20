"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ReactDOM from 'react-dom';

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

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center p-4 transition-opacity duration-200 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
      onTransitionEnd={() => {
        if (!open) setIsVisible(false);
      }}
    >
      {/* Backdrop - usando portal para que esté por encima de todo */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-lg transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Modal Content */}
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-elegant-900 rounded-2xl shadow-2xl p-4 border border-elegant-200 dark:border-elegant-800 transform transition-all duration-200 ${
        open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-elegant-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  // Render modal using portal to body to ensure it's above everything
  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
}

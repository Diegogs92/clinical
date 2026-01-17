"use client";

import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { KeyboardShortcut, formatShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  className?: string;
}

export default function KeyboardShortcutsHelp({
  shortcuts,
  className = ''
}: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Open with ? key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !isOpen) {
        const target = e.target as HTMLElement;
        const isTyping =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true';

        if (!isTyping) {
          e.preventDefault();
          setIsOpen(true);
        }
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-30 p-3 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}
        aria-label="Mostrar atajos de teclado"
        title="Atajos de teclado (?)"
      >
        <Keyboard className="w-5 h-5" />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                <Keyboard className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Atajos de Teclado
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-6 py-4 max-h-[calc(80vh-100px)]">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Usa estos atajos de teclado para navegar más rápido por la aplicación.
            </p>

            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {shortcut.description}
                  </span>
                  <kbd className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-mono font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm whitespace-nowrap">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>

            {/* Help Tip */}
            <div className="mt-6 p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg">
              <p className="text-sm text-sky-900 dark:text-sky-100">
                <strong>Tip:</strong> Presiona <kbd className="px-2 py-0.5 text-xs font-mono bg-white dark:bg-sky-900 border border-sky-300 dark:border-sky-700 rounded">?</kbd> en cualquier momento para ver esta guía.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  height?: 'auto' | 'half' | 'full';
  showHandle?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    const deltaY = currentY.current - startY.current;

    if (sheetRef.current) {
      if (deltaY > 100) {
        // Close if dragged down more than 100px
        onClose();
      }
      sheetRef.current.style.transform = '';
    }

    startY.current = 0;
    currentY.current = 0;
  };

  const getHeightClass = () => {
    switch (height) {
      case 'full':
        return 'h-[95vh]';
      case 'half':
        return 'h-[50vh]';
      default:
        return 'max-h-[85vh]';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 ease-out ${getHeightClass()} md:hidden`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 id="bottom-sheet-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: height === 'auto' ? 'calc(85vh - 100px)' : undefined }}>
          {children}
        </div>
      </div>

      {/* Desktop fallback - show as modal */}
      {isOpen && (
        <div className="hidden md:block fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={onClose}
              aria-hidden="true"
            />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="overflow-y-auto px-6 py-4 max-h-[calc(90vh-80px)]">
                {children}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

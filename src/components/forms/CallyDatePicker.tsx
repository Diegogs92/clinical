"use client";

import { memo, useRef, useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

// Dynamically import cally only on client side
if (typeof window !== 'undefined') {
  import('cally');
}

// Extend JSX namespace to include custom calendar elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'calendar-date': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        value?: string;
        onchange?: (event: Event & { target: { value: string } }) => void;
      }, HTMLElement>;
      'calendar-month': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        offset?: number;
        locale?: string;
      }, HTMLElement>;
    }
  }
}

interface CallyDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  error?: string;
  placeholder?: string;
}

const CallyDatePicker = memo(function CallyDatePicker({
  selected,
  onChange,
  minDate,
  error,
  placeholder = 'Seleccionar fecha'
}: CallyDatePickerProps) {
  const calendarRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only render on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Convert Date to DD/MM/YYYY format for display
  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Convert Date to YYYY-MM-DD format
  const formatDateToISO = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Convert YYYY-MM-DD to Date
  const parseISOToDate = (isoString: string): Date | null => {
    if (!isoString) return null;
    const [year, month, day] = isoString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const currentValue = formatDateToISO(selected);
  const displayValue = formatDateForDisplay(selected);

  // Update the calendar when the selected date changes externally
  useEffect(() => {
    if (calendarRef.current && currentValue) {
      calendarRef.current.setAttribute('value', currentValue);
    }
  }, [currentValue]);

  // Handle date selection
  const handleChange = (event: Event & { target: { value: string } }) => {
    const newValue = event.target.value;
    const newDate = parseISOToDate(newValue);
    onChange(newDate);
    setIsOpen(false);
  };

  if (!mounted) {
    return (
      <div>
        <button
          type="button"
          className="input-field w-full text-left flex items-center justify-between"
        >
          <span className="text-gray-400">{placeholder}</span>
          <Calendar className="w-4 h-4 text-gray-400" />
        </button>
        {error && <p className="text-red-600 text-xs mt-0.5">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`input-field w-full text-left flex items-center justify-between ${
          error ? 'border-red-500' : ''
        }`}
      >
        <span className={displayValue ? 'text-elegant-900 dark:text-elegant-50' : 'text-gray-400 dark:text-gray-500'}>
          {displayValue || placeholder}
        </span>
        <Calendar className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-elegant-800 rounded-lg shadow-lg border border-elegant-200 dark:border-gray-700 p-2">
          <calendar-date
            ref={calendarRef as any}
            value={currentValue}
            onchange={handleChange as any}
            lang="es"
          >
            <calendar-month locale="es-ES"></calendar-month>
          </calendar-date>
        </div>
      )}

      {error && <p className="text-red-600 text-xs mt-0.5">{error}</p>}
    </div>
  );
});

export default CallyDatePicker;

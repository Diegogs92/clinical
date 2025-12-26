"use client";

import { memo, useRef, useEffect, useState } from 'react';

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

  // Only render on client side
  useEffect(() => {
    setMounted(true);
  }, []);

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
  };

  if (!mounted) {
    return (
      <div>
        <div className="input-field text-gray-400">{placeholder}</div>
        {error && <p className="text-red-600 text-xs mt-0.5">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <calendar-date
          ref={calendarRef as any}
          value={currentValue}
          onchange={handleChange as any}
          className="w-full"
        >
          <calendar-month></calendar-month>
        </calendar-date>
      </div>
      {error && <p className="text-red-600 text-xs mt-0.5">{error}</p>}
    </div>
  );
});

export default CallyDatePicker;

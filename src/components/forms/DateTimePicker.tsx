"use client";

import DatePicker from 'react-datepicker';
import { forwardRef, memo } from 'react';
import { Calendar } from 'lucide-react';
import { es } from 'date-fns/locale';

interface DateTimePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  error?: string;
  placeholder?: string;
}

// Custom input component
const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick, placeholder }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    className="input-field w-full text-left flex items-center justify-between"
  >
    <span className={value ? 'text-elegant-900 dark:text-elegant-50' : 'text-gray-400 dark:text-gray-500'}>
      {value || placeholder || 'Seleccionar fecha'}
    </span>
    <Calendar className="w-4 h-4 text-gray-400" />
  </button>
));

CustomInput.displayName = 'CustomInput';

const DateTimePicker = memo(function DateTimePicker({
  selected,
  onChange,
  minDate,
  error,
  placeholder
}: DateTimePickerProps) {
  return (
    <div>
      <DatePicker
        selected={selected}
        onChange={onChange}
        minDate={minDate || new Date()}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholder}
        customInput={<CustomInput />}
        calendarClassName="!font-sans"
        wrapperClassName="w-full"
        locale={es}
      />
      {error && <p className="text-red-600 text-xs mt-0.5">{error}</p>}
    </div>
  );
});

export default DateTimePicker;

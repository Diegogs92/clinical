"use client";

import CurrencyInputField from 'react-currency-input-field';

interface CurrencyInputProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  error
}: CurrencyInputProps) {
  return (
    <div>
      <CurrencyInputField
        value={value}
        onValueChange={(value) => onChange(value ? parseFloat(value) : undefined)}
        placeholder={placeholder}
        prefix="$ "
        decimalsLimit={2}
        decimalSeparator=","
        groupSeparator="."
        disabled={disabled}
        className={`input-field ${error ? 'border-red-500' : ''} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
      {error && <p className="text-red-600 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

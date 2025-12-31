"use client";

import { useMemo, memo } from 'react';
import Select, { components, SingleValueProps } from 'react-select';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectFieldProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  isLoading?: boolean;
  noOptionsMessage?: string;
  disabled?: boolean;
}

const CustomSingleValue = (props: SingleValueProps<SelectOption>) => {
  return (
    <components.SingleValue {...props}>
      <span className="font-medium">{props.data.label}</span>
    </components.SingleValue>
  );
};

const SelectField = memo(function SelectField({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  error,
  isLoading = false,
  noOptionsMessage = 'No hay opciones disponibles',
  disabled = false
}: SelectFieldProps) {
  const selectedOption = useMemo(() =>
    options.find(opt => opt.value === value) || null,
    [options, value]
  );

  return (
    <div>
      <Select
        options={options}
        value={selectedOption}
        onChange={(option) => {
          const selected = option as SelectOption | null;
          if (selected) {
            onChange(selected.value);
          }
        }}
        placeholder={placeholder}
        isLoading={isLoading}
        isDisabled={disabled}
        noOptionsMessage={() => noOptionsMessage}
        components={{ SingleValue: CustomSingleValue }}
        classNames={{
          control: () =>
            `!min-h-[42px] !bg-white dark:!bg-elegant-900 !border-elegant-200 dark:!border-gray-700 !rounded-lg hover:!border-primary-light dark:hover:!border-primary-dark !shadow-sm ${
              error ? '!border-red-500' : ''
            }`,
          menu: () =>
            '!bg-white dark:!bg-elegant-800 !border !border-elegant-200 dark:!border-gray-700 !shadow-lg !rounded-lg !mt-1',
          option: (state) =>
            `!cursor-pointer ${
              state.isFocused
                ? '!bg-primary-50 dark:!bg-primary-900/20 !text-elegant-900 dark:!text-white'
                : '!bg-transparent !text-elegant-900 dark:!text-white'
            } ${
              state.isSelected
                ? '!bg-primary-100 dark:!bg-primary-900/40 !text-elegant-900 dark:!text-white'
                : ''
            }`,
          placeholder: () => '!text-gray-400 dark:!text-gray-500',
          singleValue: () => '!text-elegant-900 dark:!text-elegant-50',
          input: () => '!text-elegant-900 dark:!text-elegant-50',
        }}
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: 'transparent',
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: 'transparent',
          }),
        }}
      />
      {error && <p className="text-red-600 text-xs mt-0.5">{error}</p>}
    </div>
  );
});

export default SelectField;

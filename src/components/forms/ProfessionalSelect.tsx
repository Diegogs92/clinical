"use client";

import { useMemo, memo } from 'react';
import Select, { components, SingleValueProps, OptionProps } from 'react-select';
import { UserProfile } from '@/types';

interface ProfessionalOption {
  value: string;
  label: string;
  professional?: UserProfile;
}

interface ProfessionalSelectProps {
  professionals: UserProfile[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  error?: string;
}

const CustomSingleValue = (props: SingleValueProps<ProfessionalOption>) => {
  return (
    <components.SingleValue {...props}>
      <span className="font-medium text-elegant-900 dark:text-elegant-50">{props.data.label}</span>
    </components.SingleValue>
  );
};

const ProfessionalSelect = memo(function ProfessionalSelect({
  professionals,
  value,
  onChange,
  loading = false,
  error
}: ProfessionalSelectProps) {
  const options: ProfessionalOption[] = useMemo(() =>
    professionals.map(prof => ({
      value: prof.uid,
      label: prof.displayName || prof.email || 'Sin nombre',
      professional: prof,
    })),
    [professionals]
  );

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
          const selected = option as ProfessionalOption | null;
          onChange(selected?.value || '');
        }}
        placeholder={loading ? "Cargando..." : "Selecciona un profesional"}
        isLoading={loading}
        noOptionsMessage={() => 'No se encontraron profesionales'}
        components={{ SingleValue: CustomSingleValue, IndicatorSeparator: () => null }}
        classNames={{
          control: () =>
            `!min-h-[42px] !bg-white dark:!bg-elegant-900 !border-elegant-200 dark:!border-gray-700 !rounded-lg hover:!border-primary-light dark:hover:!border-primary-dark !shadow-sm ${error ? '!border-red-500' : ''
            }`,
          menu: () =>
            '!bg-white dark:!bg-elegant-800 !border !border-elegant-200 dark:!border-gray-700 !shadow-lg !rounded-lg !mt-1',
          option: (state) =>
            `!cursor-pointer ${state.isFocused
              ? '!bg-primary-50 dark:!bg-elegant-100/90 !text-elegant-900 dark:!text-elegant-900'
              : '!bg-transparent !text-elegant-900 dark:!text-elegant-50'
            } ${state.isSelected
              ? '!bg-primary-100 dark:!bg-elegant-200/90 !text-elegant-900 dark:!text-elegant-900'
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
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        menuPosition="fixed"
      />
      {error && <p className="text-red-600 text-xs mt-0.5">{error}</p>}
    </div>
  );
});

export default ProfessionalSelect;

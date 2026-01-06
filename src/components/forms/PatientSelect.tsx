"use client";

import { useMemo, memo } from 'react';
import Select, { components, SingleValueProps, OptionProps } from 'react-select';
import { Patient } from '@/types';
import { UserPlus } from 'lucide-react';

interface PatientOption {
  value: string;
  label: string;
  patient?: Patient;
  isCreateNew?: boolean;
}

interface PatientSelectProps {
  patients: Patient[];
  value: string;
  onChange: (value: string) => void;
  onCreateNew: () => void;
  error?: string;
}

const CustomOption = (props: OptionProps<PatientOption>) => {
  if (props.data.isCreateNew) {
    return (
      <components.Option {...props}>
        <div className="flex items-center gap-2 text-primary font-medium">
          <UserPlus className="w-4 h-4" />
          <span>Crear nuevo paciente</span>
        </div>
      </components.Option>
    );
  }

  return (
    <components.Option {...props}>
      <div>
        <div className="font-medium">{props.data.label}</div>
        {props.data.patient && (
          <div className="text-xs text-gray-500 mt-0.5">
            DNI: {props.data.patient.dni}
          </div>
        )}
      </div>
    </components.Option>
  );
};

const CustomSingleValue = (props: SingleValueProps<PatientOption>) => {
  return (
    <components.SingleValue {...props}>
      <span className="font-medium">{props.data.label}</span>
    </components.SingleValue>
  );
};

const PatientSelect = memo(function PatientSelect({
  patients,
  value,
  onChange,
  onCreateNew,
  error
}: PatientSelectProps) {
  const options: PatientOption[] = useMemo(() => [
    ...patients.map(p => ({
      value: p.id,
      label: `${p.lastName}, ${p.firstName}`,
      patient: p,
    })),
    {
      value: '__new',
      label: '+ Crear nuevo paciente',
      isCreateNew: true,
    },
  ], [patients]);

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
          const selected = option as PatientOption | null;
          if (selected?.value === '__new') {
            onCreateNew();
          } else {
            onChange(selected?.value || '');
          }
        }}
        placeholder="Buscar paciente..."
        noOptionsMessage={() => 'No se encontraron pacientes'}
        components={{ Option: CustomOption, SingleValue: CustomSingleValue }}
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
          control: (base, state) => ({
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

export default PatientSelect;

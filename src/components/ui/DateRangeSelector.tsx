"use client";

import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export type DateRangePreset = 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presetRanges: { value: DateRangePreset; label: string; getRange: () => DateRange }[] = [
  {
    value: 'today',
    label: 'Hoy',
    getRange: () => ({
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
      label: 'Hoy'
    })
  },
  {
    value: 'yesterday',
    label: 'Ayer',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 1)),
      end: endOfDay(subDays(new Date(), 1)),
      label: 'Ayer'
    })
  },
  {
    value: 'this-week',
    label: 'Esta semana',
    getRange: () => ({
      start: startOfWeek(new Date(), { weekStartsOn: 1 }),
      end: endOfWeek(new Date(), { weekStartsOn: 1 }),
      label: 'Esta semana'
    })
  },
  {
    value: 'last-week',
    label: 'Semana pasada',
    getRange: () => {
      const lastWeek = subWeeks(new Date(), 1);
      return {
        start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        label: 'Semana pasada'
      };
    }
  },
  {
    value: 'this-month',
    label: 'Este mes',
    getRange: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
      label: 'Este mes'
    })
  },
  {
    value: 'last-month',
    label: 'Mes pasado',
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
        label: 'Mes pasado'
      };
    }
  }
];

export default function DateRangeSelector({
  value,
  onChange,
  className = ''
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handlePresetSelect = (preset: typeof presetRanges[0]) => {
    onChange(preset.getRange());
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = startOfDay(new Date(customStart));
      const end = endOfDay(new Date(customEnd));

      onChange({
        start,
        end,
        label: `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })}`
      });
      setIsOpen(false);
      setShowCustom(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {value.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setShowCustom(false);
            }}
          />

          {/* Menu */}
          <div className="absolute z-20 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden">
            {!showCustom ? (
              <>
                {/* Preset Options */}
                <div className="py-1">
                  {presetRanges.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handlePresetSelect(preset)}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setShowCustom(true)}
                    className="w-full px-4 py-2.5 text-left text-sm text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                  >
                    Rango personalizado...
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Custom Range Inputs */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    Rango personalizado
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Desde
                      </label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Hasta
                      </label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setShowCustom(false)}
                      className="flex-1 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCustomApply}
                      disabled={!customStart || !customEnd}
                      className="flex-1 px-3 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

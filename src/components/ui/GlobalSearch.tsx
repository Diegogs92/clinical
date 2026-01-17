"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Calendar, User, DollarSign, Clock, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePatients } from '@/contexts/PatientsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SearchResult {
  id: string;
  type: 'patient' | 'appointment' | 'payment';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  link: string;
  metadata?: string;
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

export default function GlobalSearch({
  placeholder = 'Buscar pacientes, turnos, pagos...',
  className = ''
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { patients } = usePatients();
  const { appointments } = useAppointments();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      performSearch(query);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, patients, appointments]);

  const performSearch = useCallback((searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    // Search patients
    patients.forEach((patient) => {
      const matchesName = patient.name?.toLowerCase().includes(lowerQuery);
      const matchesDNI = patient.dni?.toLowerCase().includes(lowerQuery);
      const matchesPhone = patient.phone?.toLowerCase().includes(lowerQuery);

      if (matchesName || matchesDNI || matchesPhone) {
        searchResults.push({
          id: patient.id,
          type: 'patient',
          title: patient.name || 'Sin nombre',
          subtitle: patient.dni ? `DNI: ${patient.dni}` : patient.phone,
          icon: <User className="w-4 h-4 text-sky-500" />,
          link: `/dashboard/patients/${patient.id}`,
          metadata: patient.insurance || 'Particular'
        });
      }
    });

    // Search appointments
    appointments.forEach((appointment) => {
      const matchesPatientName = appointment.patientName?.toLowerCase().includes(lowerQuery);
      const matchesNotes = appointment.notes?.toLowerCase().includes(lowerQuery);

      if (matchesPatientName || matchesNotes) {
        const appointmentDate = new Date(appointment.date);
        searchResults.push({
          id: appointment.id,
          type: 'appointment',
          title: appointment.patientName || 'Sin paciente',
          subtitle: `${format(appointmentDate, "d 'de' MMMM, yyyy", { locale: es })} - ${appointment.startTime}`,
          icon: <Calendar className="w-4 h-4 text-green-500" />,
          link: `/dashboard?highlight=${appointment.id}`,
          metadata: appointment.status || 'programado'
        });
      }
    });

    // Search appointments with pending payments
    appointments.forEach((appointment) => {
      if (appointment.fee && appointment.fee > 0) {
        const totalPaid = (appointment.paid || 0) + (appointment.deposit || 0);
        const isPending = totalPaid < appointment.fee;

        if (isPending && appointment.patientName?.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: `payment-${appointment.id}`,
            type: 'payment',
            title: appointment.patientName,
            subtitle: `Pendiente: $${(appointment.fee - totalPaid).toLocaleString()}`,
            icon: <DollarSign className="w-4 h-4 text-amber-500" />,
            link: `/dashboard/fees?patient=${appointment.patientId}`,
            metadata: 'Pago pendiente'
          });
        }
      }
    });

    // Limit to top 10 results
    setResults(searchResults.slice(0, 10));
    setSelectedIndex(0);
  }, [patients, appointments]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.link);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'patient':
        return 'Paciente';
      case 'appointment':
        return 'Turno';
      case 'payment':
        return 'Pago';
      default:
        return '';
    }
  };

  return (
    <div className={`relative ${className}`} ref={resultsRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all duration-200"
          aria-label="Búsqueda global"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="search-results"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.trim() || results.length > 0) && (
        <div
          id="search-results"
          className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto"
          role="listbox"
        >
          {isSearching ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Buscando...</p>
            </div>
          ) : results.length === 0 && query.trim() ? (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No se encontraron resultados para &quot;{query}&quot;
              </p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    selectedIndex === index ? 'bg-slate-50 dark:bg-slate-700/50' : ''
                  }`}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div className="flex-shrink-0">{result.icon}</div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {result.title}
                      </p>
                      <span className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {getCategoryLabel(result.type)}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  {result.metadata && (
                    <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
                      {result.metadata}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

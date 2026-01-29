
import { useMemo, useState } from 'react';
import { Appointment, UserProfile, Patient } from '@/types';
import { addDays, addMonths, addYears, startOfMonth, startOfWeek, startOfYear } from 'date-fns';

export type ViewType = 'day' | 'week' | 'month' | 'year' | 'all';

interface FilterState {
  view: ViewType;
  search: string;
  patientId: string;
  status: string;
}

interface UseAppointmentFiltersProps {
  appointments: Appointment[];
  patients: Patient[];
  professionals: UserProfile[];
  currentUserId?: string;
}

export function useAppointmentFilters({
  appointments,
  patients,
  professionals,
  currentUserId
}: UseAppointmentFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    view: 'week',
    search: '',
    patientId: '',
    status: ''
  });

  const setView = (view: ViewType) => setFilters(prev => ({ ...prev, view }));
  const setSearch = (search: string) => setFilters(prev => ({ ...prev, search }));
  const setFilterPatient = (patientId: string) => setFilters(prev => ({ ...prev, patientId }));
  const setFilterStatus = (status: string) => setFilters(prev => ({ ...prev, status }));
  const clearFilters = () => setFilters(prev => ({ ...prev, search: '', patientId: '', status: '' }));

  const windowRange = useMemo(() => {
    const startBase = new Date();
    startBase.setHours(0, 0, 0, 0);

    switch (filters.view) {
      case 'day': {
        const end = addDays(startBase, 1);
        return { start: startBase, end };
      }
      case 'week': {
        const start = startOfWeek(startBase, { weekStartsOn: 1 });
        const end = addDays(start, 7);
        return { start, end };
      }
      case 'month': {
        const start = startOfMonth(startBase);
        const end = addMonths(start, 1);
        return { start, end };
      }
      case 'year': {
        const start = startOfYear(startBase);
        const end = addYears(start, 1);
        return { start, end };
      }
      case 'all': {
        const start = new Date(2020, 0, 1);
        const end = new Date(2099, 11, 31);
        return { start, end };
      }
      default:
        return { start: startBase, end: addDays(startBase, 7) };
    }
  }, [filters.view]);

  const filteredAppointments = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    
    const getProfessionalName = (id?: string) => {
      if (!id) return '';
      const found = professionals.find(p => p.uid === id);
      return found?.displayName || found?.email || '';
    };

    return appointments
      .filter(a => {
        const d = new Date(a.date);
        const inDateRange = d >= windowRange.start && d < windowRange.end;
        
        const patient = patients.find(p => p.id === a.patientId);
        
        const matchesPatient = (() => {
          if (!filters.patientId) return true;
          if (filters.patientId === 'mine') {
            return patient?.userId === currentUserId;
          }
          if (filters.patientId.startsWith('pro:')) {
            const targetId = filters.patientId.slice(4);
            return patient?.userId === targetId;
          }
          return a.patientId === filters.patientId;
        })();
        
        const matchesStatus = !filters.status || a.status === filters.status;

        if (query) {
          const professionalName = getProfessionalName(a.userId) || '';
          const patientDNI = patient?.dni || '';
          const patientInsurance = patient?.insuranceName || '';

          const searchableText = `${a.patientName || a.title || ''} ${professionalName} ${patientDNI} ${patientInsurance}`;
          const matchesSearch = searchableText.toLowerCase().includes(query);

          if (!matchesSearch) return false;
        }

        return inDateRange && matchesPatient && matchesStatus;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [
    appointments, 
    filters, 
    windowRange, 
    professionals, 
    patients, 
    currentUserId
  ]);

  return {
    filters,
    filteredAppointments,
    setView,
    setSearch,
    setFilterPatient,
    setFilterStatus,
    clearFilters
  };
}


import { Search } from 'lucide-react';
import GlassViewSelector from '@/components/GlassViewSelector';
import { UserProfile, UserRole } from '@/types';
import { ViewType } from '@/hooks/useAppointmentFilters';

interface AppointmentFiltersProps {
    view: ViewType;
    onViewChange: (view: ViewType) => void;
    search: string;
    onSearchChange: (search: string) => void;
    filterPatient: string;
    onFilterPatientChange: (filter: string) => void;
    filterStatus: string;
    onFilterStatusChange: (status: string) => void;
    onClearFilters: () => void;
    professionals: UserProfile[];
    userRole?: UserRole;
    searchInputRef: React.RefObject<HTMLInputElement>;
}

const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'scheduled', label: 'Agendado' },
    { value: 'completed', label: 'Presente' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'no-show', label: 'Ausente' },
];

export default function AppointmentFilters({
    view,
    onViewChange,
    search,
    onSearchChange,
    filterPatient,
    onFilterPatientChange,
    filterStatus,
    onFilterStatusChange,
    onClearFilters,
    professionals,
    userRole,
    searchInputRef,
}: AppointmentFiltersProps) {
    const isProfessionalRole = userRole === 'profesional';

    return (
        <div className="relative flex flex-col gap-2.5 mb-3">
            <GlassViewSelector
                options={[
                    { value: 'day', label: 'Dia' },
                    { value: 'week', label: 'Semana' },
                    { value: 'month', label: 'Mes' },
                    { value: 'year', label: 'Año' },
                    { value: 'all', label: 'Todas las fechas' }
                ]}
                value={view}
                onChange={(v) => onViewChange(v as ViewType)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5">
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-elegant-100 dark:bg-elegant-800 text-sm text-elegant-700 dark:text-elegant-300">
                    <Search className="w-4 h-4" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar por paciente, DNI u obra social (Ctrl+K)"
                        className="flex-1 bg-transparent outline-none text-sm placeholder:text-elegant-400 dark:placeholder:text-elegant-500"
                        aria-label="Buscar turnos"
                    />
                </label>

                <select
                    value={filterPatient}
                    onChange={e => onFilterPatientChange(e.target.value)}
                    className="input-field"
                >
                    {isProfessionalRole && <option value="mine">Mis pacientes</option>}
                    <option value="">Todos los pacientes</option>
                    {professionals.map(pro => (
                        <option key={pro.uid} value={`pro:${pro.uid}`}>
                            {`Pacientes de ${pro.displayName || pro.email}`}
                        </option>
                    ))}
                </select>

                <select
                    value={filterStatus}
                    onChange={e => onFilterStatusChange(e.target.value)}
                    className="input-field"
                >
                    {statusOptions.map(o => (
                        <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {(filterPatient || filterStatus || search) && (
                    <button
                        onClick={onClearFilters}
                        className="btn-secondary"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>
        </div>
    );
}

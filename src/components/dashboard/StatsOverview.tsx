'use client';

interface Stat {
  label: string;
  value: string | number;
  sub?: string;
}

const stats: Stat[] = [
  { label: 'Pacientes', value: 0, sub: 'Sin registros' },
  { label: 'Turnos Hoy', value: 0, sub: 'Sin turnos' },
  { label: 'Ingresos Mes', value: '$0', sub: 'Sin datos' },
  { label: 'Pendientes Cobro', value: '$0' },
];

export default function StatsOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(s => (
        <div key={s.label} className="card shadow-sm">
          <div className="text-xs uppercase tracking-wide text-secondary dark:text-gray-400 mb-1">{s.label}</div>
          <div className="text-3xl font-bold text-black dark:text-white mb-1">{s.value}</div>
          {s.sub && <div className="text-xs text-secondary dark:text-gray-400">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

'use client';

interface Stat {
  label: string;
  value: string | number;
  sub?: string;
}

const mockStats: Stat[] = [
  { label: 'Pacientes', value: 42, sub: '+3 este mes' },
  { label: 'Turnos Hoy', value: 8, sub: '2 pendientes' },
  { label: 'Ingresos Mes', value: '$152.300', sub: 'Objetivo 75%' },
  { label: 'Pendientes Cobro', value: '$18.500' },
];

export default function StatsOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {mockStats.map(s => (
        <div key={s.label} className="card shadow-sm">
          <div className="text-xs uppercase tracking-wide text-secondary mb-1">{s.label}</div>
          <div className="text-3xl font-bold text-primary-dark mb-1">{s.value}</div>
          {s.sub && <div className="text-xs text-secondary">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

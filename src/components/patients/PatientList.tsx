'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientsByUser, deletePatient } from '@/lib/patients';
import { Patient } from '@/types';
import { Trash2, Edit, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';

export default function PatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getPatientsByUser(user.uid);
        setPatients(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Re-cargar lista al volver el foco a la pestaña (ayuda tras crear/editar)
  useEffect(() => {
    const onFocus = async () => {
      if (!user) return;
      try {
        const data = await getPatientsByUser(user.uid);
        setPatients(data);
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user]);

  const filtered = patients.filter(p =>
    `${p.lastName} ${p.firstName}`.toLowerCase().includes(search.toLowerCase()) || p.dni.includes(search)
  );

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar paciente',
      description: 'Esta acción es irreversible. ¿Deseas continuar?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deletePatient(id);
      setPatients(prev => prev.filter(p => p.id !== id));
      toast.success('Paciente eliminado correctamente');
    } catch (e) {
      console.error(e);
      toast.error('Error al eliminar paciente');
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-primary dark:text-white"><Loader2 className="w-5 h-5 animate-spin" /> Cargando pacientes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="relative md:max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary dark:text-gray-400" />
          <input
            placeholder="Buscar por nombre o DNI..."
            className="input-field pl-10 w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Link href="/patients/new" className="btn-primary inline-block text-center hover:shadow-lg hover:scale-105 transition-all">+ Nuevo Paciente</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-secondary-lighter dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
          <thead className="bg-secondary-lighter dark:bg-gray-700">
            <tr className="text-left text-sm text-primary-dark dark:text-white">
              <th className="p-2">Apellido</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">DNI</th>
              <th className="p-2">Teléfono</th>
              <th className="p-2">Email</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-900 dark:text-gray-100">
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-secondary-lighter dark:border-gray-700 hover:bg-secondary-lighter/40 dark:hover:bg-gray-700 transition-colors">
                <td className="p-2 font-medium">{p.lastName}</td>
                <td className="p-2">{p.firstName}</td>
                <td className="p-2">{p.dni}</td>
                <td className="p-2">{p.phone}</td>
                <td className="p-2">{p.email}</td>
                <td className="p-2 flex gap-2">
                  <Link href={`/patients/${p.id}`} className="text-primary-dark dark:text-blue-400 hover:underline hover:scale-110 transition-all flex items-center gap-1"><Edit className="w-4 h-4" /> Editar</Link>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 dark:text-red-400 hover:underline hover:scale-110 transition-all flex items-center gap-1"><Trash2 className="w-4 h-4" /> Borrar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-secondary dark:text-gray-400">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

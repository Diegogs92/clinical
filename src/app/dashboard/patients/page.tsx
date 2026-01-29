"use client"

import { useState } from 'react';
import { usePatients } from '@/contexts/PatientsContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Search, UserPlus, FileText } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PatientsPage() {
    const { patients, loading } = usePatients();
    const [search, setSearch] = useState('');
    const router = useRouter();

    const filteredPatients = patients.filter(p => {
        const fullName = `${p.firstName} ${p.lastName}`;
        return fullName.toLowerCase().includes(search.toLowerCase()) ||
            p.email?.toLowerCase().includes(search.toLowerCase()) ||
            p.id.includes(search);
    });

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pacientes</h1>
                            <p className="text-gray-500 dark:text-gray-400">Gestiona las historias clínicas y odontogramas</p>
                        </div>
                        <button className="btn-primary flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Nuevo Paciente
                        </button>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, email o DNI..."
                                    className="pl-9 w-full md:w-[300px] h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Nombre</th>
                                            <th className="px-4 py-3 font-medium">Contacto</th>
                                            <th className="px-4 py-3 font-medium">Historial</th>
                                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                    Cargando pacientes...
                                                </td>
                                            </tr>
                                        ) : filteredPatients.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                    No se encontraron pacientes.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPatients.map((patient) => (
                                                <tr
                                                    key={patient.id}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                                    onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                                                >
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        {patient.firstName} {patient.lastName}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        <div className="flex flex-col">
                                                            <span>{patient.email}</span>
                                                            <span className="text-xs">{patient.phone}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                                            Ver ficha
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                                            <FileText className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

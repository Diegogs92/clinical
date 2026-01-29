"use client"

import { usePatients } from '@/contexts/PatientsContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Odontogram from '@/components/odontogram/Odontogram';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
    const { patients } = usePatients();
    const router = useRouter();
    const patient = patients.find(p => p.id === params.id);

    if (!patient) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="flex flex-col items-center justify-center h-[50vh]">
                        <h2 className="text-xl font-bold mb-2">Paciente no encontrado</h2>
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{patient.firstName} {patient.lastName}</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                {patient.email} - HC: {params.id.substring(0, 6)}
                            </p>
                        </div>
                    </div>

                    <Tabs defaultValue="odontogram" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                            <TabsTrigger
                                value="general"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                            >
                                <User className="mr-2 h-4 w-4" />
                                General
                            </TabsTrigger>
                            <TabsTrigger
                                value="odontogram"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                            >
                                <Activity className="mr-2 h-4 w-4" />
                                Odontograma
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Historial Tratamientos
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="general">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Datos del Paciente</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                                                <div className="text-base">{patient.firstName} {patient.lastName}</div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Email</label>
                                                <div className="text-base">{patient.email || '-'}</div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                                                <div className="text-base">{patient.phone || '-'}</div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Obra Social</label>
                                                <div className="text-base">{patient.insuranceName || '-'}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="odontogram">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-medium">Odontograma Interactivo</h3>
                                        <Button size="sm">Guardar Cambios</Button>
                                    </div>
                                    <Odontogram />
                                </div>
                            </TabsContent>

                            <TabsContent value="history">
                                <Card>
                                    <CardContent className="pt-6 text-center text-gray-500">
                                        Sin historial de tratamientos registrado.
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

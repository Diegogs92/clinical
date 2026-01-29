"use client"

import { useState, useEffect } from 'react';
import { usePatients } from '@/contexts/PatientsContext';
import { updatePatient, deletePatient } from '@/lib/patients';
import { listPayments } from '@/lib/payments';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Calendar as CalendarIcon, FileText, Activity, Shield, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Odontogram from '@/components/odontogram/Odontogram';
import PatientHistory from '@/components/patients/PatientHistory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
    const { patients } = usePatients();
    const { user } = useAuth();
    const { canViewAllPayments } = usePermissions();
    const router = useRouter();
    const patient = patients.find(p => p.id === params.id);
    const [odontogramData, setOdontogramData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { refreshPatients } = usePatients();
    const [payments, setPayments] = useState<any[]>([]);

    const handleSaveOdontogram = async () => {
        if (!patient || !odontogramData) return;
        setIsSaving(true);
        try {
            await updatePatient(patient.id, { odontogram: odontogramData });
            await refreshPatients();
            // Optional: show toast
        } catch (error) {
            console.error("Error saving odontogram:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Load payments for history
    useEffect(() => {
        const fetchPayments = async () => {
            if (!user) return;
            try {
                const data = await listPayments(user.uid, canViewAllPayments);
                setPayments(data);
            } catch (error) {
                console.error("Error loading payments", error);
            }
        };
        fetchPayments();
    }, [user, canViewAllPayments]);

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
                    <div className="flex items-center gap-4 mb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
                                {patient.firstName} {patient.lastName}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                Paciente #{patient.id.slice(-6)}
                            </p>
                        </div>
                        <div className="ml-auto flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                                // TODO: Add edit logic here or a Dialog
                                console.log("Edit patient");
                            }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={async () => {
                                if (confirm('¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer.')) {
                                    try {
                                        await deletePatient(patient.id);
                                        router.push('/dashboard/patients');
                                    } catch (e) {
                                        console.error(e);
                                        alert('Error al eliminar paciente');
                                    }
                                }
                            }}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="general" className="w-full space-y-6">
                        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="odontogram">Odontograma</TabsTrigger>
                            <TabsTrigger value="history">Historial</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Información de Contacto</CardTitle>
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between py-1 border-b dark:border-gray-800">
                                                <span className="text-gray-500">Email:</span>
                                                <span className="font-medium">{patient.email || '-'}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b dark:border-gray-800">
                                                <span className="text-gray-500">Teléfono:</span>
                                                <span className="font-medium">{patient.phone}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b dark:border-gray-800">
                                                <span className="text-gray-500">DNI:</span>
                                                <span className="font-medium">{patient.dni}</span>
                                            </div>
                                            <div className="flex justify-between py-1 text-right">
                                                <span className="text-gray-500">Dirección:</span>
                                                <span className="font-medium max-w-[200px] truncate">{patient.address || '-'}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Cobertura Médica</CardTitle>
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between py-1 border-b dark:border-gray-800">
                                                <span className="text-gray-500">Tipo:</span>
                                                <span className="font-medium capitalize">{patient.insuranceType?.replace('-', ' ') || 'Particular'}</span>
                                            </div>
                                            {patient.insuranceName && (
                                                <div className="flex justify-between py-1 border-b dark:border-gray-800">
                                                    <span className="text-gray-500">Nombre:</span>
                                                    <span className="font-medium">{patient.insuranceName}</span>
                                                </div>
                                            )}
                                            {patient.insuranceNumber && (
                                                <div className="flex justify-between py-1">
                                                    <span className="text-gray-500">Nro. Afiliado:</span>
                                                    <span className="font-medium">{patient.insuranceNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Notas</CardTitle>
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 min-h-[80px]">
                                            {patient.notes || 'Sin notas adicionales.'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="odontogram">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">Odontograma Interactivo</h3>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveOdontogram}
                                        disabled={isSaving}
                                        className="min-w-[140px]"
                                    >
                                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                                    </Button>
                                </div>
                                <Odontogram
                                    initialData={patient.odontogram}
                                    onDataChange={setOdontogramData}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="history">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Historial Clínico y Financiero</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <PatientHistory patientId={patient.id} payments={payments} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

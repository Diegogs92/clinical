'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useOffices } from '@/contexts/OfficesContext';
import { useState } from 'react';
import { Office } from '@/types';
import Modal from '@/components/ui/Modal';
import { Plus, Edit2, Trash2, MapPin, ExternalLink } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createOffice, updateOffice, deleteOffice } from '@/lib/offices';
import { useForm } from 'react-hook-form';
import LocationPicker from '@/components/LocationPicker';

export const dynamic = 'force-dynamic';

// Google Calendar Color IDs con sus colores
const CALENDAR_COLORS = [
  { id: '1', name: 'Lavanda', color: '#7986CB' },
  { id: '2', name: 'Salvia', color: '#33B679' },
  { id: '3', name: 'Uva', color: '#8E24AA' },
  { id: '4', name: 'Flamingo', color: '#E67C73' },
  { id: '5', name: 'Banana', color: '#F6BF26' },
  { id: '6', name: 'Mandarina', color: '#F4511E' },
  { id: '7', name: 'Pavo real', color: '#039BE5' },
  { id: '8', name: 'Grafito', color: '#616161' },
  { id: '9', name: 'Ar\u00e1ndano', color: '#3F51B5' },
  { id: '10', name: 'Albahaca', color: '#0B8043' },
  { id: '11', name: 'Tomate', color: '#D50000' },
];

interface OfficeFormData {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  colorId: string;
}

export default function OfficesPage() {
  const { user } = useAuth();
  const { offices, refreshOffices } = useOffices();
  const [showModal, setShowModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<OfficeFormData>({
    defaultValues: {
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      colorId: '1',
    }
  });

  const selectedColorId = watch('colorId');

  const handleEdit = (office: Office) => {
    setEditingOffice(office);
    setValue('name', office.name);
    setValue('address', office.address);
    setValue('latitude', office.latitude?.toString() || '');
    setValue('longitude', office.longitude?.toString() || '');
    setValue('colorId', office.colorId);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingOffice(null);
    reset();
  };

  const onSubmit = async (data: OfficeFormData) => {
    if (!user) return;

    try {
      const officeData = {
        name: data.name,
        address: data.address,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
        colorId: data.colorId,
        userId: user.uid,
      };

      if (editingOffice) {
        await updateOffice(editingOffice.id, officeData);
        toast.success('Consultorio actualizado');
      } else {
        await createOffice(officeData);
        toast.success('Consultorio creado');
      }
      await refreshOffices();
      handleClose();
    } catch (error) {
      console.error('Error saving office:', error);
      toast.error('Error al guardar consultorio');
    }
  };

  const handleDelete = async (office: Office) => {
    const confirmed = await confirm({
      title: 'Eliminar consultorio',
      description: `\u00bfEst\u00e1s seguro de eliminar el consultorio "${office.name}"?`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });

    if (!confirmed) return;

    try {
      await deleteOffice(office.id);
      await refreshOffices();
      toast.success('Consultorio eliminado');
    } catch (error) {
      console.error('Error deleting office:', error);
      toast.error('Error al eliminar consultorio');
    }
  };

  const getColorById = (colorId: string) => {
    return CALENDAR_COLORS.find(c => c.id === colorId) || CALENDAR_COLORS[0];
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Consultorios</h1>
            <button
              onClick={() => {
                setEditingOffice(null);
                reset();
                setShowModal(true);
              }}
              className="btn-primary hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Consultorio
            </button>
          </div>

          <div className="card overflow-x-auto">
            <table className="table-skin">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Ubicación</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {offices.map(office => {
                  const color = getColorById(office.colorId);
                  const hasLocation = office.latitude && office.longitude;
                  const mapsUrl = hasLocation
                    ? `https://www.google.com/maps?q=${office.latitude},${office.longitude}`
                    : null;

                  return (
                    <tr key={office.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: color.color }}
                          ></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{color.name}</span>
                        </div>
                      </td>
                      <td className="font-medium">{office.name}</td>
                      <td>{office.address}</td>
                      <td>
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-dark flex items-center gap-1"
                            title={`${office.latitude}, ${office.longitude}`}
                          >
                            <MapPin className="w-4 h-4" />
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(office)}
                            className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white hover:scale-110 transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(office)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:scale-110 transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {offices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      No hay consultorios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal open={showModal} onClose={handleClose} title={editingOffice ? 'Editar' : 'Nuevo'} maxWidth="max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  {...register('name', { required: 'Requerido' })}
                  className="input-field text-sm"
                  placeholder="Consultorio Centro"
                />
                {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Color *</label>
                <div className="grid grid-cols-4 gap-1">
                  {CALENDAR_COLORS.map(color => (
                    <label
                      key={color.id}
                      className={`flex items-center justify-center p-1 rounded border-2 cursor-pointer transition-all ${
                        selectedColorId === color.id
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      title={color.name}
                    >
                      <input
                        type="radio"
                        value={color.id}
                        {...register('colorId')}
                        className="sr-only"
                      />
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: color.color }}
                      ></div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <LocationPicker
                latitude={editingOffice?.latitude}
                longitude={editingOffice?.longitude}
                address={editingOffice?.address}
                onLocationChange={(lat, lng, address) => {
                  setValue('latitude', lat.toString());
                  setValue('longitude', lng.toString());
                  if (address) {
                    setValue('address', address);
                  }
                }}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleClose} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1">
                {editingOffice ? 'Guardar Cambios' : 'Crear Consultorio'}
              </button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

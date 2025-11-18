'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { createInsurance, getInsurance, updateInsurance } from '@/lib/insurances';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Insurance } from '@/types';

const schema = z.object({
  name: z.string().min(2),
  type: z.enum(['obra-social','prepaga']),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  insuranceId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function InsuranceForm({ insuranceId, onSuccess, onCancel }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState<Insurance | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (insuranceId) {
      (async () => {
        const ins = await getInsurance(insuranceId);
        if (ins) {
          setInitial(ins);
          reset({
            name: ins.name,
            type: ins.type,
            phone: ins.phone,
            email: ins.email || '',
            address: ins.address,
            website: ins.website || '',
            notes: ins.notes || '',
          });
        }
      })();
    }
  }, [insuranceId, reset]);

  const onSubmit = async (v: FormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      if (insuranceId && initial) {
        await updateInsurance(insuranceId, v);
      } else {
        await createInsurance({ ...v, userId: user.uid });
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/insurances');
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Nombre</label>
        <input className="input-field" {...register('name')} />
        {errors.name && <p className="text-red-600 text-xs">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Tipo</label>
        <select className="input-field" {...register('type')}>
          <option value="obra-social">Obra Social</option>
          <option value="prepaga">Prepaga</option>
        </select>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Teléfono</label>
          <input className="input-field" {...register('phone')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Email</label>
          <input className="input-field" {...register('email')} />
          {errors.email && <p className="text-red-600 text-xs">{errors.email.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Sitio Web</label>
        <input className="input-field" {...register('website')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Dirección</label>
        <input className="input-field" {...register('address')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Notas</label>
        <textarea rows={4} className="input-field" {...register('notes')} />
      </div>
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            Cancelar
          </button>
        )}
        <button
          disabled={loading}
          className={`btn-primary hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${onCancel ? 'flex-1' : 'w-full'}`}
        >
          {loading ? 'Guardando...' : (insuranceId ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  );
}

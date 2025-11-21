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
  code: z.string().optional(),
  acronym: z.string().optional(),
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
            code: ins.code || '',
            acronym: ins.acronym || '',
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Código</label>
          <input className="input-field text-sm py-1.5" {...register('code')} placeholder="Ej: 100106" />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Sigla</label>
          <input className="input-field text-sm py-1.5" {...register('acronym')} placeholder="Ej: OSIAD" />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Tipo</label>
          <select className="input-field text-sm py-1.5" {...register('type')}>
            <option value="obra-social">Obra Social</option>
            <option value="prepaga">Prepaga</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Denominación (Nombre)</label>
        <input className="input-field text-sm py-1.5" {...register('name')} />
        {errors.name && <p className="text-red-600 text-[10px] mt-0.5">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Teléfono</label>
          <input className="input-field text-sm py-1.5" {...register('phone')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Email</label>
          <input className="input-field text-sm py-1.5" {...register('email')} />
          {errors.email && <p className="text-red-600 text-[10px] mt-0.5">{errors.email.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Sitio Web</label>
          <input className="input-field text-sm py-1.5" {...register('website')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Dirección</label>
          <input className="input-field text-sm py-1.5" {...register('address')} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Notas</label>
        <textarea rows={2} className="input-field text-sm py-1.5 resize-none" {...register('notes')} />
      </div>
      <div className="flex gap-2 pt-1.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary text-sm py-1.5 px-3 flex-1 hover:bg-gray-300 dark:hover:bg-gray-600 hover:shadow-md hover:scale-105 transition-all duration-200 active:scale-[0.98]"
          >
            Cancelar
          </button>
        )}
        <button
          disabled={loading}
          className={`btn-primary text-sm py-1.5 px-4 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${onCancel ? 'flex-1' : 'w-full'}`}
        >
          {loading ? 'Guardando...' : (insuranceId ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  );
}

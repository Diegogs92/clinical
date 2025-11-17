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

interface Props { insuranceId?: string }

export default function InsuranceForm({ insuranceId }: Props) {
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
      router.push('/insurances');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-primary-dark mb-1">Nombre</label>
        <input className="input-field" {...register('name')} />
        {errors.name && <p className="text-red-600 text-xs">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark mb-1">Tipo</label>
        <select className="input-field" {...register('type')}>
          <option value="obra-social">Obra Social</option>
          <option value="prepaga">Prepaga</option>
        </select>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Teléfono</label>
          <input className="input-field" {...register('phone')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Email</label>
          <input className="input-field" {...register('email')} />
          {errors.email && <p className="text-red-600 text-xs">{errors.email.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark mb-1">Sitio Web</label>
        <input className="input-field" {...register('website')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark mb-1">Dirección</label>
        <input className="input-field" {...register('address')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark mb-1">Notas</label>
        <textarea rows={4} className="input-field" {...register('notes')} />
      </div>
      <button disabled={loading} className="btn-primary hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">{loading ? 'Guardando...' : (insuranceId ? 'Actualizar' : 'Crear')}</button>
    </form>
  );
}

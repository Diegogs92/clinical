import { db, mockMode } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, getDoc, getDocs, query, where, orderBy, Firestore, limit } from 'firebase/firestore';
import { Appointment, RecurrenceRule } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from './mockStorage';
import { deletePayment, listPaymentsByAppointment } from './payments';
import { format, parseISO } from 'date-fns';

const APPOINTMENTS_COLLECTION = 'appointments';
// In-memory mocks when mockMode is active
const mockAppointments: Appointment[] = loadFromLocalStorage<Appointment>('appointments');

// Rango de fechas para optimización de queries (6 meses atrás, 6 meses adelante)
const getAppointmentsDateRange = () => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - 6); // 6 meses atrás
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 6); // 6 meses adelante
  return {
    start: startDate.toISOString().split('T')[0], // YYYY-MM-DD
    end: endDate.toISOString().split('T')[0]
  };
};

export async function createAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();

  console.log('[createAppointment] Iniciando creación:', {
    mockMode,
    hasDb: !!db,
    data,
  });

  if (mockMode || !db) {
    console.log('[createAppointment] Usando modo mock');
    const id = `mock-ap-${Date.now()}`;
    mockAppointments.push({ ...(data as Appointment), id, createdAt: now, updatedAt: now });
    saveToLocalStorage('appointments', mockAppointments);
    console.log('[createAppointment] Turno guardado en localStorage con ID:', id);
    return id;
  }

  try {
    const colRef = collection(db as Firestore, APPOINTMENTS_COLLECTION);
    const payload = { ...data, createdAt: now, updatedAt: now };
    console.log('[createAppointment] Enviando a Firestore:', payload);

    const docRef = await addDoc(colRef, payload);
    console.log('[createAppointment] Turno guardado en Firestore con ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('[createAppointment] Error al guardar en Firestore:', error);
    console.error('[createAppointment] Error code:', error?.code);
    console.error('[createAppointment] Error message:', error?.message);
    throw error;
  }
}

export async function updateAppointment(id: string, data: Partial<Appointment>) {
  if (mockMode || !db) {
    const idx = mockAppointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      mockAppointments[idx] = { ...mockAppointments[idx], ...data, updatedAt: new Date().toISOString() };
      saveToLocalStorage('appointments', mockAppointments);
    }
    return;
  }
  const docRef = doc(db as Firestore, APPOINTMENTS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteAppointment(id: string, ownerId?: string) {
  // Primero eliminar los pagos asociados al turno
  const payments = await listPaymentsByAppointment(id, ownerId);
  await Promise.all(payments.map(p => deletePayment(p.id)));

  // Luego eliminar el turno
  if (mockMode || !db) {
    const idx = mockAppointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      mockAppointments.splice(idx, 1);
      saveToLocalStorage('appointments', mockAppointments);
    }
    return;
  }
  const docRef = doc(db as Firestore, APPOINTMENTS_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  if (mockMode || !db) {
    return mockAppointments.find(a => a.id === id) || null;
  }
  const docRef = doc(db as Firestore, APPOINTMENTS_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data() as Appointment;
  return { ...data, id: snap.id };
}

export async function getAppointmentsByUser(userId: string): Promise<Appointment[]> {
  if (mockMode || !db) {
    return mockAppointments.filter(a => a.userId === userId).sort((a, b) => a.date.localeCompare(b.date));
  }
  const colRef = collection(db as Firestore, APPOINTMENTS_COLLECTION);

  // Solo filtrar por userId, ordenar en cliente para evitar requerir índice compuesto
  const q = query(colRef, where('userId', '==', userId));
  const snap = await getDocs(q);
  const appointments = snap.docs.map(d => ({ ...d.data() as Appointment, id: d.id }));

  // Ordenar por fecha en el cliente
  return appointments.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Obtiene turnos recientes y futuros (optimizado con rango de fechas)
 * Carga solo turnos de los últimos 6 meses y próximos 6 meses para mejor rendimiento
 */
export async function getAllAppointments(): Promise<Appointment[]> {
  if (mockMode || !db) {
    // En mock mode, filtrar por rango de fechas para simular la optimización
    const { start, end } = getAppointmentsDateRange();
    return mockAppointments
      .filter(a => a.date >= start && a.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Optimización: cargar solo turnos en rango de fechas relevante
  // Esto evita cargar años de historial innecesariamente
  const { start, end } = getAppointmentsDateRange();
  const q = query(
    collection(db as Firestore, APPOINTMENTS_COLLECTION),
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date', 'asc'),
    limit(2000) // Límite de seguridad adicional
  );

  const snap = await getDocs(q);
  const appointments = snap.docs.map(d => ({ ...d.data() as Appointment, id: d.id }));
  return appointments.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Verifica si un turno se solapa con otros turnos existentes del profesional
 * @param professionalId ID del profesional (solo informativo)
 * @param date Fecha del turno en formato YYYY-MM-DD
 * @param startTime Hora de inicio en formato HH:mm
 * @param endTime Hora de fin en formato HH:mm
 * @param excludeAppointmentId ID del turno a excluir (para ediciones)
 * @returns Array de turnos que se solapan
 */
export async function getOverlappingAppointments(
  professionalId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<Appointment[]> {
  console.log('[getOverlappingAppointments] Validando:', {
    professionalId,
    date,
    startTime,
    endTime,
    excludeAppointmentId,
  });

  // Obtener turnos del profesional seleccionado para evitar errores de permisos
  let appointments: Appointment[];
  if (mockMode || !db) {
    appointments = mockAppointments.filter(a => a.userId === professionalId);
  } else {
    const colRef = collection(db as Firestore, APPOINTMENTS_COLLECTION);
    const q = query(colRef, where('userId', '==', professionalId));
    const snap = await getDocs(q);
    appointments = snap.docs.map(d => ({ ...d.data() as Appointment, id: d.id }));
  }

  // Normalizar la fecha del turno a comparar (solo la parte de fecha)
  const targetDateStr = date.includes('T') ? date.split('T')[0] : date;

  // Filtrar turnos del mismo día
  const sameDayAppointments = appointments.filter(a => {
    // Excluir el turno que estamos editando
    if (excludeAppointmentId && a.id === excludeAppointmentId) return false;

    // Normalizar la fecha del turno existente usando date-fns para respetar zona horaria local
    const appointmentDateStr = a.date.includes('T')
      ? format(parseISO(a.date), 'yyyy-MM-dd')
      : a.date;

    return appointmentDateStr === targetDateStr;
  });

  console.log('[getOverlappingAppointments] Turnos del mismo día:', sameDayAppointments.length);

  // Función auxiliar para convertir HH:mm a minutos desde medianoche
  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const targetStart = timeToMinutes(startTime);
  const targetEnd = timeToMinutes(endTime);

  // Verificar solapamiento
  const overlapping = sameDayAppointments.filter(a => {
    const appointmentStart = timeToMinutes(a.startTime);
    const appointmentEnd = timeToMinutes(a.endTime);

    // Dos rangos se solapan si:
    // - El inicio del nuevo turno está dentro del rango existente
    // - El fin del nuevo turno está dentro del rango existente
    // - El nuevo turno envuelve completamente al existente
    const overlaps = (
      (targetStart >= appointmentStart && targetStart < appointmentEnd) || // Inicio se solapa
      (targetEnd > appointmentStart && targetEnd <= appointmentEnd) ||     // Fin se solapa
      (targetStart <= appointmentStart && targetEnd >= appointmentEnd)     // Envuelve completamente
    );

    if (overlaps) {
      console.log('[getOverlappingAppointments] Solapamiento detectado:', {
        existing: `${a.startTime}-${a.endTime}`,
        new: `${startTime}-${endTime}`,
        patientName: a.patientName,
      });
    }

    return overlaps;
  });

  console.log('[getOverlappingAppointments] Total solapamientos:', overlapping.length);
  return overlapping;
}

// Utility to expand recurrence (client-side only for now)
export function expandRecurrence(base: Appointment, maxOccurrences: number = 100): Appointment[] {
  if (!base.isRecurrent || !base.recurrenceRule) return [base];
  const rule: RecurrenceRule = base.recurrenceRule;
  const occurrences: Appointment[] = [];
  const startDate = new Date(base.date);
  let count = 0;

  // Use rule.count if provided, otherwise use maxOccurrences as safeguard
  const max = rule.count || maxOccurrences;

  while (count < max) {
    const d = new Date(startDate);
    switch (rule.frequency) {
      case 'daily': d.setDate(startDate.getDate() + count * rule.interval); break;
      case 'weekly': d.setDate(startDate.getDate() + count * 7 * rule.interval); break;
      case 'biweekly': d.setDate(startDate.getDate() + count * 14 * rule.interval); break;
      case 'monthly': d.setMonth(startDate.getMonth() + count * rule.interval); break;
    }

    // Check if we've passed the end date
    if (rule.endDate && d > new Date(rule.endDate)) break;

    const iso = d.toISOString().split('T')[0]; // Keep only date part
    occurrences.push({ ...base, id: `${base.id}-${count}`, date: iso });
    count++;
  }
  return occurrences;
}

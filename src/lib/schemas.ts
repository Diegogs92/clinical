import { z } from 'zod';

// Patient schemas
export const PatientSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  dni: z.string().min(1, 'El DNI es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(1, 'El teléfono es requerido'),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  insuranceId: z.string().optional(),
  insuranceNumber: z.string().optional(),
  notes: z.string().optional(),
  panoramicUrl: z.string().optional(),
  panoramicName: z.string().optional(),
  panoramicUploadedAt: z.string().optional(),
  panoramics: z.array(z.object({
    url: z.string(),
    name: z.string(),
    uploadedAt: z.string(),
  })).optional(),
  odontogram: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
});

export const PatientFileSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  name: z.string(),
  url: z.string(),
  type: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
});

export const MedicalHistorySchema = z.object({
  id: z.string(),
  patientId: z.string(),
  appointmentId: z.string().optional(),
  date: z.string(),
  diagnosis: z.string(),
  treatment: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
});

// Appointment schemas
export const RecurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  interval: z.number().min(1),
  endDate: z.string().optional(),
  count: z.number().min(1).optional(),
});

export const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number().min(1),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']),
  type: z.string(),
  notes: z.string().optional(),
  insuranceId: z.string().optional(),
  authorizationCode: z.string().optional(),
  isRecurrent: z.boolean().optional(),
  recurrenceRule: RecurrenceRuleSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
});

// Insurance schemas
export const InsuranceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['obra-social', 'prepaga']),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
});

export const InsuranceFeeSchema = z.object({
  id: z.string(),
  insuranceId: z.string(),
  consultationType: z.string(),
  amount: z.number().min(0),
  validFrom: z.string(),
  validTo: z.string().optional(),
  userId: z.string(),
});

export const AuthorizationSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  insuranceId: z.string(),
  code: z.string(),
  consultationType: z.string(),
  sessionsAuthorized: z.number().min(1),
  sessionsUsed: z.number().min(0),
  validFrom: z.string(),
  validTo: z.string(),
  status: z.enum(['active', 'expired', 'exhausted']),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
});

// Payment schemas
export const PaymentSchema = z.object({
  id: z.string(),
  appointmentId: z.string().optional(),
  patientId: z.string(),
  patientName: z.string(),
  insuranceId: z.string().optional(),
  amount: z.number().min(0),
  method: z.enum(['cash', 'transfer', 'credit-card', 'debit-card', 'insurance']),
  status: z.enum(['pending', 'completed', 'cancelled']),
  date: z.string(),
  consultationType: z.string(),
  authorizationCode: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
});

// User profile schemas
export const TimeSlotSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
});

export const WorkingHoursSchema = z.object({
  monday: z.array(TimeSlotSchema).optional(),
  tuesday: z.array(TimeSlotSchema).optional(),
  wednesday: z.array(TimeSlotSchema).optional(),
  thursday: z.array(TimeSlotSchema).optional(),
  friday: z.array(TimeSlotSchema).optional(),
  saturday: z.array(TimeSlotSchema).optional(),
  sunday: z.array(TimeSlotSchema).optional(),
});

export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().optional(),
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  defaultAppointmentDuration: z.number().min(1),
  workingHours: WorkingHoursSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Helper function to safely parse Firestore data
export function parseFirestoreData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Helper function with fallback
export function safeParseFirestoreData<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error('Validation error:', result.error);
  return null;
}

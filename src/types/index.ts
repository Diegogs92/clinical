// Patient types
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email?: string;
  phone: string;
  birthDate?: string;
  address?: string;
  insuranceType?: 'obra-social' | 'prepaga' | 'particular'; // Tipo de cobertura
  insuranceName?: string; // Nombre de la obra social o prepaga (texto libre)
  insuranceId?: string; // Obra Social ID (si existe en la base)
  insuranceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: string; // Professional ID
}

export interface PatientFile {
  id: string;
  patientId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface MedicalHistory {
  id: string;
  patientId: string;
  appointmentId?: string;
  date: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  createdAt: string;
}

// Appointment types
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  type: string; // consultation type
  notes?: string;
  insuranceId?: string;
  authorizationCode?: string;
  isRecurrent?: boolean;
  recurrenceRule?: RecurrenceRule;
  createdAt: string;
  updatedAt: string;
  userId: string; // Professional ID
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  endDate?: string;
  count?: number; // number of occurrences
}

// Insurance types
export interface Insurance {
  id: string;
  name: string;
  type: 'obra-social' | 'prepaga';
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: string; // Professional ID
}

export interface InsuranceFee {
  id: string;
  insuranceId: string;
  consultationType: string;
  amount: number;
  validFrom: string;
  validTo?: string;
  userId: string;
}

export interface Authorization {
  id: string;
  patientId: string;
  insuranceId: string;
  code: string;
  consultationType: string;
  sessionsAuthorized: number;
  sessionsUsed: number;
  validFrom: string;
  validTo: string;
  status: 'active' | 'expired' | 'exhausted';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// Payment types
export interface Payment {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  insuranceId?: string;
  amount: number;
  method: 'cash' | 'transfer' | 'credit-card' | 'debit-card' | 'insurance';
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
  consultationType: string;
  authorizationCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: string; // Professional ID
}

// User/Professional types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  specialty?: string;
  licenseNumber?: string;
  phone?: string;
  address?: string;
  defaultAppointmentDuration: number; // in minutes
  workingHours?: WorkingHours;
  createdAt: string;
  updatedAt: string;
}

export interface WorkingHours {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

// Statistics types
export interface Statistics {
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  pendingPayments: number;
  monthlyRevenue: MonthlyRevenue[];
  appointmentsByStatus: { [key: string]: number };
  paymentsByMethod: { [key: string]: number };
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  appointments: number;
}

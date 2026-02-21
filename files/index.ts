// src/types/index.ts

export type UserRole = 'patient' | 'clinician' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Patient extends User {
  role: 'patient';
  assignedClinicianId?: string;
  diagnoses: string[];
  medications: Medication[];
  dateOfBirth?: string;
  phone?: string;
}

export interface Clinician extends User {
  role: 'clinician';
  specialty?: string;
  patientIds: string[];
}

export interface Admin extends User {
  role: 'admin';
}

// ─── Medication ────────────────────────────────────────────
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g. "Twice daily"
  times: string[];   // e.g. ["08:00", "20:00"]
  prescribedBy: string; // clinicianId
  startDate: string;
  endDate?: string;
  instructions?: string;
}

export interface MedicationLog {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenAt?: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  note?: string;
  date: string; // YYYY-MM-DD
}

// ─── Appointment ────────────────────────────────────────────
export type AppointmentType = 'physical' | 'virtual';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface Appointment {
  id: string;
  patientId: string;
  clinicianId: string;
  patientName: string;
  clinicianName: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string; // ISO datetime
  duration: number;    // minutes
  venue?: string;      // for physical
  meetingLink?: string; // for virtual
  notes?: string;
  createdAt: string;
}

// ─── Todo ────────────────────────────────────────────────────
export interface TodoItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  category?: 'health' | 'medication' | 'appointment' | 'general';
  createdAt: string;
}

// ─── AI Chat ─────────────────────────────────────────────────
export type MessageSender = 'patient' | 'ai' | 'clinician';
export type EscalationStatus = 'pending' | 'reviewed' | 'resolved';

export interface ChatMessage {
  id: string;
  patientId: string;
  sender: MessageSender;
  message: string;
  timestamp: string;
  isEscalated: boolean;
  escalationStatus?: EscalationStatus;
  escalatedTo?: string; // clinicianId
  sessionId: string;
}

export interface EscalatedEnquiry {
  id: string;
  patientId: string;
  patientName: string;
  sessionId: string;
  messages: ChatMessage[];
  escalatedAt: string;
  status: EscalationStatus;
  clinicianNote?: string;
  assignedClinicianId?: string;
}

// ─── Video Call ───────────────────────────────────────────────
export interface VideoCall {
  id: string;
  patientId: string;
  clinicianId: string;
  roomId: string;
  status: 'initiated' | 'active' | 'ended';
  startedAt?: string;
  endedAt?: string;
  initiatedBy: string;
}

// ─── Analytics ────────────────────────────────────────────────
export interface MedicationAdherence {
  patientId: string;
  patientName: string;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  adherenceRate: number; // percentage
  period: 'week' | 'month';
}

export interface LoginHistory {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  loginAt: string;
  device?: string;
  ipAddress?: string;
}

// ─── Navigation ───────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  PatientTabs: undefined;
  ClinicianTabs: undefined;
  AdminTabs: undefined;
};

export type PatientTabParamList = {
  Dashboard: undefined;
  Medications: undefined;
  Appointments: undefined;
  Chat: undefined;
  Todo: undefined;
};

export type ClinicianTabParamList = {
  Patients: undefined;
  Appointments: undefined;
  Enquiries: undefined;
  Analytics: undefined;
  Todo: undefined;
};

export type AdminTabParamList = {
  UserManagement: undefined;
  AIAnalytics: undefined;
  LoginHistory: undefined;
};

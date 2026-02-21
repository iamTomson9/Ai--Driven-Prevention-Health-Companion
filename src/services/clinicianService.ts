import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Patient,
  Clinician,
  Appointment,
  AppointmentType,
  EscalatedEnquiry,
  MedicationAdherence,
  Medication,
} from '../types';
import { generateDailyMedicationLogs } from './patientService';

// Clinician Profile 
export const getClinicianProfile = async (clinicianId: string): Promise<Clinician | null> => {
  const snap = await getDoc(doc(db, 'clinicians', clinicianId));
  if (!snap.exists()) return null;
  return { ...snap.data(), uid: snap.id } as Clinician;
};

// Patients
export const getClinicianPatients = async (clinicianId: string): Promise<Patient[]> => {
  const q = query(
    collection(db, 'patients'),
    where('assignedClinicianId', '==', clinicianId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as Patient));
};

export const getPatientById = async (patientId: string): Promise<Patient | null> => {
  const snap = await getDoc(doc(db, 'patients', patientId));
  if (!snap.exists()) return null;
  return { ...snap.data(), uid: snap.id } as Patient;
};

export const assignPatientToClinician = async (
  patientId: string,
  clinicianId: string
): Promise<void> => {
  await updateDoc(doc(db, 'patients', patientId), {
    assignedClinicianId: clinicianId,
  });
  await updateDoc(doc(db, 'clinicians', clinicianId), {
    patientIds: arrayUnion(patientId),
  });
};

export const setPatientDiagnoses = async (
  patientId: string,
  diagnoses: string[]
): Promise<void> => {
  await updateDoc(doc(db, 'patients', patientId), { diagnoses });
};

// Medications
export const setPatientMedications = async (
  patientId: string,
  medications: Medication[]
): Promise<void> => {
  await updateDoc(doc(db, 'patients', patientId), { medications });

  // Generate today's medication logs right away
  const today = new Date().toISOString().split('T')[0];
  await generateDailyMedicationLogs(patientId, medications, today);
};

export const addMedicationToPatient = async (
  patientId: string,
  medication: Omit<Medication, 'id'>
): Promise<void> => {
  const medWithId: Medication = {
    ...medication,
    id: `med_${Date.now()}`,
  };
  const patient = await getPatientById(patientId);
  if (!patient) throw new Error('Patient not found');

  const updatedMeds = [...patient.medications, medWithId];
  await setPatientMedications(patientId, updatedMeds);
};

export const removeMedicationFromPatient = async (
  patientId: string,
  medicationId: string
): Promise<void> => {
  const patient = await getPatientById(patientId);
  if (!patient) throw new Error('Patient not found');

  const updatedMeds = patient.medications.filter((m) => m.id !== medicationId);
  await updateDoc(doc(db, 'patients', patientId), { medications: updatedMeds });
};

// Appointments
export const getClinicianAppointments = async (clinicianId: string): Promise<Appointment[]> => {
  const q = query(
    collection(db, 'appointments'),
    where('clinicianId', '==', clinicianId),
    orderBy('scheduledAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Appointment));
};

export const createAppointment = async (
  appointment: Omit<Appointment, 'id'>
): Promise<string> => {
  const ref = await addDoc(collection(db, 'appointments'), appointment);
  return ref.id;
};

export const updateAppointment = async (
  appointmentId: string,
  data: Partial<Appointment>
): Promise<void> => {
  await updateDoc(doc(db, 'appointments', appointmentId), data);
};

export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  await updateDoc(doc(db, 'appointments', appointmentId), {
    status: 'cancelled',
  });
};

// Escalated Enquiries
export const getEscalatedEnquiries = async (
  clinicianId: string
): Promise<EscalatedEnquiry[]> => {
  const q = query(
    collection(db, 'escalatedEnquiries'),
    where('assignedClinicianId', '==', clinicianId),
    where('status', '==', 'pending'),
    orderBy('escalatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as EscalatedEnquiry));
};

export const resolveEnquiry = async (
  enquiryId: string,
  clinicianNote: string
): Promise<void> => {
  await updateDoc(doc(db, 'escalatedEnquiries', enquiryId), {
    status: 'resolved',
    clinicianNote,
  });
};

export const markEnquiryReviewed = async (enquiryId: string): Promise<void> => {
  await updateDoc(doc(db, 'escalatedEnquiries', enquiryId), {
    status: 'reviewed',
  });
};

// Patient Analytics
export const getPatientMedicationAdherence = async (
  patientId: string,
  period: 'week' | 'month'
): Promise<MedicationAdherence | null> => {
  const now = new Date();
  const daysBack = period === 'week' ? 7 : 30;
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - daysBack);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = now.toISOString().split('T')[0];

  const q = query(
    collection(db, 'medicationLogs'),
    where('patientId', '==', patientId),
    where('date', '>=', startStr),
    where('date', '<=', endStr)
  );
  const snap = await getDocs(q);
  const logs = snap.docs.map((d) => d.data());

  if (logs.length === 0) return null;

  const totalDoses = logs.length;
  const takenDoses = logs.filter((l) => l.status === 'taken').length;
  const missedDoses = logs.filter((l) => l.status === 'missed').length;
  const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  const patient = await getPatientById(patientId);

  return {
    patientId,
    patientName: patient?.displayName || 'Unknown',
    totalDoses,
    takenDoses,
    missedDoses,
    adherenceRate,
    period,
  };
};

export const getAllPatientsAdherence = async (
  clinicianId: string
): Promise<MedicationAdherence[]> => {
  const patients = await getClinicianPatients(clinicianId);
  const results = await Promise.all(
    patients.map((p) => getPatientMedicationAdherence(p.uid, 'week'))
  );
  return results.filter((r): r is MedicationAdherence => r !== null);
};

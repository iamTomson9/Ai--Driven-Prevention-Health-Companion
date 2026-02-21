// src/services/patientService.ts
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
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Patient, MedicationLog, Appointment, TodoItem } from '../types';

// ─── Patient Profile ──────────────────────────────────────────
export const getPatientProfile = async (patientId: string): Promise<Patient | null> => {
  const snap = await getDoc(doc(db, 'patients', patientId));
  if (!snap.exists()) return null;
  return { ...snap.data(), uid: snap.id } as Patient;
};

export const updatePatientProfile = async (
  patientId: string,
  data: Partial<Patient>
): Promise<void> => {
  await updateDoc(doc(db, 'patients', patientId), data);
  await updateDoc(doc(db, 'users', patientId), data);
};

// ─── Medication Logs ──────────────────────────────────────────
export const getTodayMedicationLogs = async (patientId: string): Promise<MedicationLog[]> => {
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, 'medicationLogs'),
    where('patientId', '==', patientId),
    where('date', '==', today)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as MedicationLog));
};

export const getMedicationLogsByRange = async (
  patientId: string,
  startDate: string,
  endDate: string
): Promise<MedicationLog[]> => {
  const q = query(
    collection(db, 'medicationLogs'),
    where('patientId', '==', patientId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as MedicationLog));
};

export const markMedicationTaken = async (
  logId: string,
  takenAt: string,
  note?: string
): Promise<void> => {
  await updateDoc(doc(db, 'medicationLogs', logId), {
    status: 'taken',
    takenAt,
    note: note || null,
  });
};

export const markMedicationSkipped = async (logId: string, note?: string): Promise<void> => {
  await updateDoc(doc(db, 'medicationLogs', logId), {
    status: 'skipped',
    note: note || null,
  });
};

// Generate daily medication logs for a patient (call when medication is set/updated)
export const generateDailyMedicationLogs = async (
  patientId: string,
  medications: Patient['medications'],
  date: string
): Promise<void> => {
  const batch: Promise<void>[] = [];

  for (const med of medications) {
    for (const time of med.times) {
      const logRef = doc(
        collection(db, 'medicationLogs')
      );
      batch.push(
        setDoc(logRef, {
          patientId,
          medicationId: med.id,
          medicationName: med.name,
          scheduledTime: time,
          status: 'pending',
          date,
          takenAt: null,
          note: null,
        } as Omit<MedicationLog, 'id'>)
      );
    }
  }

  await Promise.all(batch);
};

// ─── Appointments ─────────────────────────────────────────────
export const getPatientAppointments = async (patientId: string): Promise<Appointment[]> => {
  const q = query(
    collection(db, 'appointments'),
    where('patientId', '==', patientId),
    orderBy('scheduledAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Appointment));
};

export const getUpcomingAppointments = async (patientId: string): Promise<Appointment[]> => {
  const now = new Date().toISOString();
  const q = query(
    collection(db, 'appointments'),
    where('patientId', '==', patientId),
    where('scheduledAt', '>=', now),
    where('status', '==', 'scheduled'),
    orderBy('scheduledAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Appointment));
};

// ─── Todo Items ───────────────────────────────────────────────
export const getUserTodos = async (userId: string): Promise<TodoItem[]> => {
  const q = query(
    collection(db, 'todos'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as TodoItem));
};

export const createTodo = async (todo: Omit<TodoItem, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'todos'), todo);
  return ref.id;
};

export const updateTodo = async (todoId: string, data: Partial<TodoItem>): Promise<void> => {
  await updateDoc(doc(db, 'todos', todoId), data);
};

export const deleteTodo = async (todoId: string): Promise<void> => {
  await deleteDoc(doc(db, 'todos', todoId));
};

export const toggleTodoComplete = async (
  todoId: string,
  completed: boolean
): Promise<void> => {
  await updateDoc(doc(db, 'todos', todoId), { completed });
};

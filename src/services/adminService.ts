import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, LoginHistory, EscalatedEnquiry, MedicationAdherence } from '../types';
import { registerUser, toggleUserStatus } from './authService';

//managing users 
export const getAllUsers = async (): Promise<User[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as User));
};

export const createUserAccount = async (
  email: string,
  password: string,
  displayName: string,
  role: User['role']
): Promise<User> => {
  return registerUser(email, password, displayName, role);
};

export const activateUser = async (uid: string): Promise<void> => {
  await toggleUserStatus(uid, true);
};

export const deactivateUser = async (uid: string): Promise<void> => {
  await toggleUserStatus(uid, false);
};

// view the login history fo users 
export const getAllLoginHistory = async (limitCount = 100): Promise<LoginHistory[]> => {
  const q = query(
    collection(db, 'loginHistory'),
    orderBy('loginAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as LoginHistory));
};

export const getUserLoginHistory = async (userId: string): Promise<LoginHistory[]> => {
  const q = query(
    collection(db, 'loginHistory'),
    where('userId', '==', userId),
    orderBy('loginAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as LoginHistory));
};

// viewing the analytics for the Ai
export interface AIAnalytics {
  totalConversations: number;
  totalMessages: number;
  escalatedCount: number;
  escalationRate: number;
  resolvedEnquiries: number;
  pendingEnquiries: number;
  topKeywords: { keyword: string; count: number }[];
}

export const getAIAnalytics = async (): Promise<AIAnalytics> => {
  const [messagesSnap, enquiriesSnap] = await Promise.all([
    getDocs(collection(db, 'chatMessages')),
    getDocs(collection(db, 'escalatedEnquiries')),
  ]);

  const messages = messagesSnap.docs.map((d) => d.data());
  const enquiries = enquiriesSnap.docs.map((d) => d.data());

  const sessions = new Set(messages.map((m) => m.sessionId));
  const escalated = messages.filter((m) => m.isEscalated).length;

  // keyword count for when the user need help
  const keywordMap: Record<string, number> = {};
  const patientMessages = messages.filter((m) => m.sender === 'patient');
  patientMessages.forEach((m) => {
    const words = (m.message as string).toLowerCase().split(/\s+/);
    words
      .filter((w) => w.length > 4)
      .forEach((w) => {
        keywordMap[w] = (keywordMap[w] || 0) + 1;
      });
  });

  const topKeywords = Object.entries(keywordMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));

  return {
    totalConversations: sessions.size,
    totalMessages: messages.length,
    escalatedCount: escalated,
    escalationRate:
      messages.length > 0 ? Math.round((escalated / messages.length) * 100) : 0,
    resolvedEnquiries: enquiries.filter((e) => e.status === 'resolved').length,
    pendingEnquiries: enquiries.filter((e) => e.status === 'pending').length,
    topKeywords,
  };
};

// viewing the medication adherence stats for the patients
export const getSystemAdherenceStats = async (): Promise<{
  averageAdherence: number;
  totalPatients: number;
  highRiskPatients: number;
}> => {
  const patientsSnap = await getDocs(collection(db, 'patients'));
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const logsSnap = await getDocs(
    query(
      collection(db, 'medicationLogs'),
      where('date', '>=', weekAgoStr),
      where('date', '<=', today)
    )
  );

  const logs = logsSnap.docs.map((d) => d.data());
  const patientLogs: Record<string, { total: number; taken: number }> = {};

  logs.forEach((l) => {
    if (!patientLogs[l.patientId]) {
      patientLogs[l.patientId] = { total: 0, taken: 0 };
    }
    patientLogs[l.patientId].total++;
    if (l.status === 'taken') patientLogs[l.patientId].taken++;
  });

  const adherenceRates = Object.values(patientLogs).map(({ total, taken }) =>
    total > 0 ? (taken / total) * 100 : 0
  );

  const averageAdherence =
    adherenceRates.length > 0
      ? Math.round(adherenceRates.reduce((a, b) => a + b, 0) / adherenceRates.length)
      : 0;

  const highRiskPatients = adherenceRates.filter((r) => r < 60).length;

  return {
    averageAdherence,
    totalPatients: patientsSnap.size,
    highRiskPatients,
  };
};

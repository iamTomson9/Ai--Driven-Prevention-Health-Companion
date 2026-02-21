import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import { ChatMessage, EscalatedEnquiry } from '../types';

const BOTPRESS_WEBHOOK_URL = process.env.EXPO_PUBLIC_BOTPRESS_WEBHOOK_URL || '';

// Keywords that trigger escalation
const ESCALATION_KEYWORDS = [
  'emergency', 'chest pain', 'can\'t breathe', 'shortness of breath',
  'severe pain', 'allergic reaction', 'overdose', 'suicidal', 'urgent',
  'bleeding', 'unconscious', 'seizure', 'stroke', 'heart attack',
];

const shouldEscalate = (message: string): boolean => {
  const lower = message.toLowerCase();
  return ESCALATION_KEYWORDS.some((kw) => lower.includes(kw));
};

// Send Message to Botpress
export const sendMessageToAI = async (
  patientId: string,
  message: string,
  sessionId: string,
  assignedClinicianId?: string
): Promise<{ reply: string; escalated: boolean }> => {
  // Save patient message
  const patientMsg: Omit<ChatMessage, 'id'> = {
    patientId,
    sender: 'patient',
    message,
    timestamp: new Date().toISOString(),
    isEscalated: false,
    sessionId,
  };
  await addDoc(collection(db, 'chatMessages'), patientMsg);

  // Check for emergency keywords BEFORE sending to Botpress
  const escalate = shouldEscalate(message);

  let aiReply = '';

  try {
    const response = await fetch(BOTPRESS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: patientId,
        sessionId,
        message,
        escalate,
      }),
    });

    const data = await response.json();
    aiReply = data.reply || data.text || 'I understand your concern. A doctor will follow up shortly.';
  } catch (err) {
    aiReply = escalate
      ? 'This message has been escalated to your doctor for urgent review.'
      : 'I amm sorry, I am having trouble connecting. Please try again or contact your doctor directly.';
  }

  // Save AI response
  const aiMsg: Omit<ChatMessage, 'id'> = {
    patientId,
    sender: 'ai',
    message: aiReply,
    timestamp: new Date().toISOString(),
    isEscalated: escalate,
    sessionId,
  };
  await addDoc(collection(db, 'chatMessages'), aiMsg);

  // Escalate if needed
  if (escalate && assignedClinicianId) {
    await escalateToClinicianr(patientId, sessionId, assignedClinicianId, message);
  }

  return { reply: aiReply, escalated: escalate };
};

// Escalate to Clinician 
const escalateToClinicianr = async (
  patientId: string,
  sessionId: string,
  clinicianId: string,
  triggerMessage: string
): Promise<void> => {
  // Get session messages
  const q = query(
    collection(db, 'chatMessages'),
    where('patientId', '==', patientId),
    where('sessionId', '==', sessionId),
    orderBy('timestamp', 'asc')
  );
  const snap = await getDocs(q);
  const messages = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ChatMessage));

  const enquiry: Omit<EscalatedEnquiry, 'id'> = {
    patientId,
    patientName: '', // Will be populated in UI from patient profile
    sessionId,
    messages,
    escalatedAt: new Date().toISOString(),
    status: 'pending',
    assignedClinicianId: clinicianId,
  };

  await addDoc(collection(db, 'escalatedEnquiries'), enquiry);
};

// Get Chat History
export const getChatHistory = async (
  patientId: string,
  sessionId?: string
): Promise<ChatMessage[]> => {
  let q = sessionId
    ? query(
        collection(db, 'chatMessages'),
        where('patientId', '==', patientId),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      )
    : query(
        collection(db, 'chatMessages'),
        where('patientId', '==', patientId),
        orderBy('timestamp', 'asc')
      );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ChatMessage));
};

export const generateSessionId = (): string =>
  `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
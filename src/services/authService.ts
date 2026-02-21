import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserRole, LoginHistory } from '../types';

// User Sign Up
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  const userData: User = {
    uid: credential.user.uid,
    email,
    displayName,
    role,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  // Store in role-specific collection AND unified users collection
  await setDoc(doc(db, 'users', credential.user.uid), userData);

  if (role === 'patient') {
    await setDoc(doc(db, 'patients', credential.user.uid), {
      ...userData,
      assignedClinicianId: null,
      diagnoses: [],
      medications: [],
    });
  } else if (role === 'clinician') {
    await setDoc(doc(db, 'clinicians', credential.user.uid), {
      ...userData,
      patientIds: [],
      specialty: '',
    });
  }

  return userData;
};

// User Sign In 
export const loginUser = async (email: string, password: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));

  if (!userDoc.exists()) throw new Error('User profile not found');

  const userData = userDoc.data() as User;

  if (!userData.isActive) throw new Error('Account is deactivated. Please contact admin.');

  // Log login history
  await addDoc(collection(db, 'loginHistory'), {
    userId: userData.uid,
    userEmail: userData.email,
    userRole: userData.role,
    loginAt: new Date().toISOString(),
    device: 'mobile',
  } as Omit<LoginHistory, 'id'>);

  return userData;
};

//User Sign Out
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

//Get Current User Profile
export const getUserProfile = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return userDoc.data() as User;
};

//Toggle User Active Status
export const toggleUserStatus = async (uid: string, isActive: boolean): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { isActive });
};

export const getCurrentFirebaseUser = (): FirebaseUser | null => auth.currentUser;

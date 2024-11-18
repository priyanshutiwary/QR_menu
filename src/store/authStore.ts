import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthState {
  user: any;
  userType: 'restaurant' | 'customer' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, data: any, type: 'restaurant' | 'customer') => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: any) => void;
  loadUserType: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userType: null,
  loading: true,
  signIn: async (email, password) => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
    const userData = userDoc.data();
    set({ userType: userData?.type });
  },
  signUp: async (email, password, data, type) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userData = {
      email,
      type,
      createdAt: new Date().toISOString(),
      ...data
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    
    if (type === 'restaurant') {
      await setDoc(doc(db, 'restaurants', userCredential.user.uid), {
        ...data,
        email,
        createdAt: new Date().toISOString(),
      });
    }
    
    set({ userType: type });
  },
  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, userType: null });
  },
  setUser: (user) => set({ user, loading: false }),
  loadUserType: async () => {
    const { user } = get();
    if (!user) return;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    set({ userType: userData?.type });
  }
}));
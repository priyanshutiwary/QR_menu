import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCvHfQrZGyK3BTbGRDG_OrhVAUT_KlW2CY",
  authDomain: "qr-menu-153fd.firebaseapp.com",
  projectId: "qr-menu-153fd",
  storageBucket: "qr-menu-153fd.firebasestorage.app",
  messagingSenderId: "803023568126",
  appId: "1:803023568126:web:33a8fb8aafa0b2e37079af",
  measurementId: "G-F9ZT105EXY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
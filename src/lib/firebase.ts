import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const authReady: Promise<void> = new Promise((resolve) => {
  let resolved = false;
  const done = () => {
    if (resolved) return;
    resolved = true;
    resolve();
  };

  onAuthStateChanged(auth, (u) => {
    if (u) done();
  });

  // Ensure we have a Firebase auth user for Firestore security rules
  if (!auth.currentUser) {
    signInAnonymously(auth)
      .then(() => done())
      .catch((err) => {
        console.warn(
          'Firebase anonymous sign-in failed. Enable Anonymous provider in Firebase Auth.',
          err?.code || err?.message || err
        );
        // Still resolve so UI can continue without realtime listeners
        done();
      });
  } else {
    done();
  }
});

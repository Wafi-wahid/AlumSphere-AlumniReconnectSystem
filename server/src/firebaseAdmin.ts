import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK only once
export function initFirebaseAdmin() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    // Try application default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
    try {
      initializeApp({ credential: applicationDefault() });
      console.log('[firebase-admin] initialized with applicationDefault credentials');
      return;
    } catch (e: any) {
      throw new Error(
        '[firebase-admin] Failed to initialize. Provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or set GOOGLE_APPLICATION_CREDENTIALS. ' +
          (e?.message ? `Root error: ${e.message}` : '')
      );
    }
  }

  // Handle escaped newlines in env
  privateKey = privateKey.replace(/\\n/g, '\n');
  try {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    console.log('[firebase-admin] initialized with service account from env');
  } catch (e: any) {
    throw new Error(
      '[firebase-admin] Failed to initialize with service account env vars. Check FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. ' +
        (e?.message ? `Root error: ${e.message}` : '')
    );
  }
}

export { getAuth, getFirestore };

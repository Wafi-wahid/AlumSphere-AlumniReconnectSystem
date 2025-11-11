import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK only once
export function initFirebaseAdmin() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  try {
    if (!projectId || !clientEmail || !privateKey) {
      // Try application default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
      initializeApp({ credential: applicationDefault() });
      console.log('[firebase-admin] initialized with applicationDefault credentials');
      return;
    }
    // Handle escaped newlines in env
    privateKey = privateKey.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    console.log('[firebase-admin] initialized with service account from env');
  } catch (e) {
    console.warn('[firebase-admin] initialization failed; realtime features may be limited', e);
  }
}

export { getAuth, getFirestore };

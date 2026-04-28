import { Request, Response, NextFunction } from "express";
import { getAuth } from "../firebaseAdmin";

export interface FirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  customClaims?: {
    role?: string;
    [key: string]: any;
  };
}

/**
 * Middleware to verify Firebase ID token from Authorization header
 * Expects header format: "Authorization: Bearer <firebase_id_token>"
 */
export async function requireFirebaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No Firebase ID token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).firebaseUser = decodedToken;
    next();
  } catch (error: any) {
    console.error('[firebase-auth] Token verification failed:', error);
    return res.status(401).json({ 
      error: 'Invalid or expired Firebase ID token',
      details: error?.message || 'Token verification failed'
    });
  }
}

/**
 * Optional Firebase auth - doesn't fail if token is missing/invalid
 * Sets firebaseUser on request if token is valid
 */
export async function optionalFirebaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).firebaseUser = decodedToken;
  } catch (error) {
    // Silently fail for optional auth
    console.warn('[firebase-auth] Optional token verification failed:', error);
  }
  
  next();
}

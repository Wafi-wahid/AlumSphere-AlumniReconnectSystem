import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { User } from '../models/User';
import { Types } from 'mongoose';
import { initFirebaseAdmin, getAuth as getAdminAuth, getFirestore as getAdminFirestore } from '../firebaseAdmin';

export const authRouter = Router();

const baseUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, 'Password must contain letters and numbers'),
  role: z.enum(['student', 'alumni']).optional(),
});

// Google OAuth 2.0
// GET /auth/google/start
authRouter.get('/google/start', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const scope = encodeURIComponent('openid email profile');
  const state = Math.random().toString(36).slice(2);
  const role = (req.query.role as string) || 'alumni'; // Default to alumni if not specified
  res.cookie('go_state', state, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
  res.cookie('go_role', role, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
  console.log('[google:start] building authorization url', { redirectUri, scope: 'openid email profile', state, role });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri || ''
  )}&scope=${scope}&state=${state}`;
  return res.redirect(url);
});

// GET /auth/google/callback
authRouter.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query as { code?: string; state?: string; error?: string; error_description?: string };
    const appRedirect = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
    const roleCookie = (req as any).cookies?.go_role as string | undefined;
    console.log('[google:callback] query received', { hasCode: !!code, state, error, error_description, role: roleCookie });
    if (error) {
      res.cookie('go_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('go_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      console.error('[google:callback] provider returned error', { error, error_description });
      return res.redirect(`${appRedirect}/register?li_error=${encodeURIComponent(error_description || error)}`);
    }
    if (!code) {
      console.error('[google:callback] missing code');
      res.cookie('go_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('go_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      return res.redirect(`${appRedirect}/register?li_error=${encodeURIComponent('Missing authorization code')}`);
    }
    const redirectUri = process.env.GOOGLE_REDIRECT_URI as string;
    const stateCookie = (req as any).cookies?.go_state as string | undefined;
    if (!state || !stateCookie || state !== stateCookie) {
      res.cookie('go_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('go_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      console.error('[google:callback] invalid state', { state, hasStateCookie: !!stateCookie });
      return res.redirect(`${appRedirect}/register?li_error=${encodeURIComponent('Invalid OAuth state')}`);
    }

    // Exchange code for access token
    console.log('[google:callback] exchanging code for token', { redirectUri });
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('[google:callback] token exchange ok', { status: tokenRes.status });
    const accessToken = tokenRes.data.access_token as string;

    // Fetch OIDC userinfo
    console.log('[google:callback] fetching userinfo (OIDC)');
    const userinfoRes = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('[google:callback] userinfo fetch ok', { status: userinfoRes.status });

    const u = userinfoRes.data as any;
    const email = (u.email as string | undefined)?.toLowerCase();
    const name = (u.name as string) || `${u.given_name || ''} ${u.family_name || ''}`.trim();
    const picture = (u.picture as string | undefined) || '';

    // Validate email domain for students
    if (roleCookie === 'student' && email && !email.endsWith('@students.riphah.edu.pk')) {
      res.cookie('go_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('go_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      console.error('[google:callback] student email domain validation failed', { email });
      return res.redirect(`${appRedirect}/login?error=${encodeURIComponent('Student login requires @students.riphah.edu.pk email domain. Please sign in with your student email.')}`);
    }

    // If email matches existing user, log them in
    if (email) {
      const existing = await User.findOne({ email });
      if (existing) {
        // Validate role matches existing user's role
        if (roleCookie === 'student' && existing.role !== 'student') {
          res.cookie('go_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
          res.cookie('go_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
          return res.redirect(`${appRedirect}/login?error=${encodeURIComponent('This account is registered as ' + existing.role + '. Please use the ' + existing.role + ' login form.')}`);
        }
        signAndSetCookie(res, { id: String(existing._id), role: existing.role });
        res.cookie('go_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
        res.cookie('go_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
        return res.redirect(appRedirect);
      }
    }

    // Prefill registration data
    const prefill = { name, email: email || '', profilePicture: picture, linkedinId: '' };
    res.cookie('li_prefill', JSON.stringify(prefill), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
    res.cookie('go_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
    res.cookie('go_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
    return res.redirect(`${appRedirect}/register?role=${roleCookie || 'alumni'}`);
  } catch (e: any) {
    const appRedirect = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
    const details = e?.response?.data?.error_description || e?.response?.data || e?.message || 'Google auth failed';
    console.error('[google:callback] exception', { details });
    res.cookie('go_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
    res.cookie('go_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
    return res.redirect(`${appRedirect}/register?li_error=${encodeURIComponent(String(details))}`);
  }
});

const studentSchema = baseUserSchema.extend({
  role: z.literal('student'),
  sapId: z.string().regex(/^\d{5}$/, 'SAP ID must be exactly 5 digits'),
  program: z.enum(['BS', 'BBA', 'MS', 'MBA', 'PhD', 'Other']),
  customProgram: z.string().optional(),
  department: z.string().min(2, 'Enter your department'),
  batchSeason: z.enum(['Spring', 'Fall']),
  batchYear: z.number().int().min(2010).max(2025),
  email: z.string().email().refine((email) => email.endsWith('@students.riphah.edu.pk'), {
    message: 'Student registration requires @students.riphah.edu.pk email domain'
  }),
});

const alumniSchema = baseUserSchema.extend({
  role: z.literal('alumni'),
  program: z.enum(['BS', 'BBA', 'MS', 'MBA', 'PhD', 'Other']).optional(),
  customProgram: z.string().optional(),
  department: z.string().min(2, 'Enter your department').optional(),
  gradSeason: z.enum(['Spring', 'Fall']),
  gradYear: z.number().int().min(2010).max(2025),
  linkedinId: z.string().optional(),
});

function signAndSetCookie(res: any, payload: { id: string; role: string }) {
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// POST /auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const role = (req.body.role as string) || 'student';
    const parsed = role === 'student' ? studentSchema.parse(req.body) : alumniSchema.parse({ ...req.body, role: 'alumni' });

    // duplicates
    const existingByEmail = await User.findOne({ email: parsed.email });
    if (existingByEmail) return res.status(409).json({ error: 'Email already registered' });

    if ('sapId' in parsed && parsed.sapId) {
      const existingSap = await User.findOne({ sapId: parsed.sapId });
      if (existingSap) return res.status(409).json({ error: 'SAP ID already registered' });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const doc = await User.create({
      name: parsed.name,
      email: parsed.email,
      passwordHash,
      role: parsed.role,
      sapId: 'sapId' in parsed ? (parsed as any).sapId : undefined,
      program: 'program' in parsed ? (parsed as any).program === 'Other' ? (parsed as any).customProgram : (parsed as any).program : undefined,
      customProgram: 'customProgram' in parsed ? (parsed as any).customProgram : undefined,
      department: 'department' in parsed ? (parsed as any).department : undefined,
      batchSeason: 'batchSeason' in parsed ? (parsed as any).batchSeason : undefined,
      batchYear: 'batchYear' in parsed ? (parsed as any).batchYear : undefined,
      gradSeason: 'gradSeason' in parsed ? (parsed as any).gradSeason : undefined,
      gradYear: 'gradYear' in parsed ? (parsed as any).gradYear : undefined,
      linkedinId: 'linkedinId' in parsed ? (parsed as any).linkedinId ?? undefined : undefined,
      onboardingRequired: true,
      onboardingCompleted: false,
      onboardingStep: 0,
    });
    const user = { id: String(doc._id), role: doc.role, name: doc.name, email: doc.email, profilePicture: doc.profilePicture } as any;

    signAndSetCookie(res, { id: user.id, role: user.role });
    return res.status(201).json({ user });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.flatten() });
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
const loginSchema = z.object({ 
  email: z.string().email(), 
  password: z.string().min(8),
  role: z.enum(['student', 'alumni', 'admin'])
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password, role } = loginSchema.parse(req.body);
    
    // Validate email domain for students
    if (role === 'student' && !email.endsWith('@students.riphah.edu.pk')) {
      return res.status(400).json({ error: 'Student login requires @students.riphah.edu.pk email domain' });
    }
    
    const doc = await User.findOne({ email });
    if (!doc) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, doc.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Check if user role matches the selected role
    // Allow both admin and super_admin to use admin login form
    if (role === 'admin' && (doc.role === 'admin' || doc.role === 'super_admin')) {
      // Admin form allows both admin and super_admin
    } else if (doc.role !== role) {
      return res.status(401).json({ 
        error: `This account is registered as ${doc.role}. Please use the ${doc.role === 'super_admin' ? 'admin' : doc.role} login form.` 
      });
    }

    signAndSetCookie(res, { id: String(doc._id), role: doc.role });
    return res.json({ user: { id: String(doc._id), role: doc.role, name: doc.name, email: doc.email, profilePicture: doc.profilePicture } });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.flatten() });
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/logout
authRouter.post('/logout', (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0), path: '/' });
  return res.json({ ok: true });
});

// GET /auth/me
authRouter.get('/me', requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  if (!Types.ObjectId.isValid(userId)) {
    // Legacy Prisma session id present — ask client to re-authenticate
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  const doc = await User.findById(userId).select({ _id: 1, role: 1, name: 1, email: 1, profilePicture: 1 });
  const user = doc ? { id: String(doc._id), role: doc.role, name: doc.name, email: doc.email, profilePicture: doc.profilePicture } : null;
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json({ user });
});

// POST /auth/firebase/custom-token — mint a Firebase Custom Token for the currently authenticated user (JWT cookie based)
authRouter.post('/firebase/custom-token', requireAuth, async (req, res) => {
  try {
    initFirebaseAdmin();
    const mongoId = (req as any).user.id as string;
    if (!Types.ObjectId.isValid(mongoId)) return res.status(400).json({ error: 'Invalid user id' });
    const doc = await User.findById(mongoId).lean() as any;
    if (!doc) return res.status(404).json({ error: 'User not found' });
    const uid = String(doc._id);
    const role = doc.role as 'student'|'alumni'|'admin'|'super_admin';
    const adminAuth = getAdminAuth();

    // Ensure Firebase user exists (create if missing)
    try {
      await adminAuth.getUser(uid);
    } catch {
      await adminAuth.createUser({ uid, email: doc.email || undefined, displayName: doc.name || undefined, photoURL: doc.profilePicture || undefined });
    }
    // Sync custom claims for role
    await adminAuth.setCustomUserClaims(uid, { role });

    // Mirror selected profile fields to Firestore for realtime UI
    try {
      const db = getAdminFirestore();
      await db.doc(`users/${uid}`).set({
        name: doc.name || '',
        email: doc.email || '',
        avatar: doc.profilePicture || '',
        profilePicture: doc.profilePicture || '',
        currentCompany: doc.currentCompany || '',
        profileHeadline: doc.profileHeadline || '',
        location: doc.location || '',
        experienceYears: doc.experienceYears || 0,
        skills: Array.isArray(doc.skills) ? doc.skills : String(doc.skills || '').split(',').map((s: string)=>s.trim()).filter(Boolean),
        mentorEligible: !!doc.mentorEligible,
        role,
        updatedAt: new Date(),
      }, { merge: true });
    } catch {}

    const token = await adminAuth.createCustomToken(uid);
    return res.json({ token });
  } catch (e: any) {
    console.error('[firebase:custom-token] error', e);
    return res.status(500).json({ error: 'Failed to create custom token' });
  }
});

// LinkedIn OAuth 2.0
// GET /auth/linkedin/start
authRouter.get('/linkedin/start', requireAuth, (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const scope = encodeURIComponent('openid profile');
  const state = Math.random().toString(36).slice(2);
  res.cookie('li_state', state, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
  console.log('[linkedin:start] building authorization url', { redirectUri, scope: 'openid profile', state });
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri || ''
  )}&scope=${scope}&state=${state}`;
  return res.redirect(url);
});

// GET /auth/linkedin/login/start (direct login via LinkedIn)
authRouter.get('/linkedin/login/start', (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const scope = encodeURIComponent('openid profile email');
  const state = Math.random().toString(36).slice(2);
  const role = (req.query.role as string) || 'alumni'; // Default to alumni if not specified
  res.cookie('li_state', state, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
  res.cookie('li_mode', 'login', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
  res.cookie('li_role', role, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
  console.log('[linkedin:login:start] building authorization url', { redirectUri, scope: 'openid profile email', state, role });
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri || ''
  )}&scope=${scope}&state=${state}`;
  return res.redirect(url);
});

// GET /auth/linkedin/register/start
authRouter.get('/linkedin/register/start', (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const scope = encodeURIComponent('openid profile email');
  const state = Math.random().toString(36).slice(2);
  const role = (req.query.role as string) || 'alumni'; // Default to alumni for registration
  res.cookie('li_state', state, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
  res.cookie('li_role', role, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
  console.log('[linkedin:register:start] building authorization url', { redirectUri, scope: 'openid profile email', state, role });
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri || ''
  )}&scope=${scope}&state=${state}`;
  return res.redirect(url);
});

// GET /auth/linkedin/callback
authRouter.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query as { code?: string; state?: string; error?: string; error_description?: string };
    const appRedirect = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
    const roleCookie = (req as any).cookies?.li_role as string | undefined;
    console.log('[linkedin:callback] query received', { hasCode: !!code, state, error, error_description, role: roleCookie });
    if (error) {
      res.cookie('li_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('li_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      console.error('[linkedin:callback] provider returned error', { error, error_description });
      return res.redirect(`${appRedirect}/register?li_error=${encodeURIComponent(error_description || error)}`);
    }
    if (!code) {
      console.error('[linkedin:callback] missing code');
      res.cookie('li_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('li_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      return res.redirect(`${appRedirect}/register?li_error=${encodeURIComponent('Missing authorization code')}`);
    }
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI as string;
    const stateCookie = (req as any).cookies?.li_state as string | undefined;
    if (!state || !stateCookie || state !== stateCookie) {
      res.cookie('li_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('li_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      console.error('[linkedin:callback] invalid state', { state, hasStateCookie: !!stateCookie });
      return res.redirect(`${appRedirect}/register?li_error=${encodeURIComponent('Invalid OAuth state')}`);
    }

    // Exchange code for access token
    console.log('[linkedin:callback] exchanging code for token', { redirectUri });
    const tokenRes = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID || '',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('[linkedin:callback] token exchange ok', { status: tokenRes.status });
    const accessToken = tokenRes.data.access_token as string;

    // Fetch OpenID Connect userinfo (may include email if scope granted)
    console.log('[linkedin:callback] fetching userinfo (OIDC)');
    const userinfoRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('[linkedin:callback] userinfo fetch ok', { status: userinfoRes.status });

    const u = userinfoRes.data as any;
    const email = (u.email as string | undefined) || undefined;
    const first = u.given_name || '';
    const last = u.family_name || '';
    const headline = ''; // not provided by OIDC userinfo
    const pic = u.picture || undefined;

    // Validate email domain for students
    if (roleCookie === 'student' && email && !email.endsWith('@students.riphah.edu.pk')) {
      res.cookie('li_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('li_mode', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('li_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      console.error('[linkedin:callback] student email domain validation failed', { email });
      return res.redirect(`${appRedirect}/login?error=${encodeURIComponent('Student login requires @students.riphah.edu.pk email domain. Please sign in with your student email.')}`);
    }

    // If logged in, update user profile; if not, store prefill for registration
    let userId: string | undefined;
    try {
      const token = (req as any).cookies?.token as string | undefined;
      if (token) {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        userId = decoded?.id;
      }
    } catch {}

    if (userId) {
      console.log('[linkedin:callback] updating logged-in user with linkedin profile', { userId });
      await User.findByIdAndUpdate(userId, {
        $set: {
          name: `${first} ${last}`.trim() || undefined,
          email: email || undefined,
          profileHeadline: headline || undefined,
          profilePicture: pic || undefined,
          linkedinId: u.sub || undefined,
        },
      });
      res.cookie('li_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('li_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      return res.redirect(`${appRedirect}/profile`);
    } else {
      // If login mode or existing user found, sign in directly
      const liMode = (req as any).cookies?.li_mode as string | undefined;
      let existing = null as any;
      if (email) existing = await User.findOne({ email: email.toLowerCase() });
      if (!existing && u.sub) existing = await User.findOne({ linkedinId: u.sub });
      if (liMode === 'login' || existing) {
        if (existing) {
          // Validate role matches existing user's role
          if (roleCookie === 'student' && existing.role !== 'student') {
            res.cookie('li_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
            res.cookie('li_mode', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
            res.cookie('li_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
            return res.redirect(`${appRedirect}/login?error=${encodeURIComponent('This account is registered as ' + existing.role + '. Please use the ' + existing.role + ' login form.')}`);
          }
          signAndSetCookie(res, { id: String(existing._id), role: existing.role });
          res.cookie('li_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
          res.cookie('li_mode', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
          res.cookie('li_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
          return res.redirect(appRedirect);
        }
        // login mode but no existing user; fall through to prefill/register
      }
      console.log('[linkedin:callback] setting registration prefill cookie (OIDC)');
      const prefill = {
        name: (u.name as string) || `${first} ${last}`.trim() || '',
        email: (email || '').toLowerCase(),
        profilePicture: pic || '',
        linkedinId: (u.sub as string) || '',
      };
      res.cookie('li_prefill', JSON.stringify(prefill), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
      res.cookie('li_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('li_mode', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      res.cookie('li_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      return res.redirect(`${appRedirect}/register?role=${roleCookie || 'alumni'}`);
    }
  } catch (e: any) {
    const appRedirect = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
    const details = e?.response?.data?.error_description || e?.response?.data || e?.message || 'LinkedIn sync failed';
    console.error('[linkedin:callback] exception', { details });
    res.cookie('li_state', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
    res.cookie('li_mode', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
    res.cookie('li_role', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
    return res.redirect(`${appRedirect}/register?li_error=${encodeURIComponent(String(details))}`);
  }
});

// GET /auth/linkedin/prefill
authRouter.get('/linkedin/prefill', (req, res) => {
  try {
    const v = (req as any).cookies?.li_prefill as string | undefined;
    if (!v) return res.json({ prefill: null });
    let json: any = null;
    try { json = JSON.parse(v); } catch { json = null; }
    return res.json({ prefill: json });
  } catch {
    return res.json({ prefill: null });
  }
});

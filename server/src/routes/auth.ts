import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { User } from '../models/User';
import { Types } from 'mongoose';

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

const studentSchema = baseUserSchema.extend({
  role: z.literal('student'),
  sapId: z.string().regex(/^\d{5}$/, 'SAP ID must be exactly 5 digits'),
  batchSeason: z.enum(['Spring', 'Fall']),
  batchYear: z.number().int().min(2010).max(2025),
});

const alumniSchema = baseUserSchema.extend({
  role: z.literal('alumni'),
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
      batchSeason: 'batchSeason' in parsed ? (parsed as any).batchSeason : undefined,
      batchYear: 'batchYear' in parsed ? (parsed as any).batchYear : undefined,
      gradSeason: 'gradSeason' in parsed ? (parsed as any).gradSeason : undefined,
      gradYear: 'gradYear' in parsed ? (parsed as any).gradYear : undefined,
      linkedinId: 'linkedinId' in parsed ? (parsed as any).linkedinId ?? undefined : undefined,
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
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const doc = await User.findOne({ email });
    if (!doc) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, doc.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

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

// LinkedIn OAuth 2.0
// GET /auth/linkedin/start
authRouter.get('/linkedin/start', requireAuth, (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const scope = encodeURIComponent('r_liteprofile r_emailaddress');
  const state = Math.random().toString(36).slice(2);
  (req as any).sessionState = state;
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri || ''
  )}&scope=${scope}&state=${state}`;
  return res.redirect(url);
});

// GET /auth/linkedin/callback
authRouter.get('/linkedin/callback', requireAuth, async (req, res) => {
  try {
    const { code } = req.query as { code?: string };
    if (!code) return res.status(400).send('Missing code');
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI as string;

    // Exchange code for access token
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
    const accessToken = tokenRes.data.access_token as string;

    // Fetch basic profile
    const profileRes = await axios.get('https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,localizedHeadline,profilePicture(displayImage~:playableStreams))', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const emailRes = await axios.get(
      'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const prof = profileRes.data;
    const email = emailRes.data?.elements?.[0]?.['handle~']?.emailAddress as string | undefined;
    const first = prof.localizedFirstName || '';
    const last = prof.localizedLastName || '';
    const headline = prof.localizedHeadline || '';
    const picCandidates = prof?.profilePicture?.['displayImage~']?.elements || [];
    const pic = picCandidates.length ? picCandidates[picCandidates.length - 1]?.identifiers?.[0]?.identifier : undefined;

    const userId = (req as any).user.id as string;
    await User.findByIdAndUpdate(userId, {
      $set: {
        name: `${first} ${last}`.trim() || undefined,
        email: email || undefined,
        profileHeadline: headline || undefined,
        profilePicture: pic || undefined,
        linkedinId: prof.id,
      },
    });

    // Redirect back to profile page in the app
    const appRedirect = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
    return res.redirect(`${appRedirect}/profile`);
  } catch (e: any) {
    console.error('LinkedIn callback error', e?.response?.data || e?.message);
    return res.status(500).send('LinkedIn sync failed');
  }
});

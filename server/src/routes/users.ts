import { Router, Request } from 'express';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import multer = require('multer');
import path from 'path';
import { User } from '../models/User';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';


export const userRouter = Router();

// Multer storage for avatars
type UploadedFileLite = { originalname: string };
const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: UploadedFileLite,
    cb: (error: Error | null, destination: string) => void,
  ) => cb(null, path.resolve('uploads')),
  filename: (
    _req: Request,
    file: UploadedFileLite,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const ext = path.extname(file.originalname) || '.png';
    const name = `avatar_${Date.now()}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// GET /me - current profile
userRouter.get('/me', requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  if (!Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  const doc = (await User.findById(userId).lean()) as any;
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const user = {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    sapId: doc.sapId,
    batchSeason: doc.batchSeason,
    batchYear: doc.batchYear,
    gradSeason: doc.gradSeason,
    gradYear: doc.gradYear,
    linkedinId: doc.linkedinId,
    profilePicture: doc.profilePicture,
    program: doc.program,
    currentCompany: doc.currentCompany,
    skills: doc.skills,
    profileHeadline: doc.profileHeadline,
    location: doc.location,
    experienceYears: doc.experienceYears,
    profileCompleted: !!doc.profileCompleted,
    mentorEligible: !!doc.mentorEligible,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  } as any;
  return res.json({ user });
});

// PATCH /me - update profile
const emptyToUndef = (schema: z.ZodTypeAny) => z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema.optional());

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  linkedinId: emptyToUndef(z.string()),
  batchSeason: z.enum(['Spring', 'Fall']).optional(),
  batchYear: z.number().int().min(2010).max(2025).optional(),
  gradSeason: z.enum(['Spring', 'Fall']).optional(),
  gradYear: z.number().int().min(2010).max(2025).optional(),
  // allow absolute URLs or local upload paths like /uploads/filename.png
  profilePicture: emptyToUndef(z.string().regex(/^(https?:\/\/.*|\/uploads\/.*)$/)),
  program: emptyToUndef(z.string().min(2)),
  currentCompany: emptyToUndef(z.string()),
  skills: emptyToUndef(z.string()),
  profileHeadline: emptyToUndef(z.string().min(3)),
  location: emptyToUndef(z.string()),
  experienceYears: z.number().int().min(0).max(60).optional(),
});

userRouter.patch('/me', requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  if (!Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const current = (await User.findById(userId).lean()) as any;
  if (!current) return res.status(404).json({ error: 'Not found' });

  const data: any = { ...parsed.data };
  if (typeof parsed.data.experienceYears === 'number') {
    data.mentorEligible = parsed.data.experienceYears >= 4;
  }

  const candidate: any = { ...current, ...data };
  const requiredFilled = [
    candidate.name,
    candidate.program,
    candidate.batchSeason,
    candidate.batchYear,
    candidate.profileHeadline,
    candidate.skills,
    candidate.location,
  ].every(Boolean);
  data.profileCompleted = !!requiredFilled;

  await User.findByIdAndUpdate(userId, { $set: data });
  const doc = await User.findById(userId).lean();
  const user = {
    id: String(doc!._id),
    name: doc!.name,
    email: doc!.email,
    role: doc!.role,
    sapId: doc!.sapId,
    batchSeason: doc!.batchSeason,
    batchYear: doc!.batchYear,
    gradSeason: doc!.gradSeason,
    gradYear: doc!.gradYear,
    linkedinId: doc!.linkedinId,
    profilePicture: doc!.profilePicture,
    program: doc!.program,
    currentCompany: doc!.currentCompany,
    skills: doc!.skills,
    profileHeadline: doc!.profileHeadline,
    location: doc!.location,
    experienceYears: doc!.experienceYears,
    profileCompleted: !!doc!.profileCompleted,
    mentorEligible: !!doc!.mentorEligible,
    createdAt: doc!.createdAt,
    updatedAt: doc!.updatedAt,
  } as any;
  return res.json({ user });
});

// POST /me/avatar - upload profile picture
userRouter.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const userId = (req as any).user.id as string;
  if (!Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  const base = `${req.protocol}://${req.get('host')}`;
  const publicUrl = `${base}/uploads/${req.file.filename}`;
  await User.findByIdAndUpdate(userId, { $set: { profilePicture: publicUrl } });
  return res.json({ url: publicUrl });
});

// PATCH /me/password - change password
userRouter.patch('/me/password', requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  if (!Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  const schema = z.object({ currentPassword: z.string().min(6), newPassword: z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const doc = await User.findById(userId);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const ok = await bcrypt.compare(parsed.data.currentPassword, doc.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });
  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await User.findByIdAndUpdate(userId, { $set: { passwordHash: hash } });
  return res.json({ ok: true });
});

// PATCH /me/email - change email (requires password)
userRouter.patch('/me/email', requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  if (!Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  const schema = z.object({ newEmail: z.string().email(), password: z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const doc = await User.findById(userId);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const ok = await bcrypt.compare(parsed.data.password, doc.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Password is incorrect' });
  const exists = await User.findOne({ email: parsed.data.newEmail });
  if (exists && String(exists._id) !== String(userId)) return res.status(400).json({ error: 'Email already in use' });
  await User.findByIdAndUpdate(userId, { $set: { email: parsed.data.newEmail } });
  return res.json({ ok: true, email: parsed.data.newEmail });
});

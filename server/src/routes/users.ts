import { Router, Request } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import multer = require('multer');
import path from 'path';


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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      sapId: true,
      batchSeason: true,
      batchYear: true,
      gradSeason: true,
      gradYear: true,
      linkedinId: true,
      profilePicture: true,
      program: true,
      currentCompany: true,
      skills: true,
      profileHeadline: true,
      location: true,
      experienceYears: true,
      profileCompleted: true,
      mentorEligible: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'Not found' });
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
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // derive mentor eligibility and profile completion if experienceYears provided or other fields
  const data: any = { ...parsed.data };
  if (typeof parsed.data.experienceYears === 'number') {
    data.mentorEligible = parsed.data.experienceYears >= 4;
  }
  // compute completion: require key fields
  const current = await prisma.user.findUnique({ where: { id: userId } });
  const candidate = { ...current, ...data } as any;
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

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      sapId: true,
      batchSeason: true,
      batchYear: true,
      gradSeason: true,
      gradYear: true,
      linkedinId: true,
      profilePicture: true,
      program: true,
      currentCompany: true,
      skills: true,
      profileHeadline: true,
      location: true,
      experienceYears: true,
      profileCompleted: true,
      mentorEligible: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return res.json({ user: updated });
});

// POST /me/avatar - upload profile picture
userRouter.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const userId = (req as any).user.id as string;
  const base = `${req.protocol}://${req.get('host')}`;
  const publicUrl = `${base}/uploads/${req.file.filename}`;
  const updated = await prisma.user.update({ where: { id: userId }, data: { profilePicture: publicUrl } });
  return res.json({ url: publicUrl });
});

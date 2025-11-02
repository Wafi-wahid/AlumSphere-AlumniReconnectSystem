import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const adminRouter = Router();

const createAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const updateCategorySchema = z.object({ adminCategory: z.string().min(2).nullable().optional() });

const alumniSearchSchema = z.object({
  q: z.string().optional(),
  skill: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
});

// Update a user's adminCategory
adminRouter.patch('/users/:id/category', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { id } = req.params as { id: string };
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { adminCategory } = parsed.data as { adminCategory?: string | null };
  const user = await prisma.user.update({ where: { id }, data: { adminCategory: adminCategory ?? null }, select: { id: true, name: true, email: true, role: true, adminCategory: true } });
  return res.json({ user });
});

// Only super_admin can create admin accounts
adminRouter.post('/users', requireAuth, requireRole('super_admin'), async (req, res) => {
  const parsed = createAdminSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'admin' },
    select: { id: true, name: true, email: true, role: true },
  });
  return res.status(201).json({ user });
});

// List users for role management
adminRouter.get('/users', requireAuth, requireRole('super_admin'), async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true },
  });
  return res.json({ users });
});

// Sync a server user to Firebase Auth and store uid on user.firebaseUid
adminRouter.post('/sync-firebase-uid', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'Not found' });
  try {
    // Lazy-load firebase-admin so server doesn't crash if not installed/configured
    let admin: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      admin = require('firebase-admin');
    } catch {
      return res.status(501).json({ error: 'firebase-admin not installed. Skipping sync.' });
    }
    if (!admin.apps || !admin.apps.length) {
      try {
        admin.initializeApp();
      } catch {}
    }
    let fbUser;
    if (user.email) {
      try {
        fbUser = await admin.auth().getUserByEmail(user.email);
      } catch (_) {
        fbUser = await admin.auth().createUser({ email: user.email, displayName: user.name });
      }
    } else {
      fbUser = await admin.auth().createUser({ displayName: user.name });
    }
    // Return uid without persisting if schema doesn't have firebaseUid
    return res.json({ user: { id: user.id, firebaseUid: fbUser.uid } });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Sync failed' });
  }
});

// Alumni search for host selection (admin and super_admin)
adminRouter.get('/users/alumni-search', requireAuth, requireRole('admin','super_admin'), async (req, res) => {
  const parsed = alumniSearchSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { q, skill, company, location } = parsed.data;
  const orQuery: any[] = [];
  if (q) {
    orQuery.push({ name: { contains: q } });
    orQuery.push({ email: { contains: q } });
  }
  const where: any = {
    role: 'alumni',
    AND: [
      orQuery.length ? { OR: orQuery } : {},
      company ? { currentCompany: { contains: company } } : {},
      location ? { location: { contains: location } } : {},
      skill ? { skills: { contains: skill } } : {},
    ],
  };
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, currentCompany: true, skills: true, location: true },
    take: 50,
  });
  return res.json({ users });
});

const updateRoleSchema = z.object({ role: z.enum(['student','alumni','admin','super_admin']) });

// Update a user's role
adminRouter.patch('/users/:id/role', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { id } = req.params as { id: string };
  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { role } = parsed.data;
  const user = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, name: true, email: true, role: true } });
  return res.json({ user });
});

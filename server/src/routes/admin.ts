import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

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
  const doc = await User.findByIdAndUpdate(id, { $set: { adminCategory: adminCategory ?? undefined } }, { new: true })
    .select({ _id: 1, name: 1, email: 1, role: 1, adminCategory: 1 })
    .lean() as any;
  if (!doc) return res.status(404).json({ error: 'Not found' });
  return res.json({ user: { id: String(doc._id), name: doc.name, email: doc.email, role: doc.role, adminCategory: doc.adminCategory } });
});

// Only super_admin can create admin accounts
adminRouter.post('/users', requireAuth, requireRole('super_admin'), async (req, res) => {
  const parsed = createAdminSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, email, password } = parsed.data;

  const exists = await User.findOne({ email }).lean();
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const doc = await User.create({ name, email, passwordHash, role: 'admin' });
  return res.status(201).json({ user: { id: String(doc._id), name: doc.name, email: doc.email, role: doc.role } });
});

// List users for role management
adminRouter.get('/users', requireAuth, requireRole('super_admin'), async (_req, res) => {
  const docs = await User.find({}).sort({ createdAt: -1 }).select({ _id: 1, name: 1, email: 1, role: 1 }).lean() as any[];
  const users = docs.map(d => ({ id: String(d._id), name: d.name, email: d.email, role: d.role }));
  return res.json({ users });
});

// Sync a server user to Firebase Auth and store uid on user.firebaseUid
adminRouter.post('/sync-firebase-uid', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const user = await User.findById(userId).lean() as any;
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
    return res.json({ user: { id: String(user._id), firebaseUid: fbUser.uid } });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Sync failed' });
  }
});

// Alumni search for host selection (admin and super_admin)
adminRouter.get('/users/alumni-search', requireAuth, requireRole('admin','super_admin'), async (req, res) => {
  const parsed = alumniSearchSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { q, skill, company, location } = parsed.data;
  const and: any[] = [{ role: 'alumni' }];
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    and.push({ $or: [{ name: rx }, { email: rx }] });
  }
  if (company) and.push({ currentCompany: new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
  if (location) and.push({ location: new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
  if (skill) and.push({ skills: new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
  const where = and.length ? { $and: and } : {};
  const docs = await User.find(where).sort({ createdAt: -1 }).limit(50).select({ _id: 1, name: 1, email: 1, role: 1, currentCompany: 1, skills: 1, location: 1 }).lean() as any[];
  const users = docs.map(d => ({ id: String(d._id), name: d.name, email: d.email, role: d.role, currentCompany: d.currentCompany, skills: d.skills, location: d.location }));
  return res.json({ users });
});

const updateRoleSchema = z.object({ role: z.enum(['student','alumni','admin','super_admin']) });

// Update a user's role
adminRouter.patch('/users/:id/role', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { id } = req.params as { id: string };
  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { role } = parsed.data;
  const doc = await User.findByIdAndUpdate(id, { $set: { role } }, { new: true }).select({ _id: 1, name: 1, email: 1, role: 1 }).lean() as any;
  if (!doc) return res.status(404).json({ error: 'Not found' });
  return res.json({ user: { id: String(doc._id), name: doc.name, email: doc.email, role: doc.role } });
});

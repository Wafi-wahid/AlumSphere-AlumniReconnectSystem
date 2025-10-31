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

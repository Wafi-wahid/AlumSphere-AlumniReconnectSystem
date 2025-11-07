import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { MentorshipRequest } from '../models/MentorshipRequest';

export const mentorshipRouter = Router();

// GET /mentors — list mentors from Prisma User table
mentorshipRouter.get('/mentors', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const topic = String(req.query.topic || '');
    const batch = String(req.query.batch || '');
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
    const skip = (page - 1) * limit;

    const where: any = {
      mentorEligible: true,
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { currentCompany: { contains: q, mode: 'insensitive' } },
        { profileHeadline: { contains: q, mode: 'insensitive' } },
        { skills: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (topic && topic !== 'all') {
      where.skills = { contains: topic, mode: 'insensitive' };
    }

    if (batch && batch !== 'all') {
      const byear = Number(batch);
      if (!Number.isNaN(byear)) where.batchYear = byear;
    }

    const [items, count] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          profilePicture: true,
          profileHeadline: true,
          currentCompany: true,
          skills: true,
          batchYear: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const nextPage = skip + items.length < count ? page + 1 : undefined;
    res.json({ items, nextPage });
  } catch (err) {
    next(err);
  }
});

// GET /mentors/:id — single mentor details
mentorshipRouter.get('/mentors/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const mentor = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        profileHeadline: true,
        currentCompany: true,
        program: true,
        skills: true,
        location: true,
        experienceYears: true,
        mentorEligible: true,
        batchYear: true,
      },
    });
    if (!mentor || !mentor.mentorEligible) return res.status(404).json({ error: 'Mentor not found' });
    res.json({ mentor });
  } catch (err) {
    next(err);
  }
});

// POST /mentorshipRequests — create a mentorship request in MongoDB
const createRequestSchema = z.object({
  mentorId: z.string().min(1),
  topic: z.string().min(2),
  sessionType: z.enum(['30m', '45m', '60m']),
  preferredDateTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid datetime'),
  notes: z.string().max(1000).optional(),
});

mentorshipRouter.post('/mentorshipRequests', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const parsed = createRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(', ') });

    const { mentorId, topic, sessionType, preferredDateTime, notes } = parsed.data;
    const studentId = (req as any).user?.id;

    // Ensure mentor exists and is eligible (Prisma check)
    const mentor = await prisma.user.findUnique({ where: { id: mentorId }, select: { id: true, mentorEligible: true } });
    if (!mentor || !mentor.mentorEligible) return res.status(400).json({ error: 'Invalid mentor' });

    const created = await MentorshipRequest.create({
      studentId,
      mentorId,
      topic,
      sessionType,
      preferredDateTime: new Date(preferredDateTime),
      notes,
      status: 'Pending',
    });

    res.status(201).json({ ok: true, id: String(created._id) });
  } catch (err) {
    next(err);
  }
});

import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { requireAuth, requireRole } from '../middleware/auth';
import { MentorshipRequest } from '../models/MentorshipRequest';

export const mentorshipRouter = Router();

// GET /mentors — list mentors from Mongo User collection
mentorshipRouter.get('/mentors', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const topic = String(req.query.topic || '');
    const batch = String(req.query.batch || '');
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
    const skip = (page - 1) * limit;

    const and: any[] = [{ mentorEligible: true }];

    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      and.push({ $or: [
        { name: rx },
        { currentCompany: rx },
        { profileHeadline: rx },
        { skills: rx },
      ]});
    }

    if (topic && topic !== 'all') {
      const rxTopic = new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      and.push({ skills: rxTopic });
    }

    if (batch && batch !== 'all') {
      const byear = Number(batch);
      if (!Number.isNaN(byear)) and.push({ batchYear: byear });
    }

    const where = and.length ? { $and: and } : {};
    const [docs, count] = await Promise.all([
      User.find(where)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .select({ _id: 1, name: 1, profilePicture: 1, profileHeadline: 1, currentCompany: 1, skills: 1, batchYear: 1 })
        .lean() as any,
      User.countDocuments(where),
    ]);
    const items = (docs as any[]).map((d) => ({
      id: String(d._id),
      name: d.name,
      profilePicture: d.profilePicture,
      profileHeadline: d.profileHeadline,
      currentCompany: d.currentCompany,
      skills: d.skills,
      batchYear: d.batchYear,
    }));

    const nextPage = skip + items.length < count ? page + 1 : undefined;
    res.json({ items, nextPage });
  } catch (err) {
    next(err);
  }
});

// GET /mentors/:id — single mentor details from Mongo
mentorshipRouter.get('/mentors/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const d = await User.findById(id)
      .select({ _id: 1, name: 1, email: 1, profilePicture: 1, profileHeadline: 1, currentCompany: 1, program: 1, skills: 1, location: 1, experienceYears: 1, mentorEligible: 1, batchYear: 1 })
      .lean() as any;
    if (!d || !d.mentorEligible) return res.status(404).json({ error: 'Mentor not found' });
    const mentor = {
      id: String(d._id),
      name: d.name,
      email: d.email,
      profilePicture: d.profilePicture,
      profileHeadline: d.profileHeadline,
      currentCompany: d.currentCompany,
      program: d.program,
      skills: d.skills,
      location: d.location,
      experienceYears: d.experienceYears,
      mentorEligible: !!d.mentorEligible,
      batchYear: d.batchYear,
    };
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

    // Ensure mentor exists and is eligible (Mongo check)
    const mentor = await User.findById(mentorId).select({ _id: 1, mentorEligible: 1 }).lean() as any;
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

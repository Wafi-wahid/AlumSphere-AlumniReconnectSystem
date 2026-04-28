import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { User } from '../models/User';
import { requireAuth, requireRole } from '../middleware/auth';
import { MentorshipRequest } from '../models/MentorshipRequest';
import { MentorshipSession } from '../models/MentorshipSession';
import { sendInAppNotification } from '../lib/notifications';
import { sendEmail } from '../lib/mailer';

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

    const and: any[] = [{ mentorEligible: true }, { role: { $in: ['student', 'alumni'] } }];

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

// GET /mentorshipRequests?as=student|mentor — list my requests
mentorshipRouter.get('/mentorshipRequests', requireAuth, async (req, res, next) => {
  try {
    const me = (req as any).user?.id as string;
    const as = String(req.query.as || 'student').toLowerCase();

    if (as === 'mentor') {
      const u = await User.findById(me).select({ _id: 1, mentorEligible: 1, role: 1, mentorshipPreferences: 1 }).lean() as any;
      if (!u || !['alumni'].includes(u.role)) {
        return res.status(403).json({ error: 'Forbidden: Only alumni can be mentors' });
      }
      // Allow alumni to view requests even if not fully set up as mentor yet
      // This gives them visibility to accept mentorship requests
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;
    const where = as === 'mentor' ? { mentorId: me } : { studentId: me };
    const [docs, count] = await Promise.all([
      MentorshipRequest.find(where)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as any,
      MentorshipRequest.countDocuments(where),
    ]);

    const requestIds = (docs as any[]).map((d) => d._id);
    const sessions = await MentorshipSession.find({ requestId: { $in: requestIds } }).lean();
    const sessionByRequestId = new Map<string, any>(sessions.map((s: any) => [String(s.requestId), s]));

    const studentIds = Array.from(new Set((docs as any[]).map((d) => String(d.studentId))));
    const mentorIds = Array.from(new Set((docs as any[]).map((d) => String(d.mentorId))));
    const [students, mentors] = await Promise.all([
      User.find({ _id: { $in: studentIds } }).select({ _id: 1, name: 1, profilePicture: 1, role: 1, profileHeadline: 1, currentCompany: 1 }).lean(),
      User.find({ _id: { $in: mentorIds } }).select({ _id: 1, name: 1, profilePicture: 1, role: 1, profileHeadline: 1, currentCompany: 1 }).lean(),
    ]);
    const studentById = new Map<string, any>(students.map((u: any) => [String(u._id), u]));
    const mentorById = new Map<string, any>(mentors.map((u: any) => [String(u._id), u]));

    res.json({
      items: docs.map((d: any) => ({
        id: String(d._id),
        studentId: String(d.studentId),
        mentorId: String(d.mentorId),
        student: (() => {
          const u = studentById.get(String(d.studentId));
          if (!u) return undefined;
          return {
            id: String(u._id),
            name: u.name,
            profilePicture: u.profilePicture,
            profileHeadline: u.profileHeadline,
            currentCompany: u.currentCompany,
            role: u.role,
          };
        })(),
        mentor: (() => {
          const u = mentorById.get(String(d.mentorId));
          if (!u) return undefined;
          return {
            id: String(u._id),
            name: u.name,
            profilePicture: u.profilePicture,
            profileHeadline: u.profileHeadline,
            currentCompany: u.currentCompany,
            role: u.role,
          };
        })(),
        topic: d.topic,
        sessionType: d.sessionType,
        preferredDateTime: d.preferredDateTime,
        notes: d.notes,
        status: d.status,
        session: (() => {
          const s = sessionByRequestId.get(String(d._id));
          if (!s) return undefined;
          return {
            id: String(s._id),
            scheduledAt: s.scheduledAt,
            durationMins: s.durationMins,
            meetingProvider: s.meetingProvider,
            meetingLink: s.meetingLink,
            status: s.status,
            studentRating: s.studentRating,
          };
        })(),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      nextPage: skip + docs.length < count ? page + 1 : undefined,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /mentorshipRequests/:id — mentor: accept/decline; student: cancel
const updateReqSchema = z.object({
  status: z.enum(['Accepted', 'Declined', 'Cancelled']),
  scheduledAt: z.string().optional(),
});
mentorshipRouter.patch('/mentorshipRequests/:id', requireAuth, async (req, res, next) => {
  try {
    const parsed = updateReqSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(', ') });
    const id = req.params.id;
    const me = (req as any).user?.id as string;
    const doc = await MentorshipRequest.findById(id).lean() as any;
    if (!doc) return res.status(404).json({ error: 'Request not found' });
    if (doc.status !== 'Pending') return res.status(400).json({ error: 'Request already processed' });

    const desired = parsed.data.status;
    if (desired === 'Accepted' || desired === 'Declined') {
      if (String(doc.mentorId) !== me) return res.status(403).json({ error: 'Only mentor can respond' });
      const u = await User.findById(me).select({ _id: 1, mentorEligible: 1, role: 1 }).lean() as any;
      if (!u || !['alumni'].includes(u.role)) {
        return res.status(403).json({ error: 'Forbidden: Only alumni can respond to requests' });
      }

      // Notify student of mentor response
      const student = await User.findById(doc.studentId).select({ _id: 1, email: 1, name: 1 }).lean() as any;
      const mentorUser = await User.findById(doc.mentorId).select({ _id: 1, email: 1, name: 1 }).lean() as any;

      if (desired === 'Declined') {
        await MentorshipRequest.updateOne({ _id: id }, { $set: { status: desired } });

        if (student?._id) {
          await sendInAppNotification(String(student._id), {
            type: 'mentorship_declined',
            title: 'Mentorship request declined',
            body: `${mentorUser?.name || 'A mentor'} declined your request.`,
            link: '/mentorship',
            metadata: { requestId: String(id) },
          });
        }
        if (student?.email) {
          await sendEmail({
            to: String(student.email),
            subject: 'Your mentorship request was declined',
            text: `${mentorUser?.name || 'A mentor'} declined your mentorship request. You can request another mentor from the Mentorship page.`,
          });
        }

        return res.json({ ok: true });
      }

      // Accepted: schedule session + generate Jitsi link
      const durationMins = doc.sessionType === '30m' ? 30 : doc.sessionType === '60m' ? 60 : 45;
      const scheduledAtIso = parsed.data.scheduledAt;
      const scheduledAt = scheduledAtIso ? new Date(scheduledAtIso) : new Date(doc.preferredDateTime);
      if (Number.isNaN(scheduledAt.getTime())) {
        return res.status(400).json({ error: 'Invalid scheduledAt' });
      }
      if (scheduledAt.getTime() < Date.now() - 60_000) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }

      const roomId = `echo-alum-link-${randomBytes(9).toString('hex')}`;
      // Store room ID for internal meeting route
      const meetingLink = `/meeting/${roomId}`;

      await MentorshipRequest.updateOne({ _id: id }, { $set: { status: desired } });
      const session = await MentorshipSession.findOneAndUpdate(
        { requestId: doc._id },
        {
          $setOnInsert: {
            requestId: doc._id,
            studentId: String(doc.studentId),
            mentorId: String(doc.mentorId),
          },
          $set: {
            scheduledAt,
            durationMins,
            meetingProvider: 'jitsi',
            meetingLink,
            status: 'Scheduled',
          },
        },
        { upsert: true, new: true, lean: true }
      );

      const when = scheduledAt.toLocaleString();
      if (student?._id) {
        await sendInAppNotification(String(student._id), {
          type: 'mentorship_scheduled',
          title: 'Mentorship session scheduled',
          body: `Your mentor accepted. Session at ${when}.`,
          link: '/mentorship',
          metadata: { requestId: String(id), sessionId: String((session as any)?._id) },
        });
      }
      if (mentorUser?._id) {
        await sendInAppNotification(String(mentorUser._id), {
          type: 'mentorship_scheduled',
          title: 'Mentorship session scheduled',
          body: `Session scheduled at ${when}.`,
          link: '/mentorship',
          metadata: { requestId: String(id), sessionId: String((session as any)?._id) },
        });
      }

      if (student?.email) {
        await sendEmail({
          to: String(student.email),
          subject: 'Mentorship session scheduled',
          text: `Your mentor accepted and scheduled your session at ${when}. Meeting link: ${meetingLink}`,
        });
      }
      if (mentorUser?.email) {
        await sendEmail({
          to: String(mentorUser.email),
          subject: 'Mentorship session scheduled',
          text: `You scheduled a mentorship session at ${when}. Meeting link: ${meetingLink}`,
        });
      }

      return res.json({ ok: true });
    } else if (desired === 'Cancelled') {
      if (String(doc.studentId) !== me) return res.status(403).json({ error: 'Only student can cancel' });
    }

    await MentorshipRequest.updateOne({ _id: id }, { $set: { status: desired } });
    res.json({ ok: true });
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
    if (!d || !d.mentorEligible || !['student', 'alumni'].includes(d.role)) return res.status(404).json({ error: 'Mentor not found' });
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
  sessionType: z.enum(['30m', '45m', '60m', 'individual', 'group']),
  preferredDateTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid datetime'),
  notes: z.string().max(1000).optional(),
});

mentorshipRouter.post('/mentorshipRequests', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const parsed = createRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(', ') });

    const { mentorId, topic, sessionType, preferredDateTime, notes } = parsed.data;
    const studentId = (req as any).user?.id;

    const pendingCount = await MentorshipRequest.countDocuments({ studentId, status: 'Pending' });
    if (pendingCount >= 3) {
      return res.status(400).json({ error: 'You can have at most 3 pending mentorship requests.' });
    }

    // Ensure mentor exists and is eligible (Mongo check)
    const mentor = await User.findById(mentorId).select({ _id: 1, mentorEligible: 1, role: 1, email: 1, name: 1 }).lean() as any;
    if (!mentor || !mentor.mentorEligible || !['student', 'alumni'].includes(mentor.role)) return res.status(400).json({ error: 'Invalid mentor' });

    const student = await User.findById(studentId).select({ _id: 1, name: 1, email: 1 }).lean() as any;

    const created = await MentorshipRequest.create({
      studentId,
      mentorId,
      topic,
      sessionType,
      preferredDateTime: new Date(preferredDateTime),
      notes,
      status: 'Pending',
    });

    // Notify mentor
    await sendInAppNotification(String(mentor._id), {
      type: 'mentorship_request',
      title: 'New mentorship request',
      body: `${student?.name || 'A student'} requested mentorship (${topic}).`,
      link: '/mentorship',
      metadata: { requestId: String(created._id) },
    });
    if (mentor?.email) {
      await sendEmail({
        to: String(mentor.email),
        subject: 'New mentorship request',
        text: `${student?.name || 'A student'} requested mentorship (${topic}). Open the Mentorship page to accept, reschedule, or decline.`,
      });
    }

    res.status(201).json({ ok: true, id: String(created._id) });
  } catch (err) {
    next(err);
  }
});

// DELETE /mentorshipSessions/:id — cancel scheduled session (by mentor or student)
mentorshipRouter.delete('/mentorshipSessions/:id', requireAuth, async (req, res, next) => {
  try {
    const me = (req as any).user?.id as string;
    const sessionId = req.params.id;
    const session = await MentorshipSession.findById(sessionId).lean() as any;
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'Scheduled') return res.status(400).json({ error: 'Cannot cancel completed or cancelled session' });
    
    // Only mentor or student can cancel
    if (String(session.mentorId) !== me && String(session.studentId) !== me) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await MentorshipSession.updateOne(
      { _id: sessionId },
      { $set: { status: 'Cancelled' } }
    );

    // Update request status to Cancelled
    await MentorshipRequest.updateOne(
      { _id: session.requestId },
      { $set: { status: 'Cancelled' } }
    );

    // Notify both parties
    const [student, mentor] = await Promise.all([
      User.findById(session.studentId).select({ _id: 1, name: 1 }).lean(),
      User.findById(session.mentorId).select({ _id: 1, name: 1 }).lean(),
    ]);

    if (student?._id && String(student._id) !== me) {
      await sendInAppNotification(String(student._id), {
        type: 'mentorship_cancelled',
        title: 'Session cancelled',
        body: `${mentor?.name || 'Your mentor'} cancelled the mentorship session.`,
        link: '/mentorship',
        metadata: { sessionId: String(sessionId) },
      });
    }
    if (mentor?._id && String(mentor._id) !== me) {
      await sendInAppNotification(String(mentor._id), {
        type: 'mentorship_cancelled',
        title: 'Session cancelled',
        body: `${student?.name || 'Your student'} cancelled the mentorship session.`,
        link: '/mentorship',
        metadata: { sessionId: String(sessionId) },
      });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /mentorshipSessions/:id/rating — student rates after session time
const ratingSchema = z.object({ rating: z.number().int().min(1).max(5), feedback: z.string().max(1000).optional() });
mentorshipRouter.post('/mentorshipSessions/:id/rating', requireAuth, async (req, res, next) => {
  try {
    const me = (req as any).user?.id as string;
    const parsed = ratingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(', ') });
    const sessionId = req.params.id;
    const session = await MentorshipSession.findById(sessionId).lean() as any;
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (String(session.studentId) !== String(me)) return res.status(403).json({ error: 'Forbidden' });
    if (new Date(session.scheduledAt).getTime() > Date.now()) return res.status(400).json({ error: 'You can rate after the session time' });

    await MentorshipSession.updateOne(
      { _id: sessionId },
      { $set: { studentRating: parsed.data.rating, studentFeedback: parsed.data.feedback, status: 'Completed' } }
    );

    const mentor = await User.findById(session.mentorId).select({ _id: 1 }).lean() as any;
    if (mentor?._id) {
      await sendInAppNotification(String(mentor._id), {
        type: 'mentorship_rating',
        title: 'New mentorship rating',
        body: `You received a ${parsed.data.rating}/5 rating.`,
        link: '/mentorship',
        metadata: { sessionId: String(sessionId) },
      });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /mentorship/leaderboard — top mentors by average rating
mentorshipRouter.get('/mentorship/leaderboard', async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const rows = await MentorshipSession.aggregate([
      { $match: { studentRating: { $gte: 1 } } },
      {
        $group: {
          _id: '$mentorId',
          avgRating: { $avg: '$studentRating' },
          ratingsCount: { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1, ratingsCount: -1 } },
      { $limit: limit },
    ]);

    const mentorIds = rows.map((r: any) => r._id);
    const users = await User.find({ _id: { $in: mentorIds } }).select({ _id: 1, name: 1, profilePicture: 1, role: 1 }).lean();
    const byId = new Map(users.map((u: any) => [String(u._id), u]));

    const items = rows
      .map((r: any) => {
        const u = byId.get(String(r._id));
        if (!u) return null;
        return {
          mentorId: String(u._id),
          name: u.name,
          profilePicture: u.profilePicture,
          avgRating: Number(r.avgRating || 0),
          ratingsCount: Number(r.ratingsCount || 0),
        };
      })
      .filter(Boolean);

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

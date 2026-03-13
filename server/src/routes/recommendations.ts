import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { initFirebaseAdmin, getFirestore } from '../firebaseAdmin';

const router = Router();

// Initialize Firebase Admin
initFirebaseAdmin();
const adminDb = getFirestore();

// Helper: intersection size
function intersectSize(a: string[], b: string[]): number {
  return new Set(a.filter(x => b.includes(x))).size;
}

async function getUserByMongoIdOrDocId(userId: string) {
  // Primary: your users docs appear to store mongo id in field `id` (string)
  const byField = await adminDb.collection('users').where('id', '==', userId).limit(1).get();
  if (!byField.empty) return byField.docs[0];

  // Secondary: some docs may store mongo id at mongo._id
  const byMongo = await adminDb.collection('users').where('mongo._id', '==', userId).limit(1).get();
  if (!byMongo.empty) return byMongo.docs[0];

  // Fallback: doc id matches
  return await adminDb.collection('users').doc(userId).get();
}

// Helper: simple scoring for mentors
function scoreMentor(mentor: any, student: any): number {
  let score = 0;
  if (intersectSize(mentor.preferredIndustries || [], student.preferredIndustries || [])) score += 3;
  if (intersectSize(mentor.interests || [], student.interests || [])) score += 2;
  const mentorSkills = Array.isArray(mentor.skills)
    ? mentor.skills
    : String(mentor.skills || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
  if (intersectSize(mentorSkills, student.skillsToDevelop || [])) score += 2;
  if (intersectSize(mentor.mentorshipPreferences?.mentorshipGoals || [], student.mentorshipPreferences?.mentorshipGoals || [])) score += 1;
  if (mentor.location && mentor.location === student.location) score += 1;
  return score;
}

function normalizeMentor(raw: any) {
  const skillsArr = Array.isArray(raw.skills)
    ? raw.skills
    : String(raw.skills || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
  const userKey = raw.id || raw.mongo?._id || raw._id || raw.firestoreId;
  return {
    userId: userKey,
    name: raw.name || raw.displayName || '',
    profilePicture: raw.profilePicture || raw.avatar || raw.photoURL || '',
    profileHeadline: raw.profileHeadline || '',
    currentCompany: raw.currentCompany || '',
    position: raw.position || raw.currentPosition || '',
    location: raw.location || '',
    mentorIndustries: Array.isArray(raw.preferredIndustries) ? raw.preferredIndustries : [],
    mentorSkills: skillsArr,
    // Keep original arrays for scoring
    preferredIndustries: Array.isArray(raw.preferredIndustries) ? raw.preferredIndustries : [],
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    skills: skillsArr,
    mentorshipPreferences: raw.mentorshipPreferences || {},
  };
}

// Helper: simple scoring for jobs
function scoreJob(job: any, student: any): number {
  let score = 0;
  if (intersectSize(job.requiredSkills || [], student.skillsToDevelop || [])) score += 3;
  if (intersectSize(job.tags || [], student.interests || [])) score += 2;
  if (job.industry && student.preferredIndustries?.includes(job.industry)) score += 2;
  if (job.experienceYears && student.experienceYears !== undefined && Math.abs(job.experienceYears - student.experienceYears) <= 2) score += 1;
  return score;
}

function normalizeJob(raw: any) {
  const key = raw.id || raw._id || raw.mongo?._id || raw.firestoreId;
  return {
    _id: key,
    title: raw.title || raw.position || '',
    company: raw.company || raw.companyName || '',
    location: raw.location || '',
    employmentType: raw.employmentType || raw.type || '',
    salaryRange: raw.salaryRange || raw.salary || '',
    industry: raw.industry || '',
    experienceYears: raw.experienceYears || raw.experience || undefined,
    requiredSkills: Array.isArray(raw.requiredSkills) ? raw.requiredSkills : Array.isArray(raw.skills) ? raw.skills : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    isActive: raw.isActive,
  };
}

// Helper: simple scoring for events
function scoreEvent(event: any, student: any): number {
  let score = 0;
  if (intersectSize(event.tags || [], student.interests || [])) score += 3;
  if (event.industry && student.preferredIndustries?.includes(event.industry)) score += 2;
  if (event.location && event.location === student.location) score += 1;
  return score;
}

function normalizeEvent(raw: any) {
  const rawDate = raw.date || raw.startDate || raw.eventDate || raw.datetime || raw.startTime || raw.createdAt;
  const dateObj = rawDate?.toDate ? rawDate.toDate() : rawDate ? new Date(rawDate) : null;
  const hasValidDate = !!(dateObj && !Number.isNaN(dateObj.getTime()));
  const key = raw.id || raw._id || raw.mongo?._id || raw.firestoreId;
  return {
    _id: key,
    title: raw.title || raw.name || raw.eventTitle || '',
    organizer: raw.organizer || raw.host || '',
    location: raw.location || '',
    isVirtual: !!raw.isVirtual,
    registrationLink: raw.registrationLink || raw.link || '',
    industry: raw.industry || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    date: hasValidDate ? dateObj!.toISOString() : '',
    isActive: raw.isActive,
    _dateObj: dateObj,
    _hasValidDate: hasValidDate,
  };
}

// GET /recommendations/mentors
router.get('/mentors', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id as string;
    const { fallback } = req.query;

    if (!userId) return res.status(401).json({ error: 'Invalid session' });

    const studentSnap = await getUserByMongoIdOrDocId(userId);
    if (!studentSnap.exists) return res.status(404).json({ error: 'User not found' });
    const student = studentSnap.data() || {};
    const currentUserKey = (student as any).id || (student as any).mongo?._id || (student as any)._id || userId;

    // Fetch candidate mentors from Firestore.
    // Some deployments store mentorEligible nested under `mongo.*`, so we filter in-memory.
    const mentorSnap = await adminDb.collection('users').limit(500).get();

    const mentors = mentorSnap.docs
      .map(d => ({ firestoreId: d.id, ...d.data() }))
      .filter(raw => {
        const eligible = (raw as any).mentorEligible ?? (raw as any).mongo?.mentorEligible;
        return eligible === true;
      })
      .map(raw => normalizeMentor(raw))
      .filter(m => m.userId && m.userId !== currentUserKey)
      .filter(m => {
        // If availableToMentor exists, honor it; otherwise keep.
        const avail = (m as any).mentorshipPreferences?.availableToMentor ?? (m as any).mongo?.mentorshipPreferences?.availableToMentor;
        return typeof avail === 'boolean' ? avail : true;
      });

    const scored = mentors
      .map(m => ({
        ...m,
        score: scoreMentor(m, student),
      }))
      .sort((a, b) => b.score - a.score);

    let result = scored.filter(m => m.score > 0).slice(0, 10);
    if (fallback === 'true' && result.length === 0) {
      result = scored.slice(0, 5);
    }

    return res.json({ mentors: result });
  } catch (e: any) {
    console.error('[recommendations:mentors] error', e);
    return res.status(500).json({ error: 'Failed to load mentor recommendations' });
  }
});

// GET /recommendations/jobs
router.get('/jobs', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id as string;
    const { fallback } = req.query;

    if (!userId) return res.status(401).json({ error: 'Invalid session' });

    const studentSnap = await getUserByMongoIdOrDocId(userId);
    if (!studentSnap.exists) return res.status(404).json({ error: 'User not found' });
    const student = studentSnap.data() || {};

    let jobsRaw: any[] = [];
    try {
      const jobSnap = await adminDb
        .collection('jobs')
        .where('isActive', '==', true)
        .limit(200)
        .get();
      jobsRaw = jobSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    } catch {
      jobsRaw = [];
    }
    if (jobsRaw.length === 0) {
      const jobSnap = await adminDb.collection('jobs').limit(200).get();
      jobsRaw = jobSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    }
    const jobs = jobsRaw.map(normalizeJob);

    const scored = jobs
      .map(j => ({
        ...j,
        score: scoreJob(j, student),
      }))
      .sort((a, b) => b.score - a.score);

    let result = scored.filter(j => j.score > 0).slice(0, 10);
    if (fallback === 'true' && result.length === 0) {
      result = scored.slice(0, 5);
    }

    return res.json({ jobs: result });
  } catch (e: any) {
    console.error('[recommendations:jobs] error', e);
    return res.status(500).json({ error: 'Failed to load job recommendations' });
  }
});

// GET /recommendations/events
router.get('/events', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id as string;
    const { fallback } = req.query;

    if (!userId) return res.status(401).json({ error: 'Invalid session' });

    const studentSnap = await getUserByMongoIdOrDocId(userId);
    if (!studentSnap.exists) return res.status(404).json({ error: 'User not found' });
    const student = studentSnap.data() || {};

    const now = new Date();
    let eventsRaw: any[] = [];

    // Try strict query first (fast path). If it fails (missing index OR field type mismatch), fall back.
    try {
      const eventSnap = await adminDb
        .collection('events')
        .where('isActive', '==', true)
        .where('date', '>=', now)
        .limit(200)
        .get();
      eventsRaw = eventSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    } catch {
      eventsRaw = [];
    }

    if (eventsRaw.length === 0) {
      try {
        const eventSnap = await adminDb
          .collection('events')
          .where('isActive', '==', true)
          .limit(200)
          .get();
        eventsRaw = eventSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      } catch {
        eventsRaw = [];
      }
    }

    if (eventsRaw.length === 0) {
      const eventSnap = await adminDb.collection('events').limit(200).get();
      eventsRaw = eventSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    }

    const events = eventsRaw
      .map(normalizeEvent)
      .filter((ev: any) => {
        if (!ev._hasValidDate) return true;
        const dt: Date | null = ev._dateObj || (ev.date ? new Date(ev.date) : null);
        return dt && !Number.isNaN(dt.getTime()) ? dt >= now : true;
      })
      .map((ev: any) => {
        const { _dateObj, _hasValidDate, ...rest } = ev;
        return rest;
      });

    const scored = events
      .map(e => ({
        ...e,
        score: scoreEvent(e, student),
      }))
      .sort((a, b) => b.score - a.score);

    let result = scored.filter(e => e.score > 0).slice(0, 10);
    if (fallback === 'true' && result.length === 0) {
      result = scored.slice(0, 5);
    }

    return res.json({ events: result });
  } catch (e: any) {
    console.error('[recommendations:events] error', e);
    return res.status(500).json({ error: 'Failed to load event recommendations' });
  }
});

export default router;

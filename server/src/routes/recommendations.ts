import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { MentorProfile } from '../models/MentorProfile';
import { Job } from '../models/Job';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { z } from 'zod';
import { Types } from 'mongoose';

const router = Router();

// Helper: intersection size
function intersectSize(a: string[], b: string[]): number {
  return new Set(a.filter(x => b.includes(x))).size;
}

// Helper: simple scoring for mentors
function scoreMentor(mentor: any, student: any): number {
  let score = 0;
  if (intersectSize(mentor.mentorIndustries, student.preferredIndustries || [])) score += 3;
  if (intersectSize(mentor.mentorInterests, student.interests || [])) score += 2;
  if (intersectSize(mentor.mentorSkills, student.skillsToDevelop || [])) score += 2;
  if (intersectSize(mentor.mentorshipGoals, student.mentorshipPreferences?.mentorshipGoals || [])) score += 1;
  // Optional: location boost
  if (mentor.location && mentor.location === student.location) score += 1;
  return score;
}

// Helper: simple scoring for jobs
function scoreJob(job: any, student: any): number {
  let score = 0;
  if (intersectSize(job.requiredSkills, student.skillsToDevelop || [])) score += 3;
  if (intersectSize(job.tags, student.interests || [])) score += 2;
  if (job.industry && student.preferredIndustries?.includes(job.industry)) score += 2;
  if (job.experienceYears && student.experienceYears !== undefined && Math.abs(job.experienceYears - student.experienceYears) <= 2) score += 1;
  return score;
}

// Helper: simple scoring for events
function scoreEvent(event: any, student: any): number {
  let score = 0;
  if (intersectSize(event.tags, student.interests || [])) score += 3;
  if (event.industry && student.preferredIndustries?.includes(event.industry)) score += 2;
  if (event.location && event.location === student.location) score += 1;
  return score;
}

// GET /recommendations/mentors
router.get('/mentors', requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  const { fallback } = req.query;

  if (!Types.ObjectId.isValid(userId)) return res.status(401).json({ error: 'Invalid session' });

  const student = await User.findById(userId).lean().exec();
  if (!student) return res.status(404).json({ error: 'User not found' });

  const mentors = await MentorProfile.find({
    mentorEligible: true,
    availableToMentor: true,
    userId: { $ne: new Types.ObjectId(userId) },
  }).lean().exec();

  const scored = mentors.map(m => ({
    ...m,
    score: scoreMentor(m, student),
  })).sort((a, b) => b.score - a.score);

  let result = scored.filter(m => m.score > 0).slice(0, 10);
  if (fallback === 'true' && result.length === 0) {
    result = scored.slice(0, 5);
  }

  return res.json({ mentors: result });
});

// GET /recommendations/jobs
router.get('/jobs', requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  const { fallback } = req.query;

  if (!Types.ObjectId.isValid(userId)) return res.status(401).json({ error: 'Invalid session' });

  const student = await User.findById(userId).lean().exec();
  if (!student) return res.status(404).json({ error: 'User not found' });

  const jobs = await Job.find({ isActive: true }).lean().exec();

  const scored = jobs.map(j => ({
    ...j,
    score: scoreJob(j, student),
  })).sort((a, b) => b.score - a.score);

  let result = scored.filter(j => j.score > 0).slice(0, 10);
  if (fallback === 'true' && result.length === 0) {
    result = scored.slice(0, 5);
  }

  return res.json({ jobs: result });
});

// GET /recommendations/events
router.get('/events', requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  const { fallback } = req.query;

  if (!Types.ObjectId.isValid(userId)) return res.status(401).json({ error: 'Invalid session' });

  const student = await User.findById(userId).lean().exec();
  if (!student) return res.status(404).json({ error: 'User not found' });

  const events = await Event.find({ isActive: true, date: { $gte: new Date() } }).lean().exec();

  const scored = events.map(e => ({
    ...e,
    score: scoreEvent(e, student),
  })).sort((a, b) => b.score - a.score);

  let result = scored.filter(e => e.score > 0).slice(0, 10);
  if (fallback === 'true' && result.length === 0) {
    result = scored.slice(0, 5);
  }

  return res.json({ events: result });
});

export default router;

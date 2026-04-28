import { Router, Request } from 'express';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import multer = require('multer');
import path from 'path';
import { User, IUser } from '../models/User';
import { syncMentorProfile } from '../services/MentorSyncService';
import { Types, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

type UserDocument = HydratedDocument<IUser>;


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
  const doc = await User.findById(userId).lean().exec();
  if (!doc) return res.status(404).json({ error: 'Not found' });
  
  // Type assertion since we know the shape from our model
  const userDoc = doc as unknown as IUser & { _id: Types.ObjectId };
  
  const user = {
    id: String(userDoc._id),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    sapId: userDoc.sapId,
    batchSeason: userDoc.batchSeason,
    batchYear: userDoc.batchYear,
    gradSeason: userDoc.gradSeason,
    gradYear: userDoc.gradYear,
    linkedinId: userDoc.linkedinId,
    profilePicture: userDoc.profilePicture,
    bio: userDoc.bio,
    program: userDoc.program,
    currentCompany: userDoc.currentCompany,
    position: userDoc.position,
    skills: userDoc.skills,
    profileHeadline: userDoc.profileHeadline,
    location: userDoc.location,
    experienceYears: userDoc.experienceYears,
    
    // New onboarding fields
    interests: userDoc.interests || [],
    preferredIndustries: userDoc.preferredIndustries || [],
    skillsToDevelop: userDoc.skillsToDevelop || [],
    mentorshipPreferences: {
      seekingMentor: userDoc.mentorshipPreferences?.seekingMentor || false,
      availableToMentor: userDoc.mentorshipPreferences?.availableToMentor || false,
      mentorshipGoals: userDoc.mentorshipPreferences?.mentorshipGoals || [],
      preferredCommunication: userDoc.mentorshipPreferences?.preferredCommunication || 'any',
      additionalNotes: (userDoc.mentorshipPreferences as any)?.additionalNotes,
    },
    
    profileCompleted: !!userDoc.profileCompleted,
    mentorEligible: !!userDoc.mentorEligible,
    onboardingCompleted: !!userDoc.onboardingCompleted,
    onboardingStep: userDoc.onboardingStep || 0,
    onboardingRequired: !!(userDoc as any).onboardingRequired,
    
    // Timestamps
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
  return res.json({ user });
});

// PATCH /me - update profile
const emptyToUndef = (schema: z.ZodTypeAny) => z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema.optional());

const updateSchema = z.object({
  // Basic info
  name: z.string().min(2).optional(),
  linkedinId: emptyToUndef(z.string()),
  batchSeason: z.enum(['Spring', 'Fall']).optional(),
  batchYear: z.number().int().min(2010).max(2025).optional(),
  gradSeason: z.enum(['Spring', 'Fall']).optional(),
  gradYear: z.number().int().min(2010).max(2025).optional(),
  
  // Profile info
  profilePicture: emptyToUndef(z.string().regex(/^(https?:\/\/.*|\/uploads\/.*|data:image\/.*)$/)),
  bio: emptyToUndef(z.string().max(500)),
  program: emptyToUndef(z.string().min(2)),
  currentCompany: emptyToUndef(z.string()),
  position: emptyToUndef(z.string()),
  skills: emptyToUndef(z.string()),
  profileHeadline: emptyToUndef(z.string().min(3)),
  location: emptyToUndef(z.string()),
  experienceYears: z.number().int().min(0).max(60).optional(),
  
  // New onboarding fields
  interests: z.array(z.string()).optional(),
  preferredIndustries: z.array(z.string()).optional(),
  skillsToDevelop: z.array(z.string()).optional(),
  mentorshipPreferences: z.object({
    seekingMentor: z.boolean().default(false),
    availableToMentor: z.boolean().default(false),
    mentorshipGoals: z.array(z.string()).default([]),
    preferredCommunication: z.enum(['chat', 'video', 'in-person', 'any']).default('any'),
    additionalNotes: z.string().max(1000).optional(),
  }).optional(),
  onboardingCompleted: z.boolean().optional(),
  onboardingStep: z.number().int().min(0).max(10).default(0).optional(),
  onboardingRequired: z.boolean().optional(),
}).partial();

userRouter.patch('/me', requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  if (!Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const current = await User.findById(userId).lean().exec();
  if (!current) return res.status(404).json({ error: 'Not found' });

  // Type assertion for current user
  const currentUser = current as unknown as IUser & { _id: Types.ObjectId };
  
  const data: Partial<IUser> = { ...parsed.data };

  // Create a candidate object with merged data for validation
  const candidate = { ...currentUser, ...data };
  // Check if required profile fields are filled
  const requiredFilled = [
    candidate.name,
    candidate.program,
    candidate.batchSeason,
    candidate.batchYear,
    candidate.profileHeadline,
    candidate.skills,
    candidate.location,
  ].every(Boolean);
  
  // Update profile completion status
  data.profileCompleted = !!requiredFilled;
  
  // If all onboarding steps are complete, mark onboarding as completed
  if (data.onboardingStep !== undefined && data.onboardingStep >= 5 && !data.onboardingCompleted) {
    data.onboardingCompleted = true;
  }

  // If onboarding is completed, clear onboardingRequired
  if (data.onboardingCompleted) {
    (data as any).onboardingRequired = false;
  }

  // Recompute mentor eligibility from the combined rule:
  // - role is student or alumni
  // - onboardingCompleted is true
  // - mentorshipPreferences.availableToMentor is true
  // - experienceYears >= 4
  const mentorEligibilityInputsChanged = [
    'experienceYears',
    'mentorshipPreferences',
    'onboardingCompleted',
    'role',
  ].some((k) => k in parsed.data);
  if (mentorEligibilityInputsChanged) {
    const nextRole = (data.role ?? currentUser.role) as any;
    const nextOnboardingCompleted = (data.onboardingCompleted ?? currentUser.onboardingCompleted) === true;
    const nextExperienceYears = (data.experienceYears ?? currentUser.experienceYears) ?? 0;
    const nextMentorshipPrefs = (data.mentorshipPreferences ?? currentUser.mentorshipPreferences) as any;
    const availableToMentor = nextMentorshipPrefs?.availableToMentor === true;

    data.mentorEligible =
      ['student', 'alumni'].includes(String(nextRole)) &&
      nextOnboardingCompleted &&
      availableToMentor &&
      Number(nextExperienceYears) >= 4;
  }

  // Update the user with the new data
  const updatedUser = await User.findByIdAndUpdate(
    userId, 
    { $set: data },
    { new: true, lean: true }
  ).exec();

  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Sync mentor profile if mentorship-related fields changed
  const mentorFieldsChanged = [
    'experienceYears',
    'preferredIndustries',
    'interests',
    'skills',
    'mentorshipPreferences',
    'mentorEligible',
    'onboardingCompleted',
  ].some(k => k in parsed.data);
  if (mentorFieldsChanged) {
    await syncMentorProfile(updatedUser as any);
  }

  // Type assertion for the updated user
  const userDoc = updatedUser as unknown as IUser & { _id: Types.ObjectId };
  
  // Prepare the response
  const user = {
    id: String(userDoc._id),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    sapId: userDoc.sapId,
    batchSeason: userDoc.batchSeason,
    batchYear: userDoc.batchYear,
    gradSeason: userDoc.gradSeason,
    gradYear: userDoc.gradYear,
    linkedinId: userDoc.linkedinId,
    profilePicture: userDoc.profilePicture,
    bio: (userDoc as any).bio,
    program: userDoc.program,
    currentCompany: userDoc.currentCompany,
    position: userDoc.position,
    skills: userDoc.skills,
    profileHeadline: userDoc.profileHeadline,
    location: userDoc.location,
    experienceYears: userDoc.experienceYears,
    
    // New onboarding fields
    interests: userDoc.interests || [],
    preferredIndustries: userDoc.preferredIndustries || [],
    skillsToDevelop: userDoc.skillsToDevelop || [],
    mentorshipPreferences: {
      seekingMentor: userDoc.mentorshipPreferences?.seekingMentor || false,
      availableToMentor: userDoc.mentorshipPreferences?.availableToMentor || false,
      mentorshipGoals: userDoc.mentorshipPreferences?.mentorshipGoals || [],
      preferredCommunication: userDoc.mentorshipPreferences?.preferredCommunication || 'any',
      additionalNotes: (userDoc.mentorshipPreferences as any)?.additionalNotes,
    },
    
    profileCompleted: !!userDoc.profileCompleted,
    mentorEligible: !!userDoc.mentorEligible,
    onboardingCompleted: !!userDoc.onboardingCompleted,
    onboardingStep: userDoc.onboardingStep || 0,
    onboardingRequired: !!(userDoc as any).onboardingRequired,
    
    // Timestamps
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
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

// POST /me/attachment - upload a message attachment
// Accepts common doc and image types, up to 10MB
const attachStorage = multer.diskStorage({
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
    const safeName = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(safeName) || '';
    const name = `file_${Date.now()}${ext}`;
    cb(null, name);
  },
});
const uploadAttachment = multer({
  storage: attachStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
    ];
    if (allowed.includes((file as any).mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type'));
  },
});

userRouter.post('/me/attachment', requireAuth, uploadAttachment.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const userId = (req as any).user.id as string;
  if (!Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  const base = `${req.protocol}://${req.get('host')}`;
  const publicUrl = `${base}/uploads/${req.file.filename}`;
  return res.json({
    url: publicUrl,
    name: req.file.originalname,
    type: (req.file as any).mimetype,
    size: (req.file as any).size,
  });
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

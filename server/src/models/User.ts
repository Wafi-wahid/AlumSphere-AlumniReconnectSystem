import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'alumni', 'admin', 'super_admin'], required: true },
    adminCategory: { type: String },
    sapId: { type: String, unique: true, sparse: true },
    batchSeason: { type: String },
    batchYear: { type: Number },
    gradSeason: { type: String },
    gradYear: { type: Number },
    linkedinId: { type: String },
    profilePicture: { type: String },
    program: { type: String },
    currentCompany: { type: String },
    position: { type: String },
    // keep skills as a simple string (comma-separated) to match current client expectations
    skills: { type: String },
    profileHeadline: { type: String },
    location: { type: String },
    experienceYears: { type: Number },
    profileCompleted: { type: Boolean, default: false },
    mentorEligible: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type IUser = {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'alumni' | 'admin' | 'super_admin';
  adminCategory?: string | null;
  sapId?: string | null;
  batchSeason?: 'Spring' | 'Fall' | null;
  batchYear?: number | null;
  gradSeason?: 'Spring' | 'Fall' | null;
  gradYear?: number | null;
  linkedinId?: string | null;
  profilePicture?: string | null;
  program?: string | null;
  currentCompany?: string | null;
  position?: string | null;
  skills?: string | null;
  profileHeadline?: string | null;
  location?: string | null;
  experienceYears?: number | null;
  profileCompleted: boolean;
  mentorEligible: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const User = models.User || model('User', UserSchema);

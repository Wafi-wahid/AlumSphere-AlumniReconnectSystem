import { Schema, model, Types } from 'mongoose';

export interface IMentorProfile {
  userId: Types.ObjectId;
  name: string;
  email: string;
  role: 'student' | 'alumni' | 'admin' | 'super_admin';
  profilePicture?: string;
  profileHeadline?: string;
  location?: string;
  currentCompany?: string;
  position?: string;
  experienceYears?: number;
  mentorEligible: boolean;
  availableToMentor: boolean;
  mentorIndustries: string[];
  mentorInterests: string[];
  mentorSkills: string[];
  mentorshipGoals: string[];
  preferredCommunication: 'chat' | 'video' | 'in-person' | 'any';
  additionalNotes?: string;
  // Optional later: embedding vector for AI similarity
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const MentorProfileSchema = new Schema<IMentorProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['student', 'alumni', 'admin', 'super_admin'], required: true },
  profilePicture: { type: String },
  profileHeadline: { type: String },
  location: { type: String },
  currentCompany: { type: String },
  position: { type: String },
  experienceYears: { type: Number },
  mentorEligible: { type: Boolean, required: true },
  availableToMentor: { type: Boolean, required: true },
  mentorIndustries: [{ type: String }],
  mentorInterests: [{ type: String }],
  mentorSkills: [{ type: String }],
  mentorshipGoals: [{ type: String }],
  preferredCommunication: { type: String, enum: ['chat', 'video', 'in-person', 'any'], default: 'any' },
  additionalNotes: { type: String },
  embedding: [{ type: Number }],
}, { timestamps: true });

// Indexes for fast recommendation queries
MentorProfileSchema.index({ mentorEligible: 1, availableToMentor: 1 });
MentorProfileSchema.index({ mentorIndustries: 1 });
MentorProfileSchema.index({ mentorInterests: 1 });
MentorProfileSchema.index({ mentorSkills: 1 });

export const MentorProfile = model<IMentorProfile>('MentorProfile', MentorProfileSchema);

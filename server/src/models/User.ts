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
    bio: { type: String },
    program: { type: String },
    customProgram: { type: String },
    department: { type: String },
    currentCompany: { type: String },
    position: { type: String },
    // keep skills as a simple string (comma-separated) to match current client expectations
    skills: { type: String },
    profileHeadline: { type: String },
    location: { type: String },
    experienceYears: { type: Number },
    profileCompleted: { type: Boolean, default: false },
    mentorEligible: { type: Boolean, default: false },
    
    // New fields for enhanced onboarding
    interests: { type: [String], default: [] },
    preferredIndustries: { type: [String], default: [] },
    skillsToDevelop: { type: [String], default: [] },
    mentorshipPreferences: {
      seekingMentor: { type: Boolean, default: false },
      availableToMentor: { type: Boolean, default: false },
      mentorshipGoals: { type: [String], default: [] },
      preferredCommunication: {
        type: String,
        enum: ['chat', 'video', 'in-person', 'any'],
        default: 'any'
      },
      additionalNotes: { type: String },
    },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 0 },
    onboardingRequired: { type: Boolean, default: false },
  },
  { 
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
      transform: function(doc: any, ret: any) {
        // Type assertion to allow property deletion
        const retObj = ret as { passwordHash?: string; __v?: any; [key: string]: any };
        
        if ('passwordHash' in retObj) {
          delete retObj.passwordHash;
        }
        if ('__v' in retObj) {
          delete retObj.__v;
        }
        return retObj;
      }
    }
  }
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
  bio?: string | null;
  program?: string | null;
  customProgram?: string | null;
  department?: string | null;
  currentCompany?: string | null;
  position?: string | null;
  skills?: string | null;
  profileHeadline?: string | null;
  location?: string | null;
  experienceYears?: number | null;
  interests?: string[];
  preferredIndustries?: string[];
  skillsToDevelop?: string[];
  mentorshipPreferences?: {
    seekingMentor: boolean;
    availableToMentor: boolean;
    mentorshipGoals: string[];
    preferredCommunication: 'chat' | 'video' | 'in-person' | 'any';
    additionalNotes?: string;
  };
  profileCompleted: boolean;
  mentorEligible: boolean;
  onboardingCompleted: boolean;
  onboardingStep: number;
  onboardingRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const User = models.User || model('User', UserSchema);

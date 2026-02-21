import { Schema, model, Types } from 'mongoose';

export interface IJob {
  title: string;
  company: string;
  location?: string;
  description: string;
  requiredSkills: string[];
  industry?: string;
  tags: string[];
  experienceYears?: number;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryRange?: string;
  postedBy: Types.ObjectId; // user who posted the job
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  description: { type: String, required: true },
  requiredSkills: [{ type: String, required: true }],
  industry: { type: String },
  tags: [{ type: String }],
  experienceYears: { type: Number },
  employmentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'] },
  salaryRange: { type: String },
  postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

JobSchema.index({ requiredSkills: 1 });
JobSchema.index({ industry: 1 });
JobSchema.index({ tags: 1 });
JobSchema.index({ isActive: 1 });

export const Job = model<IJob>('Job', JobSchema);

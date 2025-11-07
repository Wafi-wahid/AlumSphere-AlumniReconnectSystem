import { Schema, model, models, Types } from 'mongoose';

const MentorshipRequestSchema = new Schema(
  {
    studentId: { type: String, required: true },
    mentorId: { type: String, required: true },
    topic: { type: String, required: true },
    sessionType: { type: String, enum: ['30m', '45m', '60m'], required: true },
    preferredDateTime: { type: Date, required: true },
    notes: { type: String },
    status: { type: String, enum: ['Pending', 'Accepted', 'Declined', 'Cancelled'], default: 'Pending', index: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type TMentorshipRequest = {
  _id: Types.ObjectId;
  studentId: string;
  mentorId: string;
  topic: string;
  sessionType: '30m' | '45m' | '60m';
  preferredDateTime: Date;
  notes?: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Cancelled';
  createdAt: Date;
  updatedAt: Date;
};

export const MentorshipRequest = models.MentorshipRequest || model('MentorshipRequest', MentorshipRequestSchema);

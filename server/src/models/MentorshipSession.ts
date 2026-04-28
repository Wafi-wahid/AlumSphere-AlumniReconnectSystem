import { Schema, model, models, Types } from 'mongoose';

export type MentorshipSessionStatus = 'Scheduled' | 'Completed' | 'Missed' | 'Cancelled';

const MentorshipSessionSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'MentorshipRequest', required: true, unique: true, index: true },
    studentId: { type: String, required: true, index: true },
    mentorId: { type: String, required: true, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    durationMins: { type: Number, required: true },
    meetingProvider: { type: String, enum: ['jitsi'], default: 'jitsi', required: true },
    meetingLink: { type: String, required: true },
    status: { type: String, enum: ['Scheduled', 'Completed', 'Missed', 'Cancelled'], default: 'Scheduled', index: true },
    reminderSentAt: { type: Date },
    studentRating: { type: Number, min: 1, max: 5 },
    studentFeedback: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type TMentorshipSession = {
  _id: Types.ObjectId;
  requestId: Types.ObjectId;
  studentId: string;
  mentorId: string;
  scheduledAt: Date;
  durationMins: number;
  meetingProvider: 'jitsi';
  meetingLink: string;
  status: MentorshipSessionStatus;
  reminderSentAt?: Date;
  studentRating?: number;
  studentFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const MentorshipSession =
  (models.MentorshipSession as any) || model('MentorshipSession', MentorshipSessionSchema);

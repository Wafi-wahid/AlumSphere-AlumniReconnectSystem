import { Schema, model, Types } from 'mongoose';

export interface IEvent {
  title: string;
  description: string;
  date: Date;
  location?: string;
  isVirtual: boolean;
  tags: string[];
  industry?: string;
  organizer?: string;
  registrationLink?: string;
  postedBy: Types.ObjectId; // user who posted the event
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String },
  isVirtual: { type: Boolean, default: false },
  tags: [{ type: String }],
  industry: { type: String },
  organizer: { type: String },
  registrationLink: { type: String },
  postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

EventSchema.index({ tags: 1 });
EventSchema.index({ industry: 1 });
EventSchema.index({ date: 1 });
EventSchema.index({ isActive: 1 });

export const Event = model<IEvent>('Event', EventSchema);

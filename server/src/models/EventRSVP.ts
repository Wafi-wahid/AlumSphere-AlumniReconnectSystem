import { Schema, model, Types } from 'mongoose';

export interface IEventRSVP {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'attending' | 'maybe' | 'not_attending';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventRSVPSchema = new Schema<IEventRSVP>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['attending', 'maybe', 'not_attending'], 
    required: true,
    default: 'attending'
  },
  notes: { type: String, maxlength: 500 }
}, { 
  timestamps: true
});

// Ensure a user can only RSVP once per event
EventRSVPSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const EventRSVP = model<IEventRSVP>('EventRSVP', EventRSVPSchema);

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { z } from 'zod';
import { Event } from '../models/Event';
import { EventRSVP } from '../models/EventRSVP';
import { User } from '../models/User';

export const eventsRouter = Router();

// Schemas for validation
const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  date: z.string().datetime(), // ISO datetime string
  location: z.string().optional(),
  isVirtual: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  industry: z.string().optional(),
  organizer: z.string().optional(),
  registrationLink: z.string().url().optional(),
  maxAttendees: z.number().positive().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
});

const updateEventSchema = createEventSchema.partial();

const queryEventsSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  industry: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  isVirtual: z.string().transform(val => val === 'true').optional(),
  upcoming: z.string().transform(val => val === 'true').optional(),
  past: z.string().transform(val => val === 'true').optional(),
});

// GET /api/events - Get all events with filtering and pagination
eventsRouter.get('/', async (req, res) => {
  try {
    const parsed = queryEventsSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
    }

    const { page, limit, search, tags, industry, category, type, isVirtual, upcoming, past } = parsed.data;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { isActive: true };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (industry) {
      query.industry = { $regex: industry, $options: 'i' };
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (type) {
      query.type = { $regex: type, $options: 'i' };
    }

    if (typeof isVirtual === 'boolean') {
      query.isVirtual = isVirtual;
    }

    if (upcoming) {
      query.date = { $gte: new Date() };
    }

    if (past) {
      query.date = { $lt: new Date() };
    }

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('postedBy', 'name email profilePicture')
        .sort({ date: upcoming ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query)
    ]);

    return res.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - Get single event by ID
eventsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id)
      .populate('postedBy', 'name email profilePicture')
      .lean();

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json({ event });
  } catch (error: any) {
    console.error('Error fetching event:', error);
    return res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/events - Create new event (admin/super_admin only)
eventsRouter.post('/', requireAuth, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid event data', details: parsed.error.flatten() });
    }

    const eventData = {
      ...parsed.data,
      date: new Date(parsed.data.date),
      postedBy: (req as any).user.id,
    };

    const event = await Event.create(eventData);
    await event.populate('postedBy', 'name email profilePicture');

    return res.status(201).json({ event });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id - Update event (admin/super_admin only, or original poster)
eventsRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid event data', details: parsed.error.flatten() });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check permissions: admin/super_admin can edit any event, others can only edit their own
    if (!['admin', 'super_admin'].includes(user.role) && event.postedBy.toString() !== user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this event' });
    }

    const updateData = {
      ...parsed.data,
      ...(parsed.data.date && { date: new Date(parsed.data.date) })
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('postedBy', 'name email profilePicture');

    return res.json({ event: updatedEvent });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Delete event (admin/super_admin only, or original poster)
eventsRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check permissions: admin/super_admin can delete any event, others can only delete their own
    if (!['admin', 'super_admin'].includes(user.role) && event.postedBy.toString() !== user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    // Soft delete by setting isActive to false
    await Event.findByIdAndUpdate(id, { isActive: false });

    return res.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ error: 'Failed to delete event' });
  }
});

// GET /api/events/my-events - Get events created by current user
eventsRouter.get('/my-events', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const parsed = queryEventsSchema.safeParse(req.query);
    
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
    }

    const { page, limit, search, tags, industry, category, type, isVirtual, upcoming, past } = parsed.data;
    const skip = (page - 1) * limit;

    const query: any = { 
      postedBy: user.id,
      isActive: true 
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (industry) {
      query.industry = { $regex: industry, $options: 'i' };
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (type) {
      query.type = { $regex: type, $options: 'i' };
    }

    if (typeof isVirtual === 'boolean') {
      query.isVirtual = isVirtual;
    }

    if (upcoming) {
      query.date = { $gte: new Date() };
    }

    if (past) {
      query.date = { $lt: new Date() };
    }

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('postedBy', 'name email profilePicture')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query)
    ]);

    return res.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching user events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/tags - Get all unique tags for filtering
eventsRouter.get('/tags', async (req, res) => {
  try {
    const tags = await Event.distinct('tags', { isActive: true });
    return res.json({ tags });
  } catch (error: any) {
    console.error('Error fetching tags:', error);
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/events/industries - Get all unique industries for filtering
eventsRouter.get('/industries', async (req, res) => {
  try {
    const industries = await Event.distinct('industry', { isActive: true, industry: { $ne: null } });
    return res.json({ industries });
  } catch (error: any) {
    console.error('Error fetching industries:', error);
    return res.status(500).json({ error: 'Failed to fetch industries' });
  }
});

// RSVP Schemas
const createRSVPSchema = z.object({
  status: z.enum(['attending', 'maybe', 'not_attending']),
  notes: z.string().max(500).optional(),
});

// POST /api/events/:id/rsvp - Create or update RSVP for an event
eventsRouter.post('/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as any).user.id;

    const parsed = createRSVPSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid RSVP data', details: parsed.error.flatten() });
    }

    // Check if event exists and is active
    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Create or update RSVP
    const rsvp = await EventRSVP.findOneAndUpdate(
      { eventId, userId },
      { 
        status: parsed.data.status,
        notes: parsed.data.notes,
        updatedAt: new Date()
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    ).populate('userId', 'name email profilePicture');

    return res.json({ rsvp });
  } catch (error: any) {
    console.error('Error creating RSVP:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'RSVP already exists' });
    }
    return res.status(500).json({ error: 'Failed to create RSVP' });
  }
});

// GET /api/events/:id/rsvp - Get user's RSVP for an event
eventsRouter.get('/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as any).user.id;

    const rsvp = await EventRSVP.findOne({ eventId, userId })
      .populate('userId', 'name email profilePicture')
      .lean();

    return res.json({ rsvp });
  } catch (error: any) {
    console.error('Error fetching RSVP:', error);
    return res.status(500).json({ error: 'Failed to fetch RSVP' });
  }
});

// DELETE /api/events/:id/rsvp - Cancel RSVP for an event
eventsRouter.delete('/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as any).user.id;

    const result = await EventRSVP.deleteOne({ eventId, userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'RSVP not found' });
    }

    return res.json({ message: 'RSVP cancelled successfully' });
  } catch (error: any) {
    console.error('Error cancelling RSVP:', error);
    return res.status(500).json({ error: 'Failed to cancel RSVP' });
  }
});

// GET /api/events/:id/rsvps - Get all RSVPs for an event (event organizer/admin only)
eventsRouter.get('/:id/rsvps', requireAuth, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const user = (req as any).user;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check permissions: admin/super_admin can view any event RSVPs, others can only view their own events
    if (!['admin', 'super_admin'].includes(user.role) && event.postedBy.toString() !== user.id) {
      return res.status(403).json({ error: 'Not authorized to view RSVPs for this event' });
    }

    const rsvps = await EventRSVP.find({ eventId })
      .populate('userId', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    // Count by status
    const stats = {
      total: rsvps.length,
      attending: rsvps.filter(r => r.status === 'attending').length,
      maybe: rsvps.filter(r => r.status === 'maybe').length,
      not_attending: rsvps.filter(r => r.status === 'not_attending').length
    };

    return res.json({ rsvps, stats });
  } catch (error: any) {
    console.error('Error fetching RSVPs:', error);
    return res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
});

// GET /api/events/my-rsvps - Get all RSVPs for current user
eventsRouter.get('/my-rsvps', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const [rsvps, total] = await Promise.all([
      EventRSVP.find(query)
        .populate({
          path: 'eventId',
          match: { isActive: true },
          select: 'title description date location isVirtual tags industry organizer'
        })
        .populate('userId', 'name email profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      EventRSVP.countDocuments(query)
    ]);

    // Filter out events that are no longer active
    const validRsvps = rsvps.filter(rsvp => rsvp.eventId);

    return res.json({
      rsvps: validRsvps,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching user RSVPs:', error);
    return res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
});

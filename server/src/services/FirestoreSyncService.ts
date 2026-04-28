import mongoose from 'mongoose';
import { getFirestore } from '../firebaseAdmin';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { MentorProfile } from '../models/MentorProfile';

/**
 * MongoDB to Firestore Sync Service
 * Uses MongoDB Change Streams to automatically sync data changes to Firestore
 * for real-time UI features.
 */

export class FirestoreSyncService {
  private static instance: FirestoreSyncService;
  private changeStreams: any[] = [];
  private db = getFirestore();
  private isRunning = false;

  private constructor() {}

  static getInstance(): FirestoreSyncService {
    if (!FirestoreSyncService.instance) {
      FirestoreSyncService.instance = new FirestoreSyncService();
    }
    return FirestoreSyncService.instance;
  }

  /**
   * Start all change stream listeners
   */
  async start() {
    if (this.isRunning) {
      console.warn('[FirestoreSync] Service already running');
      return;
    }

    console.log('[FirestoreSync] Starting MongoDB to Firestore sync service...');
    this.isRunning = true;

    try {
      // Initial sync of existing data
      await this.initialSync();
      
      // Start User collection sync
      this.syncUsers();
      
      // Start Event collection sync
      this.syncEvents();
      
      // Start MentorProfile collection sync
      this.syncMentorProfiles();

      console.log('[FirestoreSync] All change streams started successfully');
    } catch (error) {
      console.error('[FirestoreSync] Failed to start sync service:', error);
      this.stop();
      throw error;
    }
  }

  /**
   * Initial sync of all existing MongoDB data to Firestore
   */
  private async initialSync() {
    console.log('[FirestoreSync] Starting initial sync of existing data...');

    try {
      // Sync all existing users
      const users = await User.find().lean();
      console.log(`[FirestoreSync] Found ${users.length} users to sync`);
      
      for (const doc of users) {
        const docId = doc._id.toString();
        const firestorePath = `users/${docId}`;

        const userData = {
          name: doc.name || '',
          email: doc.email || '',
          avatar: doc.profilePicture || '',
          profilePicture: doc.profilePicture || '',
          currentCompany: doc.currentCompany || '',
          profileHeadline: doc.profileHeadline || '',
          location: doc.location || '',
          experienceYears: doc.experienceYears || 0,
          skills: Array.isArray(doc.skills) ? doc.skills : String(doc.skills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
          mentorEligible: !!doc.mentorEligible,
          role: doc.role || 'student',
          sapId: doc.sapId || '',
          batchSeason: doc.batchSeason || '',
          batchYear: doc.batchYear || 0,
          gradSeason: doc.gradSeason || '',
          gradYear: doc.gradYear || 0,
          linkedinId: doc.linkedinId || '',
          bio: doc.bio || '',
          onboardingCompleted: doc.onboardingCompleted || false,
          onboardingRequired: doc.onboardingRequired || false,
          onboardingStep: doc.onboardingStep || 0,
          updatedAt: doc.updatedAt || new Date(),
          createdAt: doc.createdAt || new Date(),
        };

        await this.db.doc(firestorePath).set(userData, { merge: true });
      }

      // Sync all existing events
      const events = await Event.find().lean();
      console.log(`[FirestoreSync] Found ${events.length} events to sync`);
      
      for (const doc of events) {
        const docId = doc._id.toString();
        const firestorePath = `events/${docId}`;

        const eventData = {
          title: doc.title || '',
          description: doc.description || '',
          date: doc.date || null,
          location: doc.location || '',
          isVirtual: doc.isVirtual || false,
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          industry: doc.industry || '',
          organizer: doc.organizer || '',
          registrationLink: doc.registrationLink || '',
          postedBy: doc.postedBy?.toString() || '',
          isActive: doc.isActive !== undefined ? doc.isActive : true,
          maxAttendees: doc.maxAttendees || 0,
          category: doc.category || '',
          type: doc.type || '',
          rsvps: Array.isArray(doc.rsvps) ? doc.rsvps.map((id: any) => id.toString()) : [],
          updatedAt: doc.updatedAt || new Date(),
          createdAt: doc.createdAt || new Date(),
        };

        await this.db.doc(firestorePath).set(eventData, { merge: true });
      }

      // Sync all existing mentor profiles
      const mentorProfiles = await MentorProfile.find().lean();
      console.log(`[FirestoreSync] Found ${mentorProfiles.length} mentor profiles to sync`);
      
      for (const doc of mentorProfiles) {
        const docId = doc._id.toString();
        const firestorePath = `mentors/${docId}`;

        const mentorData = {
          userId: doc.userId?.toString() || '',
          mentorEligible: doc.mentorEligible || false,
          availableToMentor: doc.availableToMentor || false,
          mentorIndustries: Array.isArray(doc.mentorIndustries) ? doc.mentorIndustries : [],
          mentorSkills: Array.isArray(doc.mentorSkills) ? doc.mentorSkills : [],
          mentorshipGoals: Array.isArray(doc.mentorshipGoals) ? doc.mentorshipGoals : [],
          preferredCommunication: doc.preferredCommunication || '',
          bio: doc.bio || '',
          experienceYears: doc.experienceYears || 0,
          currentCompany: doc.currentCompany || '',
          profileHeadline: doc.profileHeadline || '',
          location: doc.location || '',
          updatedAt: doc.updatedAt || new Date(),
          createdAt: doc.createdAt || new Date(),
        };

        await this.db.doc(firestorePath).set(mentorData, { merge: true });
      }

      console.log('[FirestoreSync] Initial sync completed successfully');
    } catch (error) {
      console.error('[FirestoreSync] Initial sync failed:', error);
      throw error;
    }
  }

  /**
   * Stop all change stream listeners
   */
  async stop() {
    console.log('[FirestoreSync] Stopping sync service...');
    this.isRunning = false;

    for (const stream of this.changeStreams) {
      try {
        await stream.close();
      } catch (error) {
        console.error('[FirestoreSync] Error closing change stream:', error);
      }
    }

    this.changeStreams = [];
    console.log('[FirestoreSync] Sync service stopped');
  }

  /**
   * Sync User collection changes to Firestore
   */
  private syncUsers() {
    console.log('[FirestoreSync] Starting User collection sync...');

    const stream = User.watch([], { fullDocument: 'updateLookup' });

    stream.on('change', async (change) => {
      try {
        const docId = change.documentKey._id.toString();
        const firestorePath = `users/${docId}`;

        switch (change.operationType) {
          case 'insert':
          case 'update':
          case 'replace':
            const doc = change.fullDocument;
            if (!doc) break;

            const userData = {
              name: doc.name || '',
              email: doc.email || '',
              avatar: doc.profilePicture || '',
              profilePicture: doc.profilePicture || '',
              currentCompany: doc.currentCompany || '',
              profileHeadline: doc.profileHeadline || '',
              location: doc.location || '',
              experienceYears: doc.experienceYears || 0,
              skills: Array.isArray(doc.skills) ? doc.skills : String(doc.skills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
              mentorEligible: !!doc.mentorEligible,
              role: doc.role || 'student',
              sapId: doc.sapId || '',
              batchSeason: doc.batchSeason || '',
              batchYear: doc.batchYear || 0,
              gradSeason: doc.gradSeason || '',
              gradYear: doc.gradYear || 0,
              linkedinId: doc.linkedinId || '',
              bio: doc.bio || '',
              onboardingCompleted: doc.onboardingCompleted || false,
              onboardingRequired: doc.onboardingRequired || false,
              onboardingStep: doc.onboardingStep || 0,
              updatedAt: doc.updatedAt || new Date(),
              createdAt: doc.createdAt || new Date(),
            };

            await this.db.doc(firestorePath).set(userData, { merge: true });
            console.log(`[FirestoreSync] User synced: ${docId} (${change.operationType})`);
            break;

          case 'delete':
            await this.db.doc(firestorePath).delete();
            console.log(`[FirestoreSync] User deleted: ${docId}`);
            break;
        }
      } catch (error) {
        console.error('[FirestoreSync] Error syncing user:', error);
      }
    });

    stream.on('error', (error) => {
      console.error('[FirestoreSync] User change stream error:', error);
    });

    this.changeStreams.push(stream);
  }

  /**
   * Sync Event collection changes to Firestore
   */
  private syncEvents() {
    console.log('[FirestoreSync] Starting Event collection sync...');

    const stream = Event.watch([], { fullDocument: 'updateLookup' });

    stream.on('change', async (change) => {
      try {
        const docId = change.documentKey._id.toString();
        const firestorePath = `events/${docId}`;

        switch (change.operationType) {
          case 'insert':
          case 'update':
          case 'replace':
            const doc = change.fullDocument;
            if (!doc) break;

            const eventData = {
              title: doc.title || '',
              description: doc.description || '',
              date: doc.date || null,
              location: doc.location || '',
              isVirtual: doc.isVirtual || false,
              tags: Array.isArray(doc.tags) ? doc.tags : [],
              industry: doc.industry || '',
              organizer: doc.organizer || '',
              registrationLink: doc.registrationLink || '',
              postedBy: doc.postedBy?.toString() || '',
              isActive: doc.isActive !== undefined ? doc.isActive : true,
              maxAttendees: doc.maxAttendees || 0,
              category: doc.category || '',
              type: doc.type || '',
              rsvps: Array.isArray(doc.rsvps) ? doc.rsvps.map((id: any) => id.toString()) : [],
              updatedAt: doc.updatedAt || new Date(),
              createdAt: doc.createdAt || new Date(),
            };

            await this.db.doc(firestorePath).set(eventData, { merge: true });
            console.log(`[FirestoreSync] Event synced: ${docId} (${change.operationType})`);
            break;

          case 'delete':
            await this.db.doc(firestorePath).delete();
            console.log(`[FirestoreSync] Event deleted: ${docId}`);
            break;
        }
      } catch (error) {
        console.error('[FirestoreSync] Error syncing event:', error);
      }
    });

    stream.on('error', (error) => {
      console.error('[FirestoreSync] Event change stream error:', error);
    });

    this.changeStreams.push(stream);
  }

  /**
   * Sync MentorProfile collection changes to Firestore
   */
  private syncMentorProfiles() {
    console.log('[FirestoreSync] Starting MentorProfile collection sync...');

    const stream = MentorProfile.watch([], { fullDocument: 'updateLookup' });

    stream.on('change', async (change) => {
      try {
        const docId = change.documentKey._id.toString();
        const firestorePath = `mentors/${docId}`;

        switch (change.operationType) {
          case 'insert':
          case 'update':
          case 'replace':
            const doc = change.fullDocument;
            if (!doc) break;

            const mentorData = {
              userId: doc.userId?.toString() || '',
              mentorEligible: doc.mentorEligible || false,
              availableToMentor: doc.availableToMentor || false,
              mentorIndustries: Array.isArray(doc.mentorIndustries) ? doc.mentorIndustries : [],
              mentorSkills: Array.isArray(doc.mentorSkills) ? doc.mentorSkills : [],
              mentorshipGoals: Array.isArray(doc.mentorshipGoals) ? doc.mentorshipGoals : [],
              preferredCommunication: doc.preferredCommunication || '',
              bio: doc.bio || '',
              experienceYears: doc.experienceYears || 0,
              currentCompany: doc.currentCompany || '',
              profileHeadline: doc.profileHeadline || '',
              location: doc.location || '',
              updatedAt: doc.updatedAt || new Date(),
              createdAt: doc.createdAt || new Date(),
            };

            await this.db.doc(firestorePath).set(mentorData, { merge: true });
            console.log(`[FirestoreSync] MentorProfile synced: ${docId} (${change.operationType})`);
            break;

          case 'delete':
            await this.db.doc(firestorePath).delete();
            console.log(`[FirestoreSync] MentorProfile deleted: ${docId}`);
            break;
        }
      } catch (error) {
        console.error('[FirestoreSync] Error syncing mentor profile:', error);
      }
    });

    stream.on('error', (error) => {
      console.error('[FirestoreSync] MentorProfile change stream error:', error);
    });

    this.changeStreams.push(stream);
  }
}

export const firestoreSyncService = FirestoreSyncService.getInstance();

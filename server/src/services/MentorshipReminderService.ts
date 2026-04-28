import cron from 'node-cron';
import { MentorshipSession } from '../models/MentorshipSession';
import { User } from '../models/User';
import { sendInAppNotification } from '../lib/notifications';
import { sendEmail } from '../lib/mailer';

let started = false;

export function startMentorshipReminderService() {
  if (started) return;
  started = true;

  cron.schedule('* * * * *', async () => {
    try {
      const now = Date.now();
      const windowStart = new Date(now + 59 * 60 * 1000);
      const windowEnd = new Date(now + 60 * 60 * 1000);

      const sessions = await MentorshipSession.find({
        status: 'Scheduled',
        reminderSentAt: { $exists: false },
        scheduledAt: { $gte: windowStart, $lte: windowEnd },
      }).lean();

      for (const s of sessions as any[]) {
        const scheduledAt = new Date(s.scheduledAt);
        const when = scheduledAt.toLocaleString();

        const [student, mentor] = (await Promise.all([
          User.findById(s.studentId).select({ _id: 1, email: 1, name: 1 }).lean(),
          User.findById(s.mentorId).select({ _id: 1, email: 1, name: 1 }).lean(),
        ])) as any[];

        if (student?._id) {
          await sendInAppNotification(String(student._id), {
            type: 'mentorship_reminder',
            title: 'Mentorship session starts in 1 hour',
            body: `Your session is scheduled at ${when}.`,
            link: '/mentorship',
            metadata: { sessionId: String(s._id), requestId: String(s.requestId) },
          });
        }
        if (mentor?._id) {
          await sendInAppNotification(String(mentor._id), {
            type: 'mentorship_reminder',
            title: 'Mentorship session starts in 1 hour',
            body: `Your session is scheduled at ${when}.`,
            link: '/mentorship',
            metadata: { sessionId: String(s._id), requestId: String(s.requestId) },
          });
        }

        if (student?.email) {
          await sendEmail({
            to: String(student.email),
            subject: 'Reminder: mentorship session in 1 hour',
            text: `Your mentorship session starts in 1 hour (at ${when}). Join: ${s.meetingLink}`,
          });
        }
        if (mentor?.email) {
          await sendEmail({
            to: String(mentor.email),
            subject: 'Reminder: mentorship session in 1 hour',
            text: `Your mentorship session starts in 1 hour (at ${when}). Join: ${s.meetingLink}`,
          });
        }

        await MentorshipSession.updateOne({ _id: s._id }, { $set: { reminderSentAt: new Date() } });
      }
    } catch (err) {
      console.error('[MentorshipReminderService] tick failed', err);
    }
  });

  console.log('[MentorshipReminderService] started');
}

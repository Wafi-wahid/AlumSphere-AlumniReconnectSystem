import { User, IUser } from '../models/User';
import { MentorProfile, IMentorProfile } from '../models/MentorProfile';
import { Types } from 'mongoose';

/**
 * Sync a user to/from the MentorProfile collection.
 * - If the user is mentor-eligible and opted-in: upsert their MentorProfile.
 * - Otherwise, delete any existing MentorProfile for that user.
 */
export async function syncMentorProfile(user: IUser & { _id: Types.ObjectId }) {
  const isEligible = !!user.mentorEligible && (user as any).mentorshipPreferences?.availableToMentor === true;

  if (!isEligible) {
    // Remove from mentor profiles if no longer eligible
    await MentorProfile.deleteOne({ userId: user._id }).exec();
    return null;
  }

  const mentorData: Partial<IMentorProfile> = {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture ?? undefined,
    profileHeadline: user.profileHeadline ?? undefined,
    location: user.location ?? undefined,
    currentCompany: user.currentCompany ?? undefined,
    position: user.position ?? undefined,
    experienceYears: user.experienceYears ?? undefined,
    mentorEligible: !!user.mentorEligible,
    availableToMentor: (user as any).mentorshipPreferences?.availableToMentor || false,
    mentorIndustries: user.preferredIndustries || [],
    mentorInterests: user.interests || [],
    mentorSkills: user.skills ? user.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    mentorshipGoals: (user as any).mentorshipPreferences?.mentorshipGoals || [],
    preferredCommunication: (user as any).mentorshipPreferences?.preferredCommunication || 'any',
    additionalNotes: (user as any).mentorshipPreferences?.additionalNotes,
  };

  // Upsert: update if exists, otherwise create
  const profile = await MentorProfile.findOneAndUpdate(
    { userId: user._id },
    { $set: mentorData },
    { upsert: true, new: true, lean: true }
  ).exec();

  return profile;
}

/**
 * Re-sync all users (useful for migration or manual fix).
 */
export async function resyncAllMentorProfiles() {
  const users = await User.find({
    mentorEligible: true,
    'mentorshipPreferences.availableToMentor': true,
  }).lean().exec();

  for (const user of users) {
    await syncMentorProfile(user as any);
  }
  return users.length;
}

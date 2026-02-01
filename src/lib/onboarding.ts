import { api } from './api';

export interface OnboardingData {
  name: string;
  profilePicture?: string;
  bio?: string;
  interests: string[];
  preferredIndustries: string[];
  skillsToDevelop: string[];
  mentorshipPreferences: {
    seekingMentor: boolean;
    availableToMentor: boolean;
    mentorshipGoals: string[];
    preferredCommunication: 'chat' | 'video' | 'in-person' | 'any';
    additionalNotes?: string;
  };
  onboardingCompleted?: boolean;
  onboardingStep?: number;
}

export const OnboardingAPI = {
  completeOnboarding: (data: Partial<OnboardingData>) => 
    api<{ user: any }>('/me', { 
      method: 'PATCH', 
      body: JSON.stringify({ 
        ...data, 
        onboardingCompleted: true,
        onboardingStep: 5 // Assuming 5 is the final step
      }) 
    }),

  updateOnboardingStep: (step: number, data: Partial<OnboardingData> = {}) =>
    api<{ user: any }>('/me', { 
      method: 'PATCH', 
      body: JSON.stringify({ 
        ...data, 
        onboardingStep: step,
        onboardingCompleted: step >= 5 // Mark as completed if it's the last step or beyond
      }) 
    }),

  getOnboardingStatus: () => 
    api<{ 
      onboardingCompleted: boolean; 
      onboardingStep: number;
      user: any;
    }>('/me')
};

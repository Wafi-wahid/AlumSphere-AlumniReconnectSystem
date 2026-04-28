import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { UsersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
// In OnboardingFlow.tsx
import {
  WelcomeStep,
  ProfileStep,
  InterestsStep,
  SkillsStep,
  MentorshipStep,
  CompleteStep
} from './steps';
import { toast } from '@/hooks/use-toast';

export interface OnboardingFormData {
  name: string;
  program?: string;
  customProgram?: string;
  department?: string;
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
}

const OnboardingFlow = () => {
  const { user, refresh, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // If onboarding already completed, redirect to homepage
  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/', { replace: true });
    }
  }, [user?.onboardingCompleted, navigate]);

  // Resume from last saved step if available
  useEffect(() => {
    if (typeof user?.onboardingStep === 'number') {
      const step = Math.max(0, Math.min(user.onboardingStep!, totalSteps - 1));
      setCurrentStep(step);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.onboardingStep]);

  const [formData, setFormData] = useState<OnboardingFormData>({
    name: user?.name || '',
    bio: '',
    interests: [],
    preferredIndustries: [],
    skillsToDevelop: [],
    mentorshipPreferences: {
      seekingMentor: false,
      availableToMentor: false,
      mentorshipGoals: [],
      preferredCommunication: 'any',
    },
  });

  const totalSteps = 5; // Total number of steps in the onboarding

  useEffect(() => {
    // Calculate progress based on current step
    setProgress(((currentStep + 1) / totalSteps) * 100);
  }, [currentStep]);

  const updateFormData = (newData: Partial<OnboardingFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...newData,
      mentorshipPreferences: {
        ...prev.mentorshipPreferences,
        ...(newData.mentorshipPreferences || {}),
      },
    }));
  };

  const canProceedFromStep = (stepIndex: number) => {
    if (stepIndex === 0) return true;

    if (stepIndex === 1) {
      return formData.name.trim().length >= 2;
    }

    if (stepIndex === 2) {
      // Require at least 1 interest OR 1 industry
      return formData.interests.length > 0 || formData.preferredIndustries.length > 0;
    }

    if (stepIndex === 3) {
      // Require at least 1 skill
      return formData.skillsToDevelop.length > 0;
    }

    if (stepIndex === 4) {
      // If they opt into mentorship (either way), require at least one goal
      const wantsMentorship = formData.mentorshipPreferences.seekingMentor || formData.mentorshipPreferences.availableToMentor;
      if (!wantsMentorship) return true;
      return formData.mentorshipPreferences.mentorshipGoals.length > 0;
    }

    return true;
  };

  const getValidationMessage = (stepIndex: number) => {
    if (stepIndex === 1) return 'Please enter your full name to continue.';
    if (stepIndex === 2) return 'Please select at least one interest or one preferred industry to continue.';
    if (stepIndex === 3) return 'Please add at least one skill to develop to continue.';
    if (stepIndex === 4) return 'Please select at least one mentorship goal to continue.';
    return 'Please complete the required fields to continue.';
  };

  // Save step progress (non-blocking)
  const saveProgress = async (nextStepIndex: number) => {
    try {
      await UsersAPI.updateMe({
        ...formData,
        onboardingStep: nextStepIndex,
      });
    } catch (e) {
      console.warn('Onboarding autosave failed', e);
      toast({
        title: 'Autosave failed',
        description: 'We could not save your progress. Your changes are only local until the connection recovers.',
      });
    }
  };

  const nextStep = () => {
    setValidationError(null);

    if (!canProceedFromStep(currentStep)) {
      setValidationError(getValidationMessage(currentStep));
      return;
    }

    if (currentStep < totalSteps - 1) {
      const next = currentStep + 1;
      saveProgress(next);
      setCurrentStep(next);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      saveProgress(prev);
      setCurrentStep(prev);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare the data to send to the server
      const updateData = {
        ...formData,
        onboardingCompleted: true,
        onboardingStep: totalSteps,
      };

      // Update user profile with onboarding data and set onboardingCompleted in auth state
      await completeOnboarding(updateData);
      
      // Redirect to homepage and replace history to prevent going back to onboarding
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Onboarding could not be completed',
        description: String((error as any)?.message || error) || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <ProfileStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <InterestsStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <SkillsStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <MentorshipStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <CompleteStep formData={formData} />;
      default:
        return <WelcomeStep formData={formData} updateFormData={updateFormData} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-6 space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Step Content */}
        <div className="py-4">
          {renderStep()}
        </div>

        {validationError && (
          <div className="text-sm text-destructive">
            {validationError}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0 || isSubmitting}
          >
            Back
          </Button>
          
          <Button
            onClick={nextStep}
            disabled={isSubmitting || !canProceedFromStep(currentStep)}
          >
            {currentStep === totalSteps - 1 
              ? isSubmitting ? 'Completing...' : 'Complete Setup'
              : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;

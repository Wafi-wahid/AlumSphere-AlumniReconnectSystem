import { OnboardingFormData } from '../OnboardingFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type WelcomeStepProps = {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
};

const WelcomeStep = ({ formData, updateFormData }: WelcomeStepProps) => {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-3xl font-bold">Welcome to Echo Alum Link! 👋</CardTitle>
        <CardDescription className="text-lg">
          Let's set up your profile to get the most out of our community.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-muted-foreground text-center">
            We'll guide you through a few simple steps to personalize your experience and connect you with the right people.
          </p>
          <div className="flex flex-col space-y-4 pt-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">1</span>
              </div>
              <span>Basic Profile Information</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">2</span>
              </div>
              <span>Your Interests</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">3</span>
              </div>
              <span>Skills & Goals</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">4</span>
              </div>
              <span>Mentorship Preferences</span>
            </div>
          </div>
        </div>
        <div className="flex justify-center pt-4">
          <Button size="lg" className="px-8">
            Get Started
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeStep;

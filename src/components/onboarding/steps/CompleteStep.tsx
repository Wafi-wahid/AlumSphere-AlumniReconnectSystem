import { OnboardingFormData } from '../OnboardingFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CompleteStepProps = {
  formData: OnboardingFormData;
};

const CompleteStep = ({ formData }: CompleteStepProps) => {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <CardTitle className="mt-4 text-2xl">You're all set! 🎉</CardTitle>
        <p className="text-muted-foreground">
          Your profile is ready. Let's start exploring the platform!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4 space-y-4">
          <h3 className="font-medium">Here's what you've shared:</h3>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Interests</h4>
            {formData.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.interests.map((interest) => (
                  <span key={interest} className="text-sm bg-muted px-2 py-1 rounded">
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No interests selected</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Industries</h4>
            {formData.preferredIndustries.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.preferredIndustries.map((industry) => (
                  <span key={industry} className="text-sm bg-muted px-2 py-1 rounded">
                    {industry}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No industries selected</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Skills to Develop</h4>
            {formData.skillsToDevelop.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.skillsToDevelop.map((skill) => (
                  <span key={skill} className="text-sm bg-muted px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills selected</p>
            )}
          </div>

          {(formData.mentorshipPreferences.seekingMentor || formData.mentorshipPreferences.availableToMentor) && (
            <div className="space-y-4 pt-2">
              <h4 className="font-medium">Mentorship Preferences</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Looking for mentor</p>
                  <p className="font-medium">
                    {formData.mentorshipPreferences.seekingMentor ? 'Yes' : 'No'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Available to mentor</p>
                  <p className="font-medium">
                    {formData.mentorshipPreferences.availableToMentor ? 'Yes' : 'No'}
                  </p>
                </div>
                
                {formData.mentorshipPreferences.preferredCommunication && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Preferred communication</p>
                    <p className="font-medium capitalize">
                      {formData.mentorshipPreferences.preferredCommunication}
                    </p>
                  </div>
                )}
              </div>
              
              {formData.mentorshipPreferences.mentorshipGoals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Mentorship goals</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.mentorshipPreferences.mentorshipGoals.map((goal) => (
                      <span key={goal} className="text-sm bg-muted px-2 py-1 rounded">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-4">
            You can always update this information later in your profile settings.
          </p>
          <Button className="px-8">
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompleteStep;

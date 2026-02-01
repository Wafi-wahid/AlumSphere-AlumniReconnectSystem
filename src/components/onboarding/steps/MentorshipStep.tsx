import { OnboardingFormData } from '../OnboardingFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

type MentorshipStepProps = {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
};

const mentorshipGoals = [
  'Career guidance',
  'Skill development',
  'Industry insights',
  'Networking',
  'Resume review',
  'Interview preparation',
  'Leadership development',
  'Work-life balance',
  'Entrepreneurship',
  'Research collaboration'
];

const MentorshipStep = ({ formData, updateFormData }: MentorshipStepProps) => {
  const toggleMentorshipGoal = (goal: string) => {
    const currentGoals = formData.mentorshipPreferences.mentorshipGoals;
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    
    updateFormData({
      mentorshipPreferences: {
        ...formData.mentorshipPreferences,
        mentorshipGoals: newGoals
      }
    });
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">Mentorship Preferences</CardTitle>
        <p className="text-sm text-muted-foreground">
          Let us know how you'd like to engage with our mentorship program.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="seeking-mentor"
                checked={formData.mentorshipPreferences.seekingMentor}
                onCheckedChange={(checked) => 
                  updateFormData({
                    mentorshipPreferences: {
                      ...formData.mentorshipPreferences,
                      seekingMentor: Boolean(checked)
                    }
                  })
                }
              />
              <Label htmlFor="seeking-mentor" className="font-normal">
                I'm looking for a mentor
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="available-to-mentor"
                checked={formData.mentorshipPreferences.availableToMentor}
                onCheckedChange={(checked) => 
                  updateFormData({
                    mentorshipPreferences: {
                      ...formData.mentorshipPreferences,
                      availableToMentor: Boolean(checked)
                    }
                  })
                }
              />
              <Label htmlFor="available-to-mentor" className="font-normal">
                I'm available to mentor others
              </Label>
            </div>
          </div>

          {(formData.mentorshipPreferences.seekingMentor || formData.mentorshipPreferences.availableToMentor) && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Preferred Communication</h3>
                <RadioGroup 
                  value={formData.mentorshipPreferences.preferredCommunication}
                  onValueChange={(value: 'chat' | 'video' | 'in-person' | 'any') =>
                    updateFormData({
                      mentorshipPreferences: {
                        ...formData.mentorshipPreferences,
                        preferredCommunication: value
                      }
                    })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  {[
                    { value: 'chat', label: 'Chat' },
                    { value: 'video', label: 'Video Call' },
                    { value: 'in-person', label: 'In Person' },
                    { value: 'any', label: 'Any' }
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">
                  {formData.mentorshipPreferences.availableToMentor && formData.mentorshipPreferences.seekingMentor 
                    ? 'Mentorship Goals & Interests' 
                    : formData.mentorshipPreferences.availableToMentor 
                      ? 'Areas You Can Mentor In' 
                      : 'Your Mentorship Goals'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mentorshipGoals.map((goal) => (
                    <div key={goal} className="flex items-center">
                      <Checkbox
                        id={`goal-${goal}`}
                        checked={formData.mentorshipPreferences.mentorshipGoals.includes(goal)}
                        onCheckedChange={() => toggleMentorshipGoal(goal)}
                        className="mr-1"
                      />
                      <Label 
                        htmlFor={`goal-${goal}`} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {goal}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional-notes">
                  {formData.mentorshipPreferences.availableToMentor 
                    ? 'Additional notes about your mentoring style or experience' 
                    : 'Anything else you\'d like potential mentors to know?'}
                </Label>
                <Textarea
                  id="additional-notes"
                  placeholder="Share any additional details..."
                  rows={3}
                  value={formData.mentorshipPreferences.additionalNotes || ''}
                  onChange={(e) => 
                    updateFormData({
                      mentorshipPreferences: {
                        ...formData.mentorshipPreferences,
                        additionalNotes: e.target.value
                      }
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MentorshipStep;

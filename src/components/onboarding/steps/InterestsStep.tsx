import { OnboardingFormData } from '../OnboardingFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { X } from 'lucide-react';

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing',
  'Design', 'Engineering', 'Business', 'Arts', 'Science',
  'Entertainment', 'Sports', 'Non-profit', 'Government', 'Retail'
];

const interests = [
  'Mentoring', 'Networking', 'Career Development', 'Leadership',
  'Public Speaking', 'Research', 'Startups', 'Data Science',
  'Artificial Intelligence', 'Web Development', 'Mobile Development',
  'UI/UX Design', 'Product Management', 'Cloud Computing', 'Cybersecurity'
];

type InterestsStepProps = {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
};

const InterestsStep = ({ formData, updateFormData }: InterestsStepProps) => {
  const [industryInput, setIndustryInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const addIndustry = (industry: string) => {
    if (industry && !formData.preferredIndustries.includes(industry)) {
      updateFormData({
        preferredIndustries: [...formData.preferredIndustries, industry]
      });
    }
    setIndustryInput('');
  };

  const removeIndustry = (industry: string) => {
    updateFormData({
      preferredIndustries: formData.preferredIndustries.filter(i => i !== industry)
    });
  };

  const addInterest = (interest: string) => {
    if (interest && !formData.interests.includes(interest)) {
      updateFormData({
        interests: [...formData.interests, interest]
      });
    }
    setInterestInput('');
  };

  const removeInterest = (interest: string) => {
    updateFormData({
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">Your Interests</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select or add your interests and industries to help us personalize your experience.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Preferred Industries</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.preferredIndustries.map((industry) => (
                <Badge key={industry} className="flex items-center gap-1">
                  {industry}
                  <button 
                    type="button" 
                    onClick={() => removeIndustry(industry)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                placeholder="Type an industry and press enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && industryInput.trim()) {
                    e.preventDefault();
                    addIndustry(industryInput.trim());
                  }
                }}
              />
              <button
                type="button"
                onClick={() => industryInput.trim() && addIndustry(industryInput.trim())}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {industries
                .filter(industry => 
                  industry.toLowerCase().includes(industryInput.toLowerCase()) &&
                  !formData.preferredIndustries.includes(industry)
                )
                .map((industry) => (
                  <Badge 
                    key={industry} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => addIndustry(industry)}
                  >
                    {industry}
                  </Badge>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Your Interests</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.interests.map((interest) => (
                <Badge key={interest} className="flex items-center gap-1">
                  {interest}
                  <button 
                    type="button" 
                    onClick={() => removeInterest(interest)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="Type an interest and press enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && interestInput.trim()) {
                    e.preventDefault();
                    addInterest(interestInput.trim());
                  }
                }}
              />
              <button
                type="button"
                onClick={() => interestInput.trim() && addInterest(interestInput.trim())}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {interests
                .filter(interest => 
                  interest.toLowerCase().includes(interestInput.toLowerCase()) &&
                  !formData.interests.includes(interest)
                )
                .map((interest) => (
                  <Badge 
                    key={interest} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => addInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InterestsStep;

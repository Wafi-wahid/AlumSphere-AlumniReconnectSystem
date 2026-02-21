import { OnboardingFormData } from '../OnboardingFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { X } from 'lucide-react';

const popularSkills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript',
  'Data Analysis', 'Project Management', 'UI/UX Design',
  'Cloud Computing', 'Machine Learning', 'Cybersecurity',
  'Communication', 'Leadership', 'Public Speaking', 'Teamwork'
];

type SkillsStepProps = {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
};

const SkillsStep = ({ formData, updateFormData }: SkillsStepProps) => {
  const [skillInput, setSkillInput] = useState('');

  const addSkill = (skill: string) => {
    if (skill && !formData.skillsToDevelop.includes(skill)) {
      updateFormData({
        skillsToDevelop: [...formData.skillsToDevelop, skill]
      });
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    updateFormData({
      skillsToDevelop: formData.skillsToDevelop.filter(s => s !== skill)
    });
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">Skills to Develop</CardTitle>
        <p className="text-sm text-muted-foreground">
          What skills would you like to develop or improve? This will help us match you with relevant resources and mentors.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Your Skills</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.skillsToDevelop.map((skill) => (
                <Badge key={skill} className="flex items-center gap-1">
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Type a skill and press enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && skillInput.trim()) {
                    e.preventDefault();
                    addSkill(skillInput.trim());
                  }
                }}
              />
              <button
                type="button"
                onClick={() => skillInput.trim() && addSkill(skillInput.trim())}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {popularSkills
                .filter(skill => 
                  skill.toLowerCase().includes(skillInput.toLowerCase()) &&
                  !formData.skillsToDevelop.includes(skill)
                )
                .map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => addSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
        
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Why add skills?</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Get personalized learning resources</li>
            <li>• Find mentors with expertise in these areas</li>
            <li>• Connect with peers who share similar learning goals</li>
            <li>• Track your progress over time</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillsStep;

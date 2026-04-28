import { OnboardingFormData } from '../OnboardingFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

type ProfileStepProps = {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
};

const ProfileStep = ({ formData, updateFormData }: ProfileStepProps) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const programs = ["BS", "BBA", "MS", "MBA", "PhD", "Other"] as const;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        updateFormData({ profilePicture: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <Avatar 
                className="h-24 w-24 cursor-pointer"
                onClick={handleAvatarClick}
              >
                <AvatarImage src={previewImage || formData.profilePicture} />
                <AvatarFallback className="text-2xl">
                  {formData.name ? formData.name[0].toUpperCase() : 'U'}
                </AvatarFallback>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                  <span className="text-white text-sm font-medium">Change</span>
                </div>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Click to upload a profile picture
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program">Program (optional)</Label>
              <Select
                value={formData.program}
                onValueChange={(value) => updateFormData({ program: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department (optional)</Label>
              <Input
                id="department"
                value={formData.department || ''}
                onChange={(e) => updateFormData({ department: e.target.value })}
                placeholder="e.g., Software Engineering"
              />
            </div>
          </div>

          {formData.program === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="customProgram">Specify Program</Label>
              <Input
                id="customProgram"
                value={formData.customProgram || ''}
                onChange={(e) => updateFormData({ customProgram: e.target.value })}
                placeholder="e.g., BSCS, BBA, etc."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => updateFormData({ bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio?.length || 0}/500 characters
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileStep;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Linkedin, Check, Download, ExternalLink } from "lucide-react";

interface LinkedInSyncProps {
  onSyncComplete: (data: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function LinkedInSync({ onSyncComplete, isOpen, onClose }: LinkedInSyncProps) {
  const [step, setStep] = useState(1);
  const [selectedFields, setSelectedFields] = useState({
    education: true,
    workHistory: true,
    skills: true,
    profilePicture: true,
    connections: false,
    recommendations: false
  });
  const [isImporting, setIsImporting] = useState(false);

  const mockLinkedInData = {
    education: {
      university: "Stanford University",
      degree: "Bachelor of Science",
      field: "Computer Science",
      graduationYear: 2018,
      gpa: "3.8"
    },
    workHistory: [
      {
        company: "Google",
        position: "Senior Software Engineer",
        duration: "2020 - Present",
        location: "Mountain View, CA"
      },
      {
        company: "Facebook",
        position: "Software Engineer",
        duration: "2018 - 2020",
        location: "Menlo Park, CA"
      }
    ],
    skills: [
      "JavaScript", "React", "Node.js", "Python", "Machine Learning", 
      "System Design", "Leadership", "Product Management"
    ],
    profilePicture: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=300&h=300&fit=crop&crop=face"
  };

  const handleLinkedInAuth = () => {
    setStep(2);
    // Mock OAuth consent flow
    setTimeout(() => {
      setStep(3);
    }, 2000);
  };

  const handleImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      const importedData: any = {};
      
      if (selectedFields.education) {
        importedData.education = mockLinkedInData.education;
      }
      if (selectedFields.workHistory) {
        importedData.workHistory = mockLinkedInData.workHistory;
      }
      if (selectedFields.skills) {
        importedData.skills = mockLinkedInData.skills;
      }
      if (selectedFields.profilePicture) {
        importedData.profilePicture = mockLinkedInData.profilePicture;
      }

      onSyncComplete(importedData);
      setIsImporting(false);
      onClose();
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-[#0077b5]" />
                Import from LinkedIn
              </DialogTitle>
              <DialogDescription>
                Quickly set up your profile by importing your LinkedIn information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">What we'll import</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      Education history
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      Work experience
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      Skills & endorsements
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      Profile picture
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Your data stays safe</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ We only read public information</p>
                    <p>✓ No access to messages or connections</p>
                    <p>✓ You can edit everything after import</p>
                    <p>✓ Data encrypted and secure</p>
                  </CardContent>
                </Card>
              </div>

              <Badge variant="secondary" className="w-full justify-center py-2">
                This will open LinkedIn in a new window for authorization
              </Badge>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Skip for now
              </Button>
              <Button variant="linkedin" onClick={handleLinkedInAuth}>
                <Linkedin className="mr-2 h-4 w-4" />
                Connect LinkedIn
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Connecting to LinkedIn...</DialogTitle>
              <DialogDescription>
                Please authorize AlumSphere in the LinkedIn window
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">Waiting for authorization...</p>
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open LinkedIn manually
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle>Choose what to import</DialogTitle>
              <DialogDescription>
                Select the information you'd like to import from your LinkedIn profile
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-3">
                {Object.entries({
                  education: "Education history",
                  workHistory: "Work experience", 
                  skills: "Skills & endorsements",
                  profilePicture: "Profile picture",
                  connections: "Connection count (optional)",
                  recommendations: "Recommendations (optional)"
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={selectedFields[key]}
                      onCheckedChange={(checked) => 
                        setSelectedFields(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                    <label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {label}
                    </label>
                  </div>
                ))}
              </div>

              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {selectedFields.education && <p>• Stanford University, CS 2018</p>}
                  {selectedFields.workHistory && <p>• Senior Software Engineer at Google</p>}
                  {selectedFields.skills && <p>• 8 technical skills</p>}
                  {selectedFields.profilePicture && <p>• Professional profile photo</p>}
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={handleImport}
                disabled={isImporting}
                className="min-w-[120px]"
              >
                {isImporting ? (
                  <>
                    <Download className="mr-2 h-4 w-4 animate-pulse" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import Data
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
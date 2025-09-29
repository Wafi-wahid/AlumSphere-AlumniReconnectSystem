import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Linkedin, Building2, UserCheck, Shield } from "lucide-react";

interface LoginPageProps {
  onLogin: (userData: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  const handleLinkedInLogin = () => {
    setIsLoading(true);
    // Mock LinkedIn OAuth flow
    setTimeout(() => {
      onLogin({
        name: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        role: "alumni",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
        linkedinSynced: true,
        graduationYear: 2018,
        department: "Computer Science",
        currentCompany: "Google",
        currentRole: "Senior Software Engineer"
      });
      setIsLoading(false);
    }, 2000);
  };

  const handleUniversityLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        name: "Alex Chen",
        email: "alex.chen@university.edu",
        role: "student",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        linkedinSynced: false,
        graduationYear: 2025,
        department: "Engineering",
        currentRole: "Final Year Student"
      });
      setIsLoading(false);
    }, 1500);
  };

  const mockUsers = [
    { name: "Student", role: "student", icon: GraduationCap, color: "bg-blue-500" },
    { name: "Alumni", role: "alumni", icon: UserCheck, color: "bg-green-500" },
    { name: "Recruiter", role: "recruiter", icon: Building2, color: "bg-purple-500" },
    { name: "Admin", role: "admin", icon: Shield, color: "bg-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Welcome to AlumSphere</h1>
            <p className="text-muted-foreground">Connect with your university community</p>
          </div>
        </div>

        {/* Login Options */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* LinkedIn Login */}
            <Button
              variant="linkedin"
              className="w-full h-12"
              onClick={handleLinkedInLogin}
              disabled={isLoading}
            >
              <Linkedin className="mr-2 h-5 w-5" />
              {isLoading ? "Connecting..." : "Continue with LinkedIn"}
            </Button>

            {/* University SSO */}
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleUniversityLogin}
              disabled={isLoading}
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              University SSO Login
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Demo Roles</span>
              </div>
            </div>

            {/* Demo Role Selection */}
            <div className="grid grid-cols-2 gap-3">
              {mockUsers.map((user) => {
                const Icon = user.icon;
                return (
                  <Button
                    key={user.role}
                    variant="outline"
                    className="h-16 flex-col gap-2"
                    onClick={() => {
                      setIsLoading(true);
                      setTimeout(() => {
                        onLogin({
                          name: `Demo ${user.name}`,
                          email: `demo.${user.role}@university.edu`,
                          role: user.role,
                          avatar: `https://images.unsplash.com/photo-${user.role === 'student' ? '1507003211169-0a1dd7228f2d' : user.role === 'alumni' ? '1494790108755-2616b612b47c' : user.role === 'recruiter' ? '1472099645785-5658abf4ff4e' : '1560250097-0b93528c311a'}?w=150&h=150&fit=crop&crop=face`,
                          linkedinSynced: user.role === 'alumni',
                          notifications: Math.floor(Math.random() * 5),
                          messages: Math.floor(Math.random() * 3)
                        });
                        setIsLoading(false);
                      }, 1000);
                    }}
                    disabled={isLoading}
                  >
                    <div className={`w-6 h-6 ${user.color} rounded-full flex items-center justify-center`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs">{user.name}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-center text-muted-foreground w-full">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardFooter>
        </Card>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-full justify-center py-2">
              Directory
            </Badge>
            <p className="text-xs text-muted-foreground">Find alumni</p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary" className="w-full justify-center py-2">
              Mentorship
            </Badge>
            <p className="text-xs text-muted-foreground">Get guidance</p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary" className="w-full justify-center py-2">
              Careers
            </Badge>
            <p className="text-xs text-muted-foreground">Find jobs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
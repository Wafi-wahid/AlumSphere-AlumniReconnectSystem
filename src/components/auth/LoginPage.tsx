import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Linkedin } from "lucide-react";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleLinkedInLogin = () => {
    setIsLoading(true);
    // Mock LinkedIn OAuth flow
    setTimeout(() => {
      toast.success("LinkedIn login placeholder");
      setIsLoading(false);
    }, 2000);
  };

  const handleUniversityLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      toast.success("University SSO placeholder");
      setIsLoading(false);
    }, 1500);
  };

  // Demo roles removed

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
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button
                variant="brand"
                className="w-full h-10 text-primary-foreground border-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]"
                disabled={isLoading}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    await login(email, password);
                    toast.success("Logged in");
                  } catch (e: any) {
                    toast.error(e.message || "Login failed");
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                Sign In
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                Don’t have an account? <a className="text-primary underline" href="/register">Create one</a>
              </div>
            </div>
            {/* LinkedIn Login */}
            <Button
              variant="brand"
              className="w-full h-12 transition-transform hover:scale-[1.02] text-primary-foreground border-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]"
              onClick={handleLinkedInLogin}
              disabled={isLoading}
            >
              <Linkedin className="mr-2 h-5 w-5" />
              {isLoading ? "Connecting..." : "Continue with LinkedIn"}
            </Button>

            {/* University SSO */}
            <Button
              variant="soft"
              className="w-full h-12 transition-transform hover:scale-[1.02] text-primary-foreground border-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]"
              onClick={handleUniversityLogin}
              disabled={isLoading}
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              University SSO Login
            </Button>

            {/* Demo roles removed */}
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
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Linkedin } from "lucide-react";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"student_alumni" | "admin">("student_alumni");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleLinkedInLogin = () => {
    setIsLoading(true);
    // Mock LinkedIn OAuth flow
    setTimeout(() => {
      toast.success("LinkedIn login placeholder");
      setIsLoading(false);
    }, 2000);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Mock Google OAuth flow
    setTimeout(() => {
      toast.success("Google login placeholder");
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
    <div className="relative min-h-screen bg-background">
      {/* Three-shade gradient across whole page, starting top-left */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom_right,#0b1b3a_0%,#3b82f6_70%,#60a5fa_100%)]" />
      <div className={`relative grid min-h-screen grid-cols-1 md:grid-cols-2 gap-0 p-6 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}> 
        {/* Left: Form */}
        <div className="order-1 md:order-2 flex items-center justify-start">
          <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className={`text-left space-y-1 transition-all duration-700 ease-out delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
            <p className="text-sm text-white/80">Sign in to continue</p>
          </div>

          {/* Role selection */}
          <Tabs value={role} onValueChange={(v) => setRole(v as typeof role)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
              <TabsTrigger
                value="student_alumni"
                className="rounded-full text-white/80 transition-colors data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white hover:data-[state=inactive]:bg-white/15"
              >
                Student/Alumni
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="rounded-full text-white/80 transition-colors data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white hover:data-[state=inactive]:bg-white/15"
              >
                Admin
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Login Card */}
          <Card className={`shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/10 bg-white/10 backdrop-blur-xl transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-white">Sign in to your account</CardTitle>
              <CardDescription className="text-white/80">Choose your preferred sign-in method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Animate on role switch by remounting content */}
              <div key={role} className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-white/90">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-white/90">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                </div>
                <Button
                  variant="brand"
                  className="w-full h-10 text-white border-0 bg-[#1e3a8a] hover:bg-[#1d4ed8]"
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
                  {role === 'admin' ? 'Sign In as Admin' : 'Sign In'}
                </Button>
                <div className="text-sm text-center text-white/90">
                  Don’t have an account? <a className="underline text-[#1e3a8a] hover:text-[#1d4ed8]" href="/register">Create one</a>
                </div>
              </div>

              {/* Social logins */}
              <div className="flex items-center gap-2 justify-center">
                <Button variant="outline" onClick={handleGoogleLogin} disabled={isLoading} aria-label="Continue with Google" className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <svg aria-hidden="true" focusable="false" className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.3 1.5-1.7 4.4-5.5 4.4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.6-2.6C16.9 3.1 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.9 0-.7-.1-1.1-.2-1.6H12z" />
                  </svg>
                  Continue with Google
                </Button>
                <Button variant="outline" onClick={handleLinkedInLogin} disabled={isLoading} aria-label="Continue with LinkedIn" className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <Linkedin className="h-4 w-4 text-[#0077b5]" />
                  Continue with LinkedIn
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-center text-white/80 w-full">By signing in, you agree to our Terms of Service and Privacy Policy</p>
            </CardFooter>
          </Card>
        </div>
        </div>
        {/* Right (desktop left): Logo and centered features */}
        <div className={`order-2 md:order-1 relative hidden md:flex items-center justify-center px-6 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'} overflow-hidden`}>
          <div className="relative z-10 max-w-md space-y-6 text-center px-4">
            <div className="mx-auto inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-primary-light shadow-xl">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">AlumSphere</h1>
              <p className="text-white/85 text-lg leading-relaxed">
                Where students meet alumni to network, mentor, and grow.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Badge variant="secondary" className="justify-center py-2">Directory</Badge>
              <Badge variant="secondary" className="justify-center py-2">Mentorship</Badge>
              <Badge variant="secondary" className="justify-center py-2">Careers</Badge>
            </div>
          </div>
          <div className="pointer-events-none absolute -left-10 -bottom-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>
      </div>
    </div>
  );
}
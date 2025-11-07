import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Linkedin, Eye, EyeOff, Info } from "lucide-react";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"student" | "alumni" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { login } = useAuth();
  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      const seen = localStorage.getItem('login_guide_seen');
      if (!seen) {
        setShowGuide(true);
        localStorage.setItem('login_guide_seen', '1');
      }
    } catch {
      // ignore storage errors
      setShowGuide(true);
    }
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
      {/* Gradient to match Register/Sidebar */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#0b1b3a,#1e3a8a)]" />
      <div className={`relative grid min-h-screen grid-cols-1 md:grid-cols-2 gap-0 p-6 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}> 
        {/* Left: Form */}
        <div className="order-1 md:order-2 flex items-center justify-start">
          <div className="w-full max-w-md space-y-6">
          {showGuide && (
            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/15 text-white p-3 backdrop-blur-md shadow-[0_6px_24px_rgba(0,0,0,0.2)]">
              <Info className="h-5 w-5 mt-0.5 text-[#FFB800]" />
              <div className="text-sm leading-5">
                <p className="font-semibold">Quick guide</p>
                <p>Step 1: Select your role (Student, Alumni, or Admin).</p>
                <p>Step 2: Enter your email and password to sign in.</p>
                <p className="mt-1">First time here? Click <a href="/register" className="underline text-[#FFB800] hover:text-[#FFA726]">Create account</a> to register.</p>
              </div>
              <button
                type="button"
                aria-label="Dismiss guide"
                className="ml-auto text-white/80 hover:text-white"
                onClick={() => setShowGuide(false)}
              >
                ×
              </button>
            </div>
          )}
          {/* Header */}
          <div className={`text-left space-y-1 transition-all duration-700 ease-out delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
            <p className="text-sm text-white/80">Sign in to continue</p>
          </div>

          {/* Role selection */}
          <div className="text-xs text-white/80 mb-1">Step 1: Choose your role</div>
          <Tabs value={role} onValueChange={(v) => setRole(v as typeof role)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
              <TabsTrigger
                value="student"
                className="rounded-full text-white/90 transition-colors data-[state=active]:bg-[#FFB800] data-[state=active]:text-black hover:data-[state=inactive]:bg-white/15"
              >
                Student
              </TabsTrigger>
              <TabsTrigger
                value="alumni"
                className="rounded-full text-white/90 transition-colors data-[state=active]:bg-[#FFB800] data-[state=active]:text-black hover:data-[state=inactive]:bg-white/15"
              >
                Alumni
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="rounded-full text-white/90 transition-colors data-[state=active]:bg-[#FFB800] data-[state=active]:text-black hover:data-[state=inactive]:bg-white/15"
              >
                Admin
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Login Card */}
          <Card className={`shadow-[0_12px_40px_rgba(0,0,0,0.28)] border border-white/20 bg-white/15 backdrop-blur-2xl transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-white">Sign in to your account</CardTitle>
              <CardDescription className="text-white/80">Choose your preferred sign-in method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Animate on role switch by remounting content */}
              <div key={role} className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-white/90">Email</Label>
                  {role === 'student' && (
                    <p className="text-xs text-white/70">Use your official university email</p>
                  )}
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'student' ? '12345@students.riphah.edu.pk' : 'name@gmail.com'}
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-white/90">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pr-10 bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                    <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPass((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-white/80 hover:text-white">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  variant="brand"
                  className="w-full h-10 text-black border-0 bg-[#FFB800] hover:bg-[#FFA726]"
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
                  {role === 'admin' ? 'Sign In as Admin' : role === 'student' ? 'Sign In as Student' : 'Sign In as Alumni'}
                </Button>
                <div className="text-sm text-center text-white/90">
                  Don’t have an account? <a className="underline text-[#FFB800] hover:text-[#FFA726]" href="/register">Create account</a>
                </div>
              </div>

              {/* Separator */}
              <div className="flex items-center gap-4 my-2">
                <div className="h-px flex-1 bg-white/20" />
                <span className="text-xs text-white/80">OR</span>
                <div className="h-px flex-1 bg-white/20" />
              </div>

              {/* Social logins (official icons) */}
              <div className="flex items-center gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => { window.location.href = `${API_BASE}/auth/google/start`; }}
                  disabled={isLoading}
                  aria-label="Continue with Google"
                  className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  {/* Official Google G icon SVG */}
                  <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.817C14.431 16.087 18.878 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.126 35.091 26.671 36 24 36c-5.202 0-9.619-3.317-11.282-7.946l-6.5 5.02C9.53 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.791 2.235-2.231 4.166-3.994 5.565l.003-.002 6.19 5.238C39.231 36.349 44 30.667 44 24c0-1.341-.138-2.651-.389-3.917z"/>
                  </svg>
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { window.location.href = `${API_BASE}/auth/linkedin/login/start`; }}
                  disabled={isLoading}
                  aria-label="Continue with LinkedIn"
                  className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
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
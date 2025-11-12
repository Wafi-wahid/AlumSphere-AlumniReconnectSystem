import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Eye, EyeOff, Info, Mail, Lock, User } from "lucide-react";
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
  const isStudentEmailValid = useMemo(() => /^(\d{5})@students\.riphah\.edu\.pk$/i.test(email), [email]);

  const [mounted, setMounted] = useState(false);
  const testimonials = useMemo(() => ([
    // Alumni Testimonials
    {
      quote: "I finally found a platform where I can easily connect with juniors and guide them toward the right opportunities. AlumSphere truly strengthens the Riphah community.",
      name: "Ahmed Bilal",
      role: "Software Engineer @ Systems Ltd",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=120&h=120&fit=crop&crop=face",
      rating: 5,
      type: 'alumni' as const,
    },
    {
      quote: "Thanks to this portal, I reconnected with my old batchmates and even discovered new professional collaborations!",
      name: "Ayesha Malik",
      role: "UI/UX Designer @ Arbisoft",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face",
      rating: 5,
      type: 'alumni' as const,
    },
    {
      quote: "The mentorship feature is a game changer. I helped a student prepare for their first industry interview, felt amazing to give back!",
      name: "Hammad Khan",
      role: "SQA Analyst @ Techlogix",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face",
      rating: 5,
      type: 'alumni' as const,
    },
    {
      quote: "Finally, a centralized alumni directory! No more endless LinkedIn stalking to find Riphah contacts.",
      name: "Mariam Raza",
      role: "Business Analyst @ Jazz",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face",
      rating: 5,
      type: 'alumni' as const,
    },
    {
      quote: "A brilliant initiative! Happy to stay connected and contribute to the Riphah network.",
      name: "Omar Farooq",
      role: "Blockchain Developer @ Emumba",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=120&h=120&fit=crop&crop=face",
      rating: 5,
      type: 'alumni' as const,
    },
    // Student Testimonials
    {
      quote: "Alumni guidance helped me choose the right career path. A very supportive community!",
      name: "Fatima Tanveer",
      role: "BSSE 7th Semester",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face",
      rating: 5,
      type: 'student' as const,
    },
    {
      quote: "The platform made internship hunting so much easier, thanks to seniors!",
      name: "Waleed Arshad",
      role: "BSCS 6th Semester",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face",
      rating: 5,
      type: 'student' as const,
    },
  ]), []);
  const [tIndex, setTIndex] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      setTIndex((i) => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(id);
  }, [testimonials.length]);

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
    <div className="relative h-screen overflow-hidden bg-[#F8FAFC]">
      <div className={`relative grid h-screen grid-cols-1 md:grid-cols-5 gap-0 p-0 md:p-6 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {/* LEFT 40%: Branding + Testimonials */}
        <div className={`order-2 md:order-1 relative hidden md:flex col-span-2 items-stretch justify-center px-0 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
          <div className="relative m-6 flex-1 rounded-2xl bg-gradient-to-b from-[#0B2E68] to-[#0D47A1] p-6 overflow-hidden shadow-[0_20px_60px_rgba(11,46,104,0.45)]">
            <div className="relative z-10 h-full flex flex-col">
              <div>
                <div className="flex items-center gap-3">
                  <img src="/logo2.png" alt="AlumSphere" className="h-10 w-10 rounded-md object-cover" />
                  <span className="text-white text-xl font-bold tracking-tight">AlumSphere</span>
                </div>
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">Connect with 2000+ Riphah Alumni</h1>
                <p className="mt-2 text-white/90 text-base">Build your career with mentorship, networking, and referral support.</p>
                {/* removed benefits bullets per requirement */}
              </div>
              <div className="mt-auto pt-6">
                <div className="relative h-56">
                  {testimonials.map((t, i) => (
                    <div key={i} className={`absolute inset-0 transition-all duration-700 ease-out ${i === tIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} aria-hidden={i!==tIndex}>
                      <div className="relative rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)] h-full flex flex-col">
                        <span className={`absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#FDBA01] text-[#0F172A]`}>
                          {t.type === 'alumni' ? 'Alumni' : 'Student'}
                        </span>
                        <div className="mt-7 text-white text-base font-semibold">“{t.quote.split('—')[0] || t.quote}”</div>
                        {t.quote.includes('—') && (
                          <div className="text-white/85 text-sm mt-1">{t.quote.split('—')[1]}</div>
                        )}
                        <div className="mt-auto pt-4 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-white/20 text-white text-sm font-semibold flex items-center justify-center">
                            {t.name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-semibold truncate">{t.name}</div>
                            <div className="text-white/80 text-xs truncate">{t.role}</div>
                          </div>
                          <div className="shrink-0 text-[#FDBA01]" aria-label={`${t.rating} out of 5 stars`}>★★★★★</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {testimonials.map((_, i) => (
                    <span key={i} className={`h-2.5 w-2.5 rounded-full transition-all ${i === tIndex ? 'bg-white' : 'bg-white/40'}`} aria-label={`Go to slide ${i+1}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -left-10 -bottom-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          </div>
        </div>
        {/* RIGHT 60%: Form */}
        <div className="order-1 md:order-2 col-span-3 flex items-center justify-center px-6 py-8">
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
            <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to continue</p>
          </div>

          {/* Role selection */}
          <div className="text-sm md:text-base text-slate-700 mb-0">Choose your role</div>
          <Tabs value={role} onValueChange={(v) => setRole(v as typeof role)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-full bg-white shadow-sm border border-slate-200">
              <TabsTrigger
                value="student"
                className="rounded-full text-slate-700 transition-colors data-[state=active]:bg-[#0D47A1] data-[state=active]:text-white hover:data-[state=inactive]:bg-slate-100"
              >
                Student
              </TabsTrigger>
              <TabsTrigger
                value="alumni"
                className="rounded-full text-slate-700 transition-colors data-[state=active]:bg-[#0D47A1] data-[state=active]:text-white hover:data-[state=inactive]:bg-slate-100"
              >
                Alumni
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="rounded-full text-slate-700 transition-colors data-[state=active]:bg-[#0D47A1] data-[state=active]:text-white hover:data-[state=inactive]:bg-slate-100"
              >
                Admin
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Login Card */}
          <Card className={`rounded-3xl shadow-[0_18px_60px_rgba(0,0,0,0.12)] border border-slate-200 bg-white transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-slate-900 text-[28px] font-semibold">Sign in to your account</CardTitle>
              <CardDescription className="text-slate-600">Choose your preferred sign-in method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Animate on role switch by remounting content */}
              <div key={role} className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-slate-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role === 'student' ? '12345@students.riphah.edu.pk' : 'name@gmail.com'}
                      className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-slate-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="password" type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]" />
                    <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPass((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  variant="default"
                  className="w-full h-11 text-white bg-[#0D47A1] hover:bg-[#0B3C89] hover:scale-[1.02] transition-transform shadow-sm"
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
                {role !== 'admin' && (
                  <>
                    {/* Separator */}
                    <div className="flex items-center gap-4 my-2">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs text-slate-500">OR</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    {/* Social logins (icon-only) */}
                    <div className="flex items-center gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => { window.location.href = `${API_BASE}/auth/google/start`; }}
                        disabled={isLoading}
                        aria-label="Continue with Google"
                        className="p-2 h-10 w-10 rounded-full bg-white border-slate-200 text-slate-800 hover:bg-slate-50 flex items-center justify-center"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                          <path fill="#FF3D00" d="M6.306 14.691l6.571 4.817C14.431 16.087 18.878 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.126 35.091 26.671 36 24 36c-5.202 0-9.619-3.317-11.282-7.946l-6.5 5.02C9.53 39.556 16.227 44 24 44z"/>
                          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.791 2.235-2.231 4.166-3.994 5.565l-.003-.002 6.19 5.238C39.231 36.349 44 30.667 44 24c0-1.341-.138-2.651-.389-3.917z"/>
                        </svg>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { window.location.href = `${API_BASE}/auth/linkedin/login/start`; }}
                        disabled={isLoading}
                        aria-label="Continue with LinkedIn"
                        className="p-2 h-10 w-10 rounded-full bg-white border-slate-200 text-slate-800 hover:bg-slate-50 flex items-center justify-center"
                      >
                        <Linkedin className="h-5 w-5 text-[#0077b5]" />
                      </Button>
                    </div>
                  </>
                )}
                <div className="text-sm text-center text-slate-500">
                  Don’t have an account? <a className="underline text-[#1A73E8] hover:text-[#1664c7]" href="/register">Create account</a>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-center text-slate-500 w-full">By signing in, you agree to our Terms of Service and Privacy Policy</p>
            </CardFooter>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
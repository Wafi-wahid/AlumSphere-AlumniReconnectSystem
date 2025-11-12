import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { CheckCircle2, Eye, EyeOff, Mail, Lock, User, Linkedin } from "lucide-react";
import { api } from "@/lib/api";

const years = Array.from({ length: 2025 - 2010 + 1 }, (_, i) => 2010 + i);
const seasons = ["Spring", "Fall"] as const;

const baseSchema = {
  name: z.string().min(2, "Enter full name"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, "Include letters and numbers"),
  confirmPassword: z.string(),
};

const studentSchema = z
  .object({
    ...baseSchema,
    sapId: z.string().regex(/^\d{5}$/i, "SAP ID must be exactly 5 digits"),
    batchSeason: z.enum(seasons),
    batchYear: z.coerce.number().int().min(2010).max(2025),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type StudentForm = z.infer<typeof studentSchema>;

const alumniSchema = z
  .object({
    ...baseSchema,
    gradSeason: z.enum(seasons),
    gradYear: z.coerce.number().int().min(2010).max(2025),
    linkedinId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type AlumniForm = z.infer<typeof alumniSchema>;

export default function Register() {
  const { registerStudent, registerAlumni } = useAuth();
  const [tab, setTab] = useState<"student" | "alumni">("student");
  const [mounted, setMounted] = useState(false);
  const [showPassS, setShowPassS] = useState(false);
  const [showPassA, setShowPassA] = useState(false);
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

  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

  const {
    register: regS,
    handleSubmit: handleSubmitS,
    setValue: setValueS,
    formState: { errors: errorsS, isSubmitting: submittingS },
  } = useForm<StudentForm>({ resolver: zodResolver(studentSchema) });

  const {
    register: regA,
    handleSubmit: handleSubmitA,
    setValue: setValueA,
    formState: { errors: errorsA, isSubmitting: submittingA },
  } = useForm<AlumniForm>({ resolver: zodResolver(alumniSchema) });

  // Show LinkedIn error if present in URL and then clean it
  useEffect(() => {
    const url = new URL(window.location.href);
    const liErr = url.searchParams.get('li_error');
    if (liErr) {
      toast.error(liErr);
      url.searchParams.delete('li_error');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  // Prefill from LinkedIn if available
  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ prefill: { name?: string; email?: string; profilePicture?: string; linkedinId?: string } | null }>("/auth/linkedin/prefill");
        if (res?.prefill) {
          const { name, email, linkedinId } = res.prefill;
          if (name) {
            setValueS('name', name, { shouldValidate: true });
            setValueA('name', name, { shouldValidate: true });
          }
          if (email) {
            setValueS('email', email, { shouldValidate: true });
            setValueA('email', email, { shouldValidate: true });
          }
          if (linkedinId) {
            setValueA('linkedinId', linkedinId, { shouldValidate: true });
          }
          toast.success('Imported info from LinkedIn');
        }
      } catch {
        // ignore prefill fetch errors
      }
    })();
  }, [setValueS, setValueA]);

  const startLinkedIn = () => {
    window.location.href = `${API_BASE}/auth/linkedin/register/start`;
  };

  const onStudent = async (data: StudentForm) => {
    try {
      await registerStudent({
        name: data.name,
        email: data.email,
        password: data.password,
        role: "student",
        sapId: data.sapId,
        batchSeason: data.batchSeason,
        batchYear: data.batchYear,
      });
      toast.success("Registered as Student");
      window.location.href = "/";
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
    }
  };

  const onAlumni = async (data: AlumniForm) => {
    try {
      await registerAlumni({
        name: data.name,
        email: data.email,
        password: data.password,
        role: "alumni",
        gradSeason: data.gradSeason,
        gradYear: data.gradYear,
        linkedinId: data.linkedinId || undefined,
      });
      toast.success("Registered as Alumni");
      window.location.href = "/";
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
    }
  };

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

        {/* RIGHT 60%: Forms */}
        <div className="order-1 md:order-2 col-span-3 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-2xl space-y-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-white shadow-sm border border-slate-200">
                <TabsTrigger value="student" className="rounded-full text-slate-700 transition-colors data-[state=active]:bg-[#0D47A1] data-[state=active]:text-white hover:data-[state=inactive]:bg-slate-100">Student</TabsTrigger>
                <TabsTrigger value="alumni" className="rounded-full text-slate-700 transition-colors data-[state=active]:bg-[#0D47A1] data-[state=active]:text-white hover:data-[state=inactive]:bg-slate-100">Alumni</TabsTrigger>
              </TabsList>

              <TabsContent value="student">
                <div key={tab} className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <Card className={`rounded-3xl shadow-[0_18px_60px_rgba(0,0,0,0.12)] border border-slate-200 bg-white transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    <CardHeader>
                      <CardTitle className="text-slate-900 text-[26px] font-semibold">Student Registration</CardTitle>
                      <CardDescription className="text-slate-600">If you are currently enrolled, fill this form. Otherwise, switch to Alumni registration.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button type="button" onClick={startLinkedIn} className="w-full bg-[#0a66c2] hover:bg-[#084e96] text-white">
                        <Linkedin className="h-4 w-4 mr-2" /> Sync LinkedIn (prefill name & email)
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="s_name" className="text-slate-700">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="s_name" placeholder="John Doe" {...regS('name')} className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]" />
                          </div>
                          {errorsS.name && <p className="text-xs text-destructive">{errorsS.name.message}</p>}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="s_email" className="text-slate-700">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="s_email" type="email" placeholder="12345@students.riphah.edu.pk" {...regS('email')} className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]" />
                          </div>
                          {errorsS.email && <p className="text-xs text-destructive">{errorsS.email.message}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="s_password" className="text-slate-700">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="s_password" type={showPassS ? 'text' : 'password'} placeholder="••••••••" {...regS('password')} className="pl-9 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]" />
                            <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassS((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700">
                              {showPassS ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {errorsS.password && <p className="text-xs text-destructive">{errorsS.password.message}</p>}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="s_confirm" className="text-slate-700">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="s_confirm" type={showPassS ? 'text' : 'password'} placeholder="••••••••" {...regS('confirmPassword')} className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]" />
                          </div>
                          {errorsS.confirmPassword && <p className="text-xs text-destructive">{errorsS.confirmPassword.message as any}</p>}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="s_sap" className="text-slate-700">SAP ID</Label>
                        <Input id="s_sap" placeholder="12345" {...regS('sapId')} className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]" />
                        {errorsS.sapId && <p className="text-xs text-destructive">{errorsS.sapId.message}</p>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-slate-700">Session</Label>
                          <Select onValueChange={(v) => setValueS('batchSeason', v as any)}>
                            <SelectTrigger className="bg-white border-slate-200 text-slate-900 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1A73E8]/30">
                              <SelectValue placeholder="Select session" />
                            </SelectTrigger>
                            <SelectContent>
                              {seasons.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errorsS.batchSeason && <p className="text-xs text-destructive">{errorsS.batchSeason.message as any}</p>}
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-slate-700">Year</Label>
                          <Select onValueChange={(v) => setValueS('batchYear', Number(v))}>
                            <SelectTrigger className="bg-white border-slate-200 text-slate-900 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1A73E8]/30">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errorsS.batchYear && <p className="text-xs text-destructive">{errorsS.batchYear.message as any}</p>}
                        </div>
                      </div>
                      <Button className="w-full h-11 text-white bg-[#0D47A1] hover:bg-[#0B3C89] hover:scale-[1.02] transition-transform" disabled={submittingS} onClick={handleSubmitS(onStudent)}>
                        {submittingS ? 'Registering...' : 'Register as Student'}
                      </Button>
                      <div className="text-base text-center text-slate-600">
                        Already have an account? <Link className="underline text-[#1A73E8] hover:text-[#1664c7]" to="/">Sign in</Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="alumni">
                <div key={tab} className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <Card className={`rounded-3xl shadow-[0_18px_60px_rgba(0,0,0,0.12)] border border-slate-200 bg-white transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    <CardHeader>
                      <CardTitle className="text-slate-900 text-[26px] font-semibold">Alumni Registration</CardTitle>
                      <CardDescription className="text-slate-600">If you have graduated, fill this form.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button type="button" onClick={startLinkedIn} className="w-full bg-[#0a66c2] hover:bg-[#084e96] text-white">
                        <Linkedin className="h-4 w-4 mr-2" /> Sync LinkedIn (prefill name & email)
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="a_name" className="text-slate-700">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="a_name" placeholder="Sarah Johnson" {...regA('name')} className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]" />
                          </div>
                          {errorsA.name && <p className="text-xs text-destructive">{errorsA.name.message}</p>}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="a_email" className="text-slate-700">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="a_email" type="email" placeholder="you@email.com" {...regA('email')} className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]" />
                          </div>
                          {errorsA.email && <p className="text-xs text-destructive">{errorsA.email.message}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="a_password" className="text-slate-700">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="a_password" type={showPassA ? 'text' : 'password'} placeholder="••••••••" {...regA('password')} className="pl-9 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]" />
                            <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassA((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700">
                              {showPassA ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {errorsA.password && <p className="text-xs text-destructive">{errorsA.password.message}</p>}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="a_confirm" className="text-slate-700">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="a_confirm" type={showPassA ? 'text' : 'password'} placeholder="••••••••" {...regA('confirmPassword')} className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]" />
                          </div>
                          {errorsA.confirmPassword && <p className="text-xs text-destructive">{errorsA.confirmPassword.message as any}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label className="text-slate-700">Session</Label>
                          <Select onValueChange={(v) => setValueA('gradSeason', v as any)}>
                            <SelectTrigger className="bg-white border-slate-200 text-slate-900 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1A73E8]/30">
                              <SelectValue placeholder="Select session" />
                            </SelectTrigger>
                            <SelectContent>
                              {seasons.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errorsA.gradSeason && <p className="text-xs text-destructive">{errorsA.gradSeason.message as any}</p>}
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-slate-700">Year</Label>
                          <Select onValueChange={(v) => setValueA('gradYear', Number(v))}>
                            <SelectTrigger className="bg-white border-slate-200 text-slate-900 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1A73E8]/30">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errorsA.gradYear && <p className="text-xs text-destructive">{errorsA.gradYear.message as any}</p>}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="linkedin" className="text-slate-700">LinkedIn ID (optional)</Label>
                        <Input id="linkedin" placeholder="linkedin-12345" {...regA('linkedinId')} className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A73E8]/30 focus:border-[#1A73E8]" />
                      </div>
                      <Button className="w-full h-11 text-white bg-[#0D47A1] hover:bg-[#0B3C89] hover:scale-[1.02] transition-transform" disabled={submittingA} onClick={handleSubmitA(onAlumni)}>
                        {submittingA ? 'Registering...' : 'Register as Alumni'}
                      </Button>
                      <div className="text-base text-center text-slate-600">
                        Already have an account? <Link className="underline text-[#1A73E8] hover:text-[#1664c7]" to="/">Sign in</Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

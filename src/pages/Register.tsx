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
import { GraduationCap, CheckCircle2, Eye, EyeOff } from "lucide-react";
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
};

const studentSchema = z.object({
  ...baseSchema,
  sapId: z.string().regex(/^\d{5}$/i, "SAP ID must be exactly 5 digits"),
  batchSeason: z.enum(seasons),
  batchYear: z.coerce.number().int().min(2010).max(2025),
});

type StudentForm = z.infer<typeof studentSchema>;

const alumniSchema = z.object({
  ...baseSchema,
  gradSeason: z.enum(seasons),
  gradYear: z.coerce.number().int().min(2010).max(2025),
  linkedinId: z.string().optional(),
});

type AlumniForm = z.infer<typeof alumniSchema>;

export default function Register() {
  const { registerStudent, registerAlumni } = useAuth();
  const [tab, setTab] = useState<"student" | "alumni">("student");
  const [mounted, setMounted] = useState(false);
  const [showPassS, setShowPassS] = useState(false);
  const [showPassA, setShowPassA] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

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
    <div className="relative min-h-screen bg-background">
      {/* Gradient to match Login */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#0b1b3a,#1e3a8a)]" />
      <div className={`relative grid min-h-screen grid-cols-1 md:grid-cols-2 gap-0 p-6 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {/* Brand panel (left on desktop) */}
        <div className={`order-2 md:order-1 relative hidden md:flex items-center justify-center px-6 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'} overflow-hidden`}>
          <div className="relative z-10 max-w-md space-y-6 text-center px-4">
            <div className="mx-auto inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-primary-light shadow-xl">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">AlumSphere</h1>
              <p className="text-white/85 text-lg leading-relaxed">Join the community to learn, mentor, and grow.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Badge variant="secondary" className="justify-center py-2">Directory</Badge>
              <Badge variant="secondary" className="justify-center py-2">Mentorship</Badge>
              <Badge variant="secondary" className="justify-center py-2">Careers</Badge>
            </div>
          </div>
          <div className="pointer-events-none absolute -left-10 -bottom-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Form column (right on desktop, first on mobile) */}
        <div className="order-1 md:order-2 flex items-center justify-start">
          <div className="w-full max-w-md space-y-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
                <TabsTrigger value="student" className="rounded-full text-white/90 transition-colors data-[state=active]:bg-[#FFB800] data-[state=active]:text-black hover:data-[state=inactive]:bg-white/15">Student</TabsTrigger>
                <TabsTrigger value="alumni" className="rounded-full text-white/90 transition-colors data-[state=active]:bg-[#FFB800] data-[state=active]:text-black hover:data-[state=inactive]:bg-white/15">Alumni</TabsTrigger>
              </TabsList>

              <TabsContent value="student">
                <div key={tab} className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <Card className={`shadow-[0_12px_40px_rgba(0,0,0,0.28)] border border-white/20 bg-white/15 backdrop-blur-2xl transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    <CardHeader>
                      <CardTitle className="text-white">Student Registration</CardTitle>
                      <CardDescription className="text-white/80">If you are currently enrolled, fill this form. Otherwise, switch to Alumni registration.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button type="button" onClick={startLinkedIn} className="w-full bg-[#0a66c2] hover:bg-[#084e96] text-white">
                        Sync LinkedIn (prefill name & email)
                      </Button>
                      <div className="grid gap-2">
                        <Label htmlFor="s_name" className="text-white/90">Full Name</Label>
                        <Input id="s_name" placeholder="John Doe" {...regS('name')} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                        {errorsS.name && <p className="text-xs text-destructive">{errorsS.name.message}</p>}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="s_email" className="text-white/90">Email</Label>
                        <p className="text-xs text-white/70">Use your official university email</p>
                        <Input id="s_email" type="email" placeholder="12345@students.riphah.edu.pk" {...regS('email')} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                        {errorsS.email && <p className="text-xs text-destructive">{errorsS.email.message}</p>}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="s_password" className="text-white/90">Password</Label>
                        <div className="relative">
                          <Input id="s_password" type={showPassS ? 'text' : 'password'} placeholder="••••••••" {...regS('password')} className="pr-10 bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                          <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassS((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-white/80 hover:text-white">
                            {showPassS ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errorsS.password && <p className="text-xs text-destructive">{errorsS.password.message}</p>}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="s_sap" className="text-white/90">SAP ID</Label>
                        <Input id="s_sap" placeholder="12345" {...regS('sapId')} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                        {errorsS.sapId && <p className="text-xs text-destructive">{errorsS.sapId.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label className="text-white/90">Session</Label>
                          <Select onValueChange={(v) => setValueS('batchSeason', v as any)}>
                            <SelectTrigger className="bg-white/5 border-white/15 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/40">
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
                          <Label className="text-white/90">Year</Label>
                          <Select onValueChange={(v) => setValueS('batchYear', Number(v))}>
                            <SelectTrigger className="bg-white/5 border-white/15 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/40">
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
                      <Button className="w-full text-black border-0 bg-[#FFB800] hover:bg-[#FFA726]" disabled={submittingS} onClick={handleSubmitS(onStudent)}>
                        {submittingS ? 'Registering...' : 'Register as Student'}
                      </Button>
                      <div className="text-base text-center text-white/90">
                        Already have an account? <Link className="underline text-[#FFB800] hover:text-[#FFA726]" to="/">Sign in</Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="alumni">
                <div key={tab} className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <Card className={`shadow-[0_12px_40px_rgba(0,0,0,0.28)] border border-white/20 bg-white/15 backdrop-blur-2xl transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    <CardHeader>
                      <CardTitle className="text-white">Alumni Registration</CardTitle>
                      <CardDescription className="text-white/80">If you have graduated, fill this form.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button type="button" onClick={startLinkedIn} className="w-full bg-[#0a66c2] hover:bg-[#084e96] text-white">
                        Sync LinkedIn (prefill name & email)
                      </Button>
                      <div className="grid gap-2">
                        <Label htmlFor="a_name" className="text-white/90">Full Name</Label>
                        <Input id="a_name" placeholder="Sarah Johnson" {...regA('name')} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                        {errorsA.name && <p className="text-xs text-destructive">{errorsA.name.message}</p>}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="a_email" className="text-white/90">Email</Label>
                        <p className="text-xs text-white/70">Use your official university email</p>
                        <Input id="a_email" type="email" placeholder="you@email.com" {...regA('email')} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                        {errorsA.email && <p className="text-xs text-destructive">{errorsA.email.message}</p>}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="a_password" className="text-white/90">Password</Label>
                        <div className="relative">
                          <Input id="a_password" type={showPassA ? 'text' : 'password'} placeholder="••••••••" {...regA('password')} className="pr-10 bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                          <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassA((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-white/80 hover:text-white">
                            {showPassA ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errorsA.password && <p className="text-xs text-destructive">{errorsA.password.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label className="text-white/90">Session</Label>
                          <Select onValueChange={(v) => setValueA('gradSeason', v as any)}>
                            <SelectTrigger className="bg-white/5 border-white/15 text-white hover:bg-[#1e3a8a] hover:text-white focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/40">
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
                          <Label className="text-white/90">Year</Label>
                          <Select onValueChange={(v) => setValueA('gradYear', Number(v))}>
                            <SelectTrigger className="bg-white/5 border-white/15 text-white hover:bg-[#1e3a8a] hover:text-white focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/40">
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
                        <Label htmlFor="linkedin" className="text-white/90">LinkedIn ID (optional)</Label>
                        <Input id="linkedin" placeholder="linkedin-12345" {...regA('linkedinId')} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                      </div>
                      <Button className="w-full text-black border-0 bg-[#FFB800] hover:bg-[#FFA726]" disabled={submittingA} onClick={handleSubmitA(onAlumni)}>
                        {submittingA ? 'Registering...' : 'Register as Alumni'}
                      </Button>
                      <div className="text-base text-center text-white/90">
                        Already have an account? <Link className="underline text-[#FFB800] hover:text-[#FFA726]" to="/">Sign in</Link>
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

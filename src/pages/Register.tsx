import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { GraduationCap, CheckCircle2 } from "lucide-react";

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
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

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
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom_right,#0b1b3a_0%,#3b82f6_70%,#60a5fa_100%)]" />
      <div className={`relative grid min-h-screen grid-cols-1 md:grid-cols-2 gap-0 p-6 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {/* Brand panel (left on desktop) */}
        <div className={`order-2 md:order-1 relative hidden md:flex items-center justify-start pr-6 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'} overflow-hidden`}>
          <div className="relative z-10 max-w-md space-y-6 text-left pl-4">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-primary-light shadow-xl">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">AlumSphere</h1>
              <p className="text-white/85 text-lg leading-relaxed">Join the community to learn, mentor, and grow.</p>
              <ul className="mt-2 space-y-2">
                <li className="flex items-start gap-2 text-white/80"><CheckCircle2 className="h-5 w-5 text-white/90 mt-0.5" /><span>Network with alumni and peers</span></li>
                <li className="flex items-start gap-2 text-white/80"><CheckCircle2 className="h-5 w-5 text-white/90 mt-0.5" /><span>Discover opportunities and events</span></li>
                <li className="flex items-start gap-2 text-white/80"><CheckCircle2 className="h-5 w-5 text-white/90 mt-0.5" /><span>Give back through mentorship</span></li>
              </ul>
            </div>
          </div>
          <div className="pointer-events-none absolute -left-10 -bottom-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Form column (right on desktop, first on mobile) */}
        <div className="order-1 md:order-2 flex items-center justify-start">
          <div className="w-full max-w-md space-y-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
                <TabsTrigger value="student" className="rounded-full text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white transition-colors">Student</TabsTrigger>
                <TabsTrigger value="alumni" className="rounded-full text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white transition-colors">Alumni</TabsTrigger>
              </TabsList>

              <TabsContent value="student">
                <Card className={`shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/10 bg-white/10 backdrop-blur-xl transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  <CardHeader>
                    <CardTitle className="text-white">Student Registration</CardTitle>
                    <CardDescription className="text-white/80">Create your student account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="s_name" className="text-white/90">Full Name</Label>
                      <Input id="s_name" placeholder="John Doe" {...regS("name")} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                      {errorsS.name && <p className="text-xs text-destructive">{errorsS.name.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="s_email" className="text-white/90">Email</Label>
                      <Input id="s_email" type="email" placeholder="you@university.edu" {...regS("email")} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                      {errorsS.email && <p className="text-xs text-destructive">{errorsS.email.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="s_password" className="text-white/90">Password</Label>
                      <Input id="s_password" type="password" placeholder="••••••••" {...regS("password")} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                      {errorsS.password && <p className="text-xs text-destructive">{errorsS.password.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="s_sap" className="text-white/90">SAP ID</Label>
                      <Input id="s_sap" placeholder="123456" {...regS("sapId")} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                      {errorsS.sapId && <p className="text-xs text-destructive">{errorsS.sapId.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label className="text-white/90">Season</Label>
                        <Select onValueChange={(v) => setValueS("batchSeason", v as any)}>
                          <SelectTrigger className="bg-white/5 border-white/15 text-white">
                            <SelectValue placeholder="Select season" />
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
                        <Select onValueChange={(v) => setValueS("batchYear", Number(v))}>
                          <SelectTrigger className="bg-white/5 border-white/15 text-white">
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
                    <Button className="w-full text-white border-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]" disabled={submittingS} onClick={handleSubmitS(onStudent)}>
                      {submittingS ? "Registering..." : "Register as Student"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alumni">
                <Card className={`shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/10 bg-white/10 backdrop-blur-xl transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  <CardHeader>
                    <CardTitle className="text-white">Alumni Registration</CardTitle>
                    <CardDescription className="text-white/80">Create your alumni account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="a_name" className="text-white/90">Full Name</Label>
                      <Input id="a_name" placeholder="Sarah Johnson" {...regA("name")} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                      {errorsA.name && <p className="text-xs text-destructive">{errorsA.name.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="a_email" className="text-white/90">Email</Label>
                      <Input id="a_email" type="email" placeholder="you@email.com" {...regA("email")} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                      {errorsA.email && <p className="text-xs text-destructive">{errorsA.email.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="a_password" className="text-white/90">Password</Label>
                      <Input id="a_password" type="password" placeholder="••••••••" {...regA("password")} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                      {errorsA.password && <p className="text-xs text-destructive">{errorsA.password.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label className="text-white/90">Season</Label>
                        <Select onValueChange={(v) => setValueA("gradSeason", v as any)}>
                          <SelectTrigger className="bg-white/5 border-white/15 text-white">
                            <SelectValue placeholder="Select season" />
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
                        <Select onValueChange={(v) => setValueA("gradYear", Number(v))}>
                          <SelectTrigger className="bg-white/5 border-white/15 text-white">
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
                      <Input id="linkedin" placeholder="linkedin-12345" {...regA("linkedinId")} className="bg-white/5 border-white/15 text-white placeholder:text-white/50 focus-visible:ring-white/30" />
                    </div>
                    <Button className="w-full text-white border-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]" disabled={submittingA} onClick={handleSubmitA(onAlumni)}>
                      {submittingA ? "Registering..." : "Register as Alumni"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

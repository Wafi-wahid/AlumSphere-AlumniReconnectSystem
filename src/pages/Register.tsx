import { useMemo, useState } from "react";
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="alumni">Alumni</TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Student Registration</CardTitle>
                <CardDescription>Create your student account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="s_name">Full Name</Label>
                  <Input id="s_name" placeholder="John Doe" {...regS("name")} />
                  {errorsS.name && <p className="text-xs text-destructive">{errorsS.name.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="s_email">Email</Label>
                  <Input id="s_email" type="email" placeholder="you@university.edu" {...regS("email")} />
                  {errorsS.email && <p className="text-xs text-destructive">{errorsS.email.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="s_password">Password</Label>
                  <Input id="s_password" type="password" placeholder="••••••••" {...regS("password")} />
                  {errorsS.password && <p className="text-xs text-destructive">{errorsS.password.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="s_sap">SAP ID</Label>
                  <Input id="s_sap" placeholder="123456" {...regS("sapId")} />
                  {errorsS.sapId && <p className="text-xs text-destructive">{errorsS.sapId.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Season</Label>
                    <Select onValueChange={(v) => setValueS("batchSeason", v as any)}>
                      <SelectTrigger>
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
                    <Label>Year</Label>
                    <Select onValueChange={(v) => setValueS("batchYear", Number(v))}>
                      <SelectTrigger>
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
                <Button className="w-full" variant="brand" disabled={submittingS} onClick={handleSubmitS(onStudent)}>
                  {submittingS ? "Registering..." : "Register as Student"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alumni">
            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Alumni Registration</CardTitle>
                <CardDescription>Create your alumni account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="a_name">Full Name</Label>
                  <Input id="a_name" placeholder="Sarah Johnson" {...regA("name")} />
                  {errorsA.name && <p className="text-xs text-destructive">{errorsA.name.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="a_email">Email</Label>
                  <Input id="a_email" type="email" placeholder="you@email.com" {...regA("email")} />
                  {errorsA.email && <p className="text-xs text-destructive">{errorsA.email.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="a_password">Password</Label>
                  <Input id="a_password" type="password" placeholder="••••••••" {...regA("password")} />
                  {errorsA.password && <p className="text-xs text-destructive">{errorsA.password.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Season</Label>
                    <Select onValueChange={(v) => setValueA("gradSeason", v as any)}>
                      <SelectTrigger>
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
                    <Label>Year</Label>
                    <Select onValueChange={(v) => setValueA("gradYear", Number(v))}>
                      <SelectTrigger>
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
                  <Label htmlFor="linkedin">LinkedIn ID (optional)</Label>
                  <Input id="linkedin" placeholder="linkedin-12345" {...regA("linkedinId")} />
                </div>
                <Button className="w-full" variant="brand" disabled={submittingA} onClick={handleSubmitA(onAlumni)}>
                  {submittingA ? "Registering..." : "Register as Alumni"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

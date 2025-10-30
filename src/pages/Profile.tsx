import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UsersAPI } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Lightbulb, ShieldCheck, UserPlus, Linkedin, Upload } from "lucide-react";

const years = Array.from({ length: 2025 - 2010 + 1 }, (_, i) => 2010 + i);
const seasons = ["Spring", "Fall"] as const;

const schema = z.object({
  name: z.string().min(2, "Enter full name"),
  profilePicture: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  program: z.string().min(2, "Select or enter program"),
  batchSeason: z.enum(seasons),
  batchYear: z.coerce.number().int().min(2010).max(2025),
  currentCompany: z.string().optional().or(z.literal("")),
  skills: z.string().optional().or(z.literal("")),
  profileHeadline: z.string().min(10, "Add a short, compelling headline"),
  location: z.string().min(2, "Enter your city/country"),
  experienceYears: z.coerce.number().int().min(0).max(60).default(0),
});

type FormData = z.infer<typeof schema>;

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [serverUser, setServerUser] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    (async () => {
      try {
        const { user } = await UsersAPI.me();
        setServerUser(user);
        reset({
          name: user.name || "",
          profilePicture: user.profilePicture || "",
          program: user.program || "",
          batchSeason: user.batchSeason || "Spring",
          batchYear: user.batchYear || 2010,
          currentCompany: user.currentCompany || "",
          skills: user.skills || "",
          profileHeadline: user.profileHeadline || "",
          location: user.location || "",
          experienceYears: user.experienceYears ?? 0,
        });
      } catch (e: any) {
        toast.error(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [reset]);

  const experienceYears = watch("experienceYears");
  const mentorEligible = useMemo(() => (Number(experienceYears) || 0) >= 4, [experienceYears]);

  const onUploadAvatar = async (file: File) => {
    try {
      const form = new FormData();
      form.append('avatar', file);
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/me/avatar`, { method: 'POST', body: form, credentials: 'include' });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setValue('profilePicture', data.url);
      toast.success('Avatar uploaded');
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        profilePicture: data.profilePicture || undefined,
        currentCompany: data.currentCompany || undefined,
        skills: data.skills || undefined,
      };
      const res = await UsersAPI.updateMe(payload);
      setServerUser(res.user);
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading profile…</div>;
  if (!serverUser) return <div className="p-8 text-destructive">Failed to load profile.</div>;

  const needsCompletion = !serverUser.profileCompleted;

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      {needsCompletion && (
        <Card className="border-2 border-amber-300/50 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader className="flex flex-row items-center gap-3">
            <Lightbulb className="text-amber-500" />
            <div>
              <CardTitle>Complete your profile</CardTitle>
              <CardDescription>
                Add your program, headline, location, and skills to get better recommendations. If you have 4+ years of experience, you can mentor others.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Review your details from registration and complete the rest.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Top section: avatar and headline */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={watch("profilePicture") || undefined} alt={watch("name")} />
              <AvatarFallback>{(watch("name") || "").split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 grid md:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="headline">Profile Headline</Label>
                <Input id="headline" placeholder="e.g., Final-year SE student exploring AI/ML" {...register("profileHeadline")} />
                {errors.profileHeadline && <p className="text-xs text-destructive">{errors.profileHeadline.message}</p>}
              </div>
            </div>
          </div>

          {/* Picture upload and LinkedIn sync */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="avatar">Profile Picture</Label>
              <div className="flex items-center gap-3">
                <Input id="avatar" type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadAvatar(f);
                }} />
                <Button type="button" variant="secondary" onClick={() => setValue('profilePicture', '')}>
                  <Upload className="h-4 w-4 mr-2" />Clear
                </Button>
              </div>
              {watch('profilePicture') && (
                <p className="text-xs text-muted-foreground">Stored as: {watch('profilePicture')}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Sync with LinkedIn</Label>
              <p className="text-xs text-muted-foreground">With your consent, we will import your name, email, headline and profile picture from LinkedIn.</p>
              <div>
                <Button type="button" variant="linkedin" onClick={() => {
                  const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                  window.location.href = `${base}/auth/linkedin/start`;
                }}>
                  <Linkedin className="h-4 w-4 mr-2" /> Sync LinkedIn Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Academic info */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Program</Label>
              <Input placeholder="Software Engineering" {...register("program")} />
              {errors.program && <p className="text-xs text-destructive">{errors.program.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Batch Season</Label>
              <Select value={String(watch("batchSeason") || "")} onValueChange={(v) => setValue("batchSeason", v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.batchSeason && <p className="text-xs text-destructive">{errors.batchSeason.message as any}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Batch Year</Label>
              <Select value={String(watch("batchYear") || "")} onValueChange={(v) => setValue("batchYear", Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.batchYear && <p className="text-xs text-destructive">{errors.batchYear.message as any}</p>}
            </div>
          </div>

          {/* Professional */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="company">Current Company</Label>
              <Input id="company" placeholder="Optional" {...register("currentCompany")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skills">Skills</Label>
              <Input id="skills" placeholder="Comma-separated (e.g., React, Node, SQL)" {...register("skills")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="City, Country" {...register("location")} />
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>
          </div>

          {/* Experience & mentorship */}
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div className="grid gap-2">
              <Label htmlFor="exp">Years of Experience</Label>
              <Input id="exp" type="number" min={0} max={60} {...register("experienceYears", { valueAsNumber: true })} />
            </div>
            <div className="md:col-span-2">
              {mentorEligible ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  You are eligible to mentor others. Consider enabling mentorship in settings.
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserPlus className="h-4 w-4" />
                  Gain 4+ years of experience to unlock mentorship opportunities.
                </div>
              )}
            </div>
          </div>

          {/* Guidance */}
          <div className="grid gap-2">
            <Label>Tips to enhance your profile</Label>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Use a clear profile picture (URL) so peers recognize you.</li>
              <li>Add a concise headline that reflects your goals and strengths.</li>
              <li>List 5–8 relevant skills to get better matches for projects and jobs.</li>
              <li>Keep your program and batch accurate for alumni connections.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => reset()} disabled={isSubmitting}>Reset</Button>
            <Button variant="brand" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Completion status */}
      <div className="flex items-center gap-2 text-sm">
        <span>Completion status:</span>
        {serverUser.profileCompleted ? (
          <Badge className="bg-emerald-600 text-white">Complete</Badge>
        ) : (
          <Badge className="bg-amber-500 text-white">Incomplete</Badge>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BrandLoader } from "@/components/ui/BrandLoader";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const years = Array.from({ length: 2025 - 2010 + 1 }, (_, i) => 2010 + i);
const seasons = ["Spring", "Fall"] as const;

const schema = z.object({
  name: z.string().min(2, "Enter full name"),
  // accept absolute URLs or local upload paths like /uploads/filename.png
  profilePicture: z
    .string()
    .regex(/^(https?:\/\/.*|\/uploads\/.*)$/i, "Must be a URL or /uploads path")
    .optional()
    .or(z.literal("")),
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
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [serverUser, setServerUser] = useState<any>(null);
  const [tab, setTab] = useState<'profile'|'password'|'achievements'>('profile');
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

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
    // Ensure header avatar updates if coming back from LinkedIn redirect
    refresh().catch(() => {});
  }, [reset, refresh]);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(doc(db, 'users', user.id, 'gamification', 'summary'), (snap) => {
      const d = snap.data() as any;
      if (d && Array.isArray(d.earnedBadges)) setEarnedBadges(d.earnedBadges);
    });
    return () => unsub();
  }, [user?.id]);

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
      // add a cache-busting query param so the image updates immediately
      const busted = `${data.url}${data.url.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setValue('profilePicture', busted);
      // also refresh auth user so the header avatar updates
      refresh().catch(() => {});
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
      // refresh auth user so global header reflects latest profile picture/headline
      refresh().catch(() => {});
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(to_bottom,#0b1b3a,#1e3a8a)]">
      <BrandLoader label="Loading profile…" />
    </div>
  );
  if (!serverUser) return <div className="p-8 text-destructive">Failed to load profile.</div>;

  const needsCompletion = !serverUser.profileCompleted;

  const badgeCatalog: Array<{ key: string; label: string; hint: string }> = [
    { key: 'Login', label: 'Login', hint: 'Sign in to the app' },
    { key: 'Profile Complete', label: 'Profile Complete', hint: 'Fill all required profile fields' },
    { key: 'First Post', label: 'First Post', hint: 'Create your first community post' },
    { key: 'First Like', label: 'First Like', hint: 'Like a post' },
    { key: 'Connect Level 1', label: 'Connect Lv1', hint: 'Make 5 connections' },
    { key: 'Master', label: 'Master Connector', hint: 'Make 10 connections' },
    { key: 'Loable', label: 'Loable', hint: 'Make 15 connections' },
    { key: 'Networking Expert', label: 'Networking Expert', hint: 'Make 20 connections' },
    { key: 'Applicant Lv1', label: 'Applicant Lv1', hint: 'Apply 5 times' },
    { key: 'Applicant Master', label: 'Applicant Master', hint: 'Apply 10 times' },
    { key: 'Applicant Pro', label: 'Applicant Pro', hint: 'Apply 15 times' },
    { key: 'Career Climber', label: 'Career Climber', hint: 'Apply 20 times' },
    { key: 'Mentor Seeker Lv1', label: 'Mentor Seeker Lv1', hint: 'Request 5 mentorships' },
    { key: 'Mentorship Master', label: 'Mentorship Master', hint: 'Request 10 mentorships' },
    { key: 'Community Favorite', label: 'Community Favorite', hint: 'Request 15 mentorships' },
    { key: 'Guidance Guru', label: 'Guidance Guru', hint: 'Request 20 mentorships' },
  ];

  return (
    <div className="container mx-auto max-w-5xl p-6 min-h-[75vh]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Account settings</h1>
      </div>
      <Tabs value={tab} onValueChange={(v)=>setTab(v as any)} className="space-y-4">
        <Card>
          <CardContent className="p-3">
            <TabsList className="flex w-full gap-2 bg-transparent p-0">
              <TabsTrigger value="profile" className="px-3 py-2 rounded-md text-[13px] data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">Profile Settings</TabsTrigger>
              <TabsTrigger value="password" className="px-3 py-2 rounded-md text-[13px] data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">Password & Email</TabsTrigger>
              <TabsTrigger value="achievements" className="px-3 py-2 rounded-md text-[13px] data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">Achievements</TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <div className="space-y-6 relative z-0 min-w-0">
          <TabsContent value="profile" className="hidden m-0 data-[state=active]:block">
            {needsCompletion && (
              <Card className="border-2 border-amber-300/50 bg-amber-50/50 dark:bg-amber-900/10 mb-4">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Lightbulb className="text-amber-500" />
                  <div>
                    <CardTitle>Complete your profile</CardTitle>
                    <CardDescription>
                      Add your program, headline, location, and skills to get better recommendations.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )}

            <Card className="min-h-[640px]">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Review your details and complete the rest.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    <p className="text-xs text-muted-foreground">Import your name, email, headline and profile picture.</p>
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

                <div className="grid md:grid-cols-3 gap-3 items-end">
                  <div className="grid gap-2">
                    <Label htmlFor="exp">Years of Experience</Label>
                    <Input id="exp" type="number" min={0} max={60} {...register("experienceYears", { valueAsNumber: true })} />
                  </div>
                  <div className="md:col-span-2">
                    {mentorEligible ? (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-4 w-4" />
                        You are eligible to mentor others.
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserPlus className="h-4 w-4" />
                        Gain 4+ years of experience to unlock mentorship opportunities.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="secondary" type="button" onClick={() => reset()} disabled={isSubmitting}>Reset</Button>
                  <Button variant="brand" className="text-primary-foreground border-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="hidden m-0 data-[state=active]:block">
            <Card className="min-h-[640px]">
              <CardHeader>
                <CardTitle>Password & Email</CardTitle>
                <CardDescription>Secure your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input id="currentPassword" type="password" placeholder="••••••••" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input id="newPassword" type="password" placeholder="••••••••" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input id="confirmPassword" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={async () => {
                    const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement)?.value || '';
                    const newPassword = (document.getElementById('newPassword') as HTMLInputElement)?.value || '';
                    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value || '';
                    if (!currentPassword || !newPassword) { toast.error('Fill all password fields'); return; }
                    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
                    try {
                      await UsersAPI.changePassword({ currentPassword, newPassword });
                      toast.success('Password updated');
                    } catch (e: any) {
                      toast.error(e.message || 'Failed to update password');
                    }
                  }}>Update password</Button>
                </div>

                <div className="grid md:grid-cols-3 gap-3 pt-2">
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="newEmail">Email</Label>
                    <Input id="newEmail" type="email" placeholder="name@gmail.com" defaultValue={serverUser.email} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emailPassword">Password</Label>
                    <Input id="emailPassword" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={async () => {
                    const newEmail = (document.getElementById('newEmail') as HTMLInputElement)?.value || '';
                    const password = (document.getElementById('emailPassword') as HTMLInputElement)?.value || '';
                    if (!newEmail || !password) { toast.error('Fill email and password'); return; }
                    try {
                      const res = await UsersAPI.changeEmail({ newEmail, password });
                      setServerUser((u:any)=>({ ...u, email: res.email }));
                      toast.success('Email updated');
                    } catch (e: any) {
                      toast.error(e.message || 'Failed to update email');
                    }
                  }}>Update email</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="hidden m-0 data-[state=active]:block">
            <Card className="overflow-hidden min-h-[640px]">
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Badges you earned and how to unlock others</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-hidden">
                <TooltipProvider>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {badgeCatalog.map((b) => {
                      const got = earnedBadges.includes(b.key);
                      return (
                        <Tooltip key={b.key}>
                          <TooltipTrigger asChild>
                            <div className={`p-4 rounded-xl border text-center ${got ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300/50' : 'bg-muted/30'}`}>
                              <div className={`text-sm font-medium ${got ? '' : 'opacity-60'}`}>{b.label}</div>
                              <div className={`mt-1 text-xs ${got ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>{got ? 'Unlocked' : 'Locked'}</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{b.hint}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

    </div>
  );
}

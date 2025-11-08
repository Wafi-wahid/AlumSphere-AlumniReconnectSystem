import { useEffect, useMemo, useRef, useState } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Lightbulb, ShieldCheck, UserPlus, Linkedin, Upload, Sparkles, LogIn, Trophy, Star, ThumbsUp, Send, Heart, Medal, MessageSquare, Users, BadgeCheck, CalendarDays, Briefcase, TrendingUp, Rocket, Megaphone, Mic2, Link, Handshake, GraduationCap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, getDoc, setDoc, collection, query, where, limit } from "firebase/firestore";

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
  const isStudent = user?.role === 'student';
  const [loading, setLoading] = useState(true);
  const [serverUser, setServerUser] = useState<any>(null);
  const [tab, setTab] = useState<'profile'|'password'|'achievements'>('profile');
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mentorDialogOpen, setMentorDialogOpen] = useState(false);
  const [mentorPromptShown, setMentorPromptShown] = useState(false);
  const [templates, setTemplates] = useState<{
    headlines: string[];
    locations: string[];
    skillsCategories: Record<string, string[]>;
    departments: string[];
  }>({
    headlines: [
      'Software Engineering Student',
      'Aspiring Full-Stack Developer',
      'AI & ML Enthusiast',
      'Web Developer in Progress',
      'Future Cloud Engineer',
      'Cybersecurity Learner',
      'Blockchain Explorer',
      'UI/UX Design Student',
      'Data Science Beginner',
      'Tech Innovator Student',
    ],
    locations: [
      'Islamabad, PK',
      'Rawalpindi, PK',
      'Lahore, PK',
      'Faisalabad, PK',
      'Karachi, PK',
    ],
    skillsCategories: {
      Programming: ['Java', 'C++', 'Python', 'TypeScript', 'JavaScript'],
      Web: ['React', 'Node.js', 'Express', 'HTML', 'CSS', 'Tailwind', 'Next.js'],
      Mobile: ['React Native', 'Flutter'],
      'AI/ML': ['TensorFlow', 'PyTorch', 'Scikit-Learn', 'OpenCV'],
      Cloud: ['AWS', 'Firebase', 'Docker'],
      Design: ['Figma', 'UI/UX', 'Adobe XD'],
      Database: ['MongoDB', 'PostgreSQL', 'SQLite', 'Prisma'],
      'Soft Skills': ['Communication', 'Leadership', 'Problem Solving'],
    },
    departments: [
      'Software Engineering',
      'Computer Science',
      'Computer Arts',
      'CyberSecurity',
    ],
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [headlineMenu, setHeadlineMenu] = useState(false);
  const [skillsMenu, setSkillsMenu] = useState(false);
  const [locationMenu, setLocationMenu] = useState(false);
  const [departmentMenu, setDepartmentMenu] = useState(false);

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
  }, []);

  // Load templates from Firestore if available
  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, 'templates', 'profile');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data() as any;
          setTemplates((prev) => ({
            headlines: Array.isArray(d.headlines) ? d.headlines : prev.headlines,
            locations: Array.isArray(d.locations) ? d.locations : prev.locations,
            skillsCategories: d.skillsCategories && typeof d.skillsCategories === 'object' ? d.skillsCategories : prev.skillsCategories,
            departments: Array.isArray(d.departments) ? d.departments : prev.departments,
          }));
        }
      } catch (_) {
        // ignore and keep defaults
      }
    })();
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const [badgesLoadError, setBadgesLoadError] = useState<string|null>(null);
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      if (!user?.id) return;
      const ref = doc(db, 'users', user.id, 'gamification', 'summary');
      try {
        // Ensure doc exists first with a minimal payload so read rules can evaluate ownerUid
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const uid = auth.currentUser?.uid;
          if (uid) await setDoc(ref, { ownerUid: uid, earnedBadges: ['Login'] }, { merge: true });
          else await setDoc(ref, { earnedBadges: ['Login'] }, { merge: true });
        } else if ((snap.data() as any)?.ownerUid == null) {
          const uid = auth.currentUser?.uid;
          if (uid) await setDoc(ref, { ownerUid: uid }, { merge: true });
        }
        // Now safe to subscribe
        unsub = onSnapshot(ref, {
          next: async (s) => {
            setBadgesLoadError(null);
            const d = s.data() as any;
            if (d && Array.isArray(d.earnedBadges)) {
              const incoming: string[] = d.earnedBadges.map((x: any) => String(x));
              const catByLC = new Map(badgeCatalog.map(b => [b.key.toLowerCase(), b.label] as [string,string]));
              const normalized: string[] = [];
              const seen = new Set<string>();
              for (const raw of incoming) {
                const lc = raw.toLowerCase();
                const aliased = aliasMap[lc] || raw;
                const targetLC = (aliasMap[lc] || aliased).toLowerCase();
                const canonical = catByLC.get(targetLC) || aliased;
                if (!seen.has(canonical)) { seen.add(canonical); normalized.push(canonical); }
              }
              // If normalization changed the array (length or any missing), backfill to Firestore
              const changed = normalized.length !== incoming.length || normalized.some(k => !incoming.includes(k));
              if (changed) {
                try { await setDoc(ref, { earnedBadges: normalized }, { merge: true }); } catch {}
              }
              setEarnedBadges(normalized);
            }
          },
          error: (err) => {
            console.warn('Gamification summary listener error', err);
            setBadgesLoadError(err?.message || 'Permission denied');
          }
        });
      } catch (err: any) {
        console.warn('Gamification bootstrap error', err);
        setBadgesLoadError(err?.message || 'Permission denied');
      }
    })();
    return () => { if (unsub) unsub(); };
  }, [user?.id]);

  const experienceYears = watch("experienceYears");
  const mentorEligible = useMemo(() => (Number(experienceYears) || 0) >= 4, [experienceYears]);
  const earnedSetLC = useMemo(() => new Set((earnedBadges || []).map((k) => String(k).toLowerCase())), [earnedBadges]);
  const navigate = useNavigate();

  // Categorized badge catalog with icon + color
  type BadgeItem = { key: string; label: string; hint: string; Icon: any; color: string; category: string; subcategory?: string };
  const badgeCatalog: BadgeItem[] = [
    // Profile / Identity
    { key: 'Login', label: 'Login', hint: 'Sign in to the app', Icon: LogIn, color: 'bg-yellow-400 text-yellow-900', category: 'Profile / Identity' },
    { key: 'Profile Complete', label: 'Complete Profile', hint: 'Fill all required profile fields', Icon: Trophy, color: 'bg-emerald-400 text-emerald-900', category: 'Profile / Identity' },
    { key: 'Verified Profile', label: 'Verified', hint: 'Verified by super admin', Icon: BadgeCheck, color: 'bg-blue-400 text-blue-900', category: 'Profile / Identity' },

    // Engagement
    { key: 'First Connection', label: 'First Connection', hint: 'Make your first connection', Icon: Handshake, color: 'bg-violet-400 text-violet-900', category: 'Engagement' },
    { key: 'First Message', label: 'First Message', hint: 'Send your first message', Icon: MessageSquare, color: 'bg-indigo-400 text-indigo-900', category: 'Engagement' },
    { key: 'First Post', label: 'First Post', hint: 'Publish your first post', Icon: Send, color: 'bg-sky-400 text-sky-900', category: 'Engagement' },
    { key: 'Community Helper', label: 'Community Helper', hint: '5+ helpful replies', Icon: Star, color: 'bg-lime-400 text-lime-900', category: 'Engagement' },
    { key: 'Rising Star', label: 'Rising Star', hint: 'High post engagement', Icon: TrendingUp, color: 'bg-pink-400 text-pink-900', category: 'Engagement' },
    { key: 'Networking Expert', label: 'Networking Expert', hint: 'High network activity', Icon: MessageSquare, color: 'bg-sky-500 text-sky-900', category: 'Engagement' },

    // Learning + Career
    { key: 'Attended Event', label: 'Attended Event', hint: 'Attend your first event', Icon: CalendarDays, color: 'bg-teal-400 text-teal-900', category: 'Learning + Career' },
    { key: 'Mentorship Requested', label: 'Requested Mentorship', hint: 'Request mentorship', Icon: GraduationCap, color: 'bg-amber-400 text-amber-900', category: 'Learning + Career' },
    { key: 'Applied for Job', label: 'Applied for Job/Internship', hint: 'Apply for a role', Icon: Briefcase, color: 'bg-orange-400 text-orange-900', category: 'Learning + Career' },
    { key: 'Applicant Lv1', label: 'Applicant Lv1', hint: 'Apply 1 time', Icon: Briefcase, color: 'bg-orange-300 text-orange-900', category: 'Learning + Career' },
    { key: 'Applicant Master', label: 'Applicant Master', hint: 'Apply 10 times', Icon: Briefcase, color: 'bg-amber-300 text-amber-900', category: 'Learning + Career' },
    { key: 'Applicant Pro', label: 'Applicant Pro', hint: 'Apply 15 times', Icon: Briefcase, color: 'bg-yellow-300 text-yellow-900', category: 'Learning + Career' },
    { key: 'Career Climber', label: 'Career Climber', hint: 'Apply 20 times', Icon: Briefcase, color: 'bg-orange-500 text-orange-900', category: 'Learning + Career' },

    // Event Participation
    { key: 'Event Leader', label: 'Event Leader', hint: 'Speak or organize an event', Icon: Megaphone, color: 'bg-purple-400 text-purple-900', category: 'Event Participation' },
    { key: 'Event Goer', label: 'Event Goer', hint: 'Attend 1 event', Icon: CalendarDays, color: 'bg-cyan-400 text-cyan-900', category: 'Event Participation' },

    // Streak / Activity
    { key: '7-Day Active', label: '7-Day Active', hint: 'Active for 7 consecutive days', Icon: Rocket, color: 'bg-red-400 text-red-900', category: 'Streak / Activity' },

    // Alumni: Identity & Credibility
    { key: 'Verified Alumni', label: 'Verified Alumni', hint: 'Alumni verification complete', Icon: BadgeCheck, color: 'bg-blue-400 text-blue-900', category: 'Alumni', subcategory: 'Identity & Credibility' },
    { key: 'Legacy Member', label: 'Legacy Member', hint: '3+ years after graduation', Icon: Medal, color: 'bg-yellow-500 text-yellow-900', category: 'Alumni', subcategory: 'Identity & Credibility' },

    // Alumni: Mentorship & Community
    { key: 'Mentor', label: 'Mentor', hint: 'First mentee assigned', Icon: GraduationCap, color: 'bg-emerald-400 text-emerald-900', category: 'Alumni', subcategory: 'Mentorship & Community' },
    { key: 'Super Mentor', label: 'Super Mentor', hint: 'Positive mentee feedback', Icon: Star, color: 'bg-lime-400 text-lime-900', category: 'Alumni', subcategory: 'Mentorship & Community' },
    { key: 'Network Builder', label: 'Network Builder', hint: '50+ connections', Icon: Link, color: 'bg-violet-400 text-violet-900', category: 'Alumni', subcategory: 'Mentorship & Community' },

    // Alumni: Career Milestones
    { key: 'First Job', label: 'Employed / First Job', hint: 'Started your first job', Icon: Briefcase, color: 'bg-amber-400 text-amber-900', category: 'Alumni', subcategory: 'Career Milestones' },
    { key: 'Manager', label: 'Manager / Team Lead', hint: 'Promoted to team lead or manager', Icon: Trophy, color: 'bg-teal-400 text-teal-900', category: 'Alumni', subcategory: 'Career Milestones' },
    { key: 'Founder', label: 'Founder / Entrepreneur', hint: 'Launched your own venture', Icon: Rocket, color: 'bg-red-400 text-red-900', category: 'Alumni', subcategory: 'Career Milestones' },

    // Alumni: Contribution
    { key: 'Employer Referral', label: 'Employer Referral', hint: 'Referred a candidate', Icon: Megaphone, color: 'bg-sky-400 text-sky-900', category: 'Alumni', subcategory: 'Contribution' },
    { key: 'Event Speaker', label: 'Event Speaker', hint: 'Spoke at an event', Icon: Mic2, color: 'bg-purple-400 text-purple-900', category: 'Alumni', subcategory: 'Contribution' },
  ];

  const categoriesOrder = ['Profile / Identity','Engagement','Learning + Career','Event Participation','Streak / Activity','Alumni'];
  const alumniSubOrder = ['Identity & Credibility','Mentorship & Community','Career Milestones','Contribution'];

  // Legacy -> Canonical aliases to avoid key mismatches
  const aliasMap: Record<string, string> = {
    'connect level 1': 'First Connection',
    'loable': 'Network Builder',
    'mentor seeker lv1': 'Requested Mentorship',
    'community favorite': 'Community Helper',
  };

  // Where to go to earn each badge
  const badgeActions: Record<string, { tab?: string; label: string } | undefined> = {
    'login': undefined,
    'profile complete': { tab: 'profile', label: 'Complete Profile' },
    'verified profile': undefined,
    'first connection': { tab: 'directory', label: 'Find Connections' },
    'first message': { tab: 'messages', label: 'Send a Message' },
    'first post': { tab: 'community', label: 'Create a Post' },
    'community helper': { tab: 'community', label: 'Reply to Posts' },
    'rising star': { tab: 'community', label: 'Engage on Posts' },
    'attended event': { tab: 'events', label: 'Browse Events' },
    'mentorship requested': { tab: 'mentorship', label: 'Request Mentorship' },
    'applied for job': { tab: 'careers', label: 'Explore Jobs' },
    'event leader': { tab: 'events', label: 'Speak/Organize' },
    'event goer': { tab: 'events', label: 'Attend Event' },
    '7-day active': { tab: '', label: 'Stay Active' },
    // Alumni
    'verified alumni': undefined,
    'legacy member': undefined,
    'mentor': { tab: 'mentorship', label: 'Mentor Students' },
    'super mentor': { tab: 'mentorship', label: 'Support Mentees' },
    'network builder': { tab: 'directory', label: 'Grow Network' },
    'first job': { tab: 'careers', label: 'Career Progress' },
    'manager': undefined,
    'founder': undefined,
    'employer referral': { tab: 'careers', label: 'Refer Candidate' },
    'event speaker': { tab: 'events', label: 'Speak at Event' },
    'first like': { tab: 'community', label: 'Like a Post' },
  };

  useEffect(() => {
    const exp = Number(experienceYears) || 0;
    if (isStudent && exp >= 4 && !mentorPromptShown) {
      setMentorDialogOpen(true);
      setMentorPromptShown(true);
    }
  }, [isStudent, experienceYears, mentorPromptShown]);

  // Compute profile completion per requested sections
  const section1Complete = !!(watch("name") && serverUser?.email && (watch("profilePicture") || true));
  const section2Complete = !!(watch("program") && watch("batchSeason") && watch("batchYear"));
  const section3Complete = !!(watch("profileHeadline") && watch("location") && (watch("skills") || watch("currentCompany")));
  const completedCount = [section1Complete, section2Complete, section3Complete].filter(Boolean).length;
  const completionPct = Math.round((completedCount / 3) * 100);
  const allComplete = completionPct === 100;

  // Track post/like to award badges from Profile as well
  const [hasPost, setHasPost] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const q1 = query(collection(db, 'posts'), where('authorId', '==', user.id), limit(1));
    const unsub1 = onSnapshot(q1, { next: (snap) => setHasPost(!snap.empty), error: () => {/* ignore permission denied for optional badge */} });
    const q2 = query(collection(db, 'posts'), where('likes', 'array-contains', user.id), limit(1));
    const unsub2 = onSnapshot(q2, { next: (snap) => setHasLiked(!snap.empty), error: () => {/* ignore permission denied for optional badge */} });
    return () => { unsub1(); unsub2(); };
  }, [user?.id]);

  // Persist core badges here too so Achievements always reflects realtime status
  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      try {
        const core = ['Login', ...(allComplete ? ['Profile Complete'] : []), ...(hasPost ? ['First Post'] : []), ...(hasLiked ? ['First Like'] : [])];
        const ref = doc(db, 'users', user.id, 'gamification', 'summary');
        const snap = await getDoc(ref);
        const existing: string[] = (snap.exists() && Array.isArray((snap.data() as any)?.earnedBadges)) ? (snap.data() as any).earnedBadges : [];
        const merged = Array.from(new Set([...(existing || []), ...core]));
        if (merged.length !== existing.length) {
          const uid = auth.currentUser?.uid;
          if (uid) await setDoc(ref, { earnedBadges: merged, ownerUid: uid }, { merge: true });
          else await setDoc(ref, { earnedBadges: merged }, { merge: true });
        }
      } catch {}
    })();
  }, [user?.id, allComplete, hasPost, hasLiked]);

  const missingS1: string[] = useMemo(() => {
    const arr: string[] = [];
    if (!watch('name')) arr.push('Name');
    if (!serverUser?.email) arr.push('Email');
    // profile picture optional; omit from required
    return arr;
  }, [watch('name'), serverUser?.email]);
  const missingS2: string[] = useMemo(() => {
    const arr: string[] = [];
    if (!watch('program')) arr.push('Department');
    if (!watch('batchSeason')) arr.push('Session');
    if (!watch('batchYear')) arr.push('Batch Year');
    return arr;
  }, [watch('program'), watch('batchSeason'), watch('batchYear')]);
  const missingS3: string[] = useMemo(() => {
    const arr: string[] = [];
    if (!watch('profileHeadline')) arr.push('Headline');
    if (!watch('location')) arr.push('Location');
    if (!watch('skills') && !watch('currentCompany')) arr.push('Skills or Company');
    if (watch('experienceYears') === undefined || watch('experienceYears') === null) arr.push('Experience');
    return arr;
  }, [watch('profileHeadline'), watch('location'), watch('skills'), watch('currentCompany'), watch('experienceYears')]);

  const SectionMarker = ({ label, missing }: { label: string; missing: string[] }) => (
    <div className="relative flex items-center gap-2 mt-2 mb-3">
      <div className="h-px flex-1 bg-muted" />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full border text-xs ${missing.length ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10' : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10'}`}>
              <span className={`h-2 w-2 rounded-full ${missing.length ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className="font-medium">{label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {missing.length ? (
              <div className="text-xs">
                <div className="font-medium mb-1">Complete these:</div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {missing.map((m) => (<li key={m}>{m}</li>))}
                </ul>
              </div>
            ) : (
              <div className="text-xs text-emerald-600">Section complete</div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="h-px flex-1 bg-muted" />
    </div>
  );

  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (allComplete) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [allComplete]);

  const ConfettiBurst = () => (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-center">
      <style>{`
        @keyframes fall { from { transform: translateY(-20vh) rotate(0deg); opacity: 1;} to { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
      `}</style>
      <div className="relative w-full h-0">
        {Array.from({ length: 40 }).map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 0.6;
          const duration = 1.8 + Math.random() * 0.8;
          const size = 6 + Math.random() * 6;
          const colors = ["#FFB800", "#1e3a8a", "#60a5fa", "#34d399", "#f472b6"]; 
          const bg = colors[i % colors.length];
          return (
            <span
              key={i}
              style={{
                left: `${left}%`,
                width: size,
                height: size,
                background: bg,
                animation: `fall ${duration}s linear ${delay}s forwards`,
              }}
              className="absolute top-0 rounded-sm"
            />
          );
        })}
      </div>
      <div className="hidden" style={{ animationName: 'fall' }} />
    </div>
  );

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

  // Skills helpers: toggle chip selection and sync to input as comma-separated
  const addSkill = (s: string) => {
    setSelectedSkills((cur) => {
      if (cur.includes(s)) return cur;
      const next = [...cur, s];
      setValue('skills', next.join(', '));
      return next;
    });
  };
  const removeSkill = (s: string) => {
    setSelectedSkills((cur) => {
      const next = cur.filter((x) => x !== s);
      setValue('skills', next.join(', '));
      return next;
    });
  };
  const toggleSkill = (s: string) => {
    setSelectedSkills((cur) => {
      const has = cur.includes(s);
      const next = has ? cur.filter((x) => x !== s) : [...cur, s];
      setValue('skills', next.join(', '));
      return next;
    });
  };

  // Initialize selectedSkills from existing value when form loads
  useEffect(() => {
    const val = (watch('skills') || '') as string;
    const init = val.split(',').map((s) => s.trim()).filter(Boolean);
    setSelectedSkills(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isStudent && Number(data.experienceYears) > 5) {
        toast.error('Students can enter up to 5 years of experience');
        return;
      }
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
            {showConfetti && <ConfettiBurst />}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Student Profile Progress</CardTitle>
                <CardDescription>Complete all sections to finish your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-2 w-full rounded bg-muted overflow-hidden">
                  <div className="h-full bg-[#FFB800]" style={{ width: `${completionPct}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{completionPct}% complete</span>
                  {allComplete ? <span className="text-emerald-600">All sections complete</span> : <span>{3 - completedCount} remaining</span>}
                </div>
                <div className="grid md:grid-cols-3 gap-3 mt-2">
                  <div className={`rounded-lg border p-3 ${section1Complete ? 'border-emerald-300/60 bg-emerald-50 dark:bg-emerald-900/10' : 'bg-muted/30'}`}>
                    <div className="font-medium text-sm">section 1: already fetched data or sync data</div>
                    <div className="text-xs text-muted-foreground">Name, email, profile picture</div>
                  </div>
                  <div className={`rounded-lg border p-3 ${section2Complete ? 'border-emerald-300/60 bg-emerald-50 dark:bg-emerald-900/10' : 'bg-muted/30'}`}>
                    <div className="font-medium text-sm">section 2: acedemics detail</div>
                    <div className="text-xs text-muted-foreground">Department, session</div>
                  </div>
                  <div className={`rounded-lg border p-3 ${section3Complete ? 'border-emerald-300/60 bg-emerald-50 dark:bg-emerald-900/10' : 'bg-muted/30'}`}>
                    <div className="font-medium text-sm">section 3: career</div>
                    <div className="text-xs text-muted-foreground">Skills, interests, headline, company, experience</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            

            <Card className="min-h-[640px]">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Review your details and complete the rest.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SectionMarker label="Section 1: Already fetched data" missing={missingS1} />
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
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={serverUser.email || ''} disabled readOnly />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-[1fr,1.25fr] gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="avatar">Profile Picture</Label>
                    <div className="flex flex-col items-start gap-2">
                      <input
                        ref={fileInputRef}
                        id="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) onUploadAvatar(f);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:border-red-500 hover:text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />Choose file
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:border-red-500 hover:text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
                        onClick={() => setValue('profilePicture', '')}
                      >
                        <Upload className="h-4 w-4 mr-2" />Clear
                      </Button>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl p-4 text-white bg-gradient-to-br from-[#0b1b3a] to-[#1e3a8a]">
                    <div className="relative z-[1] space-y-1.5">
                      <div className="text-xs uppercase tracking-wide opacity-80">LinkedIn sync</div>
                      <div className="text-base font-semibold leading-snug">Do you want to sync your LinkedIn profile here?</div>
                      <p className="text-[11px] opacity-90">We can import your name, email, headline and profile picture now.</p>
                      <Button
                        type="button"
                        className="mt-1.5 bg-[#FFB800] hover:bg-[#ffcb38] text-black border-0"
                        onClick={() => {
                          const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                          window.location.href = `${base}/auth/linkedin/start`;
                        }}
                      >
                        <Linkedin className="h-4 w-4 mr-2" /> Sync LinkedIn
                      </Button>
                      <p className="text-[10px] opacity-90 mt-1.5">In future, you’ll be able to import your complete profile from LinkedIn.</p>
                    </div>
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
                    <div className="absolute right-6 bottom-6 h-8 w-8 rounded-full bg-white/10" />
                  </div>
                </div>

                {/* Section 2: Academic details (Department/Session) */}
                <SectionMarker label="section 2: acedemics detail" missing={missingS2} />
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="grid gap-2">
                    <Label>Department</Label>
                    <div className="relative">
                      <Input className="pr-10" placeholder="Software Engineering" {...register("program")}
                        onFocus={()=>setDepartmentMenu(true)}
                        onBlur={()=>setTimeout(()=>setDepartmentMenu(false),120)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-2 text-muted-foreground hover:text-foreground"
                        aria-label="Department templates"
                        onMouseDown={(e)=>{ e.preventDefault(); setDepartmentMenu((v)=>!v); }}
                      >
                        <Sparkles className="h-5 w-5" />
                      </button>
                      {departmentMenu && (
                        <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-sm max-h-56 overflow-auto">
                          {(() => {
                            const current = (watch('program') || '').trim();
                            const first = templates.departments.filter((d) => current && d === current);
                            const rest = templates.departments.filter((d) => !current || d !== current);
                            return [...first, ...rest].map((dep) => (
                              <button
                                type="button"
                                key={dep}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                onMouseDown={(e)=>{ e.preventDefault(); setValue('program', dep); setDepartmentMenu(false);} }
                              >
                                {dep}
                              </button>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                    {errors.program && <p className="text-xs text-destructive">{errors.program.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label>Session</Label>
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

                {/* Section 3: Career */}
                <SectionMarker label="section 3: career" missing={missingS3} />
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="headline">Profile Headline</Label>
                    <div className="relative">
                      <Input
                        className="pr-10"
                        id="headline"
                        placeholder="e.g., Final-year SE student exploring AI/ML"
                        {...register("profileHeadline")}
                        onFocus={() => setHeadlineMenu(true)}
                        onBlur={() => setTimeout(()=>setHeadlineMenu(false), 120)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-2 text-muted-foreground hover:text-foreground"
                        aria-label="Headline templates"
                        onMouseDown={(e)=>{ e.preventDefault(); setHeadlineMenu((v)=>!v); }}
                      >
                        <Sparkles className="h-5 w-5" />
                      </button>
                      {headlineMenu && (
                        <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-sm max-h-56 overflow-auto">
                          {(() => {
                            const current = (watch('profileHeadline') || '').trim();
                            const first = templates.headlines.filter((h) => current && h === current);
                            const rest = templates.headlines.filter((h) => !current || h !== current);
                            return [...first, ...rest].map((h) => (
                              <button
                                type="button"
                                key={h}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                onMouseDown={(e)=>{ e.preventDefault(); setValue('profileHeadline', h); setHeadlineMenu(false); }}
                              >
                                {h}
                              </button>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                    {errors.profileHeadline && <p className="text-xs text-destructive">{errors.profileHeadline.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="skills">Skills</Label>
                    <div className="relative">
                      <Input
                        className="pr-10"
                        id="skills"
                        placeholder="Choose skills from below"
                        {...register("skills")}
                        onFocus={()=>setSkillsMenu(true)}
                        onBlur={()=>setTimeout(()=>setSkillsMenu(false), 120)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-2 text-muted-foreground hover:text-foreground"
                        aria-label="Add skill"
                        onMouseDown={(e)=>{ e.preventDefault(); setSkillsMenu((v)=>!v); }}
                      >
                        <Sparkles className="h-5 w-5" />
                      </button>
                      {skillsMenu && (
                        <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-sm max-h-64 overflow-auto p-2">
                          {selectedSkills.length > 0 && (
                            <div className="mb-2">
                              <div className="px-1 py-1 text-[11px] text-muted-foreground">Selected</div>
                              <div className="flex flex-wrap gap-2 px-1 pb-1">
                                {selectedSkills.map((it) => (
                                  <button
                                    type="button"
                                    key={'sel-'+it}
                                    className="text-xs px-2 py-1 rounded-md border bg-emerald-50 border-emerald-300 text-emerald-700"
                                    onMouseDown={(e)=>{ e.preventDefault(); toggleSkill(it); }}
                                  >
                                    {it}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {Object.entries(templates.skillsCategories).map(([cat, items]) => {
                            const remaining = items.filter((it) => !selectedSkills.includes(it));
                            if (remaining.length === 0) return null;
                            return (
                              <div key={cat} className="mb-2">
                                <div className="px-1 py-1 text-[11px] text-muted-foreground">{cat}</div>
                                <div className="flex flex-wrap gap-2 px-1 pb-1">
                                  {remaining.map((it) => (
                                    <button
                                      type="button"
                                      key={cat+it}
                                      className="text-xs px-2 py-1 rounded-md border hover:bg-muted"
                                      onMouseDown={(e)=>{ e.preventDefault(); toggleSkill(it); }}
                                    >
                                      {it}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <Input
                        className="pr-10"
                        id="location"
                        placeholder="City, Country"
                        {...register("location")}
                        onFocus={()=>setLocationMenu(true)}
                        onBlur={()=>setTimeout(()=>setLocationMenu(false), 120)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-2 text-muted-foreground hover:text-foreground"
                        aria-label="Location templates"
                        onMouseDown={(e)=>{ e.preventDefault(); setLocationMenu((v)=>!v); }}
                      >
                        <Sparkles className="h-5 w-5" />
                      </button>
                      {locationMenu && (
                        <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-sm max-h-56 overflow-auto">
                          {(() => {
                            const current = (watch('location') || '').trim();
                            const first = templates.locations.filter((l) => current && l === current);
                            const rest = templates.locations.filter((l) => !current || l !== current);
                            return [...first, ...rest].map((loc) => (
                              <button
                                type="button"
                                key={loc}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                onMouseDown={(e)=>{ e.preventDefault(); setValue('location', loc); setLocationMenu(false);} }
                              >
                                {loc}
                              </button>
                            ));
                          })()}
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                            onMouseDown={(e)=>{ e.preventDefault(); (document.getElementById('location') as HTMLInputElement | null)?.focus(); setLocationMenu(false);} }
                          >
                            Add Custom Location ✍️
                          </button>
                        </div>
                      )}
                    </div>
                    {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-3 items-end mt-3">
                  <div className="grid gap-2">
                    <Label htmlFor="exp">Years of Experience</Label>
                    <Input id="exp" type="number" min={0} max={isStudent ? 5 : 60} {...register("experienceYears", { valueAsNumber: true })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company">Current Company</Label>
                    <Input id="company" placeholder="Optional" {...register("currentCompany")} />
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    {isStudent ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserPlus className="h-4 w-4" />
                        If you have 4+ years of experience, mentor other students.
                      </div>
                    ) : mentorEligible ? (
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

                {/* Mentorship consent dialog for students with 4+ years */}
                <Dialog open={mentorDialogOpen} onOpenChange={setMentorDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mentor other students?</DialogTitle>
                      <DialogDescription>
                        You have 4+ years of experience. Would you like to make your profile available for mentorship requests from students?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setMentorDialogOpen(false)}>Not now</Button>
                      <Button
                        onClick={() => {
                          setMentorDialogOpen(false);
                          toast.success('Thanks! We will surface your profile for mentorship (you can opt out later).');
                        }}
                      >
                        Yes, I want to mentor
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

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
            <Card>
              <CardHeader>
                <CardTitle>Password & Email</CardTitle>
                <CardDescription>Secure your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-4">
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
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Badges you earned and how to unlock others</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-hidden space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium">Achieved</div>
                    <div className="text-xs text-muted-foreground">{badgeCatalog.filter(b=>earnedSetLC.has(b.key.toLowerCase())).length} unlocked</div>
                  </div>
                  <TooltipProvider>
                    {categoriesOrder.map((cat) => {
                      const earnedInCat = badgeCatalog.filter(b => b.category === cat && earnedSetLC.has(b.key.toLowerCase()));
                      if (earnedInCat.length === 0) return null;
                      return (
                        <div key={`ach_${cat}`} className="mb-4">
                          <div className="text-xs font-semibold text-muted-foreground mb-2">{cat}</div>
                          {cat !== 'Alumni' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {earnedInCat.map((b) => (
                                <Tooltip key={b.key}>
                                  <TooltipTrigger asChild>
                                    <div className="p-4 rounded-xl border text-center bg-background">
                                      <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center ${b.color}`}>
                                        <b.Icon className="h-7 w-7" />
                                      </div>
                                      <div className="mt-2 text-sm font-medium">{b.label}</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent><p>{b.hint}</p></TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          ) : (
                            alumniSubOrder.map((sub) => {
                              const earnedInSub = earnedInCat.filter(b => b.subcategory === sub);
                              if (earnedInSub.length === 0) return null;
                              return (
                                <div key={`ach_${cat}_${sub}`} className="mb-3">
                                  <div className="text-[11px] font-medium text-muted-foreground mb-1">{sub}</div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {earnedInSub.map((b) => (
                                      <Tooltip key={b.key}>
                                        <TooltipTrigger asChild>
                                          <div className="p-4 rounded-xl border text-center bg-background">
                                            <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center ${b.color}`}>
                                              <b.Icon className="h-7 w-7" />
                                            </div>
                                            <div className="mt-2 text-sm font-medium">{b.label}</div>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{b.hint}</p></TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                    {badgeCatalog.filter(b => earnedSetLC.has(b.key.toLowerCase())).length === 0 && (
                      <div className="text-sm text-muted-foreground">No badges yet. Start by completing your profile or making your first post!</div>
                    )}
                  </TooltipProvider>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium">Locked</div>
                    <div className="text-xs text-muted-foreground">{badgeCatalog.filter(b=>!earnedSetLC.has(b.key.toLowerCase())).length} remaining</div>
                  </div>
                  <TooltipProvider>
                    {categoriesOrder.map((cat) => {
                      const lockedInCat = badgeCatalog.filter(b => b.category === cat && !earnedSetLC.has(b.key.toLowerCase()));
                      if (lockedInCat.length === 0) return null;
                      return (
                        <div key={`lock_${cat}`} className="mb-4">
                          <div className="text-xs font-semibold text-muted-foreground mb-2">{cat}</div>
                          {cat !== 'Alumni' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {lockedInCat.map((b) => (
                                <Tooltip key={b.key}>
                                  <TooltipTrigger asChild>
                                    <div className="p-4 rounded-xl border text-center bg-muted/40">
                                      <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center border border-dashed text-muted-foreground`}>
                                        <b.Icon className="h-7 w-7 opacity-60" />
                                      </div>
                                      <div className="mt-2 text-sm font-medium opacity-70">{b.label}</div>
                                      {(() => { const act = badgeActions[b.key.toLowerCase()]; return act && act.tab ? (
                                        <Button size="sm" className="mt-2 h-7 px-2 text-[11px] bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]"
                                          onClick={() => navigate({ pathname: '/', search: `?tab=${act.tab}` })}
                                        >{act.label}</Button>
                                      ) : null; })()}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent><p>{b.hint}</p></TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          ) : (
                            alumniSubOrder.map((sub) => {
                              const lockedInSub = lockedInCat.filter(b => b.subcategory === sub);
                              if (lockedInSub.length === 0) return null;
                              return (
                                <div key={`lock_${cat}_${sub}`} className="mb-3">
                                  <div className="text-[11px] font-medium text-muted-foreground mb-1">{sub}</div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {lockedInSub.map((b) => (
                                      <Tooltip key={b.key}>
                                        <TooltipTrigger asChild>
                                          <div className="p-4 rounded-xl border text-center bg-muted/40">
                                            <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center border border-dashed text-muted-foreground`}>
                                              <b.Icon className="h-7 w-7 opacity-60" />
                                            </div>
                                            <div className="mt-2 text-sm font-medium opacity-70">{b.label}</div>
                                            {(() => { const act = badgeActions[b.key.toLowerCase()]; return act && act.tab ? (
                                              <Button size="sm" className="mt-2 h-7 px-2 text-[11px] bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]"
                                                onClick={() => navigate({ pathname: '/', search: `?tab=${act.tab}` })}
                                              >{act.label}</Button>
                                            ) : null; })()}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{b.hint}</p></TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

    </div>
  );
}

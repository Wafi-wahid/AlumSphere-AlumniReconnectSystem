 
import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, collectionGroup, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc, query, where, limit } from "firebase/firestore";
import { Users, Calendar, Briefcase, Heart, Star, Eye, ThumbsUp, Target, BarChart3, Sparkles, Flame, Trophy, Bolt, BadgeCheck, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface HomePageProps {
  user: any;
  onNavigate: (section: string) => void;
}

export function HomePage({ user, onNavigate }: HomePageProps) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [referOpen, setReferOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<{ title: string; company: string } | null>(null);
  const [applicant, setApplicant] = useState({ name: user?.name || "", email: user?.email || "", resume: "" });
  const [invites, setInvites] = useState<any[]>([]);
  const [connTab, setConnTab] = useState<'requests'|'accepted'|'sent'>('requests');
  const [connRequests, setConnRequests] = useState<Array<{ id: string; name: string; avatar?: string; createdAt?: any }>>([]);
  const [connAccepted, setConnAccepted] = useState<Array<{ id: string; name: string; avatar?: string; connectedAt?: any }>>([]);
  const [connSent, setConnSent] = useState<Array<{ id: string; name: string; avatar?: string; createdAt?: any }>>([]);
  const [connLoading, setConnLoading] = useState(true);
  const [milestones, setMilestones] = useState<Array<{ id: string; title: string; done: boolean }>>([
    { id: 'internship', title: 'Get internship', done: false },
    { id: 'skill', title: 'Learn new skill', done: false },
    { id: 'product', title: 'Create product', done: false },
  ]);
  const [analytics, setAnalytics] = useState<{ profileViews7d: number; mentorshipRequested: number; mentorshipAccepted: number; postLikes7d: number; likesDaily7d: number[] }>({
    profileViews7d: 0,
    mentorshipRequested: 0,
    mentorshipAccepted: 0,
    postLikes7d: 0,
    likesDaily7d: [],
  });
  const [streakDays] = useState<number>(3);
  const [level] = useState<number>(1);
  const [missions, setMissions] = useState<Array<{ id: 'connect'|'apply'|'request'; title: string; progress: number }>>([
    { id: 'connect', title: "Connect with alumni's", progress: 0 },
    { id: 'apply', title: 'Apply to job', progress: 0 },
    { id: 'request', title: 'Request mentorship', progress: 0 },
  ]);
  const [points, setPoints] = useState<number>(0);
  const [connectCount, setConnectCount] = useState<number>(0);
  const [applyCount, setApplyCount] = useState<number>(0);
  const [mentorshipCount, setMentorshipCount] = useState<number>(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [profileComplete, setProfileComplete] = useState<boolean>(false);
  const [hasPost, setHasPost] = useState<boolean>(false);
  const [hasLiked, setHasLiked] = useState<boolean>(false);

  const getNewBadges = (kind: 'connect'|'apply'|'request', count: number, current: string[]) => {
    const newOnes: string[] = [];
    if (kind === 'connect') {
      if (count >= 5 && !current.includes('Connect Level 1')) newOnes.push('Connect Level 1');
      if (count >= 10 && !current.includes('Master')) newOnes.push('Master');
      if (count >= 15 && !current.includes('Loable')) newOnes.push('Loable');
      if (count >= 20 && !current.includes('Networking Expert')) newOnes.push('Networking Expert');
    } else if (kind === 'apply') {
      if (count >= 5 && !current.includes('Applicant Lv1')) newOnes.push('Applicant Lv1');
      if (count >= 10 && !current.includes('Applicant Master')) newOnes.push('Applicant Master');
      if (count >= 15 && !current.includes('Applicant Pro')) newOnes.push('Applicant Pro');
      if (count >= 20 && !current.includes('Career Climber')) newOnes.push('Career Climber');
    } else if (kind === 'request') {
      if (count >= 5 && !current.includes('Mentor Seeker Lv1')) newOnes.push('Mentor Seeker Lv1');
      if (count >= 10 && !current.includes('Mentorship Master')) newOnes.push('Mentorship Master');
      if (count >= 15 && !current.includes('Community Favorite')) newOnes.push('Community Favorite');
      if (count >= 20 && !current.includes('Guidance Guru')) newOnes.push('Guidance Guru');
    }
    return newOnes;
  };

  const persistGamification = async (payload?: Partial<{ points: number; connectCount: number; applyCount: number; mentorshipCount: number; earnedBadges: string[] }>) => {
    if (!user?.id) return;
    const body = {
      points,
      connectCount,
      applyCount,
      mentorshipCount,
      earnedBadges,
      ...payload,
    };
    await setDoc(doc(db, 'users', user.id, 'gamification', 'summary'), body, { merge: true });
  };

  const persistMissions = async (nextMissions: Array<{ id: 'connect'|'apply'|'request'; title: string; progress: number }>) => {
    if (!user?.id) return;
    const today = new Date();
    const key = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    await setDoc(doc(db, 'users', user.id, 'missions', 'today'), { dateKey: key, missions: nextMissions }, { merge: true });
  };

  const handleMissionAction = async (id: 'connect'|'apply'|'request') => {
    const nextPoints = points + 10;
    const nextMissions = missions.map((m) => m.id === id ? { ...m, progress: Math.min(100, m.progress + 50) } : m);
    let nConnect = connectCount, nApply = applyCount, nReq = mentorshipCount;
    if (id === 'connect') nConnect += 1;
    if (id === 'apply') nApply += 1;
    if (id === 'request') nReq += 1;
    const newBadges = getNewBadges(id, id === 'connect' ? nConnect : id === 'apply' ? nApply : nReq, earnedBadges);
    const allBadges = newBadges.length ? [...earnedBadges, ...newBadges] : earnedBadges;
    if (newBadges.length) toast.success(`Badge unlocked: ${newBadges.join(', ')}`);
    setPoints(nextPoints);
    setMissions(nextMissions);
    setConnectCount(nConnect);
    setApplyCount(nApply);
    setMentorshipCount(nReq);
    setEarnedBadges(allBadges);
    await persistGamification({ points: nextPoints, connectCount: nConnect, applyCount: nApply, mentorshipCount: nReq, earnedBadges: allBadges });
    await persistMissions(nextMissions);
    if (id === 'connect') onNavigate('directory');
    if (id === 'apply') onNavigate('careers');
    if (id === 'request') onNavigate('mentorship');
  };

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(doc(db, 'users', user.id, 'gamification', 'summary'), (snap) => {
      const d = snap.data() as any;
      if (!d) return;
      if (typeof d.points === 'number') setPoints(d.points);
      if (typeof d.connectCount === 'number') setConnectCount(d.connectCount);
      if (typeof d.applyCount === 'number') setApplyCount(d.applyCount);
      if (typeof d.mentorshipCount === 'number') setMentorshipCount(d.mentorshipCount);
      if (Array.isArray(d.earnedBadges)) setEarnedBadges(d.earnedBadges);
    });
    return () => unsub();
  }, [user?.id]);

  // Core badge sources: First Post and First Like
  useEffect(() => {
    if (!user?.id) return;
    const q1 = query(collection(db, 'posts'), where('authorId', '==', user.id), limit(1));
    const unsub1 = onSnapshot(q1, (snap) => setHasPost(!snap.empty));
    const q2 = query(collection(db, 'posts'), where('likes', 'array-contains', user.id), limit(1));
    const unsub2 = onSnapshot(q2, (snap) => setHasLiked(!snap.empty));
    return () => { unsub1(); unsub2(); };
  }, [user?.id]);

  // Ensure core badges are persisted (Login always; plus Profile Complete, First Post, First Like)
  useEffect(() => {
    if (!user?.id) return;
    const core = ['Login', ...(profileComplete ? ['Profile Complete'] : []), ...(hasPost ? ['First Post'] : []), ...(hasLiked ? ['First Like'] : [])];
    const merged = Array.from(new Set([...(earnedBadges || []), ...core]));
    if (merged.length !== earnedBadges.length) {
      setEarnedBadges(merged);
      persistGamification({ earnedBadges: merged });
    }
  }, [user?.id, profileComplete, hasPost, hasLiked]);

  // Profile completeness (from profiles/{id}); falls back to heuristic if field missing
  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(doc(db, 'profiles', user.id), (snap) => {
      if (!snap.exists()) { setProfileComplete(false); return; }
      const d = snap.data() as any;
      const marked = d?.complete === true;
      const heuristic = !!(d?.name && d?.bio && Array.isArray(d?.skills) && d.skills.length > 0);
      setProfileComplete(Boolean(marked || heuristic));
    });
    return () => unsub();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const ref = doc(db, 'users', user.id, 'missions', 'today');
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        const d = snap.data() as any;
        if (Array.isArray(d.missions)) setMissions(d.missions);
      } else {
        const init = [
          { id: 'connect', title: "Connect with alumni's", progress: 0 },
          { id: 'apply', title: 'Apply to job', progress: 0 },
          { id: 'request', title: 'Request mentorship', progress: 0 },
        ] as Array<{ id: 'connect'|'apply'|'request'; title: string; progress: number }>;
        await persistMissions(init);
      }
    });
    return () => unsub();
  }, [user?.id]);
  const featuredMentors: Array<{ id: string; name: string; role: string; avatar?: string; online?: boolean }> = [
    { id: 'm1', name: 'Maria Khan', role: 'PM, Microsoft', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face', online: true },
    { id: 'm2', name: 'Ali Raza', role: 'SWE, Google', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=face', online: false },
    { id: 'm3', name: 'Sana Iqbal', role: 'Data Scientist, Netflix', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face', online: true },
  ];
  const recentViewers: Array<{ id: string; name: string; avatar?: string }> = [
    { id: 'v1', name: 'Hina', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=face' },
    { id: 'v2', name: 'Zaid', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
    { id: 'v3', name: 'Noor', avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=80&h=80&fit=crop&crop=face' },
  ];
  useEffect(() => {
    if (!user?.id) return;
    if (user?.role === 'alumni') return; // skip invites subscription for alumni
    const unsub = onSnapshot(collectionGroup(db, 'invites'), async (snap) => {
      const mine = snap.docs.filter((d) => (d.data() as any)?.userId === user.id);
      const items: any[] = [];
      for (const d of mine) {
        const parentEventRef = d.ref.parent.parent;
        if (!parentEventRef) continue;
        const ev = await getDoc(parentEventRef);
        if (!ev.exists()) continue;
        const e = ev.data() as any;
        items.push({
          id: d.id,
          invitePath: d.ref.path,
          eventId: parentEventRef.id,
          title: e.title,
          date: e.date,
          time: e.time,
          location: e.location,
          category: e.category,
          description: e.description,
          responses: (d.data() as any)?.responses || [],
        });
      }
      setInvites(items);
    });
    return () => unsub();
  }, [user?.id]);

  // Connections subscriptions (requests/accepted/sent)
  useEffect(() => {
    if (!user?.id) return;
    setConnLoading(true);
    const unsubReq = onSnapshot(collection(db, 'connections', user.id, 'requests'), (snap) => {
      setConnRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setConnLoading(false);
    });
    const unsubAcc = onSnapshot(collection(db, 'connections', user.id, 'accepted'), (snap) => {
      setConnAccepted(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setConnLoading(false);
    });
    const unsubSent = onSnapshot(collection(db, 'connections', user.id, 'sent'), (snap) => {
      setConnSent(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setConnLoading(false);
    });
    return () => { unsubReq(); unsubAcc(); unsubSent(); };
  }, [user?.id]);

  // Subscribe to user analytics summary
  useEffect(() => {
    if (!user?.id) return;
    const ref = doc(db, 'users', user.id, 'analytics', 'summary');
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data() as any;
      if (d) {
        setAnalytics({
          profileViews7d: Number(d.profileViews7d || 0),
          mentorshipRequested: Number(d.mentorshipRequested || 0),
          mentorshipAccepted: Number(d.mentorshipAccepted || 0),
          postLikes7d: Number(d.postLikes7d || 0),
          likesDaily7d: Array.isArray(d.likesDaily7d) ? d.likesDaily7d.map((n: any) => Number(n||0)) : [],
        });
      } else {
        setAnalytics({ profileViews7d: 0, mentorshipRequested: 0, mentorshipAccepted: 0, postLikes7d: 0, likesDaily7d: [] });
      }
    });
    return () => unsub();
  }, [user?.id]);

  // Fallback: if analytics summary doesn't exist or has no likes, derive from user's posts
  useEffect(() => {
    if (!user?.id) return;
    const q = query(collection(db, 'posts'), where('authorId', '==', user.id));
    const unsub = onSnapshot(q, (snap) => {
      const posts = snap.docs.map((d) => d.data() as any);
      const totalLikes = posts.reduce((sum, p) => sum + (Array.isArray(p.likes) ? p.likes.length : 0), 0);
      // Only override when analytics is empty so we don't fight the real summary if it exists
      if ((analytics.postLikes7d ?? 0) === 0 && (!analytics.likesDaily7d || analytics.likesDaily7d.length === 0)) {
        if (totalLikes > 0) {
          setAnalytics((prev) => ({
            ...prev,
            postLikes7d: totalLikes,
            likesDaily7d: [totalLikes], // minimal series so chart renders a point
          }));
        }
      }
    });
    return () => unsub();
  }, [user?.id, analytics.postLikes7d, analytics.likesDaily7d]);

  // Mock data for sections below

  const upcomingEvents = [
    { title: 'Tech Alumni Mixer', date: 'Nov 10', time: '6:00 PM', type: 'Networking', attendees: 42 },
    { title: 'AI in Industry', date: 'Nov 15', time: '5:00 PM', type: 'Talk', attendees: 120 },
  ];

  const featuredOpportunities = [
    { title: 'Frontend Engineer', company: 'Stripe', type: 'Full-time', postedBy: 'Linda', applicants: 23 },
    { title: 'Data Scientist', company: 'Netflix', type: 'Full-time', postedBy: 'Zain', applicants: 14 },
  ];

  const connections = [
    { name: 'Ali Raza', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=face', role: 'SWE, Google' },
    { name: 'Maria Khan', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face', role: 'PM, Microsoft' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const greetEmoji = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
  // Likes chart helpers (always 7 points; left-pad zeros)
  const likesData = (() => {
    const base = (analytics.likesDaily7d && analytics.likesDaily7d.length
      ? analytics.likesDaily7d.slice(-7)
      : (analytics.postLikes7d ? [analytics.postLikes7d] : [])
    );
    const arr = base.slice(-7);
    while (arr.length < 7) arr.unshift(0);
    return arr;
  })();
  const likeLabels = useMemo(() => {
    const labels: string[] = [];
    const today = new Date();
    for (let i = likesData.length - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - (likesData.length - 1 - i));
      labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
    }
    return labels;
  }, [likesData]);
  const likesChart = useMemo(() => {
    const w = 640, h = 180, p = 24;
    const n = Math.max(likesData.length, 1);
    const maxV = Math.max(1, ...likesData);
    const stepX = n > 1 ? (w - 2 * p) / (n - 1) : 0;
    const toY = (v: number) => p + (h - 2 * p) * (1 - v / maxV);
    const pts = likesData.map((v, i) => [p + i * stepX, toY(v)] as [number, number]);
    const path = pts.map((pt, i) => (i === 0 ? `M ${pt[0]} ${pt[1]}` : `L ${pt[0]} ${pt[1]}`)).join(' ');
    const area = `${path} L ${p + (n - 1) * stepX} ${h - p} L ${p} ${h - p} Z`;
    return { w, h, p, maxV, pts, path, area };
  }, [likesData]);
  return (
    <div className="space-y-6">

      {/* Hero Welcome */}
      <Card className="overflow-hidden rounded-3xl shadow-strong border-0 bg-gradient-to-br from-[#0b1b3a] to-[#1d4ed8]">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          
          <div className="lg:col-span-2 p-6 md:p-10 text-white">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Level {level} • {streakDays} day streak <Flame className="h-3.5 w-3.5 text-orange-300" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{greeting}, {user?.name || 'Student'} {greetEmoji}</h1>
              <p className="text-white/80">Build your career roadmap with mentors, opportunities, and daily missions.</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center gap-2 md:gap-3">
              <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => onNavigate('mentorship')}>
                Find a Mentor
              </Button>
              <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => onNavigate('events')}>
                Browse Events
              </Button>
              <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => onNavigate('careers')}>
                Explore Jobs
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_40%)]" />
            <div className="relative h-full w-full p-6 md:p-8 flex items-center justify-center">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-6 text-white text-center max-w-xs">
                <div className="text-sm opacity-90">Unlock matches</div>
                <div className="text-lg font-semibold">Complete your profile to get better opportunities</div>
                <Button className="mt-3 h-9 bg-white text-[#0b1b3a] hover:bg-white/90 w-full" onClick={() => onNavigate('profile')}>Complete Profile</Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong min-h-[260px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bolt className="h-5 w-5" /> Today's Mission</CardTitle>
            <CardDescription>Complete tasks to level up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="text-muted-foreground">Points</div>
              <div className="font-semibold">{points}</div>
            </div>
            <div className="space-y-3 max-h-60 overflow-auto pr-1">
              {missions.map(m => (
                <div key={m.id} className="p-3 rounded-xl border flex items-center justify-between gap-3 hover:bg-accent/50 transition-colors">
                  <div className="text-sm font-medium">{m.title}</div>
                  <div className="flex-1 max-w-[280px]">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-700" style={{ width: `${m.progress}%` }} />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleMissionAction(m.id)}>
                    {m.id === 'connect' ? 'Connect' : m.id === 'apply' ? 'Apply' : 'Request'}
                  </Button>
                </div>
              ))}
            </div>
            {earnedBadges.length > 0 && (
              <div className="pt-2 border-t mt-2">
                <div className="text-xs text-muted-foreground mb-2">Badges earned</div>
                <div className="flex flex-wrap gap-2">
                  {earnedBadges.map((b) => (
                    <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
                  ))}
                </div>
              </div>
            )}
            <Button className="w-full bg-[#1e3a8a] text-white hover:bg-[#60a5fa]">Start Mission</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Ali got an internship through Echo Alum Link 🎉</div>
                  <div className="text-xs text-muted-foreground">Get guidance from mentors and land your first role.</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong border bg-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Featured Mentors</CardTitle>
              <CardDescription>Top mentor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {featuredMentors.slice(0,3).map(m => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={m.avatar} />
                        <AvatarFallback>{m.name[0]}</AvatarFallback>
                      </Avatar>
                      {m.online ? <span className="absolute -right-0 -bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" /> : null}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.role}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onNavigate('mentorship')}>Request</Button>
                </div>
              ))}
              <Button className="w-full mt-1" variant="outline" onClick={() => onNavigate('mentorship')}>See more</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Your Activity Analytics</CardTitle>
            <CardDescription>See your posts analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {likesData.length === 0 ? (
              <div className="group p-4 rounded-xl border bg-muted/30 text-sm transition-colors hover:bg-accent/30">
                <div className="flex items-center justify-between">
                  <span>No data to show</span>
                  <span className="text-xs text-muted-foreground">Hover for tips</span>
                </div>
                <div className="mt-2 text-muted-foreground">Post Likes (last 7 days)</div>
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                  <div>No likes in the last 7 days yet. Share something with your network to get the conversation going.</div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => onNavigate('community')}>Create Post</Button>
                    <Button size="sm" variant="outline" onClick={() => onNavigate('community')}>Browse Feed</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Post Likes (last 7 days)</span>
                  <span className="text-muted-foreground">Total: {analytics.postLikes7d}</span>
                </div>
                <div className="relative w-full">
                  <svg viewBox={`0 0 ${likesChart.w} ${likesChart.h}`} className="w-full h-48">
                    <defs>
                      <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(30,58,138)" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="rgb(96,165,250)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={likesChart.area} fill="url(#likesGrad)" />
                    <path d={likesChart.path} fill="none" stroke="rgb(30,58,138)" strokeWidth="2" />
                    {likesChart.pts.map(([x,y], i) => (
                      <circle key={i} cx={x} cy={y} r="3" fill="rgb(30,58,138)" />
                    ))}
                    {likesChart.pts.map(([x], i) => (
                      <text key={`t-${i}`} x={x} y={likesChart.h - likesChart.p + 14} textAnchor="middle" fontSize="10" fill="#6b7280">
                        {likeLabels[i]}
                      </text>
                    ))}
                    <text x={likesChart.w - likesChart.p} y={likesChart.p - 6} textAnchor="end" fontSize="10" fill="#6b7280">
                      Peak {Math.max(1, ...likesData)}
                    </text>
                  </svg>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Badges</CardTitle>
            <CardDescription>Your achievements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Login */}
              <div className="flex flex-col items-center">
                <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-[#1e3a8a]/15 to-[#60a5fa]/20 flex items-center justify-center ring-1 ring-[#1e3a8a]/20">
                  <Trophy className="h-6 w-6 text-[#1e3a8a]" />
                </div>
                <div className="mt-2 text-center text-sm font-medium">Login</div>
                <div className="mt-1 px-2 py-0.5 rounded-full text-xs bg-background/70 dark:bg-white/10 text-foreground/80 ring-1 ring-border">Unlocked</div>
              </div>
              {/* Profile Complete */}
              {profileComplete && (
                <div className="flex flex-col items-center">
                  <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-200 to-blue-100 flex items-center justify-center ring-1 ring-blue-300/50">
                    <BadgeCheck className="h-6 w-6 text-blue-700" />
                  </div>
                  <div className="mt-2 text-center text-sm font-medium">Profile Complete</div>
                  <div className="mt-1 px-2 py-0.5 rounded-full text-xs bg-background/70 dark:bg-white/10 text-foreground/80 ring-1 ring-border">Unlocked</div>
                </div>
              )}
              {/* First Post */}
              {hasPost && (
                <div className="flex flex-col items-center">
                  <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-100 flex items-center justify-center ring-1 ring-emerald-300/50">
                    <FileText className="h-6 w-6 text-emerald-700" />
                  </div>
                  <div className="mt-2 text-center text-sm font-medium">First Post</div>
                  <div className="mt-1 px-2 py-0.5 rounded-full text-xs bg-background/70 dark:bg-white/10 text-foreground/80 ring-1 ring-border">Unlocked</div>
                </div>
              )}
              {/* First Like */}
              {hasLiked && (
                <div className="flex flex-col items-center">
                  <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-rose-200 to-rose-100 flex items-center justify-center ring-1 ring-rose-300/50">
                    <Heart className="h-6 w-6 text-rose-600" />
                  </div>
                  <div className="mt-2 text-center text-sm font-medium">First Like</div>
                  <div className="mt-1 px-2 py-0.5 rounded-full text-xs bg-background/70 dark:bg-white/10 text-foreground/80 ring-1 ring-border">Unlocked</div>
                </div>
              )}
              {/* Earned badges */}
              {earnedBadges.filter(b => !['Login','Profile Complete','First Post','First Like'].includes(b)).map((b) => (
                <div key={b} className="flex flex-col items-center">
                  <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-violet-200 to-fuchsia-100 flex items-center justify-center ring-1 ring-violet-300/50">
                    <span className="text-xl">🏅</span>
                  </div>
                  <div className="mt-2 text-center text-sm font-medium truncate max-w-[120px]" title={b}>{b}</div>
                  <div className="mt-1 px-2 py-0.5 rounded-full text-xs bg-background/70 dark:bg-white/10 text-foreground/80 ring-1 ring-border">Unlocked</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground mb-2">Earn more</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => onNavigate('directory')}>Connect with alumni</Button>
                <Button size="sm" variant="outline" onClick={() => onNavigate('careers')}>Apply to jobs</Button>
                <Button size="sm" variant="outline" onClick={() => onNavigate('mentorship')}>Request mentorship</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              Don't miss these networking opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.date} at {event.time}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {event.attendees} attending
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="brand"
                  className="transition-transform hover:scale-[1.03] text-white border-0 bg-[#1e3a8a] hover:bg-[#60a5fa]"
                  onClick={() => toast.success(`Spot reserved for ${event.title}`)}
                >
                  RSVP
                </Button>
              </div>
            ))}
            <Button variant="soft" className="w-full transition-transform hover:scale-[1.02] text-white border-0 bg-[#1e3a8a] hover:bg-[#60a5fa]" onClick={() => onNavigate("events")}> 
              View All Events
            </Button>
          </CardContent>
        </Card>

        {/* Featured Job Opportunities */}
        <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Featured Opportunities
            </CardTitle>
            <CardDescription>
              Jobs posted by your alumni network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {featuredOpportunities.map((job, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {job.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Posted by {job.postedBy}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.applicants} applicants
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="brand"
                    className="transition-transform hover:scale-[1.03] text-white border-0 bg-[#1e3a8a] hover:bg-[#60a5fa]"
                    onClick={() => {
                      setSelectedJob({ title: job.title, company: job.company });
                      setApplyOpen(true);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="soft"
                    className="transition-transform hover:scale-[1.02] text-white border-0 bg-[#1e3a8a] hover:bg-[#60a5fa]"
                    onClick={() => {
                      setSelectedJob({ title: job.title, company: job.company });
                      setReferOpen(true);
                    }}
                  >
                    Refer
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="brand" className="w-full transition-transform hover:scale-[1.02] text-white border-0 bg-[#1e3a8a] hover:bg-[#60a5fa]" onClick={() => onNavigate("careers")}> 
              View All Jobs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>{selectedJob?.company}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={applicant.name} onChange={(e) => setApplicant({ ...applicant, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={applicant.email} onChange={(e) => setApplicant({ ...applicant, email: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resume">Resume URL</Label>
              <Input id="resume" placeholder="https://..." value={applicant.resume} onChange={(e) => setApplicant({ ...applicant, resume: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="soft" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button
              variant="brand"
              onClick={() => {
                toast.success(`Application submitted for ${selectedJob?.title}`);
                setApplyOpen(false);
                setApplicant({ name: user?.name || "", email: user?.email || "", resume: "" });
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refer Dialog */}
      <Dialog open={referOpen} onOpenChange={setReferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refer for {selectedJob?.title}</DialogTitle>
            <DialogDescription>Select a connection to refer</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-auto pr-2">
            {connections.map((c) => (
              <div key={c.name} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/60">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={c.avatar} />
                  <AvatarFallback>{c.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.role}</div>
                </div>
                <Button size="sm" variant="soft" onClick={() => { toast.success(`Referred ${c.name}`); setReferOpen(false); }}>Refer</Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="soft" onClick={() => setReferOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
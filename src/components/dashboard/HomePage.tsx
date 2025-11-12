 
import { useState, useEffect, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, collectionGroup, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc, query, where, limit, arrayUnion } from "firebase/firestore";
import { Users, Calendar, Briefcase, Heart, Star, Eye, ThumbsUp, Target, BarChart3, Sparkles, Flame, Trophy, Bolt, BadgeCheck, FileText, LogIn, Send, MessageSquare, Rocket, Megaphone, Mic2, Link as LinkIcon } from "lucide-react";
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
  const [analytics, setAnalytics] = useState<{ profileViews7d: number; mentorshipRequested: number; mentorshipAccepted: number; postLikes7d: number; likesDaily7d: number[]; connections7d?: number; connectionsDaily7d?: number[]; applied7d?: number; appliedDaily7d?: number[]; events7d?: number; eventsDaily7d?: number[] }>({
    profileViews7d: 0,
    mentorshipRequested: 0,
    mentorshipAccepted: 0,
    postLikes7d: 0,
    likesDaily7d: [],
    connections7d: 0,
    connectionsDaily7d: [],
    applied7d: 0,
    appliedDaily7d: [],
    events7d: 0,
    eventsDaily7d: [],
  });
  const [streakDays] = useState<number>(3);
  const [level] = useState<number>(1);
  const [missions, setMissions] = useState<Array<{ id: 'connect'|'apply'|'request'|'host'|'community'|'event'; title: string; progress: number }>>([
    { id: 'connect', title: 'Connect with alumni', progress: 0 },
    { id: 'apply', title: 'Apply to job', progress: 0 },
    { id: 'request', title: 'Request mentorship', progress: 0 },
    { id: 'community', title: 'Engage in community', progress: 0 },
    { id: 'event', title: 'Register for event', progress: 0 },
  ]);
  const [points, setPoints] = useState<number>(0);
  const [connectCount, setConnectCount] = useState<number>(0);
  const [applyCount, setApplyCount] = useState<number>(0);
  const [mentorshipCount, setMentorshipCount] = useState<number>(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [badgesLoaded, setBadgesLoaded] = useState(false);
  const [profileComplete, setProfileComplete] = useState<boolean>(false);
  const [hasPost, setHasPost] = useState<boolean>(false);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [showAllMissions, setShowAllMissions] = useState(false);
  // Rising-edge trackers
  const prevConnectRef = useRef<number>(0);
  const prevApplyRef = useRef<number>(0);
  const prevMentorRef = useRef<number>(0);
  const prevHasPostRef = useRef<boolean>(false);
  const prevHasLikeRef = useRef<boolean>(false);
  const summaryHydratedRef = useRef<boolean>(false);
  const postsHydratedRef = useRef<boolean>(false);
  // Layout: lock Today's Mission height to match right column stack
  const rightColRef = useRef<HTMLDivElement | null>(null);
  const [rightColHeight, setRightColHeight] = useState<number>(0);
  useEffect(() => {
    const el = rightColRef.current;
    if (!el) return;
    const measure = () => {
      try { setRightColHeight(el.getBoundingClientRect().height); } catch {}
    };
    measure();
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => measure());
      ro.observe(el);
    } catch {}
    const onWin = () => measure();
    window.addEventListener('resize', onWin);
    const id = window.setInterval(measure, 800); // fallback in case of dynamic content
    return () => {
      if (ro) try { ro.disconnect(); } catch {}
      window.removeEventListener('resize', onWin);
      window.clearInterval(id);
    };
  }, [user?.role]);

  const getNewBadges = (kind: 'connect'|'apply'|'request'|'host', count: number, current: string[]) => {
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
    } else if (kind === 'host') {
      // no-op badge progression for hosting events (not defined yet)
    }
    return newOnes;
  };

  // Realtime task progress from live signals
  const taskProgress = (id: 'connect'|'apply'|'request'|'host'|'community'|'event') => {
    switch (id) {
      case 'connect': return connectCount > 0 ? 100 : 0;
      case 'apply': return applyCount > 0 ? 100 : 0;
      case 'request': return mentorshipCount > 0 ? 100 : 0;
      case 'community': return (hasPost || hasLiked) ? 100 : 0;
      case 'event': return 0; // TODO: set to 100 when RSVP implemented
      case 'host': return 0;
      default: return 0;
    }
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

  const persistMissions = async (nextMissions: Array<{ id: 'connect'|'apply'|'request'|'host'|'community'|'event'; title: string; progress: number }>) => {
    if (!user?.id) return;
    const today = new Date();
    const key = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    await setDoc(doc(db, 'users', user.id, 'missions', 'today'), { dateKey: key, missions: nextMissions }, { merge: true });
  };

  const handleMissionAction = async (id: 'connect'|'apply'|'request'|'host'|'community'|'event') => {
    // Only navigate. Points and badges are awarded by the actual feature flows (backend/listeners)
    if (id === 'connect') onNavigate('directory');
    if (id === 'apply') onNavigate('careers');
    if (id === 'request') onNavigate('mentorship');
    if (id === 'host' || id === 'event') onNavigate('events');
    if (id === 'community') onNavigate('community');
  };

  useEffect(() => {
    if (!user?.id) return;
    const aliasMap: Record<string, string> = {
      'connect level 1': 'First Connection',
      'loable': 'Network Builder',
      'mentor seeker lv1': 'Requested Mentorship',
      'community favorite': 'Community Helper',
    };
    const catalogKeys = [
      'Login','Profile Complete','First Post','First Like','First Connection','First Message','Community Helper','Rising Star','Networking Expert',
      'Attended Event','Mentorship Requested','Applied for Job','Applicant Lv1','Applicant Master','Applicant Pro','Career Climber',
      'Event Leader','Event Goer','7-Day Active','Verified Alumni','Legacy Member','Mentor','Super Mentor','Network Builder','First Job','Manager','Founder','Employer Referral','Event Speaker'
    ].map(k => k.toLowerCase());
    const toCanonical = (raw: string): string => {
      const lc = raw.toLowerCase();
      const aliased = aliasMap[lc] || raw;
      const lc2 = aliased.toLowerCase();
      // if it's one of our known keys (case-insensitive), return the properly cased label from list; else return aliased raw
      const idx = catalogKeys.indexOf(lc2);
      if (idx >= 0) return [
        'Login','Profile Complete','First Post','First Like','First Connection','First Message','Community Helper','Rising Star','Networking Expert',
        'Attended Event','Mentorship Requested','Applied for Job','Applicant Lv1','Applicant Master','Applicant Pro','Career Climber',
        'Event Leader','Event Goer','7-Day Active','Verified Alumni','Legacy Member','Mentor','Super Mentor','Network Builder','First Job','Manager','Founder','Employer Referral','Event Speaker'
      ][idx];
      return aliased;
    };
    const unsub = onSnapshot(doc(db, 'users', user.id, 'gamification', 'summary'), (snap) => {
      const d = snap.data() as any;
      if (!d) return;
      if (typeof d.points === 'number') setPoints(d.points);
      if (typeof d.connectCount === 'number') setConnectCount(d.connectCount);
      if (typeof d.applyCount === 'number') setApplyCount(d.applyCount);
      if (typeof d.mentorshipCount === 'number') setMentorshipCount(d.mentorshipCount);
      if (Array.isArray(d.earnedBadges)) {
        const normalized: string[] = Array.from(new Set<string>(d.earnedBadges.map((x: any) => toCanonical(String(x)))));
        setEarnedBadges(normalized);
        setBadgesLoaded(true);
      }
      // Hydrate rising-edge baselines on first snapshot to avoid awarding on reload
      if (!summaryHydratedRef.current) {
        prevConnectRef.current = Number(d?.connectCount || 0);
        prevApplyRef.current = Number(d?.applyCount || 0);
        prevMentorRef.current = Number(d?.mentorshipCount || 0);
        summaryHydratedRef.current = true;
      }
    });
    return () => unsub();
  }, [user?.id]);

  // Award +10 points on real increases (connections/applications/mentorship)
  useEffect(() => {
    if (!user?.id || !badgesLoaded || !summaryHydratedRef.current) return;
    const updates: Array<Promise<any>> = [];
    const sumRef = doc(db, 'users', user.id, 'gamification', 'summary');
    // Connection accepted: on increase
    if (connectCount > (prevConnectRef.current || 0)) {
      updates.push(setDoc(sumRef, { points: (points || 0) + 10 }, { merge: true }));
      prevConnectRef.current = connectCount;
    } else if (connectCount !== (prevConnectRef.current || 0)) {
      prevConnectRef.current = connectCount;
    }
    // Applications
    if (applyCount > (prevApplyRef.current || 0)) {
      updates.push(setDoc(sumRef, { points: (points || 0) + 10 }, { merge: true }));
      prevApplyRef.current = applyCount;
    } else if (applyCount !== (prevApplyRef.current || 0)) {
      prevApplyRef.current = applyCount;
    }
    // Mentorship
    if (mentorshipCount > (prevMentorRef.current || 0)) {
      updates.push(setDoc(sumRef, { points: (points || 0) + 10 }, { merge: true }));
      prevMentorRef.current = mentorshipCount;
    } else if (mentorshipCount !== (prevMentorRef.current || 0)) {
      prevMentorRef.current = mentorshipCount;
    }
    if (updates.length) { Promise.allSettled(updates); }
  }, [user?.id, badgesLoaded, connectCount, applyCount, mentorshipCount]);

  // Award +10 points on first post/first like (rising edge) and ensure badge present
  useEffect(() => {
    if (!user?.id || !badgesLoaded) return;
    const sumRef = doc(db, 'users', user.id, 'gamification', 'summary');
    const toRun: Array<Promise<any>> = [];
    if (postsHydratedRef.current && hasPost && !prevHasPostRef.current) {
      toRun.push(setDoc(sumRef, { points: (points || 0) + 10, earnedBadges: arrayUnion('First Post') }, { merge: true }));
    }
    if (postsHydratedRef.current && hasLiked && !prevHasLikeRef.current) {
      toRun.push(setDoc(sumRef, { points: (points || 0) + 10, earnedBadges: arrayUnion('First Like') }, { merge: true }));
    }
    prevHasPostRef.current = hasPost;
    prevHasLikeRef.current = hasLiked;
    if (toRun.length) { Promise.allSettled(toRun); }
  }, [user?.id, badgesLoaded, hasPost, hasLiked]);

  // Core badge sources: First Post and First Like
  useEffect(() => {
    if (!user?.id) return;
    if (!badgesLoaded) return; // wait until server badges have loaded to avoid clobbering
    const q1 = query(collection(db, 'posts'), where('authorId', '==', user.id), limit(1));
    const unsub1 = onSnapshot(q1, (snap) => {
      const v = !snap.empty;
      setHasPost(v);
      if (!postsHydratedRef.current) {
        prevHasPostRef.current = v;
      }
    });
    const q2 = query(collection(db, 'posts'), where('likes', 'array-contains', user.id), limit(1));
    const unsub2 = onSnapshot(q2, (snap) => {
      const v = !snap.empty;
      setHasLiked(v);
      if (!postsHydratedRef.current) {
        prevHasLikeRef.current = v;
        postsHydratedRef.current = true;
      }
    });
    return () => { unsub1(); unsub2(); };
  }, [user?.id, badgesLoaded]);

  // Ensure core badges are persisted (Login always; plus Profile Complete, First Post, First Like)
  useEffect(() => {
    if (!user?.id) return;
    if (!badgesLoaded) return; // ensure we have server state first
    const core = ['Login', ...(profileComplete ? ['Profile Complete'] : []), ...(hasPost ? ['First Post'] : []), ...(hasLiked ? ['First Like'] : [])];
    const merged = Array.from(new Set([...(earnedBadges || []), ...core]));
    if (merged.length !== earnedBadges.length) {
      setEarnedBadges(merged);
      persistGamification({ earnedBadges: merged });
    }
  }, [user?.id, badgesLoaded, profileComplete, hasPost, hasLiked]);

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
    if (user?.role !== 'student') return;
    if (profileComplete) { setShowProfilePrompt(false); return; }
    try {
      const dismissed = localStorage.getItem('student_profile_prompt_dismissed');
      setShowProfilePrompt(dismissed !== '1');
    } catch {
      setShowProfilePrompt(true);
    }
  }, [user?.id, user?.role, profileComplete]);

  useEffect(() => {
    if (!user?.id) return;
    const ref = doc(db, 'users', user.id, 'missions', 'today');
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        const d = snap.data() as any;
        if (Array.isArray(d.missions)) setMissions(d.missions);
      } else {
        const init = (
          user?.role === 'alumni'
            ? [
                { id: 'apply', title: 'Post a job', progress: 0 },
                { id: 'connect', title: 'Connect with students', progress: 0 },
                { id: 'request', title: 'Mentor students', progress: 0 },
                { id: 'host', title: 'Host events', progress: 0 },
              ]
            : [
                { id: 'connect', title: "Connect with alumni's", progress: 0 },
                { id: 'apply', title: 'Apply to job', progress: 0 },
                { id: 'request', title: 'Request mentorship', progress: 0 },
              ]
        ) as Array<{ id: 'connect'|'apply'|'request'|'host'; title: string; progress: number }>;
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
          connections7d: Number(d.connections7d || 0),
          connectionsDaily7d: Array.isArray(d.connectionsDaily7d) ? d.connectionsDaily7d.map((n: any) => Number(n||0)) : [],
          applied7d: Number(d.applied7d || 0),
          appliedDaily7d: Array.isArray(d.appliedDaily7d) ? d.appliedDaily7d.map((n: any) => Number(n||0)) : [],
          events7d: Number(d.events7d || 0),
          eventsDaily7d: Array.isArray(d.eventsDaily7d) ? d.eventsDaily7d.map((n: any) => Number(n||0)) : [],
        });
      } else {
        setAnalytics({ profileViews7d: 0, mentorshipRequested: 0, mentorshipAccepted: 0, postLikes7d: 0, likesDaily7d: [], connections7d: 0, connectionsDaily7d: [], applied7d: 0, appliedDaily7d: [], events7d: 0, eventsDaily7d: [] });
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
  // Build weekday buckets in Mon-Sun order for horizontal bar chart
  const weekOrder = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const weekColors: Record<string, string> = {
    Mon: '#f59e0b', // amber-500
    Tue: '#3b82f6', // blue-500
    Wed: '#10b981', // emerald-500
    Thu: '#ef4444', // red-500
    Fri: '#8b5cf6', // violet-500
    Sat: '#ec4899', // pink-500
    Sun: '#06b6d4', // cyan-500
  };
  // Per-metric solid color palette (applied to bars)
  const metricColors: Record<Metric, string> = {
    likes: '#3b82f6', // blue
    connections: '#8b5cf6', // violet
    applied: '#f59e0b', // amber
    events: '#10b981', // emerald
  };
  // Last 7 days weekday labels (Mon..Sun order when bucketed by label)
  const weekdayLabels7 = useMemo(() => {
    const labels: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
    }
    return labels;
  }, []);
  // Chart animation + hover tooltip
  const [chartAnim, setChartAnim] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => setChartAnim(true), 50);
    return () => window.clearTimeout(t);
  }, []);
  // Analytics metric selector
  type Metric = 'likes' | 'connections' | 'applied' | 'events';
  const [metric, setMetric] = useState<Metric>('likes');
  const METRIC_OPTIONS: Array<{ key: Metric; label: string }> = [
    { key: 'likes', label: 'Post Likes' },
    { key: 'connections', label: 'Connections' },
    { key: 'applied', label: 'Jobs Applied' },
    { key: 'events', label: 'Events Attended' },
  ];
  const metricLabel = METRIC_OPTIONS.reduce((acc, m) => { acc[m.key] = m.label; return acc; }, {} as Record<Metric, string>);
  const selectedTotal = useMemo(() => {
    switch (metric) {
      case 'likes': return analytics.postLikes7d || 0;
      case 'connections': return Number(analytics.connections7d || 0);
      case 'applied': return Number(analytics.applied7d || 0);
      case 'events': return Number(analytics.events7d || 0);
      default: return 0;
    }
  }, [metric, analytics.postLikes7d, analytics.connections7d, analytics.applied7d, analytics.events7d]);
  // Selected metric 7-day series in Mon..Sun order for charting
  const selectedSeries = useMemo(() => {
    const map: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    if (metric === 'likes') {
      likeLabels.forEach((lbl, i) => {
        const key = (lbl || '').slice(0, 3);
        if (key in map) map[key] += Number(likesData[i] || 0);
      });
    } else {
      const src = metric === 'connections' ? (analytics.connectionsDaily7d || [])
        : metric === 'applied' ? (analytics.appliedDaily7d || [])
        : metric === 'events' ? (analytics.eventsDaily7d || [])
        : [];
      const base = src.slice(-7);
      while (base.length < 7) base.unshift(0);
      weekdayLabels7.forEach((lbl, i) => {
        const key = (lbl || '').slice(0, 3);
        if (key in map) map[key] += Number(base[i] || 0);
      });
    }
    return weekOrder.map((d) => map[d as keyof typeof map] || 0);
  }, [metric, likeLabels, likesData, analytics.connectionsDaily7d, analytics.appliedDaily7d, analytics.eventsDaily7d, weekdayLabels7]);

  const weekdayBars = useMemo(() => {
    return weekOrder.map((d, idx) => ({ day: d, value: selectedSeries[idx] || 0 }));
  }, [selectedSeries]);
  return (
    <div className="space-y-6">

      {user?.role === 'student' && !profileComplete && showProfilePrompt && (
        <Card className="border-2 border-amber-300/50 bg-amber-50/60 dark:bg-amber-900/10">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Complete your profile</CardTitle>
              <CardDescription>Set up your profile to get personalized recommendations.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowProfilePrompt(false);
                  try { localStorage.setItem('student_profile_prompt_dismissed', '1'); } catch {}
                }}
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]"
                onClick={() => onNavigate('profile')}
              >
                Set profile
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

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
              {user?.role === 'alumni' ? (
                <>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => onNavigate('mentorship')}>
                    Mentor Students
                  </Button>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => onNavigate('careers')}>
                    Post a Job
                  </Button>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => onNavigate('community')}>
                    Engage with Community
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => onNavigate('mentorship')}>
                    Find a Mentor
                  </Button>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => onNavigate('events')}>
                    Browse Events
                  </Button>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => onNavigate('careers')}>
                    Explore Jobs
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_40%)]" />
            <div className="relative h-full w-full p-6 md:p-8 flex items-center justify-center">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-6 text-white text-center max-w-xs">
                <div className="text-sm opacity-90">Unlock matches</div>
                <div className="text-lg font-semibold">Complete your profile to get better opportunities</div>
                <Button className="mt-3 h-9 bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a] w-full" onClick={() => onNavigate('profile')}>Complete Profile</Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong min-h-[260px] flex flex-col overflow-hidden border border-[#0D47A1]" style={{ height: rightColHeight ? rightColHeight : undefined }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2"><Bolt className="h-5 w-5" /> Today's Mission</CardTitle>
            <CardDescription>Complete tasks to get badges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-5 pt-0 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm md:text-base text-muted-foreground">
                Total Points: <span className="text-foreground font-semibold text-base md:text-lg">{points}</span>
              </div>
            </div>
            <div className={`space-y-3 flex-1 min-h-0 overflow-auto pr-1`}>
              {(showAllMissions ? missions : missions.slice(0,3)).map((m, idx) => (
                <div key={m.id} className="p-3 rounded-xl border flex items-center justify-between gap-3 hover:bg-accent/50 transition-colors">
                  <div className="text-sm font-medium truncate flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px]">{(showAllMissions ? missions : missions.slice(0,3)).findIndex(x=>x.id===m.id) + 1}</span>
                    {user?.role === 'alumni'
                      ? (m.id === 'apply' ? 'Post a job'
                        : m.id === 'connect' ? 'Connect with students'
                        : m.id === 'request' ? 'Mentor students'
                        : m.id === 'host' ? 'Host events'
                        : m.id === 'community' ? 'Engage in community'
                        : m.id === 'event' ? 'Register for event'
                        : m.title)
                      : (m.id === 'connect' ? 'Connect with alumni'
                        : m.id === 'apply' ? 'Apply to job'
                        : m.id === 'request' ? 'Request mentorship'
                        : m.id === 'community' ? 'Engage in community'
                        : m.id === 'event' ? 'Register for event'
                        : m.title)}
                  </div>
                  <div className="flex-1 max-w-[280px]">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-700" style={{ width: `${taskProgress(m.id)}%` }} />
                    </div>
                  </div>
                  <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]" onClick={() => handleMissionAction(m.id)}>
                    {m.id === 'apply' ? (user?.role === 'alumni' ? 'Post' : 'Apply')
                      : m.id === 'request' ? (user?.role === 'alumni' ? 'Mentor' : 'Request')
                      : (m.id === 'host' ? 'Host' : m.id === 'community' ? 'Open' : m.id === 'event' ? 'RSVP' : 'Connect')}
                  </Button>
                </div>
              ))}
              {!showAllMissions && missions.length > 3 && (
                <div className="flex justify-center">
                  <Button size="sm" variant="outline" onClick={() => setShowAllMissions(true)}>Load more</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6" ref={rightColRef}>
          <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong h-24 md:h-20 border border-[#0D47A1]">
            <CardContent className="px-4 py-3 h-full flex items-center">
              {user?.role === 'alumni' ? (
                <div className="flex items-center gap-3 w-full">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="text-sm font-semibold">Share your story on Wall of Fame</div>
                    {/* subtitle removed per requirement */}
                  </div>
                  <Button size="sm" className="shrink-0" onClick={() => onNavigate('wallOfFame')}>Share</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="text-sm font-semibold">Ali got an internship through AlumSpere 🎉</div>
                  </div>
                  <Button size="sm" className="shrink-0" onClick={() => onNavigate('wallOfFame')}>Read story</Button>
                </div>
              )}
            </CardContent>
          </Card>
          {user?.role === 'alumni' ? (
            <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong border border-[#0D47A1] bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Mentorship Requests</CardTitle>
                <CardDescription>Students seeking your guidance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {connRequests.slice(0,3).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No requests yet. Turn on availability and get discovered.</div>
                ) : connRequests.slice(0,3).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={r.avatar} />
                        <AvatarFallback>{(r.name||'S')[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{r.name || 'Student'}</div>
                        <div className="text-xs text-muted-foreground">Mentorship request</div>
                      </div>
                    </div>
                    <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]" onClick={() => onNavigate('mentorship')}>View</Button>
                  </div>
                ))}
                <Button
                  className="w-full mt-1 transition-transform hover:scale-[1.02] text-white border-0 bg-[#0D47A1] hover:bg-[#0B3C89]"
                  onClick={() => onNavigate('mentorship')}
                >
                  See more
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong border border-[#0D47A1] bg-background">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Featured Mentors</CardTitle>
                <CardDescription>Top mentor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-5 pt-3">
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
                      onClick={() => onNavigate('mentorship')}
                    >
                      Request
                    </Button>
                  </div>
                ))}
                <Button
                  className="w-full mt-1 text-white border-0 bg-[#0D47A1] hover:bg-[#0B3C89]"
                  onClick={() => onNavigate('mentorship')}
                >
                  See more
                </Button>
              </CardContent>
            </Card>
          )}
          
        </div>
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong border border-[#0D47A1]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Your Activity Analytics</CardTitle>
            <CardDescription>See your activity analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {(selectedSeries.length === 0 || selectedSeries.every(v => (v || 0) === 0)) ? (
              <div className="group p-4 rounded-xl border bg-muted/30 text-sm transition-colors hover:bg-accent/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Metric:</span>
                    <select
                      className="h-8 rounded-md border px-2 text-xs bg-background border-yellow-500 text-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      value={metric}
                      onChange={(e) => setMetric(e.target.value as any)}
                    >
                      {METRIC_OPTIONS.map(opt => (
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-muted-foreground">Total: {selectedTotal}</div>
                </div>
                <div className="mt-2 text-muted-foreground">{metricLabel[metric]} (last 7 days)</div>
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                  <div>No data to show for {metricLabel[metric]} yet. Complete related actions to see trends.</div>
                  <div className="mt-3 flex gap-2">
                    {metric === 'likes' && (<><Button size="sm" onClick={() => onNavigate('community')}>Create Post</Button><Button size="sm" variant="outline" onClick={() => onNavigate('community')}>Browse Feed</Button></>)}
                    {metric === 'connections' && (<><Button size="sm" onClick={() => onNavigate('directory')}>Find Alumni</Button></>)}
                    {metric === 'applied' && (<><Button size="sm" onClick={() => onNavigate('careers')}>Explore Jobs</Button></>)}
                    {metric === 'events' && (<><Button size="sm" onClick={() => onNavigate('events')}>Browse Events</Button></>)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Metric:</span>
                    <select
                      className="h-8 rounded-md border px-2 text-xs bg-background"
                      value={metric}
                      onChange={(e) => setMetric(e.target.value as any)}
                    >
                      <option value="likes">Post Likes</option>
                      <option value="connections">Connections</option>
                      <option value="applied">Jobs Applied</option>
                      <option value="events">Events Attended</option>
                    </select>
                  </div>
                  <span className="text-muted-foreground">Total: {selectedTotal}</span>
                </div>
                <div className="relative w-full">
                  {(() => {
                    const w = 700; const h = 260; const p = 36; // bottom padding for x labels
                    const leftPad = 36; // left padding for y ticks
                    const barGap = 10; const barW = (w - leftPad - 12 - barGap * (weekdayBars.length - 1)) / weekdayBars.length;
                    const ticks = [0,5,10,15,20];
                    const maxData = Math.max(1, ...weekdayBars.map(b => b.value));
                    const maxV = Math.max(20, Math.ceil(maxData / 5) * 5);
                    const toY = (v: number) => (h - p) - (v / maxV) * (h - p - 12);
                    return (
                      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56">
                        {/* Y-axis grid and ticks */}
                        {ticks.map((val) => {
                          const y = toY(val);
                          return (
                            <g key={val}>
                              <line x1={leftPad} x2={w - 12} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                              <text x={leftPad - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#6b7280">
                                {val}
                              </text>
                            </g>
                          );
                        })}
                        {/* Bars and X labels with animation and tooltip */}
                        {weekdayBars.map((b, i) => {
                          const x = leftPad + i * (barW + barGap);
                          const yTop = toY(b.value);
                          const fullH = (h - p) - yTop;
                          const animH = chartAnim ? fullH : 0;
                          const animY = chartAnim ? yTop : (h - p);
                          const isHover = hoverIdx === i;
                          return (
                            <g key={b.day} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
                              <rect
                                x={x}
                                y={animY}
                                width={barW}
                                height={Math.max(0, animH)}
                                rx={6}
                                fill={metricColors[metric]}
                                opacity={isHover ? 1 : 0.9}
                                stroke={isHover ? '#111827' : 'none'}
                                strokeWidth={isHover ? 1 : 0}
                              >
                                <animate attributeName="y" from={h - p} to={yTop} dur="400ms" fill="freeze" begin={chartAnim ? `${i * 50}ms` : 'indefinite'} />
                                <animate attributeName="height" from={0} to={Math.max(0, fullH)} dur="400ms" fill="freeze" begin={chartAnim ? `${i * 50}ms` : 'indefinite'} />
                              </rect>
                              <text x={x + barW / 2} y={h - p + 14} textAnchor="middle" fontSize="11" fill="#374151">
                                {b.day}
                              </text>
                              <text x={x + barW / 2} y={yTop - 4} textAnchor="middle" fontSize="10" fill="#6b7280">
                                {b.value}
                              </text>
                              {isHover && (
                                <g>
                                  <rect x={x + barW / 2 - 22} y={yTop - 28} rx={4} width={44} height={18} fill="#111827" opacity={0.9} />
                                  <text x={x + barW / 2} y={yTop - 16} textAnchor="middle" fontSize="10" fill="#ffffff">{b.value}</text>
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong border border-[#0D47A1]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Badges</CardTitle>
            <CardDescription>Your achievements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {(() => {
              const catalog: Array<{ key: string; label: string; Icon: any; color: string }> = [
                { key: 'Login', label: 'Login', Icon: LogIn, color: 'bg-yellow-400 text-yellow-900' },
                { key: 'Profile Complete', label: 'Complete Profile', Icon: Trophy, color: 'bg-emerald-400 text-emerald-900' },
                { key: 'First Post', label: 'First Post', Icon: FileText, color: 'bg-emerald-400 text-emerald-900' },
                { key: 'First Like', label: 'First Like', Icon: Heart, color: 'bg-pink-400 text-pink-900' },
                { key: 'First Connection', label: 'First Connection', Icon: Users, color: 'bg-violet-400 text-violet-900' },
                { key: 'First Message', label: 'First Message', Icon: MessageSquare, color: 'bg-indigo-400 text-indigo-900' },
                { key: 'Community Helper', label: 'Community Helper', Icon: Star, color: 'bg-lime-400 text-lime-900' },
                { key: 'Rising Star', label: 'Rising Star', Icon: ThumbsUp, color: 'bg-pink-400 text-pink-900' },
                { key: 'Attended Event', label: 'Attended Event', Icon: Calendar, color: 'bg-cyan-400 text-cyan-900' },
                { key: 'Mentorship Requested', label: 'Requested Mentorship', Icon: Users, color: 'bg-amber-400 text-amber-900' },
                { key: 'Applied for Job', label: 'Applied for Job', Icon: Briefcase, color: 'bg-orange-400 text-orange-900' },
                { key: 'Event Leader', label: 'Event Leader', Icon: Megaphone, color: 'bg-purple-400 text-purple-900' },
                { key: 'Event Goer', label: 'Event Goer', Icon: Calendar, color: 'bg-cyan-400 text-cyan-900' },
                { key: '7-Day Active', label: '7-Day Active', Icon: Rocket, color: 'bg-red-400 text-red-900' },
                { key: 'Verified Alumni', label: 'Verified Alumni', Icon: BadgeCheck, color: 'bg-blue-400 text-blue-900' },
                { key: 'Network Builder', label: 'Network Builder', Icon: LinkIcon, color: 'bg-violet-400 text-violet-900' },
              ];
              const allEarned = (earnedBadges || []).map(k => String(k));
              const lc = new Set(allEarned.map(k => k.toLowerCase()));
              const list = catalog.filter(c => lc.has(c.key.toLowerCase()));
              const matchedLC = new Set(list.map(c => c.key.toLowerCase()));
              const remaining = allEarned.filter(k => !matchedLC.has(k.toLowerCase()));
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(list.length + remaining.length) === 0 ? (
                    <div className="col-span-full text-sm text-muted-foreground">No badges yet. Start your journey from the Missions above.</div>
                  ) : list.map((b) => (
                    <div key={b.key} className="flex flex-col items-center">
                      <div className={`h-16 w-16 rounded-full flex items-center justify-center ${b.color}`}>
                        <b.Icon className="h-7 w-7" />
                      </div>
                      <div className="mt-2 text-center text-sm font-medium truncate max-w-[120px]" title={b.label}>{b.label}</div>
                      <div className="mt-1 px-2 py-0.5 rounded-full text-xs bg-background/70 dark:bg-white/10 text-foreground/80 ring-1 ring-border">Unlocked</div>
                    </div>
                  ))}
                  {remaining.map((label) => (
                    <div key={`gen_${label}`} className="flex flex-col items-center">
                      <div className={`h-16 w-16 rounded-full flex items-center justify-center bg-muted text-muted-foreground`}>
                        <Trophy className="h-7 w-7" />
                      </div>
                      <div className="mt-2 text-center text-sm font-medium truncate max-w-[120px]" title={label}>{label}</div>
                      <div className="mt-1 px-2 py-0.5 rounded-full text-xs bg-background/70 dark:bg-white/10 text-foreground/80 ring-1 ring-border">Unlocked</div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground mb-2">Earn more</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]" onClick={() => onNavigate('directory')}>Connect with alumni</Button>
                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]" onClick={() => onNavigate('careers')}>Apply to jobs</Button>
                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]" onClick={() => onNavigate('mentorship')}>Request mentorship</Button>
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
                <div className="w-32 flex justify-end">
                  <Button
                    size="sm"
                    className="transition-transform hover:scale-[1.03] text-[#0b1b3a] bg-yellow-500 hover:bg-yellow-400 border-0"
                    onClick={() => toast.success(`Spot reserved for ${event.title}`)}
                  >
                    RSVP
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="brand"
              className="w-full transition-transform hover:scale-[1.02] text-white border-0 bg-[#0D47A1] hover:bg-[#0B3C89]"
              onClick={() => onNavigate('events')}
            >
              View all events
            </Button>
          </CardContent>
        </Card>

        {/* Featured Job Opportunities */}
        <Card className="rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong border border-[#0D47A1] bg-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {user?.role === 'alumni' ? 'Your Posted Roles' : 'Featured Opportunities'}
            </CardTitle>
            <CardDescription>
              {user?.role === 'alumni' ? 'Jobs you posted' : 'Jobs posted by your alumni network'}
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
                </div>
                <div className="w-32 flex justify-end gap-2">
                  {user?.role === 'alumni' ? (
                    <Button
                      size="sm"
                      className="transition-transform hover:scale-[1.03] text-[#0b1b3a] bg-yellow-500 hover:bg-yellow-400 border-0"
                      onClick={() => onNavigate('careers')}
                    >
                      Manage
                    </Button>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            ))}
            <Button variant="brand" className="w-full transition-transform hover:scale-[1.02] text-white border-0 bg-[#0D47A1] hover:bg-[#0B3C89]" onClick={() => onNavigate("careers")}> 
              {user?.role === 'alumni' ? 'Manage jobs' : 'View All Jobs'}
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
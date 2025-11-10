import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Calendar, Heart, Star, Clock, Video, MessageCircle, CheckCircle, Building2, Briefcase, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/store/auth";
import { MentorshipAPI } from "@/lib/mentorshipApi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mockMentors = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
    company: "Google",
    role: "Senior Software Engineer",
    expertise: ["Career Guidance", "Technical Skills", "Interview Prep"],
    rating: 4.9,
    sessions: 23,
    available: true,
    nextSlot: "Tomorrow, 2:00 PM",
    batch: "2017",
    location: "Singapore"
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    company: "Microsoft",
    role: "Product Manager",
    expertise: ["Product Strategy", "Leadership", "Career Transition"],
    rating: 4.8,
    sessions: 17,
    available: true,
    nextSlot: "Dec 30, 10:00 AM",
    batch: "2015",
    location: "Kuala Lumpur"
  }
];

const mockRequests = [
  {
    id: 1,
    mentor: "Sarah Johnson",
    topic: "Interview Preparation",
    status: "pending",
    requestedDate: "Dec 28, 2024",
    preferredTime: "2:00 PM - 3:00 PM"
  }
];

const mockSessions = [
  {
    id: 1,
    mentor: "Dr. Emily Davis",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    topic: "Career Planning",
    date: "Jan 5, 2025",
    time: "3:00 PM - 4:00 PM",
    status: "upcoming"
  }
];

export function MentorshipPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [skill, setSkill] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [department, setDepartment] = useState<string>("all");
  const [ratingMin, setRatingMin] = useState<string>("all");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentTab, setCurrentTab] = useState<'find'|'requests'|'sessions'>('find');
  const searchSectionRef = useRef<HTMLDivElement | null>(null);

  const handleFindMentorsClick = () => {
    setCurrentTab('find');
    // smooth scroll to search bar
    requestAnimationFrame(() => {
      searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Load my mentorship requests (as student or mentor)
  useEffect(() => {
    const load = async () => {
      if (currentTab !== 'requests') return;
      try {
        setLoadingReq(true);
        const as: 'student'|'mentor' = (user?.role === 'alumni' ? 'mentor' : 'student');
        const res = await MentorshipAPI.listMyRequests(as);
        setMyRequests(Array.isArray(res.items) ? res.items : []);
      } catch {
        setMyRequests([]);
      } finally {
        setLoadingReq(false);
      }
    };
    load();
  }, [currentTab, user?.id]);

  const handleOpenFiltersClick = () => {
    setCurrentTab('find');
    setShowFilters(true);
    requestAnimationFrame(() => {
      searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSkill('all');
    setRoleFilter('all');
    setCompanyFilter('');
    setDepartment('all');
    setRatingMin('all');
  };
  const [selectedMentor, setSelectedMentor] = useState<any | null>(null);
  const [requestForm, setRequestForm] = useState({
    topic: "",
    topicCustom: "",
    sessionType: "",
    outline: "",
    preferredDate: "",
    preferredTime: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [usersCol, setUsersCol] = useState<any[]>([]);
  const [profilesCol, setProfilesCol] = useState<Record<string, any>>({});
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingReq, setLoadingReq] = useState<boolean>(false);

  const handleRequestMentorship = (mentor: any) => {
    setSelectedMentor(mentor);
    setShowRequestDialog(true);
  };

  const handleOpenProfile = (mentor: any) => {
    setSelectedMentor(mentor);
    setShowProfileDialog(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedMentor) return;
    if (!user || user.role !== 'student') {
      toast({ title: "Psst", description: "Only students can request mentors. Alumni, take a bow! 🎓", duration: 4000 });
      return;
    }
    const topicValue = requestForm.topic === 'other' ? requestForm.topicCustom.trim() : requestForm.topic;
    const isValid = topicValue && requestForm.sessionType && requestForm.preferredDate && requestForm.preferredTime;
    if (!isValid) {
      toast({ title: "Form incomplete", description: "Please fill all required fields. Even mentors can’t read minds… yet 😄", duration: 4000 });
      return;
    }
    try {
      setSubmitting(true);
      const preferredDateTime = new Date(`${requestForm.preferredDate}T${requestForm.preferredTime}:00`).toISOString();
      const allowedDurations = ['30m','45m','60m'] as const;
      const isAllowed = (v: string): v is typeof allowedDurations[number] => (allowedDurations as readonly string[]).includes(v);
      const apiSessionType = isAllowed(requestForm.sessionType) ? requestForm.sessionType : '45m';
      const extraPref = !isAllowed(requestForm.sessionType) && requestForm.sessionType ? ` [preference: ${requestForm.sessionType}]` : '';
      const notesCombined = `${requestForm.outline || ''}${extraPref}`.trim();
      await MentorshipAPI.createRequest({
        mentorId: String(selectedMentor.id),
        topic: topicValue,
        sessionType: apiSessionType,
        preferredDateTime,
        notes: notesCombined || undefined,
      });
      toast({ title: "Request Sent 🚀", description: "Your mentor will get back to you soon." });
      setShowRequestDialog(false);
      setRequestForm({ topic: "", topicCustom: "", sessionType: "", outline: "", preferredDate: "", preferredTime: "" });
    } catch (e: any) {
      toast({ title: "Couldn’t send request", description: e?.message || "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // Load mentors from Firestore (mirror of alumni directory: users + profiles)
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsersCol(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    const unsubProfiles = onSnapshot(collection(db, 'profiles'), (snap) => {
      const obj: Record<string, any> = {};
      snap.docs.forEach((d) => { obj[d.id] = { id: d.id, ...(d.data() as any) }; });
      setProfilesCol(obj);
    });
    return () => { unsubUsers(); unsubProfiles(); };
  }, []);

  // Track my sent and accepted connections (requires Firebase auth; skip if not signed in)
  useEffect(() => {
    if (!user?.id) return;
    const auth = getAuth();
    if (!auth.currentUser) return; // avoid permission-denied when not signed in
    const unsubSent = onSnapshot(
      collection(db, 'connections', String(user.id), 'sent'),
      (snap) => setSentRequests(new Set(snap.docs.map((d) => d.id))),
      () => {/* ignore permission errors */}
    );
    const unsubAccepted = onSnapshot(
      collection(db, 'connections', String(user.id), 'accepted'),
      (snap) => setAcceptedIds(new Set(snap.docs.map((d) => d.id))),
      () => {/* ignore permission errors */}
    );
    return () => { unsubSent(); unsubAccepted(); };
  }, [user?.id]);

  const mentors = useMemo(() => {
    // Index profiles by id (exclude current students)
    const profIndex: Record<string, any> = {};
    Object.values(profilesCol)
      .filter((p: any) => p && p.isCurrentStudent !== true)
      .forEach((p: any) => { profIndex[String(p.id)] = p; });

    // Helper to coalesce non-empty values
    const co = (...vals: any[]) => {
      for (const v of vals) {
        if (Array.isArray(v) && v.length) return v;
        if (typeof v === 'string' && v.trim()) return v.trim();
        if (v && typeof v !== 'object') return v;
      }
      return undefined;
    };

    // Use ONLY system users that are alumni AND eligible (mentorEligible or mentorshipEligible), including nested users.mongo.*
    const isEligible = (val: any) => val === true || val === 'true' || val === 1;
    const alumniUsers = usersCol.filter((u: any) => {
      const roleLower = String(u.role || u.rawRole || u?.mongo?.role || '').toLowerCase();
      const eligible = isEligible(u?.mentorEligible) || isEligible(u?.mentorshipEligible) || isEligible(u?.mongo?.mentorEligible) || isEligible(u?.mongo?.mentorshipEligible);
      return roleLower === 'alumni' && eligible;
    });
    const ids = new Set<string>(alumniUsers.map((u) => String(u.id)));

    // Build merged list per ID using non-empty fallbacks (user first, then profile)
    const list: any[] = [];
    ids.forEach((id) => {
      const u = alumniUsers.find((x) => String(x.id) === id) || {};
      const p = profIndex[id] || {};
      const name = co(u.name, u.fullName, u?.mongo?.name, p.name, 'Unknown');
      const avatar = co(u.avatar, u.photoUrl, u?.mongo?.avatar, p.avatar, '');
      const role = co(u.position, u.roleTitle, u.title, u?.mongo?.position, u?.mongo?.roleTitle, u?.mongo?.title, p.role, p.title, '');
      const company = co(u.currentCompany, u.company, u?.mongo?.currentCompany, u?.mongo?.company, p.company, p.currentCompany, '');
      const department = co(u.program, u.department, u?.mongo?.program, u?.mongo?.department, p.department, p.program, '');
      const batch = co(u.gradYear, u.batchYear, u.graduationYear, u?.mongo?.gradYear, u?.mongo?.batchYear, u?.mongo?.graduationYear, p.graduationYear, p.gradYear, '');
      const location = co(u.location, u?.mongo?.location, p.location, '');
      const toArr = (val: any): string[] => {
        if (!val && val !== 0) return [];
        if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
        if (typeof val === 'string') return String(val).split(',').map((s) => s.trim()).filter(Boolean);
        return [];
      };
      const skillsU = [
        ...toArr((u as any).skills),
        ...toArr((u as any).expertise),
        ...toArr((u as any).topSkills),
        ...toArr((u as any)?.mongo?.skills),
        ...toArr((u as any)?.mongo?.expertise),
        ...toArr((u as any)?.mongo?.topSkills),
      ];
      const skillsP = [
        ...toArr((p as any).skills),
        ...toArr((p as any).expertise),
        ...toArr((p as any).topSkills),
      ];
      const mergedSkills = [...skillsU, ...skillsP]
        .map((s) => String(s))
        .filter(Boolean);
      const dedup = Array.from(new Set(mergedSkills));
      const expertise = dedup.slice(0, 12);
      list.push({ id, name, avatar, role, company, department, batch: String(batch || ''), location, expertise });
    });

    // Filter out entries with no basic identity
    return list.filter((m) => m.name && (m.role || m.company || m.expertise?.length));
  }, [usersCol, profilesCol]);

  const filteredMentors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const source = Array.isArray(mentors) ? mentors : [];
    return source.filter((m: any) => {
      const matchesSearch =
        !q ||
        String(m.name||'').toLowerCase().includes(q) ||
        String(m.company||'').toLowerCase().includes(q) ||
        String(m.role||m.title||'').toLowerCase().includes(q) ||
        (Array.isArray(m.expertise) ? (m.expertise).some((e: string) => String(e).toLowerCase().includes(q)) : false);
      const expertise = (Array.isArray(m.expertise) ? (m.expertise).map((e: string)=>String(e).toLowerCase()) : []);
      const matchesSkill = skill === 'all' || expertise.includes(skill.toLowerCase());
      const matchesRole = roleFilter === 'all' || String(m.role||m.title||'').toLowerCase().includes(roleFilter.toLowerCase());
      const matchesCompany = !companyFilter || String(m.company||'').toLowerCase().includes(companyFilter.toLowerCase());
      const dep = String(m.program||m.department||'').toLowerCase();
      const matchesDept = department === 'all' || dep.includes(department.toLowerCase());
      return matchesSearch && matchesSkill && matchesRole && matchesCompany && matchesDept;
    });
  }, [searchQuery, skill, roleFilter, companyFilter, department, mentors]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden rounded-3xl shadow-strong border-0 bg-gradient-to-br from-[#0b1b3a] to-[#1d4ed8]">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 p-6 md:p-10 text-white">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs">
                <Star className="h-3.5 w-3.5" /> Mentorship
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Find your mentor</h1>
              <p className="text-white/80">Discover alumni mentors for guidance, interviews, and career strategy.</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60" onClick={handleFindMentorsClick}>
                Find Mentors
              </Button>
              <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60" onClick={() => setCurrentTab('requests')}>
                My Requests
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_40%)]" />
            <div className="relative h-full w-full p-6 md:p-8 flex items-center justify-center">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-6 text-white text-center max-w-xs space-y-3">
                <div className="text-sm opacity-90">Tip</div>
                <div className="text-lg font-semibold">Use filters to find the perfect match</div>
                <Button className="h-9 bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a] w-full" onClick={handleOpenFiltersClick}>
                  Open Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)} className="space-y-6">

        <TabsContent value="find" className="space-y-4">
          {/* Search + Filter toggle */}
          <Card className="rounded-2xl bg-background border border-border dark:border-0 dark:bg-white/5">
            <CardContent className="p-6 space-y-4" ref={searchSectionRef}>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-white/80" />
                  <Input
                    placeholder="Search mentors by name, expertise, or company"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background text-foreground placeholder:text-muted-foreground border border-border focus-visible:ring-2 focus-visible:ring-ring dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder:text-white/70 dark:focus-visible:ring-white/40"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-border text-foreground hover:bg-accent/50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-white/60" onClick={() => setShowFilters(v => !v)}>
                    {showFilters ? 'Hide Filters' : 'Apply Filters'}
                  </Button>
                </div>
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-6 gap-4 overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-[320px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <Select value={skill} onValueChange={setSkill}>
                  <SelectTrigger className="border border-border bg-background text-foreground dark:border-white/20 dark:bg-white/5 dark:text-white">
                    <SelectValue placeholder="Skill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Skill</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="ui">UI</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="border border-border bg-background text-foreground dark:border-white/20 dark:bg-white/5 dark:text-white">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Role</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="tester">Tester</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Company"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="bg-background text-foreground placeholder:text-muted-foreground border border-border dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder:text-white/70"
                />
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="border border-border bg-background text-foreground dark:border-white/20 dark:bg-white/5 dark:text-white">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Department</SelectItem>
                    <SelectItem value="software engineering">Software Engineering</SelectItem>
                    <SelectItem value="computer science">Computer Science</SelectItem>
                    <SelectItem value="computer arts">Computer Arts</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ratingMin} onValueChange={setRatingMin}>
                  <SelectTrigger className="border border-border bg-background text-foreground dark:border-white/20 dark:bg-white/5 dark:text-white">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rating</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl border border-border text-foreground hover:bg-accent/50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-white/60"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Directory Grid */}
          {filteredMentors.length === 0 ? (
            <div className="py-20 text-center text-sm" style={{ color: "#E5E7EB" }}>
              No mentors found — keep exploring!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map((mentor) => (
                <Card
                  key={mentor.id}
                  className="border border-blue-400 hover:border-blue-500 hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.01] transition-transform transition-shadow duration-200 rounded-xl bg-card text-card-foreground h-full"
                >
                  <CardContent className="p-6 space-y-5 h-full flex flex-col">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 ring-1 ring-border group-hover:ring-primary/40 transition">
                        <AvatarImage src={mentor.avatar} alt={mentor.name} />
                        <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground dark:text-[#E5E7EB]">{mentor.name}</h3>
                          <Button size="sm" variant="ghost" onClick={() => handleOpenProfile(mentor)} className="text-xs hover:underline" style={{ color: "#007BFF" }}>
                            View Profile
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-[#E5E7EB]">
                          <Briefcase className="h-3 w-3" /> {mentor.role}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-[#E5E7EB]">
                          <Building2 className="h-3 w-3" /> {mentor.company} • Batch {mentor.batch}
                        </div>
                        {/* rating/sessions removed */}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {mentor.expertise.map((exp) => (
                        <span
                          key={exp}
                          className="px-2 py-1 text-[10px] rounded-full border border-yellow-200 bg-yellow-50 text-yellow-800"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>

                    {/* availability removed */}

                    <div className="flex gap-2 mt-auto">
                      <Button
                        aria-label="Message"
                        size="sm"
                        variant="outline"
                        className="flex-1 border border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                        onClick={() => {
                          const params = new URLSearchParams({ tab: 'messages', to: String(mentor.id), toName: String(mentor.name || 'User') });
                          navigate({ pathname: '/', search: `?${params.toString()}` });
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      {(() => {
                        const id = String(mentor.id);
                        const isConnected = acceptedIds.has(id);
                        const isSent = sentRequests.has(id);
                        if (!user?.id || id === String(user.id)) {
                          return (
                            <Button size="sm" className="flex-1" disabled>
                              Connect
                            </Button>
                          );
                        }
                        if (isConnected) {
                          return (
                            <Button size="sm" variant="outline" className="flex-1" onClick={async () => {
                              try { await deleteDoc(doc(db, 'connections', String(user.id), 'accepted', id)); } catch {}
                              try { await deleteDoc(doc(db, 'connections', id, 'accepted', String(user.id))); } catch {}
                              toast({ title: 'Connection removed' });
                            }}>
                              Remove Connection
                            </Button>
                          );
                        }
                        if (isSent) {
                          return (
                            <Button size="sm" variant="outline" className="flex-1" onClick={async () => {
                              try { await deleteDoc(doc(db, 'connections', String(user.id), 'sent', id)); } catch {}
                              try { await deleteDoc(doc(db, 'connections', id, 'requests', String(user.id))); } catch {}
                              toast({ title: 'Request cancelled' });
                            }}>
                              Cancel Request
                            </Button>
                          );
                        }
                        return (
                          <Button size="sm" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-[#0A1A3D]" onClick={async () => {
                            const authInst = getAuth();
                            let authUid = authInst.currentUser?.uid;
                            if (!authUid) {
                              try { await signInAnonymously(authInst); authUid = authInst.currentUser?.uid; } catch {}
                            }
                            if (!authUid) { toast({ title: 'Not signed in' }); return; }
                            if (authUid === id) { toast({ title: 'You cannot connect to yourself' }); return; }
                            try {
                              // recipient inbox: requests/{senderAuthUid}
                              await setDoc(doc(db, 'connections', id, 'requests', authUid), {
                                id: authUid, // senderAuthUid
                                senderMongoId: String(user?.id || ''),
                                name: user?.name || 'User',
                                avatar: user?.avatar || '',
                                createdAt: new Date(),
                              });
                              // sender outbox: sent/{recipientMongoId}
                              await setDoc(doc(db, 'connections', authUid, 'sent', id), {
                                id, // recipientMongoId
                                recipientMongoId: id,
                                recipientName: mentor?.name || 'Alumni',
                                recipientAvatar: mentor?.avatar || '',
                                createdAt: new Date(),
                              });
                              toast({ title: 'Connection request sent' });
                            } catch (e:any) {
                              toast({ title: 'Failed to send request', description: e?.message || '' });
                            }
                          }}>
                            Connect
                          </Button>
                        );
                      })()}
                      <Button
                        size="sm"
                        className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-[#0A1A3D]"
                        onClick={() => handleRequestMentorship(mentor)}
                        disabled={!!user && user.role !== 'student'}
                        title={!!user && user.role !== 'student' ? "Only students can request mentorship (mentors need love too 💙)" : undefined}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Request Mentor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {loadingReq ? (
            <div className="p-6 text-sm text-muted-foreground">Loading requests…</div>
          ) : myRequests.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No requests yet.</div>
          ) : (
            myRequests.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {user?.role === 'alumni' ? `From Student: ${r.studentId}` : `To Mentor: ${r.mentorId}`}
                        </h3>
                        <Badge variant={r.status === 'Pending' ? 'secondary' : 'default'}>{r.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Topic: {r.topic}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Preferred: {new Date(r.preferredDateTime).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {r.sessionType}
                        </div>
                      </div>
                    </div>
                    {user?.role === 'alumni' ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={async () => { try { await MentorshipAPI.updateRequest(r.id, 'Accepted'); toast({ title: 'Accepted' }); setMyRequests((prev)=>prev.map(x=>x.id===r.id?{...x,status:'Accepted'}:x)); } catch (e:any) { toast({ title: 'Failed', description: e?.message||'Try again' }); } }}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={async () => { try { await MentorshipAPI.updateRequest(r.id, 'Declined'); toast({ title: 'Declined' }); setMyRequests((prev)=>prev.map(x=>x.id===r.id?{...x,status:'Declined'}:x)); } catch (e:any) { toast({ title: 'Failed', description: e?.message||'Try again' }); } }}>Decline</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={async () => { try { await MentorshipAPI.updateRequest(r.id, 'Cancelled'); toast({ title: 'Cancelled' }); setMyRequests((prev)=>prev.map(x=>x.id===r.id?{...x,status:'Cancelled'}:x)); } catch (e:any) { toast({ title: 'Failed', description: e?.message||'Try again' }); } }}>Cancel</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {mockSessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={session.avatar} alt={session.mentor} />
                    <AvatarFallback>{session.mentor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold">{session.mentor}</h3>
                      <p className="text-sm text-muted-foreground">{session.topic}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {session.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button size="sm">
                      <Video className="h-4 w-4 mr-2" />
                      Join Meeting
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Profile Modal */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Mentor Profile</DialogTitle>
            <DialogDescription>Detailed mentor profile and actions.</DialogDescription>
          </DialogHeader>
          <div className="relative" style={{ backgroundColor: "#0A1A3D" }}>
            {/* Header banner */}
            <div className="h-24 w-full" style={{ background: "linear-gradient(90deg, #0A1A3D, #1e3a8a)" }} />
            <button className="absolute right-4 top-4" onClick={() => setShowProfileDialog(false)}>
              <X className="h-5 w-5" style={{ color: "#E5E7EB" }} />
            </button>
            <div className="-mt-8 px-6">
              <div className="flex items-end gap-4">
                <Avatar className="h-16 w-16 ring-2" style={{ boxShadow: "0 0 0 2px #007BFF inset" }}>
                  <AvatarImage src={selectedMentor?.avatar} alt={selectedMentor?.name} />
                  <AvatarFallback>{selectedMentor?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="pb-2">
                  <h3 className="font-semibold text-lg" style={{ color: "#E5E7EB" }}>{selectedMentor?.name}</h3>
                  <p className="text-xs" style={{ color: "#E5E7EB" }}>{selectedMentor?.role} • {selectedMentor?.company} • Batch {selectedMentor?.batch}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* rating/sessions removed */}
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: "#E5E7EB" }}>Expertise</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMentor?.expertise.map((exp) => (
                    <Badge key={exp} variant="outline" className="text-[10px] border-white/20" style={{ color: "#E5E7EB" }}>
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>
              {/* availability removed */}
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 w-full border-t border-white/10 p-4 flex gap-3 justify-end" style={{ backgroundColor: "#0A1A3D" }}>
              <Button
                variant="outline"
                className="bg-transparent border-green-400 text-white hover:bg-green-900/20 hover:border-green-500"
                onClick={() => {
                  if (!selectedMentor) return;
                  const params = new URLSearchParams({ tab: 'messages', to: String(selectedMentor.id), toName: String(selectedMentor.name || 'User') });
                  setShowProfileDialog(false);
                  navigate({ pathname: '/', search: `?${params.toString()}` });
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Message
              </Button>
              <Button style={{ backgroundColor: "#FFC300", color: "#0A1A3D" }} onClick={() => { setShowProfileDialog(false); if (selectedMentor) handleRequestMentorship(selectedMentor); }}>
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Mentorship Session</DialogTitle>
            <DialogDescription>Fill the form to request a mentorship session with the selected alumni.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
              <Avatar className="h-12 w-12 ring-2 ring-blue-400">
                <AvatarImage src={selectedMentor?.avatar} alt={selectedMentor?.name} />
                <AvatarFallback>{selectedMentor?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-blue-900">{selectedMentor?.name}</p>
                <p className="text-sm text-blue-700">{selectedMentor?.role} at {selectedMentor?.company}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Select value={requestForm.topic} onValueChange={(value) => setRequestForm(prev => ({ ...prev, topic: value }))}>
                <SelectTrigger id="topic">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="career">Career Guidance</SelectItem>
                  <SelectItem value="technical">Technical Skills</SelectItem>
                  <SelectItem value="interview">Interview Preparation</SelectItem>
                  <SelectItem value="leadership">Leadership Development</SelectItem>
                  <SelectItem value="transition">Career Transition</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {requestForm.topic === 'other' && (
                <Input
                  id="topicCustom"
                  placeholder="Type your topic"
                  value={requestForm.topicCustom}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, topicCustom: e.target.value }))}
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="stype">Session Type *</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span aria-label="help" className="inline-flex items-center justify-center h-5 w-5 rounded-full border text-xs cursor-default">
                      <Info className="h-3.5 w-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div><strong>Individual</strong>: 1-on-1 mentorship, no other participants.</div>
                      <div><strong>Group</strong>: A batch of students mentored together on one topic.</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={requestForm.sessionType} onValueChange={(value) => setRequestForm(prev => ({ ...prev, sessionType: value }))}>
                <SelectTrigger id="stype">
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outline">Session Outline *</Label>
              <Textarea
                id="outline"
                placeholder="Describe what you'd like to discuss in this mentorship session..."
                value={requestForm.outline}
                onChange={(e) => setRequestForm(prev => ({ ...prev, outline: e.target.value }))}
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Preferred Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={requestForm.preferredDate}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Preferred Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={requestForm.preferredTime}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Notes removed as requested */}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowRequestDialog(false)} className="flex-1" disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRequest} className="flex-1" disabled={
                submitting ||
                !(requestForm.sessionType && requestForm.preferredDate && requestForm.preferredTime && (requestForm.topic && (requestForm.topic !== 'other' || requestForm.topicCustom.trim())))
              }>
                {submitting ? 'Sending…' : 'Send Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

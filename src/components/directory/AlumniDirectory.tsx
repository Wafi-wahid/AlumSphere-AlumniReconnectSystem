import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Filter, MapPin, Briefcase, GraduationCap, MessageCircle, Heart, X, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { api } from "@/lib/api";
import { collection, onSnapshot, query, doc, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const mockAlumni: any[] = [];

export function AlumniDirectory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    year: "all",
    department: "all",
    location: "all",
    company: "",
    skill: "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audience, setAudience] = useState<"alumni" | "students">("alumni");
  const [people, setPeople] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [visibleCount, setVisibleCount] = useState(24);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<any | null>(null);
  const searchSectionRef = useRef<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'active'>('relevance');

  const handleOpenFiltersClick = () => {
    setShowAdvanced(true);
    requestAnimationFrame(() => {
      searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Mirror Mongo users (system-registered) into Firestore 'users'
  const mapMongoToFirestoreUser = (u: any) => {
    const skillsArray = String(u.skills || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const id = String(u._id || u.id || "");
    const role = u.role || "alumni";
    const graduationYear = u.gradYear ?? u.batchYear ?? "";
    const department = u.program || "";
    const title = u.position || u.profileHeadline || "";
    const company = u.currentCompany || "";
    const avatar = u.profilePicture || "";
    const location = u.location || "";
    const linkedinUrl = u.linkedinId || "";
    const experienceYears = Number(u.experienceYears || 0);

    // Safe snapshot of original Mongo fields (exclude passwordHash and other secrets)
    const mongo = {
      _id: id,
      name: u.name || "",
      email: u.email || "",
      role,
      gradSeason: u.gradSeason || u.batchSeason || "",
      gradYear: u.gradYear || "",
      batchSeason: u.batchSeason || "",
      batchYear: u.batchYear || "",
      linkedinId: u.linkedinId || "",
      profileCompleted: !!u.profileCompleted,
      mentorEligible: !!u.mentorEligible,
      createdAt: u.createdAt || "",
      updatedAt: u.updatedAt || "",
      experienceYears,
      location,
      profileHeadline: u.profileHeadline || "",
      position: u.position || "",
      program: u.program || "",
      skills: skillsArray,
      profilePicture: avatar,
      currentCompany: company,
    };

    return {
      id,
      name: u.name || "Unnamed",
      email: u.email || "",
      role,
      roleCategory: role === 'student' ? 'student' : 'alumni',
      isCurrentStudent: role === 'student',
      // Display fields used by UI
      title,
      position: u.position || "",
      company,
      graduationYear,
      department,
      location,
      skills: skillsArray,
      avatar,
      photoURL: avatar,
      linkedinUrl,
      experienceYears,
      // Keep a safe copy of original fields for future use/debug
      mongo,
      // Source marker (optional)
      source: 'user',
    };
  };

  const syncSystemUsers = async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      // Expect backend endpoint to return { users: [...] }
      const res = await api<{ users: any[] }>("/admin/users");
      const users = Array.isArray(res?.users) ? res.users : [];
      let count = 0;
      let alumniCount = 0;
      let studentCount = 0;
      for (const u of users) {
        const mapped = mapMongoToFirestoreUser(u);
        if (!mapped.id) continue;
        await setDoc(doc(db, 'users', mapped.id), mapped, { merge: true });
        count++;
        if (mapped.roleCategory === 'alumni') alumniCount++;
        if (mapped.roleCategory === 'student') studentCount++;
      }
      toast.success(`Synced ${count} users • Alumni: ${alumniCount} • Students: ${studentCount}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to sync users');
    }
  };

  const profilesToSeed: Array<{
    id: string;
    name: string;
    avatar?: string;
    role?: string;
    headline?: string;
    company?: string;
    gradSeason?: "Spring" | "Fall";
    graduationYear?: number;
    department?: string;
    location?: string;
    skills?: string[];
    linkedinUrl?: string;
    mentorAvailable?: boolean;
    linkedinSynced?: boolean;
    visible?: boolean;
    isCurrentStudent?: boolean;
  }> = useMemo(() => ([
    {
      id: "alumni-1",
      name: "Syed Aliyan Abbas",
      avatar: "/alumni/alumni1.jpg",
      position: "Junior Software Engineer",
      headline: "Software Engineer @CareCloud",
      currentCompany: "CareCloud",
      gradSeason: "Spring",
      gradYear: 2025,
      department: "Software Engineering",
      location: "Islamabad, pk",
      skills: ["React", "TypeScript", "Next.js", "MERN stack"],
      linkedinId: "https://www.linkedin.com/in/syed-aliyan-abbas-0a201a308/",
      mentorAvailable: false,
      linkedinSynced: true,
      visible: true,
      isCurrentStudent: false,
    },
    {
      id: "alumni-2",
      name: "Afia Ishaq",
      avatar: "/alumni/alumni2.jpg",
      position: "Team Lead",
      headline: "Team Lead | Data Scientist | Gold Medalist | GoHighLevel Certified",
      currentCompany: "Tao Tao Tech",
      gradSeason: "Spring",
      gradYear: 2020,
      department: "Software Engineering",
      location: "Islamabad, pk",
      skills: ["Marketing", "WordPress Design", "Web Development", "Machine Learning"],
      linkedinId: "https://www.linkedin.com/in/afia-ishaq/",
      mentorAvailable: false,
      linkedinSynced: true,
      visible: true,
      isCurrentStudent: false,
    },
    {
      id: "alumni-3",
      name: "Anas Shoaib",
      avatar: "/alumni/alumni3.jpg",
      position: "Project Implementation Specialist / HRMS Expert ",
      headline: "Associate Project Manager @ PrimeHRMS | Project Management | Support Coordinator | HRMS Domain Expert",
      currentCompany: "PrimeHRMS",
      gradSeason: "Spring",
      gradYear: 2020,
      department: "Computer Science",
      location: "Islamabad, pk",
      skills: ["HR", "Software Project Management", "Web Development", "React.js", "Technical Support"],
      linkedinId: "https://www.linkedin.com/in/iem-anas/",
      mentorAvailable: false,
      linkedinSynced: true,
      visible: true,
      isCurrentStudent: false,
    },
    {
      id: "alumni-4",
      name: "Abdullah Saleem ",
      avatar: "/alumni/alumni4.jpg",
      position: "Android Developer",
      headline: "Android Developer | Computer Science",
      currentCompany: "Markalytics",
      gradSeason: "Spring",
      gradYear: 2024,
      department: "Computer Science",
      location: "Islamabad, pk",
      skills: ["ClickUp", "Kotlin", "Python", "Data Science", "Android Development"],
      linkedinId: "https://www.linkedin.com/in/abdullah-saleem-as/",
      mentorAvailable: false,
      linkedinSynced: true,
      visible: true,
      isCurrentStudent: false,
    },
    {
      id: "alumni-5",
      name: "Hannan Javaid",
      avatar: "/alumni/alumni5.jpg",
      position: "Chief Executive Officer",
      headline: "Founder & CEO at NOITS | Business & Tech Consultant | SaaS, Web & Mobile Solutions | Digital Growth Leader",
      currentCompany: "Noits",
      gradSeason: "Spring",
      gradYear: 2020,
      department: "Information Technology",
      location: "Islamabad, pk",
      skills: ["Web Development", "Digital Marketing", "Project Management", "Data Analysis"],
      linkedinId: "https://www.linkedin.com/in/hannan-javaid5445/",
      mentorAvailable: false,
      linkedinSynced: true,
      visible: true,
      isCurrentStudent: false,
    },
  ]), []);

  // Gate removed: show all items (system users + profiles)

  const seedProfiles = async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      for (const p of profilesToSeed) {
        await setDoc(doc(db, "profiles", p.id), p, { merge: true });
      }
      toast.success("Seeded profiles");
    } catch (e: any) {
      toast.error(e?.message || "Failed to seed");
    }
  };

  useEffect(() => {
    const qUsers = query(collection(db, "users"));
    const unsub = onSnapshot(qUsers, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setPeople(list);
    });
    return () => unsub();
  }, []);

  // Subscribe to my connection state for duplicate guards
  useEffect(() => {
    if (!user?.id) return;
    const unsubSent = onSnapshot(collection(db, 'connections', user.id, 'sent'), (snap) => {
      setSentRequests(new Set(snap.docs.map((d) => d.id)));
    });
    const unsubAcc = onSnapshot(collection(db, 'connections', user.id, 'accepted'), (snap) => {
      setAcceptedIds(new Set(snap.docs.map((d) => d.id)));
    });
    return () => { unsubSent(); unsubAcc(); };
  }, [user?.id]);

  useEffect(() => {
    const qProfiles = query(collection(db, "profiles"));
    const unsubProfiles = onSnapshot(qProfiles, (snap) => {
      const map: Record<string, any> = {};
      snap.docs.forEach((d) => {
        map[d.id] = d.data();
      });
      setProfiles(map);

    });
    return () => unsubProfiles();
  }, []);

  const items = useMemo(() => {
    const pick = (...vals: any[]) => vals.find((v) => v !== undefined && v !== null && String(v).trim() !== "");
    const ensureSkills = (val: any) => Array.isArray(val)
      ? val
      : String(val || "").split(",").map((s) => s.trim()).filter(Boolean);

    const all = (people.length ? people : []).map((u: any) => {
      const p = profiles[u.id] || {};
      const mongo = u.mongo || {};
      const name = pick(p.name, u.name, u.fullName, mongo.name, "Unnamed");
      const avatar = pick(p.avatar, p.photoURL, u.avatar, u.photoURL, u.avatarUrl, u.profilePicture, mongo.profilePicture, "");
      const company = pick(p.company, u.company, u.employer, u.currentCompany, mongo.currentCompany, mongo.company, "");
      const title = pick(
        p.position, p.role, p.title,
        u.title, u.position, u.roleTitle, u.profileHeadline,
        mongo.profileHeadline, mongo.position,
        ""
      );
      const graduationYear = pick(p.graduationYear, u.graduationYear, u.gradYear, mongo.gradYear, u.batchYear, mongo.batchYear, "");
      const department = pick(p.department, u.department, u.dept, u.program, mongo.program, "");
      const location = pick(p.location, p.city, u.location, u.city, mongo.location, "");
      const skills = Array.isArray(p.skills) ? p.skills : ensureSkills(pick(u.skills, mongo.skills, []));
      const linkedinUrl = pick(p.linkedinUrl, p.linkedinId, u.linkedinUrl, u.linkedinId, mongo.linkedinId, "");
      const rawRole = String(p.rawRole || u.rawRole || u.role || mongo.role || '').toLowerCase();
      const isStudent = rawRole === 'student';
      return {
        id: u.id,
        name,
        avatar,
        company,
        role: title,
        rawRole,
        headline: pick(p.headline, u.headline, u.profileHeadline, mongo.profileHeadline, ""),
        graduationYear,
        department,
        location,
        skills,
        mentorAvailable: p.mentorAvailable ?? !!u.mentorAvailable,
        linkedinSynced: p.linkedinSynced ?? !!u.linkedinSynced,
        linkedinUrl,
        rating: p.rating ?? (u.rating || 0),
        mentoringSessions: p.mentoringSessions ?? (u.mentoringSessions || 0),
        source: 'user',
        isCurrentStudent: u.isCurrentStudent || isStudent,
        roleCategory: isStudent ? 'student' : 'alumni',
        visible: p.visible ?? u.visible ?? true,
      };
    });
    const peopleIds = new Set((people || []).map((u: any) => u.id));
    const extraProfiles = Object.entries(profiles || {})
      .filter(([pid]) => !peopleIds.has(pid))
      .map(([pid, p]: any) => {
        const name = pick(p.name, p.fullName, "Unnamed");
        const avatar = pick(p.avatar, p.photoURL, p.avatarUrl, p.profilePicture, "");
        const company = pick(p.company, p.employer, p.currentCompany, "");
        const title = pick(p.position, p.role, p.title, p.headline, "");
        const graduationYear = pick(p.graduationYear, p.gradYear, p.batchYear, "");
        const department = pick(p.department, p.program, p.dept, "");
        const location = pick(p.location, p.city, "");
        const skills = Array.isArray(p.skills) ? p.skills : ensureSkills(p.skills);
        const rawRole = String(p.role || '').toLowerCase();
        return {
          id: pid,
          name,
          avatar,
          company,
          role: title,
          rawRole,
          headline: pick(p.headline, ""),
          graduationYear,
          department,
          location,
          skills,
          mentorAvailable: !!p.mentorAvailable,
          linkedinSynced: !!p.linkedinSynced,
          linkedinUrl: pick(p.linkedinUrl, p.linkedinId, p.linkedin, ""),
          rating: p.rating || 0,
          mentoringSessions: p.mentoringSessions || 0,
          source: 'profile',
          isCurrentStudent: false,
          roleCategory: 'alumni',
          visible: p.visible ?? true,
        };
      });
    const mockMapped = mockAlumni.map((m: any) => ({
      id: `mock-${m.id}`,
      name: m.name,
      avatar: m.avatar,
      company: m.company,
      role: m.role,
      graduationYear: m.graduationYear,
      department: m.department,
      location: m.location,
      skills: m.skills || [],
      mentorAvailable: !!m.mentorAvailable,
      linkedinSynced: !!m.linkedinSynced,
      rating: m.rating || 0,
      mentoringSessions: m.mentoringSessions || 0,
      isCurrentStudent: false,
      roleCategory: 'alumni',
    }));
    const combined = [...all, ...extraProfiles, ...mockMapped];
    return combined;
  }, [people, profiles]);

  const filteredAlumni = items.filter((alumni: any) => {
    const isVisible = alumni.visible !== false; // default to visible when undefined
    if (!isVisible) return false;
    const rr = String(alumni.rawRole || '').toLowerCase();
    if (rr === 'admin' || rr === 'super_admin' || rr === 'super admin' || rr.includes('admin')) return false;
    const matchAudience = audience === 'alumni'
      ? (alumni.roleCategory === 'alumni' && (alumni.source === 'user' || alumni.source === 'profile'))
      : ((alumni.isCurrentStudent || alumni.roleCategory === 'student') && alumni.source === 'user');

    // Search only by name
    const matchesSearch = (alumni.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const yearStr = alumni.graduationYear ? alumni.graduationYear.toString() : "";
    const matchesYear = filters.year === "all" || yearStr === filters.year;
    const matchesDepartment = filters.department === "all" || alumni.department === filters.department;
    const locationStr = alumni.location || "";
    const matchesLocation = filters.location === "all" || locationStr.includes(filters.location);
    const matchesCompany = (filters.company === "all" || !filters.company) || (alumni.company || "").toLowerCase().includes(String(filters.company).toLowerCase());
    const matchesSkill = (filters.skill === 'all' || !filters.skill)
      || (Array.isArray(alumni.skills) ? alumni.skills : []).some((s: string) => String(s || '').toLowerCase() === String(filters.skill).toLowerCase());
    return matchAudience && matchesSearch && matchesYear && matchesDepartment && matchesLocation && matchesCompany && matchesSkill;
  });

  const sortedOrFiltered = useMemo(() => {
    let arr = filteredAlumni;
    if (sortBy === 'active') {
      arr = arr.filter((a: any) => a.source === 'user');
    }
    if (sortBy === 'name') {
      arr = [...arr].sort((a: any, b: any) => String(a.name||'').localeCompare(String(b.name||'')));
    }
    return arr;
  }, [filteredAlumni, sortBy]);

  const visibleAlumni = useMemo(() => sortedOrFiltered.slice(0, visibleCount), [sortedOrFiltered, visibleCount]);

  useEffect(() => {
    setVisibleCount(24);
  }, [searchQuery, filters, audience]);

  // Build dynamic filter option lists from items
  const filterOptions = useMemo(() => {
    const yearsSet = new Set<number>();
    const deptSet = new Set<string>();
    const locSet = new Set<string>();
    const companySet = new Set<string>();
    const skillsSet = new Set<string>();
    (items || []).forEach((it: any) => {
      if (it.graduationYear && Number(it.graduationYear)) yearsSet.add(Number(it.graduationYear));
      if (it.department) deptSet.add(String(it.department));
      if (it.location) locSet.add(String(it.location));
      if (it.company) companySet.add(String(it.company));
      if (Array.isArray(it.skills)) {
        it.skills.forEach((s: string) => { if (s) skillsSet.add(String(s)); });
      }
    });
    const years = Array.from(yearsSet).sort((a, b) => b - a).map(String);
    const departments = Array.from(deptSet).sort((a, b) => a.localeCompare(b));
    const locations = Array.from(locSet).sort((a, b) => a.localeCompare(b));
    const companies = Array.from(companySet).sort((a, b) => a.localeCompare(b));
    const skills = Array.from(skillsSet).sort((a, b) => a.localeCompare(b));
    return { years, departments, locations, companies, skills };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header removed per request */}

      {/* Hero Section (Gradient) */}
      <Card className="overflow-hidden rounded-3xl shadow-strong border-0 bg-gradient-to-br from-[#0b1b3a] to-[#1d4ed8]">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 p-6 md:p-10 text-white">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs">
                Discover
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Find alumni and peers</h2>
              <p className="text-white/80">Search by Name. Filter by Role & Company. Start Networking, Start Networking!</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60" onClick={() => {
                requestAnimationFrame(() => searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
              }}>
                Find Alumni
              </Button>
              <Button
                variant="outline"
                className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60"
                onClick={() => {
                  setAudience('students');
                  requestAnimationFrame(() => searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                }}
              >
                Find Currently Enrolled Students
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_40%)]" />
            <div className="relative h-full w-full p-6 md:p-8 flex items-center justify-center">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-6 text-white text-center max-w-xs space-y-3">
                <div className="text-sm opacity-90">Tip</div>
                <div className="text-lg font-semibold">Use filters to find the perfect match</div>
                <Button className="h-9 bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a] w-full" onClick={() => {
                  setShowAdvanced(true);
                  requestAnimationFrame(() => searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                }}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card className="border-yellow-400">
        <CardContent className="p-6 space-y-4" ref={searchSectionRef}>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-yellow-400 focus-visible:ring-yellow-400"
              />
            </div>
            <div className="flex gap-2">
              <Button variant={audience === 'alumni' ? "default" : "outline"} onClick={() => setAudience('alumni')}>Alumni</Button>
              <Button variant={audience === 'students' ? "default" : "outline"} onClick={() => setAudience('students')}>Current Students</Button>
            </div>
            <Button
              variant={showAdvanced ? "default" : "outline"}
              className={showAdvanced
                ? "gap-2 bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                : "gap-2 border-blue-400 text-blue-700 hover:bg-blue-50"}
              onClick={() => setShowAdvanced((v) => !v)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={syncSystemUsers}>Sync System Users</Button>
              <Button size="sm" variant="outline" className="ml-2" onClick={seedProfiles}>Seed Profiles</Button>
            </div>
          )}

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
              <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Graduation Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {filterOptions.years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {filterOptions.departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.location} onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {filterOptions.locations.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.company || 'all'} onValueChange={(value) => setFilters((prev) => ({ ...prev, company: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {filterOptions.companies.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.skill || 'all'} onValueChange={(value) => setFilters((prev) => ({ ...prev, skill: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {filterOptions.skills.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="md:col-span-5 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters((prev) => ({
                    ...prev,
                    company: "all",
                    skill: "",
                    year: "all",
                    department: "all",
                    location: "all",
                  }))}
                >
                  Clear advanced filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {sortedOrFiltered.length} of {items.length} people
          </p>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Sort/Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Most Relevant</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="active">Active Users (Registered)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAlumni.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No results match your filters.</div>
        ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleAlumni.map((alumni: any, idx: number) => (
            <Card
              key={alumni.id}
              className="border border-blue-400 hover:border-blue-500 hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.01] transition-transform transition-shadow duration-200 cursor-pointer group rounded-xl h-full"
              style={{ transitionDelay: `${Math.min(idx, 12) * 20}ms` }}
            >
              <CardContent className="p-6 space-y-4 h-full flex flex-col">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 ring-1 ring-border group-hover:ring-primary/40 transition">
                    <AvatarImage src={alumni.avatar} alt={alumni.name} />
                    <AvatarFallback>
                      {alumni.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {alumni.name}
                      </h3>
                      {alumni.linkedinSynced && (
                        <Badge variant="secondary" className="text-xs">LinkedIn</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{alumni.role}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Briefcase className="h-3 w-3" />
                      {alumni.company}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <GraduationCap className="h-3 w-3" />
                      {alumni.department} &apos;{String(alumni.graduationYear || "").slice(-2)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {alumni.location}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Button size="sm" variant="outline" className="flex-1 bg-yellow-400 text-black hover:bg-yellow-300 border-0" onClick={() => setViewing(alumni)}>
                    View Profile
                  </Button>
                  <Button
                    aria-label="Message"
                    size="sm"
                    variant="outline"
                    className="flex-1 border border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                    onClick={() => {
                      const params = new URLSearchParams({ tab: 'messages', to: String(alumni.id), toName: String(alumni.name || 'User') });
                      navigate({ pathname: '/', search: `?${params.toString()}` });
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  {(() => {
                    const id = String(alumni.id);
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
                          try { await deleteDoc(doc(db, 'connections', user.id, 'accepted', id)); } catch {}
                          try { await deleteDoc(doc(db, 'connections', id, 'accepted', user.id)); } catch {}
                          toast.message('Connection removed');
                        }}>
                          Remove Connection
                        </Button>
                      );
                    }
                    if (isSent) {
                      return (
                        <Button size="sm" variant="outline" className="flex-1" onClick={async () => {
                          try { await deleteDoc(doc(db, 'connections', user.id, 'sent', id)); } catch {}
                          try { await deleteDoc(doc(db, 'connections', id, 'requests', user.id)); } catch {}
                          toast.message('Request cancelled');
                        }}>
                          Cancel Request
                        </Button>
                      );
                    }
                    return (
                      <Button size="sm" className="flex-1 text-primary-foreground border-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]" onClick={async () => {
                        const authUid = getAuth().currentUser?.uid || String(user?.id || "");
                        if (!authUid) { toast.error('Not signed in'); return; }
                        if (authUid === id) { toast.message('You cannot connect to yourself'); return; }
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
                            recipientName: alumni?.name || 'Alumni',
                            recipientAvatar: alumni?.avatar || '',
                            createdAt: new Date(),
                          });
                          toast.success('Connection request sent');
                        } catch (e:any) {
                          toast.error(e?.message || 'Failed to send request');
                        }
                      }}>
                        Connect
                      </Button>
                    );
                  })()}
                  {alumni.mentorAvailable && (
                    <Button size="sm" variant="outline" className="flex-1">
                      <Heart className="h-4 w-4 mr-2" />
                      Mentor Request
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {filteredAlumni.length > visibleCount && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setVisibleCount((c) => c + 24)}>Load more</Button>
          </div>
        )}
        </>
        )}
      </div>

      {/* Profile Modal */}
      <Dialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden [&>button.absolute.right-4.top-4]:text-white [&>button.absolute.right-4.top-4]:opacity-100">
          {viewing && (
            <div className="w-full">
              {/* Gradient Header */}
              <div className="relative bg-gradient-to-br from-[#0b1b3a] to-[#1d4ed8] px-6 pt-8 pb-16 text-white">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-white/60 shadow-md">
                    <AvatarImage src={viewing.avatar} alt={viewing.name} />
                    <AvatarFallback className="text-black">{String(viewing.name || 'U').split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-2xl font-bold leading-tight">{viewing.name}</div>
                    <div className="text-white/90 text-sm">{viewing.role}</div>
                    {viewing.headline && (
                      <div className="mt-1 text-white/90 text-base italic">{viewing.headline}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Card */}
              <div className="-mt-10 px-6 pb-6">
                <div className="rounded-xl border bg-background shadow-sm p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 text-sm">
                      <div className="text-xs font-medium text-muted-foreground">Overview</div>
                      <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> {viewing.company || '—'}</div>
                      <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> {viewing.department || '—'}{viewing.graduationYear ? ` '${String(viewing.graduationYear).slice(-2)}` : ''}</div>
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {viewing.location || '—'}</div>
                      {viewing.linkedinSynced && (
                        <Badge variant="secondary" className="mt-1 w-fit bg-blue-50 text-blue-700 border border-blue-200">LinkedIn Synced</Badge>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-muted-foreground">Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(viewing.skills) ? viewing.skills : []).map((s: string) => (
                          <span key={s} className="px-2 py-1 text-xs rounded-full border border-yellow-200 bg-yellow-50 text-yellow-800">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-6 flex items-center justify-between">
                    {viewing.linkedinUrl ? (
                      <Button asChild className="gap-2">
                        <a href={viewing.linkedinUrl} target="_blank" rel="noreferrer">
                          <Linkedin className="h-4 w-4" /> See LinkedIn profile
                        </a>
                      </Button>
                    ) : <span />}
                    <div className="flex gap-2">
                      <Button
                        aria-label="Message"
                        size="sm"
                        variant="outline"
                        className="border border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                        onClick={() => {
                          const params = new URLSearchParams({ tab: 'messages', to: String(viewing.id), toName: String(viewing.name || 'User') });
                          navigate({ pathname: '/', search: `?${params.toString()}` });
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    
  );
}
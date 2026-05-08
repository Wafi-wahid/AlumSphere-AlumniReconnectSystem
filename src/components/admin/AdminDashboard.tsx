import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, setDoc, serverTimestamp, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, CalendarPlus, Briefcase, MessageSquare, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const seedProfilesData = [
  {
    url: "https://www.linkedin.com/in/manahil-habib/",
    name: "Manahil Habib",
    headline: "Software Engineer",
    location: "Islāmābād, Pakistan",
    company: "Eris Innovations",
    education: null
  },
  {
    url: "https://www.linkedin.com/in/ayla-amir-b36958297/",
    name: "Ayla Amir",
    headline: "Software Engineering Student | Project Management Experience | Exchange Program Participant",
    location: "Rawalpindi, Punjab, Pakistan",
    company: "Riphah International University",
    education: null
  },
  {
    url: "https://www.linkedin.com/in/malaika-shahzad/",
    name: "Malaika Shahzad",
    headline: "Software Engineer | Ex-Intern @NADRA | Software Quality Assurance",
    location: "Rawalpindi, Punjab, Pakistan",
    company: null,
    education: null
  },
  {
    url: "https://www.linkedin.com/in/soha-ali-207b30287/",
    name: "Soha Ali",
    headline: "Front End Developer | Skilled in HTML, CSS, JavaScript, PHP, C++, Java & MySQL | Eager to Build Scalable Digital Solutions",
    location: "Islāmābād, Pakistan",
    company: "Riphah International University",
    education: null
  },
  {
    url: "https://www.linkedin.com/in/maryam-safdar-069b53301/",
    name: "Maryam Safdar",
    headline: "Software Engineering Student | Web & Mobile App Developer | UI/UX Designer",
    location: "Rawalpindi, Punjab, Pakistan",
    company: "Riphah International University",
    education: null
  },
  {
    url: "https://www.linkedin.com/in/himal-khan-35406023b",
    name: "Himal Khan",
    headline: "Human Resources Associate at we.R.play",
    location: "Islamabad, Islāmābād, Pakistan",
    company: "weRplay",
    education: null
  },
  {
    url: "https://www.linkedin.com/in/shehla-awan-463145bb",
    name: "Shehla Awan",
    headline: "Speech and Language Pathologist",
    location: "Special Education School Islamabad",
    company: "Riphah International University",
    education: null
  },
  {
    url: "https://www.linkedin.com/in/rawiah-ayoub-995506198",
    name: "Rawiah Ayoub",
    headline: "Graduated",
    location: "Islāmābād, Pakistan",
    company: "Villa Vista",
    education: null
  },
  {
    url: "https://www.linkedin.com/in/qasim-burhan-618b7368",
    name: "qasim burhan",
    headline: "service at Government Affairs",
    location: "Saint Paul Cambridge Rawalpindi",
    company: "Government Affairs",
    education: null
  },
  {
    url: "https://www.linkedin.com/in/muhammad-husnain-26791a256",
    name: "Muhammad (Aulakh) Husnain",
    headline: "Network Administrator (CCNA)",
    location: "Faisalabad, Punjab, Pakistan",
    company: "WAPDA",
    education: null
  }
];

function makeProfile(i: number) {
  const profile = seedProfilesData[i % seedProfilesData.length];
  
  return {
    name: profile.name,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}&radius=8`,
    company: profile.company || "",
    role: profile.headline || "",
    graduationYear: 2020 + Math.floor(Math.random() * 5),
    department: "Software Engineering",
    location: profile.location || "",
    skills: ["React", "TypeScript", "Node.js", "JavaScript", "Python"],
    mentorAvailable: Math.random() < 0.4,
    linkedinSynced: true,
    rating: Number((4 + Math.random()).toFixed(1)),
    mentoringSessions: Math.floor(Math.random() * 30),
    isCurrentStudent: false,
    roleCategory: 'alumni',
    sourceUrl: profile.url,
    crawledAt: serverTimestamp(),
    confidence: 0.9,
  };
}

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(100);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [usersCount, setUsersCount] = useState(0);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [adminTool, setAdminTool] = useState<'create' | 'crawl' | 'profiles' | 'roles'>('create');
  const goTab = (tab: string) => navigate({ pathname: "/", search: `?tab=${tab}` });

  // Realtime profiles feed
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "profiles"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setProfiles(list);
    });
    return () => unsub();
  }, []);

  // Realtime Firestore users count (client-side users collection used by directory)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsersCount(snap.docs.length);
    });
    return () => unsub();
  }, []);

  // Load server users (for role management)
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api<{ users: any[] }>("/admin/users");
      setUsers(res.users);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };
  useEffect(() => { loadUsers(); }, []);
  useEffect(() => {
    const id = setInterval(loadUsers, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const key = "admin_tour_done";
    const done = (() => { try { return localStorage.getItem(key) === "1"; } catch { return false; } })();
    if (!done) setTourOpen(true);
  }, []);

  const ensureAuthReady = async () => {
    if (auth.currentUser) return;
    await new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(auth, () => { unsub(); resolve(); });
    });
  };

  const startCrawlSeed = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      toast.error("Access denied: admin only");
      return;
    }
    try {
      await ensureAuthReady();
      setSeeding(true);
      setProgress(0);
      const coll = collection(db, "profiles");

      for (let i = 0; i < count; i++) {
        const pid = `seed-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`;
        const profile = makeProfile(i);
        await setDoc(doc(coll, pid), profile, { merge: true });
        const pct = Math.round(((i + 1) / count) * 100);
        setProgress(pct);
        // be polite to Firestore in dev
        await new Promise((r) => setTimeout(r, 10));
      }

      toast.success(`Seeded ${count} profiles`);
    } catch (e: any) {
      toast.error(e.message || "Seeding failed");
    } finally {
      setSeeding(false);
    }
  };

  // Derived, filtered, paginated profiles
  const filteredProfiles = profiles.filter((p) => {
    const q = search.toLowerCase();
    const matchesQuery = !q || (p.name || "").toLowerCase().includes(q) || (p.company || "").toLowerCase().includes(q) || (p.role || "").toLowerCase().includes(q);
    const matchesVisibility = visibilityFilter === "all" || (visibilityFilter === "visible" ? p.visible !== false : p.visible === false);
    return matchesQuery && matchesVisibility;
  });
  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredProfiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="text-sm text-muted-foreground">Quick actions to manage users, events, jobs, and community.</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="gap-2" onClick={() => { setTourStep(0); setTourOpen(true); }}>
            <PlayCircle className="h-4 w-4" /> Take a Tour
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow border-2 border-[#1e3a8a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" /> Manage Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">View, assign roles, and categorize admins.</div>
            <Button size="sm" className="w-full" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>Open Users & Roles</Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-2 border-[#1e3a8a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><CalendarPlus className="h-4 w-4" /> Post Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">Publish events for students and alumni.</div>
            <Button
              size="sm"
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]"
              onClick={() => goTab('events')}
            >
              Go to Events
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-2 border-[#1e3a8a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Briefcase className="h-4 w-4" /> Post Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">Share jobs or internships to careers.</div>
            <Button
              size="sm"
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]"
              onClick={() => goTab('careers')}
            >
              Go to Jobs
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-2 border-[#1e3a8a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4" /> Community</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">Moderate posts and keep discussions healthy.</div>
            <Button
              size="sm"
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]"
              onClick={() => goTab('community')}
            >
              Go to Community
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Colorful summary cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
          <CardHeader><CardTitle className="text-sm">Server Users</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Accounts with roles</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader><CardTitle className="text-sm">Directory Profiles</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profiles.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Realtime from Firestore</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <CardHeader><CardTitle className="text-sm">Visible Profiles</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profiles.filter(p => p.visible !== false).length}</div>
            <div className="text-xs text-muted-foreground mt-1">Hidden: {profiles.filter(p => p.visible === false).length}</div>
          </CardContent>
        </Card>
      </div>
      

      {/* Simple inline charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-2 border-[#1e3a8a]">
          <CardHeader><CardTitle>Users Growth (mock)</CardTitle></CardHeader>
          <CardContent>
            {(() => {
              const points = Array.from({ length: 12 }, (_, i) => {
                const base = users.length;
                const jitter = Math.sin(i / 2) * 3 + (i * base) / 60;
                return Math.max(0, base / 2 + jitter);
              });
              const max = Math.max(1, ...points);
              const path = points
                .map((v, i) => `${(i / 11) * 100},${100 - (v / max) * 100}`)
                .join(" ");
              return (
                <svg viewBox="0 0 100 100" className="w-full h-36">
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polyline fill="none" stroke="#8b5cf6" strokeWidth="1.5" points={path} />
                  <polygon fill="url(#grad)" points={`0,100 ${path} 100,100`} />
                </svg>
              );
            })()}
            <div className="text-xs text-muted-foreground">Mock trend for visual context</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-[#1e3a8a]">
          <CardHeader><CardTitle>Profiles Visibility</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-4">
            {(() => {
              const visible = profiles.filter(p => p.visible !== false).length;
              const hidden = profiles.filter(p => p.visible === false).length;
              const total = Math.max(1, visible + hidden);
              const pct = Math.round((visible / total) * 100);
              const circ = 2 * Math.PI * 36;
              const dash = (pct / 100) * circ;
              return (
                <div className="flex items-center gap-4">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="36" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                    <circle cx="50" cy="50" r="36" stroke="#10b981" strokeWidth="10" fill="none" strokeDasharray={`${dash} ${circ - dash}`} transform="rotate(-90 50 50)" />
                    <text x="50" y="54" textAnchor="middle" fontSize="14" fill="#111827">{pct}%</text>
                  </svg>
                  <div>
                    <div className="text-2xl font-bold">{visible}</div>
                    <div className="text-xs text-muted-foreground">Visible out of {total}</div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={adminTool === 'create' ? 'default' : 'outline'}
            onClick={() => setAdminTool('create')}
          >
            Create Admin User
          </Button>
          <Button
            size="sm"
            variant={adminTool === 'crawl' ? 'default' : 'outline'}
            onClick={() => setAdminTool('crawl')}
          >
            Crawl Alumni Data
          </Button>
          <Button
            size="sm"
            variant={adminTool === 'roles' ? 'default' : 'outline'}
            onClick={() => setAdminTool('roles')}
          >
            Users & Roles
          </Button>
          <Button
            size="sm"
            variant={adminTool === 'profiles' ? 'default' : 'outline'}
            onClick={() => setAdminTool('profiles')}
          >
            Profiles Management
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {adminTool === 'profiles' && (
        <Card className="border-2 border-[#1e3a8a]">
          <CardHeader>
            <CardTitle>Profiles Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={Object.values(selected).some(Boolean) ? "destructive" : "outline"}
                onClick={async () => {
                  const ids = Object.keys(selected).filter(k => selected[k]);
                  if (ids.length === 0) return;
                  if (!confirm(`Hide ${ids.length} selected profiles?`)) return;
                  try {
                    await Promise.all(ids.map(id => updateDoc(doc(db, 'profiles', id), { visible: false })));
                    toast.success(`Hidden ${ids.length} profiles`);
                    setSelected({});
                  } catch (e: any) {
                    toast.error(e.message || 'Bulk hide failed');
                  }
                }}
              >Hide Selected</Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const ids = Object.keys(selected).filter(k => selected[k]);
                  if (ids.length === 0) return;
                  try {
                    await Promise.all(ids.map(id => updateDoc(doc(db, 'profiles', id), { visible: true })));
                    toast.success(`Shown ${ids.length} profiles`);
                    setSelected({});
                  } catch (e: any) {
                    toast.error(e.message || 'Bulk show failed');
                  }
                }}
              >Show Selected</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  const ids = Object.keys(selected).filter(k => selected[k]);
                  if (ids.length === 0) return;
                  if (!confirm(`Delete ${ids.length} profiles?`)) return;
                  try {
                    await Promise.all(ids.map(id => deleteDoc(doc(db, 'profiles', id))));
                    toast.success(`Deleted ${ids.length} profiles`);
                    setSelected({});
                  } catch (e: any) {
                    toast.error(e.message || 'Bulk delete failed');
                  }
                }}
              >Delete Selected</Button>
              <Input placeholder="Search name, company, role..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              <Select value={visibilityFilter} onValueChange={(v) => { setVisibilityFilter(v as any); setPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Visibility" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="visible">Visible</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(1); }}>
                <SelectTrigger className="w-28"><SelectValue placeholder="Page size" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <div className="text-sm">Page {currentPage} / {totalPages}</div>
                <Button variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
              {pageItems
                .map((p) => (
                  <div key={p.id} className="flex items-start justify-between rounded border p-2 gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <input type="checkbox" checked={!!selected[p.id]} onChange={(e) => setSelected({ ...selected, [p.id]: e.target.checked })} />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name || 'Unnamed'}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.role || '—'} · {p.company || '—'} · {p.location || '—'}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(Array.isArray(p.skills) ? p.skills.slice(0, 4) : []).map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                        <div className="mt-2 grid md:grid-cols-4 gap-2">
                          <Input placeholder="Role" defaultValue={p.role || ''} onChange={(e) => (p._draftRole = e.target.value)} />
                          <Input placeholder="Company" defaultValue={p.company || ''} onChange={(e) => (p._draftCompany = e.target.value)} />
                          <Input placeholder="Location" defaultValue={p.location || ''} onChange={(e) => (p._draftLocation = e.target.value)} />
                          <Input placeholder="Skills: comma,separated" defaultValue={(Array.isArray(p.skills) ? p.skills : []).join(', ')} onChange={(e) => (p._draftSkills = e.target.value)} />
                        </div>
                        <div className="mt-2">
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              const payload: any = {};
                              if (p._draftRole !== undefined) payload.role = p._draftRole;
                              if (p._draftCompany !== undefined) payload.company = p._draftCompany;
                              if (p._draftLocation !== undefined) payload.location = p._draftLocation;
                              if (p._draftSkills !== undefined) payload.skills = String(p._draftSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                              if (Object.keys(payload).length === 0) { toast.info('Nothing to save'); return; }
                              await updateDoc(doc(db, 'profiles', p.id), payload);
                              toast.success('Saved');
                            } catch (e: any) {
                              toast.error(e.message || 'Save failed');
                            }
                          }}>Save</Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={p.visible === false ? 'destructive' : 'secondary'} className="text-[10px]">{p.visible === false ? 'Hidden' : 'Visible'}</Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className={p.visible === false
                            ? 'bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white'
                            : 'bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]'}
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, 'profiles', p.id), { visible: !(p.visible !== false) });
                              toast.success(p.visible === false ? 'Profile set visible' : 'Profile hidden');
                            } catch (e: any) {
                              toast.error(e.message || 'Update failed');
                            }
                          }}
                        >
                          {p.visible === false ? 'Show' : 'Hide'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm('Delete this profile?')) return;
                            try {
                              await deleteDoc(doc(db, 'profiles', p.id));
                              toast.success('Deleted');
                            } catch (e: any) {
                              toast.error(e.message || 'Delete failed');
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              {profiles.length === 0 && (
                <div className="text-sm text-muted-foreground">No profiles yet</div>
              )}
            </div>
          </CardContent>
        </Card>
          )}
          {adminTool === 'roles' && user?.role === 'super_admin' && (
        <Card className="border-2 border-[#1e3a8a]">
          <CardHeader>
            <CardTitle>Users & Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Manage roles. Only super_admin can change roles.</div>
              <Button variant="outline" onClick={loadUsers} disabled={loadingUsers}>{loadingUsers ? 'Refreshing...' : 'Refresh'}</Button>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between border rounded p-2 gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select defaultValue={u.role} onValueChange={async (val) => {
                      try {
                        await api(`/admin/users/${u.id}/role`, { method: 'PATCH', body: JSON.stringify({ role: val }) });
                        toast.success('Role updated');
                        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: val } : x));
                      } catch (e: any) {
                        toast.error(e.message || 'Failed to update role');
                      }
                    }}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">student</SelectItem>
                        <SelectItem value="alumni">alumni</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="super_admin">super_admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Category (open_house, fyp)" defaultValue={u.adminCategory || ''} onChange={(e) => (u._draftCat = e.target.value)} className="w-48" />
                    <Button variant="outline" onClick={async () => {
                      try {
                        await api(`/admin/users/${u.id}/category`, { method: 'PATCH', body: JSON.stringify({ adminCategory: u._draftCat || null }) });
                        toast.success('Category updated');
                        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, adminCategory: u._draftCat || null } : x));
                      } catch (e: any) {
                        toast.error(e.message || 'Failed to update category');
                      }
                    }}>Save</Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-sm text-muted-foreground">No users</div>
              )}
            </div>
          </CardContent>
        </Card>
          )}
          {adminTool === 'crawl' && user?.role === 'super_admin' && (
        <Card className="border-2 border-[#1e3a8a]">
          <CardHeader>
            <CardTitle>Crawl Alumni Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Simulate a crawl and publish profiles to the directory. Profiles appear on the user side immediately via realtime listeners.
            </p>
            <div className="flex items-center gap-2">
              <input
                className="border rounded px-2 py-1 w-24 bg-background"
                type="number"
                min={10}
                max={1000}
                value={count}
                onChange={(e) => setCount(Math.min(1000, Math.max(10, parseInt(e.target.value || '0', 10))))}
              />
              <span className="text-sm text-muted-foreground">profiles</span>
            </div>
            <Button onClick={startCrawlSeed} disabled={seeding}>
              {seeding ? "Seeding..." : "Start Crawl"}
            </Button>
            {seeding && (
              <div className="space-y-2">
                <Progress value={progress} />
                <div className="text-xs text-muted-foreground">{progress}%</div>
              </div>
            )}
          </CardContent>
        </Card>
          )}
          {adminTool === 'create' && user?.role === 'super_admin' && (
        <Card className="border-2 border-[#1e3a8a]">
          <CardHeader>
            <CardTitle>Create Admin User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <label className="text-sm" htmlFor="aname">Name</label>
              <Input id="aname" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm" htmlFor="aemail">Email</label>
              <Input id="aemail" type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm" htmlFor="apass">Password</label>
              <Input id="apass" type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} />
            </div>
            <Button
              disabled={creatingAdmin}
              onClick={async () => {
                try {
                  setCreatingAdmin(true);
                  await api("/admin/users", { method: 'POST', body: JSON.stringify(newAdmin) });
                  toast.success('Admin created');
                  setNewAdmin({ name: "", email: "", password: "" });
                } catch (e: any) {
                  toast.error(e.message || 'Failed to create admin');
                } finally {
                  setCreatingAdmin(false);
                }
              }}
            >
              {creatingAdmin ? 'Creating...' : 'Create Admin'}
            </Button>
            <div className="text-xs text-muted-foreground">Requires super_admin session</div>
          </CardContent>
        </Card>
          )}
        </div>
      </div>

      <Dialog open={tourOpen} onOpenChange={(o) => {
        setTourOpen(o);
        if (!o) try { localStorage.setItem('admin_tour_done', '1'); } catch {}
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to Admin Dashboard</DialogTitle>
          </DialogHeader>
          {tourStep === 0 && (
            <div className="space-y-2 text-sm">
              <div className="font-medium">Overview</div>
              <div>Manage users, publish events and jobs, and moderate community content.</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use Quick Actions to jump to common tasks</li>
                <li>Analytics show key stats at a glance</li>
                <li>Realtime updates for profiles</li>
              </ul>
            </div>
          )}
          {tourStep === 1 && (
            <div className="space-y-2 text-sm">
              <div className="font-medium">Users & Roles</div>
              <div>Assign roles and set admin categories. Only super admin can change roles.</div>
            </div>
          )}
          {tourStep === 2 && (
            <div className="space-y-2 text-sm">
              <div className="font-medium">Profiles Management</div>
              <div>Search, show/hide, edit details, or delete profiles in bulk.</div>
            </div>
          )}
          <DialogFooter className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">Step {tourStep + 1} of 3</div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={tourStep === 0} onClick={() => setTourStep((s) => Math.max(0, s - 1))}>Back</Button>
              {tourStep < 2 ? (
                <Button onClick={() => setTourStep((s) => Math.min(2, s + 1))}>Next</Button>
              ) : (
                <Button onClick={() => { setTourOpen(false); try { localStorage.setItem('admin_tour_done', '1'); } catch {} }}>Finish</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;

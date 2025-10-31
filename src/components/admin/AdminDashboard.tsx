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

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeProfile(i: number) {
  const firstNames = ["Aisha","Ahmed","Fatima","Ali","Sara","Bilal","Hassan","Hira","Zain","Noor"]; 
  const lastNames = ["Khan","Malik","Ahmed","Raza","Hussain","Ali","Sheikh","Qureshi","Javed","Saeed"]; 
  const companies = ["Google","Microsoft","Amazon","Meta","Apple","NayaPay","Careem","Systems Limited","10Pearls","Bykea"]; 
  const roles = ["Software Engineer","Product Manager","Data Scientist","UX Designer","Mobile Developer","DevOps Engineer"]; 
  const departments = ["Computer Science","Electrical Engineering","Business","Design","Data Science"]; 
  const locations = ["Karachi, PK","Lahore, PK","Islamabad, PK","Dubai, AE","Riyadh, SA","London, UK","Toronto, CA"]; 
  const skillsPool = ["React","TypeScript","Node.js","Python","SQL","AWS","Figma","Kubernetes","Django","Swift","Flutter"]; 

  const name = `${randomFrom(firstNames)} ${randomFrom(lastNames)}`;
  const skills = Array.from({ length: 3 + Math.floor(Math.random() * 4) }, () => randomFrom(skillsPool));
  const uniqueSkills = Array.from(new Set(skills));

  return {
    name,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&radius=8`,
    company: randomFrom(companies),
    role: randomFrom(roles),
    graduationYear: 2015 + Math.floor(Math.random() * 11),
    department: randomFrom(departments),
    location: randomFrom(locations),
    skills: uniqueSkills,
    mentorAvailable: Math.random() < 0.4,
    linkedinSynced: Math.random() < 0.7,
    rating: Number((4 + Math.random()).toFixed(1)),
    mentoringSessions: Math.floor(Math.random() * 30),
    isCurrentStudent: false,
    roleCategory: 'alumni',
    sourceUrl: "seed://admin",
    crawledAt: serverTimestamp(),
    confidence: 0.9,
  };
}

export function AdminDashboard() {
  const { user } = useAuth();
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
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      {/* Analytics */}
      {user?.role === 'super_admin' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader><CardTitle>Total Users (Server)</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{users.length}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Profiles</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{profiles.length}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Visible Profiles</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{profiles.filter(p => p.visible !== false).length}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Hidden Profiles</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{profiles.filter(p => p.visible === false).length}</CardContent>
          </Card>
        </div>
      )}

      {user?.role === 'super_admin' && (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
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
        <Card>
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
      </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
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
                          variant="outline"
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
        {user?.role === 'super_admin' && (
        <Card>
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
      </div>
    </div>
  );
}

export default AdminDashboard;

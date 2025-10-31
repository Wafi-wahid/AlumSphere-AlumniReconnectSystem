import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  const [visibleCount, setVisibleCount] = useState(20);

  // Realtime profiles feed
  useState(() => {
    const unsub = onSnapshot(collection(db, "profiles"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setProfiles(list);
    });
    return () => unsub();
  });

  const startCrawlSeed = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      toast.error("Access denied: admin only");
      return;
    }
    try {
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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
            <CardTitle>Profiles Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input placeholder="Search name, company, role..." value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(20); }} />
              <Button variant="outline" onClick={() => setVisibleCount((c) => c + 20)}>Load more</Button>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
              {profiles
                .filter((p) => {
                  const q = search.toLowerCase();
                  if (!q) return true;
                  return (
                    (p.name || "").toLowerCase().includes(q) ||
                    (p.company || "").toLowerCase().includes(q) ||
                    (p.role || "").toLowerCase().includes(q)
                  );
                })
                .slice(0, visibleCount)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded border p-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.role || '—'} · {p.company || '—'} · {p.location || '—'}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(Array.isArray(p.skills) ? p.skills.slice(0, 4) : []).map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.visible === false ? 'destructive' : 'secondary'} className="text-[10px]">{p.visible === false ? 'Hidden' : 'Visible'}</Badge>
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
                ))}
              {profiles.length === 0 && (
                <div className="text-sm text-muted-foreground">No profiles yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;

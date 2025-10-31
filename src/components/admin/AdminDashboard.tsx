import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";

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
      </div>
    </div>
  );
}

export default AdminDashboard;

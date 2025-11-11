import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Sparkles, Lightbulb, Users, ClipboardList } from "lucide-react";
import { db } from "@/lib/firebase";
import { getAuth, signInAnonymously } from "firebase/auth";
import { addDoc, collection, collectionGroup, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { toast } from "sonner";

export function CareersPage() {
  const { user } = useAuth();
  const isAlumniOrAdmin = user?.role === 'alumni' || user?.role === 'admin' || user?.role === 'super_admin';
  const location = useLocation();
  const navigate = useNavigate();

  const [postOpen, setPostOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [viewTab, setViewTab] = useState<'all'|'mine'|'applications'>('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [applicationsToMine, setApplicationsToMine] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [referOpen, setReferOpen] = useState(false);
  const [myConnections, setMyConnections] = useState<any[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());

  // Post form state
  const [form, setForm] = useState({
    role: "",
    type: "",
    schedule: "",
    mode: "",
    requirements: "",
    pay: "",
    company: "",
    location: "",
  });
  // Application form
  const [apply, setApply] = useState({ resume: "", note: "" });

  const TYPE_LABELS = [
    { key: 'gig', label: 'Freelance gig' },
    { key: 'job', label: 'Job' },
    { key: 'contract', label: 'Contract' },
    { key: 'internship', label: 'Internship' },
  ];

  const REQUIREMENT_TEMPLATES: Record<string,string> = {
    internship: `We are looking for an intern with:
• Passion for learning and growth
• Basic knowledge of relevant technologies
• Currently enrolled or recently graduated

Responsibilities:
• Assist the team on tasks and small features
• Participate in code reviews and stand-ups`,
    job: `We are hiring for a full-time role:
Requirements:
• 2+ years experience in relevant stack
• Strong problem-solving and communication skills

Responsibilities:
• Own features end-to-end
• Collaborate cross-functionally`,
    contract: `Contract role:
Requirements:
• Experience delivering on fixed timelines
• Ability to work independently

Engagement:
• Project-based, clearly defined milestones`,
    gig: `Freelance gig:
Requirements:
• Proven experience with similar gigs
• Portfolio or samples

Engagement:
• Short-term, outcome-driven`,
  };

  // Load jobs (all) and my jobs
  useEffect(() => {
    // Ensure there is a Firebase Auth user (anonymous is fine for reads if rules allow auth != null)
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        signInAnonymously(auth).catch(() => {});
      }
    } catch {}

    const qAll = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const unsubAll = onSnapshot(qAll, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setJobs(list);
    });
    let unsubMine: (() => void) | null = null;
    try {
      const uid = getAuth().currentUser?.uid || '';
      if (uid) {
        const qMine = query(collection(db, 'jobs'), where('ownerUid', '==', uid), orderBy('createdAt', 'desc'));
        unsubMine = onSnapshot(qMine, (snap) => setMyJobs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))));
      }
    } catch {}
    return () => { unsubAll(); if (unsubMine) unsubMine(); };
  }, [user?.id]);

  // Load my accepted connections (for referrals)
  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(collection(db, 'connections', String(user.id), 'accepted'), (snap) => {
      setMyConnections(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [user?.id]);

  // Load applications addressed to my jobs (as owner)
  useEffect(() => {
    try {
      const uid = getAuth().currentUser?.uid;
      const mongoId = String(user?.id || '');
      if (!uid && !mongoId) return;
      const unsubs: (() => void)[] = [];
      if (uid) {
        const qByUid = query(collectionGroup(db, 'applications'), where('jobOwnerUid', '==', uid), orderBy('createdAt', 'desc'));
        unsubs.push(onSnapshot(qByUid, (snap) => setApplicationsToMine((prev)=>{
          const list = snap.docs.map((d)=>({ id: d.id, ...(d.data() as any) }));
          // merge with previous (from other listener) by id
          const map = new Map<string, any>(prev.map(x=>[x.__mergeId||x.id, x]));
          list.forEach(x=>map.set(x.__mergeId||x.id, x));
          return Array.from(map.values());
        })));
      }
      if (mongoId) {
        const qByMongo = query(collectionGroup(db, 'applications'), where('jobOwnerId', '==', mongoId), orderBy('createdAt', 'desc'));
        unsubs.push(onSnapshot(qByMongo, (snap) => setApplicationsToMine((prev)=>{
          const list = snap.docs.map((d)=>({ id: d.id, ...(d.data() as any) }));
          const map = new Map<string, any>(prev.map(x=>[x.__mergeId||x.id, x]));
          list.forEach(x=>map.set(x.__mergeId||x.id, x));
          return Array.from(map.values());
        })));
      }
      return () => { unsubs.forEach(u=>u()); };
    } catch { return; }
  }, [user?.id]);

  // Load my submitted applications (as applicant)
  useEffect(() => {
    try {
      const uid = getAuth().currentUser?.uid;
      if (!uid) return;
      const qMine = query(collectionGroup(db, 'applications'), where('applicantUid', '==', uid), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(qMine, (snap) => setMyApplications(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))));
      return () => unsub();
    } catch { return; }
  }, [user?.id]);

  // Filtered jobs list from type filters
  const filteredJobs = useMemo(() => {
    if (!Array.isArray(jobs) || typeFilters.length === 0) return jobs;
    const set = new Set(typeFilters);
    return jobs.filter((j:any) => set.has(String(j.type || '').toLowerCase()));
  }, [jobs, typeFilters]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden rounded-3xl shadow-strong border-0 bg-gradient-to-br from-[#0b1b3a] to-[#1d4ed8]">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 p-6 md:p-10 text-white">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs">
                <Briefcase className="h-3.5 w-3.5" /> Careers
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Opportunities that move you forward</h1>
              <p className="text-white/80">Discover roles from the alumni network. {isAlumniOrAdmin ? 'Post and manage opportunities for students.' : 'Apply and let your potential be seen.'}</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {isAlumniOrAdmin ? (
                <>
                  <Button className="h-10 px-5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a]" onClick={() => setPostOpen(true)}>Post Job</Button>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => setViewTab('all')}>View All Jobs</Button>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => setViewTab('applications')}>View Applications</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => setViewTab('all')}>All Jobs</Button>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => setViewTab('applications')}>Applied</Button>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_40%)]" />
            <div className="relative h-full w-full p-6 md:p-8 flex items-center justify-center">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-6 text-white text-center max-w-xs space-y-3">
                <div className="text-sm opacity-90">Tip</div>
                <div className="text-lg font-semibold">{isAlumniOrAdmin ? 'Post jobs for your own startup' : 'Apply with confidence — alumni notice effort'}</div>
                <Button className="h-9 bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a] w-full" onClick={() => setViewTab('all')}>
                  Explore Jobs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Role-based body */}
      {isAlumniOrAdmin ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Share opportunities with students, help them shine
            </CardTitle>
            <CardDescription>Keep your network thriving — internships, jobs, or gigs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as any)} className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Jobs</TabsTrigger>
                <TabsTrigger value="mine">My Postings</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">All Jobs</div>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_LABELS.map(t => {
                      const active = typeFilters.includes(t.key);
                      return (
                        <button
                          key={t.key}
                          className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'text-[#1e3a8a] border-[#1e3a8a]'} `}
                          onClick={()=> setTypeFilters(prev => prev.includes(t.key) ? prev.filter(x=>x!==t.key) : [...prev, t.key])}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Card className="border bg-background">
                  <CardContent className="p-4 space-y-3">
                    {filteredJobs.length === 0 ? (
                      <div className="py-6 text-sm text-muted-foreground">No jobs yet.</div>
                    ) : (
                      filteredJobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">{job.title || job.role}</p>
                            <p className="text-sm text-muted-foreground">{job.company}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{job.type}</Badge>
                              <span className="text-xs text-muted-foreground">{job.mode} • {job.schedule ? (job.schedule === 'full' ? 'Full-time' : 'Part-time') : ''} {job.schedule ? '•' : ''} {job.location}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={()=>{ setSelectedJob(job); setDetailsOpen(true); }}>View</Button>
                            <Button size="sm" onClick={() => setPostOpen(true)}>Post Similar</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="mine">
                {myJobs.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">You have not posted any jobs yet.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {myJobs.map((job) => (
                      <Card key={job.id} className="border hover:shadow-md transition">
                        <CardContent className="p-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{job.title || job.role}</div>
                              <div className="text-sm text-muted-foreground">{job.company}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">{job.type}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{job.mode} • {job.location}</div>
                          <div className="text-xs text-muted-foreground">Applications: {job.applicationsCount ?? 0}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="applications">
                {applicationsToMine.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">No applications yet.</div>
                ) : (
                  <div className="space-y-3 p-4">
                    {applicationsToMine.map((app) => (
                      <div key={app.id} className="p-4 border rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-medium">{app.applicantName} • <span className="text-xs text-muted-foreground">{app.applicantEmail}</span></div>
                          <div className="text-sm text-muted-foreground">Applied for: {app.jobTitle}</div>
                          {app.resume && <a href={app.resume} target="_blank" className="text-xs underline">Resume</a>}
                        </div>
                        <div className="text-xs text-muted-foreground">{new Date(app.createdAt?.toDate?.() || app.createdAt).toLocaleString?.() || ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Apply — showcase your true potential, get hired
            </CardTitle>
            <CardDescription>Find roles across internships, full-time, and gigs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-2">
              <Button onClick={() => setViewTab('all')}>All Jobs</Button>
              <Button variant="outline" onClick={() => setViewTab('applications')}>Applied</Button>
            </div>
            <Card className="border bg-background">
              <CardContent className="p-4 space-y-3">
                {jobs.length === 0 ? (
                  <div className="py-6 text-sm text-muted-foreground">No jobs yet.</div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{job.title || job.role}</p>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{job.type}</Badge>
                          <span className="text-xs text-muted-foreground">{job.mode} • {job.location}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-[#1e3a8a] text-white hover:bg-[#60a5fa]" onClick={() => { setSelectedJob(job); setApplyOpen(true); }}>Apply</Button>
                        <Button size="sm" variant="soft" onClick={() => { setSelectedJob(job); setSelectedRecipients(new Set()); setReferOpen(true); }} disabled={myConnections.length === 0}>Refer</Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            {viewTab === 'applications' && (
              <div className="space-y-3 p-1">
                {myApplications.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">You haven't applied to any jobs yet.</div>
                ) : (
                  myApplications.map((app) => (
                    <div key={app.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium">{app.jobTitle} • <span className="text-xs text-muted-foreground">{app.company}</span></div>
                        {app.resume && <a href={app.resume} target="_blank" className="text-xs underline">Resume</a>}
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(app.createdAt?.toDate?.() || app.createdAt).toLocaleString?.() || ''}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post Job Dialog */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Post a Job</DialogTitle>
            <DialogDescription>Share an opportunity with students</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" placeholder="e.g. Frontend Intern" value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v)=>{ setForm((prev)=>{
                const next = { ...prev, type: v } as typeof prev;
                // Auto-fill requirements for template if empty or previously template-like
                const templ = REQUIREMENT_TEMPLATES[v as keyof typeof REQUIREMENT_TEMPLATES];
                if (templ && (!prev.requirements || prev.requirements === REQUIREMENT_TEMPLATES[prev.type as keyof typeof REQUIREMENT_TEMPLATES])) {
                  next.requirements = templ;
                }
                return next;
              }); }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="job">Job</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="gig">Freelance Gig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Schedule</Label>
              <Select value={form.schedule} onValueChange={(v)=>setForm({...form, schedule: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full-time</SelectItem>
                  <SelectItem value="part">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Work Mode</Label>
              <Select value={form.mode} onValueChange={(v)=>setForm({...form, mode: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea id="requirements" placeholder="Required skills, responsibilities, etc." rows={4} value={form.requirements} onChange={(e)=>setForm({...form, requirements: e.target.value})} />
              <div className="flex flex-wrap gap-2">
                {Object.entries(REQUIREMENT_TEMPLATES).map(([k,v])=> (
                  <button key={k} className="px-2 py-1 rounded border text-xs text-[#1e3a8a] border-[#1e3a8a]" onClick={(e)=>{ e.preventDefault(); setForm(f=>({...f, requirements: v })); }}>
                    Use {k}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pay">Expected Pay</Label>
              <Input id="pay" placeholder="e.g. 50k-70k PKR / month" value={form.pay} onChange={(e)=>setForm({...form, pay: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="e.g. My Startup" value={form.company} onChange={(e)=>setForm({...form, company: e.target.value})} />
            </div>
            {form.mode !== 'remote' && (
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g. Islamabad" value={form.location} onChange={(e)=>setForm({...form, location: e.target.value})} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="soft" onClick={() => setPostOpen(false)}>Cancel</Button>
            <Button className="bg-[#1e3a8a] text-white hover:bg-[#60a5fa]" onClick={async ()=>{
              try {
                if (!user?.id) { toast.error('Not signed in'); return; }
                if (!form.role || !form.type || !form.mode) { toast.error('Fill required fields'); return; }
                const uid = getAuth().currentUser?.uid;
                if (!uid) { toast.error('No auth user'); return; }
                await addDoc(collection(db, 'jobs'), {
                  title: form.role,
                  role: form.role,
                  type: form.type,
                  schedule: form.schedule,
                  mode: form.mode,
                  requirements: form.requirements,
                  pay: form.pay,
                  company: form.company,
                  location: form.location,
                  ownerId: String(user.id),
                  ownerName: user.name,
                  ownerUid: uid,
                  createdAt: serverTimestamp(),
                  applicationsCount: 0,
                });
                setPostOpen(false);
                setForm({ role: '', type: '', schedule: '', mode: '', requirements: '', pay: '', company: '', location: '' });
                toast.success('Job posted');
                setViewTab('mine');
              } catch (e: any) {
                toast.error(e?.message || 'Failed to post');
              }
            }}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title || selectedJob?.role}</DialogTitle>
            <DialogDescription>{selectedJob?.company} • {selectedJob?.mode} • {selectedJob?.location}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="resume">Resume URL</Label>
              <Input id="resume" placeholder="https://..." value={apply.resume} onChange={(e)=>setApply({...apply, resume: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea id="note" rows={3} placeholder="Short note" value={apply.note} onChange={(e)=>setApply({...apply, note: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="soft" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button className="bg-[#1e3a8a] text-white hover:bg-[#60a5fa]" onClick={async ()=>{
              try {
                if (!user?.id) { toast.error('Not signed in'); return; }
                if (!selectedJob?.id) { toast.error('Invalid job'); return; }
                const uid = getAuth().currentUser?.uid;
                if (!uid) { toast.error('No auth user'); return; }
                await addDoc(collection(db, 'jobs', String(selectedJob.id), 'applications'), {
                  jobId: String(selectedJob.id),
                  jobTitle: selectedJob.title || selectedJob.role,
                  company: selectedJob.company || '',
                  jobOwnerId: String(selectedJob.ownerId || ''),
                  jobOwnerUid: String(selectedJob.ownerUid || ''),
                  applicantId: String(user.id),
                  applicantUid: uid,
                  applicantName: user.name,
                  applicantEmail: user.email,
                  resume: apply.resume,
                  note: apply.note,
                  createdAt: serverTimestamp(),
                });
                toast.success('Application submitted');
                setApplyOpen(false);
                setApply({ resume: '', note: '' });
              } catch (e: any) {
                toast.error(e?.message || 'Failed to apply');
              }
            }}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedJob?.title || selectedJob?.role}</DialogTitle>
            <DialogDescription>
              {selectedJob?.company} {selectedJob?.location ? `• ${selectedJob.location}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {selectedJob?.type && <Badge variant="outline" className="text-xs">{selectedJob.type}</Badge>}
              {selectedJob?.mode && <Badge variant="outline" className="text-xs">{selectedJob.mode}</Badge>}
              {selectedJob?.schedule && (
                <Badge variant="outline" className="text-xs">{selectedJob.schedule === 'full' ? 'Full-time' : 'Part-time'}</Badge>
              )}
            </div>
            {selectedJob?.pay && (
              <div className="text-sm"><span className="text-muted-foreground">Pay:</span> {selectedJob.pay}</div>
            )}
            <div className="text-sm"><span className="text-muted-foreground">Posted by:</span> {selectedJob?.ownerName || 'Alumni'}</div>
            {selectedJob?.requirements && (
              <div>
                <div className="text-sm font-medium mb-1">Requirements</div>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedJob.requirements}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="soft" onClick={()=>setDetailsOpen(false)}>Close</Button>
            {!isAlumniOrAdmin && (
              <Button className="bg-[#1e3a8a] text-white hover:bg-[#60a5fa]" onClick={()=>{ setApplyOpen(true); }}>Apply</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refer Dialog (student) */}
      <Dialog open={referOpen} onOpenChange={setReferOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Refer to your connections</DialogTitle>
            <DialogDescription>Select connections to notify about this job</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-auto">
            {myConnections.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2">No connections yet.</div>
            ) : (
              myConnections.map((c) => {
                const active = selectedRecipients.has(String(c.id));
                return (
                  <div key={c.id} className={`flex items-center justify-between p-2 border rounded-lg ${active ? 'border-blue-500' : 'border-border'}`}>
                    <div className="text-sm">
                      <div className="font-medium">{c.name || 'User'}</div>
                    </div>
                    <Button size="sm" variant={active ? 'default' : 'outline'} onClick={() => {
                      setSelectedRecipients((prev) => {
                        const n = new Set(prev);
                        const id = String(c.id);
                        if (n.has(id)) n.delete(id); else n.add(id);
                        return n;
                      });
                    }}>
                      {active ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="soft" onClick={()=>setReferOpen(false)}>Cancel</Button>
            <Button className="bg-[#1e3a8a] text-white hover:bg-[#60a5fa]" onClick={async ()=>{
              try {
                if (!user?.id || !selectedJob?.id) return;
                const toSend = Array.from(selectedRecipients);
                if (toSend.length === 0) { toast.info('Select at least one connection'); return; }
                const deep = new URLSearchParams({ tab: 'careers', job: String(selectedJob.id) }).toString();
                for (const rid of toSend) {
                  await addDoc(collection(db, 'notifications', String(rid), 'items'), {
                    type: 'job_referral',
                    jobId: String(selectedJob.id),
                    jobTitle: selectedJob.title || selectedJob.role || '',
                    company: selectedJob.company || '',
                    referredById: String(user.id),
                    referredByName: user.name || 'Student',
                    link: `/?${deep}`,
                    createdAt: serverTimestamp(),
                    read: false,
                  });
                }
                toast.success('Referral sent');
                setReferOpen(false);
              } catch (e:any) {
                toast.error(e?.message || 'Failed to refer');
              }
            }}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

 
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, collectionGroup, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { Bell, TrendingUp, Users, Calendar, Briefcase, Heart, MessageSquare, Star } from "lucide-react";
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

  // Mock data for UI sections
  const quickStats = [
    { label: 'Connections', value: (connAccepted.length || 0).toString(), change: '+2 this week', icon: Users },
    { label: 'Messages', value: '12', change: '+3 new', icon: MessageSquare },
    { label: 'Events', value: '4', change: '2 upcoming', icon: Calendar },
    { label: 'Job Matches', value: '6', change: 'updated', icon: Briefcase },
  ];

  const recentActivity: Array<{ type: string; title: string; time: string; avatar?: string }> = [
    { type: 'event', title: 'You RSVPed to "Tech Alumni Mixer"', time: '2h ago' },
    { type: 'job', title: 'Referred Ali Raza for PM at Microsoft', time: '1d ago' },
    { type: 'mentorship', title: 'Scheduled mentorship with Maria Khan', time: '3d ago' },
  ];

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

  return (
    <div className="space-y-6">

      {/* Hero Welcome */}
      <Card className="overflow-hidden rounded-2xl shadow-strong border-0">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Left: greeting */}
          <div className="lg:col-span-2 p-6 md:p-8">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Have a nice day!</div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Good day, {user?.name || 'Student'} 👋</h1>
              <p className="text-muted-foreground">Explore your network, find mentors, and track upcoming events.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="h-10 bg-[#1e3a8a] text-white hover:bg-[#60a5fa]" onClick={() => onNavigate('mentorship')}>Find a Mentor</Button>
              <Button variant="outline" className="h-10 border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a]/10" onClick={() => onNavigate('events')}>Browse Events</Button>
            </div>
          </div>
          {/* Right: visual */}
          <div className="relative bg-[linear-gradient(135deg,#0b1b3a_0%,#1e3a8a_70%,#1d4ed8_100%)]">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_40%)]" />
            <div className="relative h-full w-full p-6 md:p-8 flex items-center justify-center">
              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-6 text-white text-center">
                <div className="text-sm opacity-80">Quick tip</div>
                <div className="text-lg font-semibold">Complete your profile to get better matches</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connections</span>
            <div className="inline-flex rounded-lg border bg-muted/30 p-0.5">
              <Button size="sm" variant={connTab==='requests'? 'default':'ghost'} onClick={() => setConnTab('requests')}>Requests {connRequests.length ? <Badge className="ml-1" variant="secondary">{connRequests.length}</Badge> : null}</Button>
              <Button size="sm" variant={connTab==='accepted'? 'default':'ghost'} onClick={() => setConnTab('accepted')}>Accepted {connAccepted.length ? <Badge className="ml-1" variant="secondary">{connAccepted.length}</Badge> : null}</Button>
              <Button size="sm" variant={connTab==='sent'? 'default':'ghost'} onClick={() => setConnTab('sent')}>Sent {connSent.length ? <Badge className="ml-1" variant="secondary">{connSent.length}</Badge> : null}</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {connLoading && (
            <div className="space-y-2">
              {[0,1,2].map((i) => (
                <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          )}
          {!connLoading && connTab === 'requests' && (
            connRequests.length === 0 ? (
              <div className="text-sm text-muted-foreground">No incoming requests</div>
            ) : (
              connRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded border hover:bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8"><AvatarImage src={r.avatar} /><AvatarFallback>{(r.name||'?')[0]}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{r.name || r.id}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.id}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={async () => {
                      try {
                        await setDoc(doc(db, 'connections', user.id, 'accepted', r.id), { id: r.id, name: r.name || r.id, avatar: r.avatar || '' , connectedAt: new Date() });
                        await setDoc(doc(db, 'connections', r.id, 'accepted', user.id), { id: user.id, name: user.name, avatar: user.avatar || '', connectedAt: new Date() });
                        await deleteDoc(doc(db, 'connections', user.id, 'requests', r.id));
                      } catch {}
                    }}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      try { await deleteDoc(doc(db, 'connections', user.id, 'requests', r.id)); } catch {}
                    }}>Decline</Button>
                  </div>
                </div>
              ))
            )
          )}
          {!connLoading && connTab === 'accepted' && (
            connAccepted.length === 0 ? (
              <div className="text-sm text-muted-foreground">No connections yet</div>
            ) : (
              <div className="grid gap-2">
                {connAccepted.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded border hover:bg-muted/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-8 w-8"><AvatarImage src={c.avatar} /><AvatarFallback>{(c.name||'?')[0]}</AvatarFallback></Avatar>
                      <div className="text-sm font-medium truncate">{c.name || c.id}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onNavigate('messages')}>Message</Button>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        try { await deleteDoc(doc(db, 'connections', user.id, 'accepted', c.id)); } catch {}
                        try { await deleteDoc(doc(db, 'connections', c.id, 'accepted', user.id)); } catch {}
                      }}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          {!connLoading && connTab === 'sent' && (
            connSent.length === 0 ? (
              <div className="text-sm text-muted-foreground">No sent requests</div>
            ) : (
              connSent.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded border hover:bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8"><AvatarImage src={s.avatar} /><AvatarFallback>{(s.name||'?')[0]}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.name || s.id}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.id}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={async () => {
                    try { await deleteDoc(doc(db, 'connections', user.id, 'sent', s.id)); } catch {}
                    try { await deleteDoc(doc(db, 'connections', s.id, 'requests', user.id)); } catch {}
                  }}>Cancel</Button>
                </div>
              ))
            )
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <Badge variant="secondary" className="text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Stay updated with your network activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                {activity.avatar ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.avatar} />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {activity.type === "job" && <Briefcase className="h-5 w-5 text-primary" />}
                    {activity.type === "event" && <Calendar className="h-5 w-5 text-primary" />}
                    {activity.type === "mentorship" && <Heart className="h-5 w-5 text-primary" />}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            <Button variant="soft" className="w-full transition-transform hover:scale-[1.02] text-white border-0 bg-[#1e3a8a] hover:bg-[#60a5fa]" onClick={() => onNavigate("community")}> 
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump to what matters most
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-12"
              onClick={() => onNavigate("directory")}
            >
              <Users className="h-5 w-5" />
              Browse Alumni Directory
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-12"
              onClick={() => onNavigate("mentorship")}
            >
              <Heart className="h-5 w-5" />
              Find a Mentor
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-12"
              onClick={() => onNavigate("careers")}
            >
              <Briefcase className="h-5 w-5" />
              Explore Jobs
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-12"
              onClick={() => onNavigate("events")}
            >
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              Don't miss these networking opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Featured Opportunities
            </CardTitle>
            <CardDescription>
              Jobs posted by your alumni network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
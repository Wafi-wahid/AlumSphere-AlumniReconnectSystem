 
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
  const [connTab, setConnTab] = useState<'requests'|'accepted'>('requests');
  const [connRequests, setConnRequests] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  const [connAccepted, setConnAccepted] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);

  useEffect(() => {
    if (!user?.id) return;
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
          eventId: ev.id,
          invitePath: d.ref.path,
          status: (d.data() as any)?.status || 'pending',
          title: e.topic,
          date: e.date,
          time: e.time,
          type: e.type,
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

  // Connections subscriptions
  useEffect(() => {
    if (!user?.id) return;
    const unsubReq = onSnapshot(collection(db, 'connections', user.id, 'requests'), (snap) => {
      setConnRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    const unsubAcc = onSnapshot(collection(db, 'connections', user.id, 'accepted'), (snap) => {
      setConnAccepted(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => { unsubReq(); unsubAcc(); };
  }, [user?.id]);
  const connections = [
    { name: "Ali Raza", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=face", role: "SWE, Google" },
    { name: "Maria Khan", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face", role: "PM, Microsoft" },
    { name: "Zain Ahmed", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", role: "ML Eng, OpenAI" },
  ];
  const recentActivity = [
    {
      type: "mentorship",
      title: "Mentoring session with Alex Chen",
      time: "2 hours ago",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face"
    },
    {
      type: "job",
      title: "New job posting: Senior Engineer at Meta",
      time: "4 hours ago",
      avatar: null
    },
    {
      type: "event",
      title: "AI/ML Workshop registration confirmed",
      time: "1 day ago",
      avatar: null
    }
  ];

  const quickStats = [
    { label: "Profile Views", value: "124", change: "+12%", icon: Users },
    { label: "Connections", value: "67", change: "+8%", icon: MessageSquare },
    { label: "Mentoring Score", value: "4.9", change: "+0.2", icon: Star },
    { label: "Events Attended", value: "8", change: "+2", icon: Calendar }
  ];

  const upcomingEvents = [
    {
      title: "Career Fair 2024",
      date: "March 15",
      time: "10:00 AM",
      type: "Career",
      attendees: 234
    },
    {
      title: "Alumni Networking Mixer",
      date: "March 20",
      time: "6:00 PM", 
      type: "Networking",
      attendees: 89
    },
    {
      title: "Tech Talk: Future of AI",
      date: "March 25",
      time: "2:00 PM",
      type: "Education",
      attendees: 156
    }
  ];

  const featuredOpportunities = [
    {
      title: "Software Engineer",
      company: "Google",
      type: "Full-time",
      postedBy: "Sarah Johnson",
      applicants: 23
    },
    {
      title: "Product Manager",
      company: "Microsoft",
      type: "Full-time", 
      postedBy: "Michael Chen",
      applicants: 41
    },
    {
      title: "Data Scientist Intern",
      company: "Netflix",
      type: "Internship",
      postedBy: "Emily Davis",
      applicants: 67
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Welcome back, {user.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your alumni network today
        </p>
      </div>

      {/* Invitations (below cards) */}
      <Card>
        <CardHeader>
          <CardTitle>Invitations {invites.length ? <Badge variant="secondary">{invites.length}</Badge> : null}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invites.length === 0 ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>No invitations yet.</div>
              <div className="text-xs">
                Why it might be empty:
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>No admin has invited you to host an event yet.</li>
                  <li>You may have already accepted/declined pending invites.</li>
                  <li>Your account must be logged in as the invited user.</li>
                </ul>
              </div>
            </div>
          ) : (
            invites.map((e) => (
              <div key={e.eventId} className="rounded border p-3 space-y-1">
                <div className="font-medium">{e.title}</div>
                <div className="text-xs text-muted-foreground">{e.category} · {e.date} {e.time} · {e.type === 'online' ? 'Webinar' : 'In-Person'} · {e.location}</div>
                <div className="text-xs">Status: <Badge>{e.status}</Badge></div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" onClick={async () => { await updateDoc(doc(db, e.invitePath), { status: 'accepted', respondedAt: new Date() }); await updateDoc(doc(db, 'events', e.eventId), { hostAccepted: true }); }}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={async () => { await updateDoc(doc(db, e.invitePath), { status: 'declined', responseText: "Sorry, I can't make it", respondedAt: new Date() }); await updateDoc(doc(db, 'events', e.eventId), { hostAccepted: false }); }}>Decline</Button>
                  <Button size="sm" variant="ghost" onClick={async () => { await updateDoc(doc(db, e.invitePath), { status: 'referred', responseText: 'I can refer another alumni', respondedAt: new Date() }); await updateDoc(doc(db, 'events', e.eventId), { hostAccepted: false }); }}>Refer other alumni</Button>
                  {e.responses.slice(0,3).map((r: string) => (
                    <Button key={r} size="sm" variant="secondary" onClick={async () => { await updateDoc(doc(db, e.invitePath), { status: 'responded', responseText: r, respondedAt: new Date() }); }}>{r}</Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connections</span>
            <div className="inline-flex rounded border">
              <Button size="sm" variant={connTab==='requests'? 'default':'ghost'} onClick={() => setConnTab('requests')}>Requests {connRequests.length ? <Badge className="ml-1" variant="secondary">{connRequests.length}</Badge> : null}</Button>
              <Button size="sm" variant={connTab==='accepted'? 'default':'ghost'} onClick={() => setConnTab('accepted')}>Accepted {connAccepted.length ? <Badge className="ml-1" variant="secondary">{connAccepted.length}</Badge> : null}</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {connTab === 'requests' ? (
            connRequests.length === 0 ? (
              <div className="text-sm text-muted-foreground">No incoming requests</div>
            ) : (
              connRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded border">
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
                        // add to my accepted
                        await setDoc(doc(db, 'connections', user.id, 'accepted', r.id), { id: r.id, name: r.name || r.id, avatar: r.avatar || '' , connectedAt: new Date() });
                        // mirror to requester accepted
                        await setDoc(doc(db, 'connections', r.id, 'accepted', user.id), { id: user.id, name: user.name, avatar: user.avatar || '', connectedAt: new Date() });
                        // remove request
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
          ) : (
            connAccepted.length === 0 ? (
              <div className="text-sm text-muted-foreground">No connections yet</div>
            ) : (
              <div className="grid gap-2">
                {connAccepted.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded border">
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
            <Button variant="soft" className="w-full transition-transform hover:scale-[1.02]" onClick={() => onNavigate("community")}>
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
                  className="transition-transform hover:scale-[1.03]"
                  onClick={() => toast.success(`Spot reserved for ${event.title}`)}
                >
                  RSVP
                </Button>
              </div>
            ))}
            <Button variant="soft" className="w-full transition-transform hover:scale-[1.02]" onClick={() => onNavigate("events")}>
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
                    className="transition-transform hover:scale-[1.03]"
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
                    className="transition-transform hover:scale-[1.02]"
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
            <Button variant="brand" className="w-full transition-transform hover:scale-[1.02]" onClick={() => onNavigate("careers")}>
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
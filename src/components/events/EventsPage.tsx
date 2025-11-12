import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Users, Clock, Video, CheckCircle, Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/store/auth";
import { db } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, setDoc, doc, collectionGroup, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { collection as fsCollection, addDoc as fsAddDoc } from "firebase/firestore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const mockEvents = [
  {
    id: 1,
    title: "Tech Career Panel: Breaking into FAANG",
    host: "Sarah Johnson",
    hostAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
    date: "Jan 10, 2025",
    time: "6:00 PM - 8:00 PM",
    type: "Webinar",
    location: "Virtual (Zoom)",
    attendees: 234,
    maxAttendees: 500,
    category: "Career",
    description: "Join alumni from Google, Meta, and Amazon as they share their journey and tips for landing your dream tech job.",
    rsvpStatus: null,
    awaitingHost: false
  },
  {
    id: 2,
    title: "Annual Alumni Networking Mixer",
    host: "Alumni Relations Office",
    hostAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    date: "Jan 15, 2025",
    time: "7:00 PM - 10:00 PM",
    type: "In-Person",
    location: "University Hall, Main Campus",
    attendees: 156,
    maxAttendees: 200,
    category: "Networking",
    description: "Connect with fellow alumni across various industries. Food and beverages will be provided.",
    rsvpStatus: null,
    awaitingHost: false
  },
  {
    id: 3,
    title: "Startup Founder Series: From Idea to IPO",
    host: "Michael Chen",
    hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    date: "Jan 20, 2025",
    time: "5:00 PM - 6:30 PM",
    type: "Webinar",
    location: "Virtual (Teams)",
    attendees: 189,
    maxAttendees: 300,
    category: "Entrepreneurship",
    description: "Learn from successful alumni entrepreneurs about building and scaling startups.",
    rsvpStatus: null,
    awaitingHost: false
  },
  {
    id: 4,
    title: "Data Science Workshop",
    host: "Dr. Emily Davis",
    hostAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    date: "Jan 25, 2025",
    time: "2:00 PM - 5:00 PM",
    type: "Workshop",
    location: "Virtual (Zoom)",
    attendees: 98,
    maxAttendees: 100,
    category: "Technical",
    description: "Hands-on workshop covering Python, ML basics, and real-world data science projects.",
    rsvpStatus: null,
    awaitingHost: false
  }
];

const mockPastEvents = [
  {
    id: 5,
    title: "Resume Review Session",
    host: "Career Services",
    date: "Dec 15, 2024",
    attendees: 87,
    rating: 4.8
  }
];

export function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState(mockEvents);
  const [creating, setCreating] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    category: "",
    categoryOther: "",
    type: "online",
    topic: "",
    description: "",
    date: "",
    time: "",
    maxAttendees: "",
    location: "",
    hostMode: "manual" as "manual" | "invite",
    hostName: "",
    hostEmail: "",
    messageTemplate: "Hi {name}, we'd love to invite you to speak on {topic} ({category}).",
  });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [myInvites, setMyInvites] = useState<any[]>([]);
  const [profQuery, setProfQuery] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<any | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [activeInvite, setActiveInvite] = useState<any | null>(null);
  const [adminTab, setAdminTab] = useState<'create'|'manage'>('create');
  const [myRsvpEventIds, setMyRsvpEventIds] = useState<Set<string>>(new Set());
  const [connections, setConnections] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  const [referOpen, setReferOpen] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "events")), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const mapped = list
        .filter((e: any) => {
          // Show publicly if no invite or accepted; always show creator their own awaiting invites
          if (!e.invitedProfileId) return true;
          if (e.hostAccepted === true) return true;
          return user?.id && e.createdBy === user.id;
        })
        .map((e) => ({
        id: e.id,
        title: e.topic,
        host: e.hostName,
        hostAvatar: e.hostAvatar || "",
        date: e.date || new Date().toISOString(),
        time: e.time || "",
        type: e.type === "online" ? "Webinar" : "In-Person",
        location: e.location || (e.type === "online" ? "Virtual" : "On Campus"),
        attendees: 0,
        maxAttendees: e.maxAttendees || 0,
        category: e.category,
        description: e.description,
        rsvpStatus: null,
        awaitingHost: !!(e.invitedProfileId && e.hostAccepted !== true && user?.id && e.createdBy === user.id),
        _sortKey: (() => {
          const dt = `${e.date || ""} ${e.time || ""}`.trim();
          const t = Date.parse(dt) || Date.now();
          return t;
        })(),
      })) as Array<any>;
      mapped.sort((a, b) => a._sortKey - b._sortKey);
      const normalizedMock = mockEvents.map((m) => ({ ...m, awaitingHost: false }));
      setEvents([...mapped.map(({ _sortKey, ...rest }) => rest), ...normalizedMock]);
    });
    return () => unsub();
  }, [myInvites, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(collectionGroup(db, 'rsvps'), (snap) => {
      const mine = snap.docs.filter((d) => d.id === user.id && (d.data() as any)?.status === 'registered');
      const ids = new Set<string>();
      for (const d of mine) {
        const parentEventRef = d.ref.parent.parent;
        if (parentEventRef) ids.add(parentEventRef.id);
      }
      setMyRsvpEventIds(ids);
    });
    return () => unsub();
  }, [user?.id]);

  // Load accepted connections for current user (MVP)
  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(collection(db, 'connections', user.id, 'accepted'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      // normalize to {id, name, avatar}
      setConnections(list.map((c: any) => ({ id: c.id, name: c.name || c.displayName || 'Connection', avatar: c.avatar || '' })));
    });
    return () => unsub();
  }, [user?.id]);

  // Load my sent connection requests to prevent duplicates
  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(collection(db, 'connections', user.id, 'sent'), (snap) => {
      const ids = new Set<string>(snap.docs.map((d) => d.id));
      setSentRequests(ids);
    });
    return () => unsub();
  }, [user?.id]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "profiles"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setProfiles(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (newEvent.hostMode !== 'manual') { setMatchedProfile(null); return; }
    const email = newEvent.hostEmail.trim().toLowerCase();
    const name = newEvent.hostName.trim().toLowerCase();
    if (!email && !name) { setMatchedProfile(null); return; }
    const found = profiles.find((p) => {
      const pEmail = String(p.email || '').toLowerCase();
      const pName = String(p.name || '').toLowerCase();
      return (email && pEmail === email) || (name && pName === name);
    });
    setMatchedProfile(found || null);
  }, [newEvent.hostMode, newEvent.hostEmail, newEvent.hostName, profiles]);

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams();
        if (profQuery) params.set('q', profQuery);
        if (filterSkill) params.set('skill', filterSkill);
        if (filterCompany) params.set('company', filterCompany);
        if (filterLocation) params.set('location', filterLocation);
        const res = await api<{ users: any[] }>(`/admin/users/alumni-search?${params.toString()}`);
        const srv = (res.users || []).map((u: any) => ({ id: `srv-${u.id}`, name: u.name, email: u.email, avatar: "", role: "Alumni", company: u.currentCompany || "", location: u.location || "", skills: (u.skills || "").split(',').map((s: string) => s.trim()).filter(Boolean) }));
        setProfiles((prev) => {
          const byId: Record<string, any> = {};
          [...prev, ...srv].forEach((p) => { byId[p.id] = p; });
          return Object.values(byId);
        });
      } catch (e) {
        // ignore silently for non-super admins without access
      }
    })();
  }, [profQuery, filterSkill, filterCompany, filterLocation]);

  useEffect(() => {
    if (!user?.id) return;
    const qInv = collectionGroup(db, 'invites');
    const unsub = onSnapshot(qInv, async (snap) => {
      const mine = snap.docs.filter((d) => (d.data() as any)?.userId === user.id);
      const items: any[] = [];
      for (const d of mine) {
        const parentEventRef = d.ref.parent.parent;
        if (!parentEventRef) continue;
        const ev = await getDoc(parentEventRef);
        if (!ev.exists()) continue;
        const e = ev.data() as any;
        items.push({
          id: ev.id,
          title: e.topic,
          host: e.hostName,
          date: e.date,
          time: e.time,
          type: e.type === 'online' ? 'Webinar' : 'In-Person',
          location: e.location,
          category: e.category,
          description: e.description,
          inviteStatus: (d.data() as any)?.status || 'pending',
          inviteRefPath: d.ref.path,
          responses: (d.data() as any)?.responses || [],
        });
      }
      setMyInvites(items);
    });
    return () => unsub();
  }, [user?.id]);

  const filteredProfiles = useMemo(() => {
    const q = profQuery.toLowerCase();
    return profiles.filter((p) => {
      const skills = Array.isArray(p.skills) ? p.skills : String(p.skills || "").split(",").map((s: string) => s.trim());
      const matchesQ = !q || (p.name || "").toLowerCase().includes(q) || (p.company || "").toLowerCase().includes(q) || (p.role || "").toLowerCase().includes(q);
      const matchesSkill = !filterSkill || skills.some((s: string) => s.toLowerCase().includes(filterSkill.toLowerCase()));
      const matchesCompany = !filterCompany || String(p.company || "").toLowerCase().includes(filterCompany.toLowerCase());
      const matchesLocation = !filterLocation || String(p.location || "").toLowerCase().includes(filterLocation.toLowerCase());
      return matchesQ && matchesSkill && matchesCompany && matchesLocation;
    });
  }, [profiles, profQuery, filterSkill, filterCompany, filterLocation]);

  const handleRSVP = async (eventId: number | string, status: string | null) => {
    setEvents(events.map(event => event.id === eventId ? { ...event, rsvpStatus: status } : event));
    try {
      if (!user?.id || typeof eventId !== 'string') return;
      const rsvpRef = doc(db, "events", eventId, "rsvps", user.id);
      if (status) {
        await setDoc(rsvpRef, { status, updatedAt: new Date() });
      } else {
        // remove RSVP document so My Events no longer shows it
        await import('firebase/firestore').then(async (m) => {
          const { deleteDoc } = m;
          await deleteDoc(rsvpRef);
        });
      }
    } catch {}
  };

  const createConversationAndInvite = async (profile: any) => {
    const me = user?.id;
    if (!me) throw new Error("No user");
    const other = String(profile.id);
    const convKey = [me, other].sort().join(":");
    const convRef = doc(db, "conversations", convKey);
    const text = newEvent.messageTemplate
      .replace("{name}", profile.name || "")
      .replace("{topic}", newEvent.topic)
      .replace("{category}", newEvent.category || newEvent.categoryOther);
    await setDoc(convRef, {
      participants: [me, other],
      participantNames: { [me]: user?.name || "Me", [other]: profile.name || "Alumni" },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSenderId: me,
      lastSenderName: user?.name || "Admin",
      lastMessage: text,
    }, { merge: true });
    await addDoc(collection(convRef, "messages"), {
      senderId: me,
      senderName: user?.name || "Admin",
      type: 'host_invite',
      eventId: null,
      text,
      createdAt: serverTimestamp(),
    });
    return convKey;
  };

  const handleCreateEvent = async () => {
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) { toast.error("Not allowed"); return; }
    try {
      setCreating(true);
      const nextErrors: Record<string, string> = {};
      const categoryValue = newEvent.category === "other" ? newEvent.categoryOther : newEvent.category;
      if (!categoryValue) nextErrors.category = "Select category";
      if (!newEvent.type) nextErrors.type = "Select type";
      if (!newEvent.topic.trim()) nextErrors.topic = "Topic is required";
      if (!newEvent.description.trim()) nextErrors.description = "Description is required";
      if (!newEvent.date) nextErrors.date = "Date is required";
      if (!newEvent.time) nextErrors.time = "Time is required";
      if (newEvent.hostMode === 'manual') {
        if (!newEvent.hostName.trim()) nextErrors.hostName = "Host name required";
        if (!newEvent.hostEmail.trim()) nextErrors.hostEmail = "Host email required";
      } else {
        if (!selectedProfile) nextErrors.selectedProfile = "Select a host";
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) { setCreating(false); return; }
      let hostName = newEvent.hostName;
      let hostEmail = newEvent.hostEmail;
      let hostAvatar = "";
      let invitedProfileId: string | null = null;
      if (newEvent.hostMode === "invite") {
        if (!selectedProfile) { toast.error("Select a host"); setCreating(false); return; }
        const resolvedUid = (selectedProfile as any).uid
          || profiles.find(p => String(p.email || '').toLowerCase() === String(selectedProfile.email || '').toLowerCase())?.id
          || (String(selectedProfile.id).startsWith('srv-') ? null : selectedProfile.id);
        invitedProfileId = resolvedUid;
        hostName = selectedProfile.name || hostName;
        hostEmail = selectedProfile.email || hostEmail;
        hostAvatar = selectedProfile.avatar || "";
        if (invitedProfileId) {
          await createConversationAndInvite(selectedProfile);
        } else {
          toast.message('Event created (external host)', { description: 'The selected host is not linked to a Firebase account. Saved as external invite.' });
        }
      } else if (newEvent.hostMode === 'manual' && matchedProfile) {
        invitedProfileId = matchedProfile.id;
        hostName = matchedProfile.name || hostName;
        hostEmail = matchedProfile.email || hostEmail;
        hostAvatar = matchedProfile.avatar || "";
        await createConversationAndInvite(matchedProfile);
      }
      const docRef = await addDoc(collection(db, "events"), {
        category: categoryValue,
        type: newEvent.type,
        topic: newEvent.topic,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
        maxAttendees: newEvent.maxAttendees ? Number(newEvent.maxAttendees) : 0,
        location: newEvent.location,
        hostName,
        hostEmail,
        hostAvatar,
        invitedProfileId: invitedProfileId ?? null,
        hostAccepted: invitedProfileId ? false : true,
        externalInviteEmail: invitedProfileId ? null : (newEvent.hostMode === 'manual' ? newEvent.hostEmail.trim() : null),
        externalInviteMessage: invitedProfileId ? null : (newEvent.hostMode === 'manual' ? newEvent.messageTemplate
          .replace("{name}", newEvent.hostName)
          .replace("{topic}", newEvent.topic)
          .replace("{category}", categoryValue) : undefined),
        createdBy: user.id,
        createdAt: new Date(),
      });
      if (invitedProfileId) {
        const sid = String(invitedProfileId);
        try {
          await setDoc(doc(db, 'events', docRef.id, 'invites', sid), {
            userId: sid,
            status: 'pending',
            createdAt: new Date(),
            responses: [
              "I can join at that time",
              "Sorry, I can't make it",
              "I can refer another alumni",
            ],
          });
        } catch (e: any) {
          toast.error('Invite write blocked by rules');
        }
      } else if (newEvent.hostMode === 'invite') {
        toast.message('Event created (external host)', { description: 'The selected host is not linked to a Firebase account. Saved as external invite.' });
      }
      // Send email if external invite
      try {
        if (!invitedProfileId && newEvent.hostMode === 'manual' && newEvent.hostEmail.trim()) {
          await api(`/admin/send-email`, {
            method: 'POST',
            body: JSON.stringify({
              to: newEvent.hostEmail.trim(),
              subject: `Invitation to host: ${newEvent.topic}`,
              text: newEvent.messageTemplate
                .replace("{name}", newEvent.hostName)
                .replace("{topic}", newEvent.topic)
                .replace("{category}", categoryValue),
            })
          });
          toast.message('Event created', { description: 'External invite email sent' });
        } else {
          toast.success('Event created');
        }
      } catch (e) {
        toast.message('Event created', { description: 'Email not sent (server email not configured)' });
      }
      setNewEvent({ category: "", categoryOther: "", type: "online", topic: "", description: "", date: "", time: "", maxAttendees: "", location: "", hostMode: "manual", hostName: "", hostEmail: "", messageTemplate: newEvent.messageTemplate });
      setSelectedProfile(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Events & Webinars</h1>
        <p className="text-muted-foreground">
          Join alumni events, webinars, and networking opportunities
        </p>
      </div>

      {(user?.role === "admin" || user?.role === "super_admin") && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Admin</CardTitle>
              <div className="inline-flex rounded border">
                <Button size="sm" variant={adminTab==='create'?'default':'ghost'} onClick={() => setAdminTab('create')}>Create Event</Button>
                <Button size="sm" variant={adminTab==='manage'?'default':'ghost'} onClick={() => setAdminTab('manage')}>Manage</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminTab === 'create' && (
              <>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Category</label>
                <Select value={newEvent.category} onValueChange={(v) => setNewEvent({ ...newEvent, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                   <SelectItem value="career">Career</SelectItem>
                   <SelectItem value="networking">Networking</SelectItem>
                   <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                   <SelectItem value="technical">Technical</SelectItem>
                   <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <div className="text-xs text-red-500">{errors.category}</div>}
                {newEvent.category === "other" && (
                  <Input placeholder="Category" value={newEvent.categoryOther} onChange={(e) => setNewEvent({ ...newEvent, categoryOther: e.target.value })} />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm">Type</label>
                <Select value={newEvent.type} onValueChange={(v) => setNewEvent({ ...newEvent, type: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">online</SelectItem>
                    <SelectItem value="on_campus">on campus</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <div className="text-xs text-red-500">{errors.type}</div>}
              </div>
              <div className="space-y-2">
                <label className="text-sm">Date</label>
                <Input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
                {errors.date && <div className="text-xs text-red-500">{errors.date}</div>}
              </div>
              <div className="space-y-2">
                <label className="text-sm">Time</label>
                <Input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} />
                {errors.time && <div className="text-xs text-red-500">{errors.time}</div>}
              </div>
              <div className="space-y-2">
                <label className="text-sm">Topic</label>
                <Input value={newEvent.topic} onChange={(e) => setNewEvent({ ...newEvent, topic: e.target.value })} placeholder="Name of topic" />
                {errors.topic && <div className="text-xs text-red-500">{errors.topic}</div>}
              </div>
              <div className="space-y-2">
                <label className="text-sm">Description</label>
                <Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="2-3 lines outline" />
                {errors.description && <div className="text-xs text-red-500">{errors.description}</div>}
              </div>
              <div className="space-y-2">
                <label className="text-sm">Max attendees</label>
                <Input type="number" min={0} value={newEvent.maxAttendees} onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Location</label>
                <Input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder={newEvent.type === 'online' ? 'Virtual (Zoom/Teams link)' : 'On Campus venue'} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm">Host Mode</label>
                <Select value={newEvent.hostMode} onValueChange={(v) => setNewEvent({ ...newEvent, hostMode: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Select host mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="invite">Invite from alumni</SelectItem>
                  </SelectContent>
                </Select>
                {(selectedProfile || matchedProfile) && (
                  <div className="mt-2 flex items-center justify-between rounded border p-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-6 w-6"><AvatarImage src={(selectedProfile||matchedProfile)?.avatar} /><AvatarFallback>{(((selectedProfile||matchedProfile)?.name)||'?')[0]}</AvatarFallback></Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">Selected host: {(selectedProfile||matchedProfile)?.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{(selectedProfile||matchedProfile)?.email || '—'} · {(selectedProfile||matchedProfile)?.company || '—'} · {(selectedProfile||matchedProfile)?.location || '—'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedProfile(null); setMatchedProfile(null); }}>Change</Button>
                    </div>
                  </div>
                )}
              </div>
              {newEvent.hostMode === "manual" ? (
                <div className="grid md:grid-cols-2 gap-2">
                  <Input placeholder="Host name" value={newEvent.hostName} onChange={(e) => setNewEvent({ ...newEvent, hostName: e.target.value })} />
                  <Input placeholder="Host email" value={newEvent.hostEmail} onChange={(e) => setNewEvent({ ...newEvent, hostEmail: e.target.value })} />
                  {(errors.hostName || errors.hostEmail) && (
                    <div className="md:col-span-2 text-xs text-red-500">{errors.hostName || errors.hostEmail}</div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid md:grid-cols-4 gap-2">
                    <Input placeholder="Search name/company/role" value={profQuery} onChange={(e) => setProfQuery(e.target.value)} />
                    <Input placeholder="Filter skill" value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)} />
                    <Input placeholder="Filter company" value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} />
                    <Input placeholder="Filter location" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} />
                  </div>
                  <div className="max-h-64 overflow-auto border rounded p-2 space-y-2">
                    {filteredProfiles.slice(0, 50).map((p) => (
                      <div key={p.id} className={`flex items-center justify-between p-2 rounded ${selectedProfile?.id === p.id ? 'bg-accent' : ''}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-6 w-6"><AvatarImage src={p.avatar} /><AvatarFallback>{(p.name||'?')[0]}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{p.name || 'Unnamed'}</div>
                            <div className="text-xs text-muted-foreground truncate">{p.role || '—'} · {p.company || '—'} · {p.location || '—'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="sm" variant={selectedProfile?.id === p.id ? 'default' : 'outline'} onClick={() => setSelectedProfile(p)}>
                            {selectedProfile?.id === p.id ? 'Selected' : 'Select'}
                          </Button>
                          <Button size="sm" variant="ghost" disabled={connections.some(c=>String(c.id)===String(p.id)) || sentRequests.has(String(p.id))} onClick={async () => {
                            if (!user?.id) { toast.error('Login required'); return; }
                            try {
                              await setDoc(doc(db, 'connections', String(p.id), 'requests', String(user.id)), {
                                id: String(user.id),
                                name: user?.name || 'User',
                                avatar: user?.avatar || '',
                                createdAt: new Date(),
                              });
                              await setDoc(doc(db, 'connections', String(user.id), 'sent', String(p.id)), {
                                id: String(p.id),
                                name: p?.name || 'Alumni',
                                avatar: p?.avatar || '',
                                createdAt: new Date(),
                              });
                              toast.success('Connection request sent');
                            } catch (e:any) {
                              toast.error(e?.message || 'Failed to send request');
                            }
                          }}>Connect</Button>
                        </div>
                      </div>
                    ))}
                    {filteredProfiles.length === 0 && <div className="text-sm text-muted-foreground">No matching alumni</div>}
                  </div>
                  
                  {errors.selectedProfile && <div className="text-xs text-red-500">{errors.selectedProfile}</div>}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm">Invite Message</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Use placeholders: {"{name}"}, {"{topic}"}, {"{category}"}. They will be auto-filled in the first message.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Textarea value={newEvent.messageTemplate} onChange={(e) => setNewEvent({ ...newEvent, messageTemplate: e.target.value })} />
            </div>
            </>
            )}
            {adminTab==='create' && (
              <Button className="text-primary-foreground border-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]" onClick={handleCreateEvent} disabled={creating}>{creating ? "Creating..." : "Create Event"}</Button>
            )}
            {adminTab==='manage' && (
              <div className="space-y-2">
                {events.filter((e: any) => e.awaitingHost).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No pending invites</div>
                ) : (
                  events.filter((e: any) => e.awaitingHost).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between border rounded p-2">
                      <div className="truncate">
                        <div className="text-sm font-medium truncate">{e.title}</div>
                        <div className="text-xs text-muted-foreground truncate">Host: {e.host} · {e.date} {e.time}</div>
                      </div>
                      <Badge variant="secondary">Awaiting host</Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-primary/10 rounded-lg min-w-[100px]">
                      <p className="text-2xl font-bold text-primary">
                        {new Date(event.date).getDate()}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-xl font-semibold">{event.title}</h3>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={event.hostAvatar} alt={event.host} />
                                <AvatarFallback>{event.host[0]}</AvatarFallback>
                              </Avatar>
                              <p className="text-sm text-muted-foreground">Hosted by {event.host}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {event.awaitingHost && <Badge variant="secondary">Awaiting host</Badge>}
                            <Badge>{event.category}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Video className="h-4 w-4" />
                          {event.type}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {event.attendees}/{event.maxAttendees} attending
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {event.rsvpStatus === null ? (
                          <>
                            <Button size="sm" className="text-primary-foreground border-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]" onClick={() => handleRSVP(event.id, 'registered')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Register
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRSVP(event.id, 'interested')}>
                              <Star className="h-4 w-4 mr-2" />
                              Interested
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {event.rsvpStatus === 'registered' ? 'Registered' : 'Interested'}
                            </Badge>
                            <Button size="sm" variant="outline" onClick={() => handleRSVP(event.id, null)}>
                              Cancel RSVP
                            </Button>
                          </div>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setSelectedEventId(String(event.id))}>View detail</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {mockPastEvents.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">Hosted by {event.host}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.attendees} attended
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {event.rating} rating
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">View Recording</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="my-events" className="space-y-4">
          {/* RSVP'd events for this user */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Your RSVPs</div>
            {events.filter((e: any) => myRsvpEventIds.has(String(e.id))).length === 0 ? (
              <Card><CardContent className="p-4 text-sm text-muted-foreground">No RSVPs yet</CardContent></Card>
            ) : (
              events.filter((e: any) => myRsvpEventIds.has(String(e.id))).map((e: any) => (
                <Card key={e.id}><CardContent className="p-4 flex items-center justify-between"><div className="truncate"><div className="text-sm font-medium truncate">{e.title}</div><div className="text-xs text-muted-foreground truncate">{e.date} {e.time} · {e.type} · {e.location}</div></div><Badge variant="secondary">RSVP'd</Badge></CardContent></Card>
              ))
            )}
          </div>

          {/* Host invitations for this user */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Your Invitations</div>
            {myInvites.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">No invitations yet</CardContent>
              </Card>
            ) : (
              myInvites.map((e) => (
                <Card key={e.id}>
                  <CardContent className="p-6 space-y-2">
                    <div className="text-lg font-semibold">{e.title}</div>
                    <div className="text-sm text-muted-foreground">Category: {e.category} · {e.date} {e.time} · {e.type} · {e.location}</div>
                    <div className="text-sm">Invite status: <Badge>{e.inviteStatus}</Badge></div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" onClick={async () => { await updateDoc(doc(db, e.inviteRefPath), { status: 'accepted', respondedAt: new Date() }); await updateDoc(doc(db, 'events', e.id), { hostAccepted: true }); toast.success('Accepted'); }}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={async () => { await updateDoc(doc(db, e.inviteRefPath), { status: 'declined', responseText: "Sorry, I can't make it", respondedAt: new Date() }); await updateDoc(doc(db, 'events', e.id), { hostAccepted: false }); toast.message('Declined', { description: "We'll notify the admin." }); }}>Decline</Button>
                      <Button size="sm" variant="ghost" onClick={async () => { await updateDoc(doc(db, e.inviteRefPath), { status: 'referred', responseText: 'I can refer another alumni', respondedAt: new Date() }); await updateDoc(doc(db, 'events', e.id), { hostAccepted: false }); toast.message('Referred', { description: 'Thanks for the referral!' }); }}>Refer other alumni</Button>
                      <div className="flex items-center gap-2">
                        {e.responses.slice(0,3).map((r: string) => (
                          <Button key={r} size="sm" variant="secondary" onClick={async () => { await updateDoc(doc(db, e.inviteRefPath), { status: 'responded', responseText: r, respondedAt: new Date() }); await updateDoc(doc(db, 'events', e.id), { hostAccepted: r.toLowerCase().includes('join') ? true : false }); toast.success('Response sent'); }}>{r}</Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      

      {/* Invite popup for host */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event invitation</DialogTitle>
          </DialogHeader>
          {activeInvite && (
            <div className="space-y-2">
              <div className="text-sm font-medium">{activeInvite.title}</div>
              <div className="text-xs text-muted-foreground">{activeInvite.category} · {activeInvite.date} {activeInvite.time} · {activeInvite.type} · {activeInvite.location}</div>
            </div>
          )}
          <DialogFooter className="flex gap-2 justify-between items-center">
            <div>
              <Button size="sm" variant="outline" onClick={() => setReferOpen(true)}>Refer from connections</Button>
            </div>
            {activeInvite && (
              <>
                <Button size="sm" onClick={async () => { if (!activeInvite) return; await updateDoc(doc(db, activeInvite.inviteRefPath), { status: 'accepted', respondedAt: new Date() }); await updateDoc(doc(db, 'events', activeInvite.id), { hostAccepted: true }); setInviteModalOpen(false); toast.success('Accepted'); }}>Accept</Button>
                <Button size="sm" variant="outline" onClick={async () => { if (!activeInvite) return; await updateDoc(doc(db, activeInvite.inviteRefPath), { status: 'declined', responseText: "Sorry, I can't make it", respondedAt: new Date() }); await updateDoc(doc(db, 'events', activeInvite.id), { hostAccepted: false }); setInviteModalOpen(false); toast.message('Declined'); }}>Decline</Button>
                <Button size="sm" variant="ghost" onClick={async () => { if (!activeInvite) return; await updateDoc(doc(db, activeInvite.inviteRefPath), { status: 'referred', responseText: 'I can refer another alumni', respondedAt: new Date() }); await updateDoc(doc(db, 'events', activeInvite.id), { hostAccepted: false }); setInviteModalOpen(false); toast.message('Referred'); }}>Quick refer</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refer picker dialog */}
      <Dialog open={referOpen} onOpenChange={setReferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refer from your connections</DialogTitle>
          </DialogHeader>
          {connections.length === 0 ? (
            <div className="text-sm text-muted-foreground">No connections yet</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {connections.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-6 w-6"><AvatarImage src={c.avatar} /><AvatarFallback>{(c.name||'?')[0]}</AvatarFallback></Avatar>
                    <div className="text-sm font-medium truncate">{c.name}</div>
                  </div>
                  <Button size="sm" onClick={async () => {
                    if (!activeInvite) return;
                    try {
                      await updateDoc(doc(db, activeInvite.inviteRefPath), {
                        status: 'referred',
                        respondedAt: new Date(),
                        referral: { by: user?.id, referredUid: c.id, referredName: c.name, createdAt: new Date() },
                      });
                      await updateDoc(doc(db, 'events', activeInvite.id), { hostAccepted: false });
                      setReferOpen(false); setInviteModalOpen(false);
                      toast.success('Referred connection');
                    } catch (e:any) {
                      toast.error(e?.message || 'Failed to refer');
                    }
                  }}>Refer</Button>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReferOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEventId} onOpenChange={(open) => { if (!open) setSelectedEventId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {events.filter((e) => String(e.id) === String(selectedEventId)).map((e) => (
              <div key={e.id} className="space-y-2">
                <div className="text-xl font-semibold">{e.title}</div>
                <div className="text-sm text-muted-foreground">Hosted by {e.host}</div>
                <div className="text-sm">{e.date} {e.time} · {e.type} · {e.location}</div>
                <div className="text-sm">Category: {e.category}</div>
                <div className="text-sm">{e.description}</div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="text-primary-foreground border-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]" onClick={() => handleRSVP(e.id, 'registered')}>Register</Button>
                  <Button size="sm" variant="outline" onClick={() => handleRSVP(e.id, 'interested')}>Interested</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedEventId(null)}>Close</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon, MapPin, Users, Clock, Video, CheckCircle, Star, Info, CalendarDays, Trophy, Target, Edit, Trash2, UserCheck, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/store/auth";
import { RecommendationTeaser } from "@/components/recommendations/RecommendationTeaser";
import { db } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, setDoc, doc, collectionGroup, getDoc, updateDoc, serverTimestamp, arrayUnion, deleteDoc, where } from "firebase/firestore";
import { toast } from "sonner";
import { collection as fsCollection, addDoc as fsAddDoc } from "firebase/firestore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Custom styles for calendar
const customCalendarStyles = `
  .custom-calendar {
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    background: white;
  }
  
  .custom-calendar .react-calendar__navigation {
    display: flex;
    height: 44px;
    background: linear-gradient(to right, #f8fafc, #f1f5f9);
    border-bottom: 1px solid #e2e8f0;
    border-radius: 12px 12px 0 0;
  }
  
  .custom-calendar .react-calendar__navigation button {
    background: transparent;
    border: none;
    color: #475569;
    font-weight: 600;
    font-size: 14px;
    padding: 8px 12px;
    border-radius: 8px;
    transition: all 0.2s;
  }
  
  .custom-calendar .react-calendar__navigation button:hover {
    background: #3b82f6;
    color: white;
  }
  
  .custom-calendar .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    font-weight: 600;
    font-size: 12px;
    color: #64748b;
    padding: 12px 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .custom-calendar .react-calendar__month-view__weekdays__weekday {
    padding: 8px 0;
  }
  
  .custom-calendar .react-calendar__month-view__days__day {
    position: relative;
    min-height: 80px;
    border: 1px solid #f1f5f9;
    background: white;
    transition: all 0.2s;
  }
  
  .custom-calendar .react-calendar__month-view__days__day:hover {
    background: #f0f9ff;
    border-color: #3b82f6;
    transform: scale(1.02);
  }
  
  .custom-calendar .react-calendar__month-view__days__day--neighboringMonth {
    background: #f8fafc;
    color: #94a3b8;
  }
  
  .custom-calendar .react-calendar__month-view__days__day--active {
    background: #3b82f6 !important;
    color: white !important;
    border-color: #3b82f6 !important;
    font-weight: 600;
  }
  
  .custom-calendar .react-calendar__tile {
    padding: 8px;
  }
  
  .custom-calendar .react-calendar__month-view__days__day--weekend {
    color: #ef4444;
  }
  
  .custom-calendar abbr {
    text-decoration: none;
    font-weight: 600;
    font-size: 13px;
  }
  
  /* Fix calendar modal z-index */
  .custom-calendar-modal {
    z-index: 9999 !important;
  }
`;

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
  const [adminTab, setAdminTab] = useState<'create'|'manage'|null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<any | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any | null>(null);
  const [myRegisteredEvents, setMyRegisteredEvents] = useState<any[]>([]);
  const [myRsvpEventIds, setMyRsvpEventIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("upcoming");
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

  // Fetch user's registered events
  useEffect(() => {
    if (!user?.id) return;
    const q = query(collection(db, "eventRegistrations"), where("userId", "==", user.id));
    const unsub = onSnapshot(q, (snap) => {
      const registrations = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setMyRegisteredEvents(registrations);
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
    const name = newEvent.hostName.trim().toLowerCase();
    if (!name) { setMatchedProfile(null); return; }
    const found = profiles.find((p) => {
      const pName = String(p.name || '').toLowerCase();
      return name && pName === name;
    });
    setMatchedProfile(found || null);
  }, [newEvent.hostMode, newEvent.hostName, profiles]);

  // Clear location when switching event types
  useEffect(() => {
    setNewEvent(prev => ({ ...prev, location: "" }));
  }, [newEvent.type]);

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

    // Also create a notification for the alumni user
    try {
      await addDoc(collection(db, "notifications", other, "items"), {
        type: 'event_invite',
        title: 'Event Invitation',
        message: `You have been invited to host an event: ${newEvent.topic}`,
        data: {
          eventId: editingEventId || 'new',
          eventName: newEvent.topic,
          invitedBy: user?.name || 'Admin',
          invitedAt: new Date(),
        },
        read: false,
        createdAt: serverTimestamp(),
      });
      console.log('Event invitation notification created successfully');
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
    
    return convKey;
  };

  const handleCreateEvent = async () => {
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) { toast.error("Not allowed"); return; }
    try {
      setCreating(true);
      const nextErrors: Record<string, string> = {};
      if (!newEvent.category) nextErrors.category = "Category required";
      if (!newEvent.topic.trim()) nextErrors.topic = "Topic required";
      if (!newEvent.description.trim()) nextErrors.description = "Description required";
      if (!newEvent.date) nextErrors.date = "Date required";
      if (!newEvent.time) nextErrors.time = "Time is required";
      if (newEvent.hostMode === 'manual') {
        if (!newEvent.hostName.trim()) nextErrors.hostName = "Host name required";
      } else {
        if (!selectedProfile) nextErrors.selectedProfile = "Select a host";
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) { setCreating(false); return; }
      let hostName = newEvent.hostName;
      let hostAvatar = "";
      let invitedProfileId: string | null = null;
      if (newEvent.hostMode === "invite") {
        const resolvedUid = String(selectedProfile.id).startsWith('srv-') 
          ? selectedProfile.id.replace('srv-', '')
          : selectedProfile.id;
        invitedProfileId = resolvedUid;
        hostName = selectedProfile.name || hostName;
        hostAvatar = selectedProfile.avatar || "";
        if (invitedProfileId) {
          await createConversationAndInvite(selectedProfile);
        } else {
          toast.message('Event created (external host)', { description: 'The selected host is not linked to a Firebase account. Saved as external invite.' });
        }
      } else if (newEvent.hostMode === 'manual' && matchedProfile) {
        invitedProfileId = matchedProfile.id;
        hostName = matchedProfile.name || hostName;
        hostAvatar = matchedProfile.avatar || "";
        await createConversationAndInvite(matchedProfile);
      }
      const categoryValue = newEvent.category === "other" ? newEvent.categoryOther : newEvent.category;
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
        hostAvatar,
        invitedProfileId: invitedProfileId ?? null,
        hostAccepted: invitedProfileId ? false : true,
        externalInviteEmail: null,
        externalInviteMessage: null,
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
            ],
          });
        } catch (e: any) {
          console.error('Invite write blocked by rules', e);
          toast.error('Invite write blocked by rules');
        }
      } else if (newEvent.hostMode === 'invite') {
        toast.message('Event created (external host)', { description: 'The selected host is not linked to a Firebase account. Saved as external invite.' });
      }
      toast.success('Event created');
      setNewEvent({ category: "", categoryOther: "", type: "online", topic: "", description: "", date: "", time: "", maxAttendees: "", location: "", hostMode: "manual", hostName: "", messageTemplate: newEvent.messageTemplate });
      setSelectedProfile(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  const handleEditEvent = (eventId: string) => {
    // Find the event and populate form for editing
    const eventToEdit = events.find(e => String(e.id) === eventId);
    if (eventToEdit) {
      setNewEvent({
        category: eventToEdit.category === "other" ? "other" : eventToEdit.category,
        categoryOther: eventToEdit.category === "other" ? eventToEdit.category : "",
        type: eventToEdit.type,
        topic: eventToEdit.title,
        description: eventToEdit.description,
        date: eventToEdit.date,
        time: eventToEdit.time,
        maxAttendees: eventToEdit.maxAttendees?.toString() || "",
        location: eventToEdit.location,
        hostMode: "manual",
        hostName: eventToEdit.host || "",
        messageTemplate: newEvent.messageTemplate
      });
      setAdminTab('create');
      setEditingEventId(eventId); // Track which event is being edited
      toast.success('Event loaded for editing');
    }
  };

  const handleUpdateEvent = async () => {
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) { toast.error("Not allowed"); return; }
    if (!editingEventId) { toast.error("No event selected for editing"); return; }
    
    try {
      setCreating(true);
      const nextErrors: Record<string, string> = {};
      if (!newEvent.category) nextErrors.category = "Category required";
      if (!newEvent.topic.trim()) nextErrors.topic = "Topic required";
      if (!newEvent.description.trim()) nextErrors.description = "Description required";
      if (!newEvent.date) nextErrors.date = "Date required";
      if (!newEvent.time) nextErrors.time = "Time is required";
      if (newEvent.hostMode === 'manual') {
        if (!newEvent.hostName.trim()) nextErrors.hostName = "Host name required";
      } else {
        if (!selectedProfile) nextErrors.selectedProfile = "Select a host";
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) { setCreating(false); return; }
      
      // Get original event to compare host changes
      const originalEvent = events.find(e => String(e.id) === editingEventId);
      
      let hostName = newEvent.hostName;
      let hostAvatar = "";
      let invitedProfileId: string | null = null;
      let shouldSendInvite = false;
      
      if (newEvent.hostMode === "invite") {
        const resolvedUid = String(selectedProfile.id).startsWith('srv-') 
          ? selectedProfile.id.replace('srv-', '')
          : selectedProfile.id;
        invitedProfileId = resolvedUid;
        hostName = selectedProfile.name || hostName;
        hostAvatar = selectedProfile.avatar || "";
        
        // Only send invite if host changed or original event had no host
        const originalHostId = originalEvent?.invitedProfileId;
        const originalHostName = originalEvent?.hostName;
        const newHostName = selectedProfile.name;
        
        shouldSendInvite = !originalHostId || originalHostId !== resolvedUid || originalHostName !== newHostName;
        
        if (shouldSendInvite) {
          if (invitedProfileId) {
            await createConversationAndInvite(selectedProfile);
          } else {
            toast.message('Event updated (external host)', { description: 'The selected host is not linked to a Firebase account. Saved as external invite.' });
          }
        }
      } else if (newEvent.hostMode === 'manual' && matchedProfile) {
        invitedProfileId = matchedProfile.id;
        hostName = matchedProfile.name || hostName;
        hostAvatar = matchedProfile.avatar || "";
        
        // Only send invite if host changed or original event had no matched profile
        const originalHostId = originalEvent?.invitedProfileId;
        const originalHostName = originalEvent?.hostName;
        const newHostName = matchedProfile.name;
        
        shouldSendInvite = !originalHostId || originalHostId !== invitedProfileId || originalHostName !== newHostName;
        
        if (shouldSendInvite) {
          await createConversationAndInvite(matchedProfile);
        }
      }
      
      const categoryValue = newEvent.category === "other" ? newEvent.categoryOther : newEvent.category;
      
      // Update existing event
      await updateDoc(doc(db, "events", editingEventId), {
        category: categoryValue,
        type: newEvent.type,
        topic: newEvent.topic,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
        maxAttendees: newEvent.maxAttendees ? Number(newEvent.maxAttendees) : 0,
        location: newEvent.location,
        hostName,
        hostAvatar,
        invitedProfileId: invitedProfileId ?? null,
        hostAccepted: invitedProfileId ? false : true,
        externalInviteEmail: null,
        externalInviteMessage: null,
        updatedAt: new Date(),
      });
      
      // Only update invite subcollection if host changed and we have a new host
      if (shouldSendInvite && invitedProfileId) {
        const sid = String(invitedProfileId);
        try {
          await setDoc(doc(db, 'events', editingEventId, 'invites', sid), {
            userId: sid,
            status: 'pending',
            createdAt: new Date(),
            responses: [
              "I can join at that time",
              "Sorry, I can't make it",
            ],
          });
        } catch (e: any) {
          console.error('Invite write blocked by rules', e);
          toast.error('Invite write blocked by rules');
        }
      } else if (shouldSendInvite && newEvent.hostMode === 'invite') {
        toast.message('Event updated (external host)', { description: 'The selected host is not linked to a Firebase account. Saved as external invite.' });
      }
      
      toast.success('Event updated successfully');
      setNewEvent({ category: "", categoryOther: "", type: "online", topic: "", description: "", date: "", time: "", maxAttendees: "", location: "", hostMode: "manual", hostName: "", messageTemplate: newEvent.messageTemplate });
      setSelectedProfile(null);
      setEditingEventId(null); // Clear editing state
      setAdminTab('manage'); // Go back to manage events
    } catch (e: any) {
      toast.error(e?.message || "Failed to update event");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = (eventId: string, event: any) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    try {
      await deleteDoc(doc(db, "events", eventToDelete.id));
      toast.success('Event deleted successfully');
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (error) {
      toast.error('Failed to delete event');
      console.error('Delete error:', error);
      setShowDeleteModal(false);
      setEventToDelete(null);
    }
  };

  const handleChangeHost = (eventId: string) => {
    // Find the event and open host selection
    const eventToEdit = events.find(e => String(e.id) === eventId);
    if (eventToEdit) {
      setNewEvent({
        category: eventToEdit.category === "other" ? "other" : eventToEdit.category,
        categoryOther: eventToEdit.category === "other" ? eventToEdit.category : "",
        type: eventToEdit.type,
        topic: eventToEdit.title,
        description: eventToEdit.description,
        date: eventToEdit.date,
        time: eventToEdit.time,
        maxAttendees: eventToEdit.maxAttendees?.toString() || "",
        location: eventToEdit.location,
        hostMode: "invite",
        hostName: "",
        messageTemplate: newEvent.messageTemplate
      });
      setAdminTab('create');
      toast.success('Select a new host for this event');
    }
  };

  return (
    <div className="space-y-6">
      {/* Inject custom styles */}
      <style dangerouslySetInnerHTML={{ __html: customCalendarStyles }} />
      
      {/* Hero */}
      <Card className="overflow-hidden rounded-3xl shadow-strong border-0 bg-gradient-to-br from-[#0b1b3a] to-[#1d4ed8]">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          
          <div className="lg:col-span-2 p-6 md:p-10 text-white">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs">
                <CalendarDays className="h-3.5 w-3.5" /> Upcoming Events • {events.length}+ opportunities <Trophy className="h-3.5 w-3.5 text-orange-300" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Events & Webinars</h1>
              <p className="text-white/80">Join alumni events, webinars, and networking opportunities. Learn from industry leaders and grow your professional network.</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center gap-2 md:gap-3">
              {(user?.role === 'admin' || user?.role === 'super_admin') ? (
                <>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => setAdminTab(null)}>
                    Browse Events
                  </Button>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => setAdminTab('create')}>
                    Create Event
                  </Button>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => setAdminTab('manage')}>
                    View Old Event Data
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => setActiveTab('upcoming')}>
                    Browse Events
                  </Button>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => setActiveTab('my-events')}>
                    My Events
                  </Button>
                  <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto" onClick={() => setActiveTab('upcoming')}>
                    Top Recommendations
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_40%)]" />
            <div className="relative h-full w-full p-6 md:p-8 flex items-center justify-center">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-6 text-white text-center max-w-xs">
                <div className="text-sm opacity-90">Event Calendar</div>
                <div className="text-lg font-semibold">Join {events.length}+ upcoming events this month</div>
                <Button className="mt-3 h-9 bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a] w-full" onClick={() => setShowCalendar(true)}>View Calendar</Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {(user?.role === "admin" || user?.role === "super_admin") && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Admin</CardTitle>
              <div className="inline-flex rounded border">
                <Button size="sm" variant={adminTab==='create'?'default':'ghost'} onClick={() => setAdminTab('create')}>Create Event</Button>
                <Button size="sm" variant={adminTab==='manage'?'default':'ghost'} onClick={() => setAdminTab('manage')}>Manage Events</Button>
                <Button size="sm" variant={adminTab===null?'default':'ghost'} onClick={() => setAdminTab(null)}>View Events</Button>
              </div>
            </div>
          </CardHeader>
          {adminTab && (
          <CardContent className="space-y-4">
            {adminTab === 'create' && (
              <>
              <div className="space-y-6">
                {/* Event Details Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Event Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select value={newEvent.category} onValueChange={(v) => setNewEvent({ ...newEvent, category: v })}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select category" /></SelectTrigger>
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
                        <Input placeholder="Specify category" value={newEvent.categoryOther} onChange={(e) => setNewEvent({ ...newEvent, categoryOther: e.target.value })} className="h-10" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mode</label>
                      <Select value={newEvent.type} onValueChange={(v) => setNewEvent({ ...newEvent, type: v as any })}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select mode" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="on_campus">On Campus</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.type && <div className="text-xs text-red-500">{errors.type}</div>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Attendees</label>
                      <Input type="number" min={0} value={newEvent.maxAttendees} onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: e.target.value })} placeholder="No limit" className="h-10" />
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Event Title</label>
                      <Input value={newEvent.topic} onChange={(e) => setNewEvent({ ...newEvent, topic: e.target.value })} placeholder="Enter event title" className="h-10" />
                      {errors.topic && <div className="text-xs text-red-500">{errors.topic}</div>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Brief description of the event (2-3 sentences)" className="resize-none h-20" />
                      {errors.description && <div className="text-xs text-red-500">{errors.description}</div>}
                    </div>
                  </div>
                </div>

                {/* Schedule & Location */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Schedule & Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <Input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="h-10" />
                      {errors.date && <div className="text-xs text-red-500">{errors.date}</div>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time</label>
                      <Input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="h-10" />
                      {errors.time && <div className="text-xs text-red-500">{errors.time}</div>}
                    </div>
                    {newEvent.type === "on_campus" ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Campus Location</label>
                        <Select value={newEvent.location} onValueChange={(v) => setNewEvent({ ...newEvent, location: v })}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Al mazen">Al mazen</SelectItem>
                            <SelectItem value="Gulberg Green">Gulberg Green</SelectItem>
                            <SelectItem value="I 14 campus">I 14 campus</SelectItem>
                            <SelectItem value="G7 campus">G7 campus</SelectItem>
                            <SelectItem value="other">Other (specify)</SelectItem>
                          </SelectContent>
                        </Select>
                        {newEvent.location === "other" && (
                          <Input 
                            placeholder="Specify location" 
                            value={newEvent.location === "other" ? "" : newEvent.location}
                            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} 
                            className="h-10 mt-2" 
                          />
                        )}
                      </div>
                    ) : newEvent.type === "online" ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Session Link</label>
                        <Input 
                          value={newEvent.location} 
                          onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} 
                          placeholder="Enter session link (Zoom/Teams/Meet)" 
                          className="h-10" 
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Host Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Host Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Host Mode</label>
                      <Select value={newEvent.hostMode} onValueChange={(v) => setNewEvent({ ...newEvent, hostMode: v as any })}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select host mode" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Entry</SelectItem>
                          <SelectItem value="invite">Invite from Alumni</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(selectedProfile || matchedProfile) && (
                      <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8"><AvatarImage src={(selectedProfile||matchedProfile)?.avatar} /><AvatarFallback>{(((selectedProfile||matchedProfile)?.name)||'?')[0]}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">Selected host: {(selectedProfile||matchedProfile)?.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{(selectedProfile||matchedProfile)?.company || '—'} · {(selectedProfile||matchedProfile)?.location || '—'}</div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedProfile(null); setMatchedProfile(null); }}>Change</Button>
                      </div>
                    )}
                    
                    {newEvent.hostMode === "manual" && !(selectedProfile || matchedProfile) && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Host Name</label>
                        <Input placeholder="Enter host name" value={newEvent.hostName} onChange={(e) => setNewEvent({ ...newEvent, hostName: e.target.value })} className="h-10" />
                        {errors.hostName && <div className="text-xs text-red-500">{errors.hostName}</div>}
                      </div>
                    )}
                    
                    {newEvent.hostMode === "invite" && !(selectedProfile || matchedProfile) && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input placeholder="Search alumni..." value={profQuery} onChange={(e) => setProfQuery(e.target.value)} className="h-10" />
                          <Input placeholder="Filter by skill..." value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)} className="h-10" />
                        </div>
                        <div className="max-h-48 overflow-auto border rounded-lg p-3 space-y-2 bg-muted/20">
                          {filteredProfiles.slice(0, 20).map((p) => (
                            <div key={p.id} className={`flex items-center justify-between p-2 rounded-md ${selectedProfile?.id === p.id ? 'bg-accent' : ''}`}>
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-6 w-6"><AvatarImage src={p.avatar} /><AvatarFallback>{(p.name||'?')[0]}</AvatarFallback></Avatar>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{p.name || 'Unnamed'}</div>
                                  <div className="text-xs text-muted-foreground truncate">{p.role || '—'} · {p.company || '—'}</div>
                                </div>
                              </div>
                              <Button size="sm" variant={selectedProfile?.id === p.id ? 'default' : 'outline'} onClick={() => setSelectedProfile(p)}>
                                {selectedProfile?.id === p.id ? 'Selected' : 'Select'}
                              </Button>
                            </div>
                          ))}
                          {filteredProfiles.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No matching alumni found</div>}
                        </div>
                        {errors.selectedProfile && <div className="text-xs text-red-500">{errors.selectedProfile}</div>}
                      </div>
                    )}
                  </div>
                </div>
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
              <Button className="text-primary-foreground border-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]" onClick={editingEventId ? handleUpdateEvent : handleCreateEvent} disabled={creating}>
                {creating ? (editingEventId ? "Updating..." : "Creating...") : (editingEventId ? "Update Event" : "Create Event")}
              </Button>
            )}
            {adminTab==='manage' && (
              <div className="space-y-2">
                {events.filter((e: any) => e.awaitingHost).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No pending invites</div>
                ) : (
                  events.filter((e: any) => e.awaitingHost).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between border rounded p-2">
                      <div className="truncate flex-1">
                        <div className="text-sm font-medium truncate">{e.title}</div>
                        <div className="text-xs text-muted-foreground truncate">Host: {e.host} · {e.date} {e.time}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Awaiting host</Badge>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleEditEvent(e.id)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Event</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleChangeHost(e.id)}>
                                <UserCheck className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Change Host</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => handleDeleteEvent(e.id, e)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Event</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
          )}
        </Card>
      )}

      {/* Only show events when no admin tab is selected */}
      {!adminTab && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">Past Events</TabsTrigger>
          <TabsTrigger value="my-events" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">My Events</TabsTrigger>
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
                                <AvatarFallback>{event.host?.[0] || '?'}</AvatarFallback>
                              </Avatar>
                              <p className="text-sm text-muted-foreground">Hosted by {event.host || 'Unknown'}</p>
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
                    <p className="text-sm text-muted-foreground">Hosted by {event.host || 'Unknown'}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
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
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Play className="h-3 w-3" />
                    View Recording
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="my-events" className="space-y-4">
          {/* Registered events for this user */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Your Registered Events</div>
            {myRegisteredEvents.length === 0 ? (
              <Card><CardContent className="p-4 text-sm text-muted-foreground">No registered events yet</CardContent></Card>
            ) : (
              myRegisteredEvents.map((registration: any) => (
                <Card key={registration.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="truncate">
                      <div className="text-sm font-medium truncate">{registration.eventData.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {registration.eventData.date} {registration.eventData.time} · {registration.eventData.type} · {registration.eventData.location}
                      </div>
                      <div className="text-xs text-green-600 mt-1">Registered on {new Date(registration.registeredAt?.toDate?.() || registration.registeredAt).toLocaleDateString()}</div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Registered</Badge>
                  </CardContent>
                </Card>
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
      )}

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

      {/* Calendar Modal */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-auto custom-calendar-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Event Calendar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-full max-w-5xl">
                <Calendar
                  className="w-full custom-calendar"
                  tileContent={({ date, view }) => {
                    if (view !== 'month') return null;
                    const dateStr = date.toISOString().split('T')[0];
                    const dayEvents = events.filter(e => e.date === dateStr);
                    
                    if (dayEvents.length === 0) return null;
                    
                    return (
                      <div className="space-y-1 p-1">
                        {dayEvents.slice(0, 3).map((event, index) => (
                          <div 
                            key={event.id}
                            className={`text-xs p-2 rounded cursor-pointer transition-all hover:scale-105 ${
                              event.type === 'online' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                            onClick={() => {
                              setSelectedEventForRegistration(event);
                              setShowRegistrationModal(true);
                              setShowCalendar(false);
                            }}
                            title={`${event.title}\n${event.date} at ${event.time}\n${event.type}`}
                          >
                            <div className="font-semibold truncate">{event.title}</div>
                            <div className="flex items-center gap-1 text-xs opacity-75">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </div>
                            <div className="flex items-center gap-1 text-xs opacity-75">
                              {event.type === 'online' ? (
                                <>
                                  <Video className="h-3 w-3" />
                                  Online
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-3 w-3" />
                                  On Campus
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-center p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 cursor-pointer">
                            +{dayEvents.length - 3} more events
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
              </div>
            </div>
            
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Upcoming Events
                </h3>
                <div className="text-sm text-gray-500">
                  {events.filter(e => new Date(e.date) >= new Date()).length} events this month
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events
                  .filter(e => new Date(e.date) >= new Date())
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 9)
                  .map(event => (
                    <div 
                      key={event.id}
                      className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all hover:scale-102 bg-white"
                      onClick={() => {
                        setSelectedEventForRegistration(event);
                        setShowRegistrationModal(true);
                        setShowCalendar(false);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-base line-clamp-2 flex-1">{event.title}</h4>
                        <Badge className={`ml-2 ${
                          event.type === 'online' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {event.type === 'online' ? 'Online' : 'On Campus'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <CalendarIcon className="h-4 w-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="h-4 w-4" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          {event.type === 'online' ? (
                            <>
                              <Video className="h-4 w-4" />
                              <span>Virtual Event</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </>
                          )}
                        </div>
                        {event.host && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Users className="h-4 w-4" />
                            <span>Host: {event.host}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <Button className="w-full" size="sm">
                          Register for this Event
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Registration Modal */}
      <Dialog open={showRegistrationModal} onOpenChange={setShowRegistrationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Registration</DialogTitle>
          </DialogHeader>
          {selectedEventForRegistration && user && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg">{selectedEventForRegistration.title}</h3>
                <p className="text-gray-600 mt-1">{selectedEventForRegistration.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <span className="font-medium">Date:</span> {selectedEventForRegistration.date}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {selectedEventForRegistration.time}
                  </div>
                  <div>
                    <span className="font-medium">Mode:</span> {selectedEventForRegistration.type}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {selectedEventForRegistration.location}
                  </div>
                </div>
              </div>

              {/* User Information Preview */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">Your Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="text-gray-800">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="text-gray-800">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Role:</span>
                    <span className="text-gray-800">{user.role}</span>
                  </div>
                </div>
              </div>

              {/* Consent Section */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-3">Registration Consent</h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>By registering for this event, you agree to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Receive event-related communications via email</li>
                    <li>Share your registration information with the event organizer</li>
                    <li>Attend the event at the scheduled time</li>
                    <li>Follow event guidelines and code of conduct</li>
                  </ul>
                  <div className="mt-3 p-2 bg-white rounded border">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="event-consent"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">I agree to the terms and conditions above</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1"
                  onClick={async () => {
                    const consentCheckbox = document.getElementById('event-consent') as HTMLInputElement;
                    if (!consentCheckbox.checked) {
                      toast.error('Please accept the terms and conditions to register.');
                      return;
                    }
                    
                    try {
                      // Save registration to database
                      await addDoc(collection(db, "eventRegistrations"), {
                        eventId: selectedEventForRegistration.id,
                        userId: user.id,
                        userName: user.name,
                        userEmail: user.email,
                        userRole: user.role,
                        registeredAt: serverTimestamp(),
                        status: 'registered',
                        consent: true,
                        eventData: {
                          title: selectedEventForRegistration.title,
                          date: selectedEventForRegistration.date,
                          time: selectedEventForRegistration.time,
                          location: selectedEventForRegistration.location,
                          type: selectedEventForRegistration.type,
                          description: selectedEventForRegistration.description
                        }
                      });
                      
                      // Update event with attendee count
                      const eventRef = doc(db, "events", selectedEventForRegistration.id);
                      await updateDoc(eventRef, {
                        registeredAttendees: arrayUnion(user.id)
                      });
                      
                      toast.success('Registration successful! Check your email for confirmation.');
                      setShowRegistrationModal(false);
                      setSelectedEventForRegistration(null);
                      
                      // Reset checkbox
                      consentCheckbox.checked = false;
                    } catch (error) {
                      toast.error('Registration failed. Please try again.');
                      console.error('Registration error:', error);
                    }
                  }}
                >
                  Confirm Registration
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowRegistrationModal(false);
                  setSelectedEventForRegistration(null);
                  // Reset checkbox
                  const consentCheckbox = document.getElementById('event-consent') as HTMLInputElement;
                  if (consentCheckbox) consentCheckbox.checked = false;
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirm Delete Event
            </DialogTitle>
          </DialogHeader>
          {eventToDelete && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">{eventToDelete.title}</h3>
                <p className="text-sm text-red-700 mb-4">
                  Are you sure you want to delete this event? This action cannot be undone and will permanently remove all event data.
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Date:</strong> {eventToDelete.date}</div>
                  <div><strong>Time:</strong> {eventToDelete.time}</div>
                  <div><strong>Location:</strong> {eventToDelete.location}</div>
                  {eventToDelete.host && <div><strong>Host:</strong> {eventToDelete.host}</div>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteEvent}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Top events for you teaser */}
      {user?.role === 'student' && (
        <div className="mt-8">
          <RecommendationTeaser type="events" maxItems={3} />
        </div>
      )}
    </div>
  );
}

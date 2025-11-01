import { Bell, MessageSquare, User, Menu, GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/store/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, updateDoc, setDoc, doc, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  currentUser?: {
    name: string;
    avatar?: string;
    role: string;
    notifications?: number;
    messages?: number;
  };
  onMenuToggle?: () => void;
}

export function Header({ currentUser, onMenuToggle }: HeaderProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const lastUpdatesRef = useRef<Record<string, number>>({});
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body?: string; convId?: string; createdAt: number }>>([]);
  const [incomingCall, setIncomingCall] = useState<null | { convId: string; type: 'audio' | 'video'; fromName: string; toName?: string }>(null);
  const ringCtxRef = useRef<AudioContext | null>(null);
  const ringOscRef = useRef<OscillatorNode | null>(null);
  const ringGainRef = useRef<GainNode | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);

  // Subscribe to my conversations for header dropdown and notifications
  useEffect(() => {
    // Ask for notification permission once
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    if (!user?.id) return;
    const q = query(collection(db, "conversations"), where("participants", "array-contains", user.id));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setConversations(list);
      // naive new message detection: toast when updatedAt increases
      list.forEach((c: any) => {
        const ts = c.updatedAt?.toMillis ? c.updatedAt.toMillis() : 0;
        const prev = lastUpdatesRef.current[c.id] || 0;
        const fromOther = c.lastSenderId && user?.id && c.lastSenderId !== user.id;
        if (ts > prev && prev !== 0 && fromOther) {
          const sender = c.lastSenderName || "Someone";
          const body = c.lastMessage || "New activity in a conversation";
          toast({ title: `${sender} messaged you`, description: body });
          // in-app notification list
          setNotifications((prevList) => [{ id: `${c.id}_${ts}`, title: `${sender} messaged you`, body, convId: c.id, createdAt: Date.now() }, ...prevList].slice(0, 20));
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`${sender} messaged you`, {
                body,
                tag: c.id,
              });
            } catch {}
          }
        }
        if (ts > prev) lastUpdatesRef.current[c.id] = ts;
      });

      // Derive incoming call banner from current snapshot to avoid stale state
      const ringing = list.find((c: any) => c?.call?.status === 'ringing' && c?.call?.toId === user?.id);
      if (ringing) {
        const otherId = (ringing.participants || []).find((p: string) => p !== user?.id);
        const toName = ringing.participantNames?.[otherId || ''] || 'Conversation';
        setIncomingCall({ convId: ringing.id, type: ringing.call?.type || 'audio', fromName: ringing.call?.fromName || 'Unknown', toName });
      } else {
        setIncomingCall(null);
      }
    });
    return () => unsub();
  }, [user?.id]);

  // Ringtone control
  useEffect(() => {
    // Track first user gesture to enable audio
    const onInteract = () => {
      setUserInteracted(true);
      // try resuming any suspended audio context
      try { ringCtxRef.current && (ringCtxRef.current.state === 'suspended') && ringCtxRef.current.resume(); } catch {}
      window.removeEventListener('pointerdown', onInteract);
    };
    window.addEventListener('pointerdown', onInteract, { once: true });
    
    const stop = () => {
      try {
        ringGainRef.current?.gain?.exponentialRampToValueAtTime(0.0001, (ringCtxRef.current as any)?.currentTime + 0.2);
      } catch {}
      setTimeout(() => {
        try { ringOscRef.current?.stop(); } catch {}
        try { ringOscRef.current?.disconnect(); } catch {}
        try { ringGainRef.current?.disconnect(); } catch {}
        try { ringCtxRef.current?.close(); } catch {}
        ringOscRef.current = null;
        ringGainRef.current = null;
        ringCtxRef.current = null;
      }, 220);
    };
    const start = async () => {
      if (ringCtxRef.current) return; // already ringing
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 850; // ring tone freq
        gain.gain.value = 0.0001; // start silent
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        // simple pulsing envelope
        gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.05);
        const interval = setInterval(() => {
          if (!ringCtxRef.current) { clearInterval(interval); return; }
          const t = ctx.currentTime;
          gain.gain.setValueAtTime(0.05, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        }, 800);
        ringCtxRef.current = ctx;
        ringOscRef.current = osc;
        ringGainRef.current = gain as any;
      } catch {}
    };
    if (incomingCall && userInteracted) start(); else stop();
    return () => { /* no-op */ };
  }, [incomingCall, userInteracted]);

  const goMessages = () => navigate({ pathname: "/", search: "?tab=messages" });
  const openConversation = (c: any) => {
    const me = user?.id || "me";
    const otherId = (c.participants || []).find((p: string) => p !== me) || "";
    const toName = c.participantNames?.[otherId] || "Conversation";
    const params = new URLSearchParams({ tab: "messages", convId: c.id, to: otherId, toName });
    navigate({ pathname: "/", search: `?${params.toString()}` });
  };

  const openNotification = (n: { convId?: string }) => {
    if (n.convId) {
      const conv = conversations.find((c) => c.id === n.convId);
      if (conv) openConversation(conv);
      else navigate({ pathname: "/", search: `?tab=messages` });
    }
  };
  const clearNotifications = () => setNotifications([]);
  const dismissNotification = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const [dismissedConvIds, setDismissedConvIds] = useState<Set<string>>(new Set());
  // Load persisted header-dismissed conversations from profile
  useEffect(() => {
    if (!user?.id) return;
    const prefRef = doc(db, 'profiles', user.id);
    const unsub = onSnapshot(prefRef, (snap) => {
      const data = (snap.data() as any) || {};
      const arr: string[] = Array.isArray(data.headerDismissedConvIds) ? data.headerDismissedConvIds : [];
      setDismissedConvIds(new Set(arr));
    });
    return () => unsub();
  }, [user?.id]);
  const dismissConversation = async (id: string) => {
    setDismissedConvIds((prev) => new Set([...prev, id]));
    try {
      if (user?.id) await setDoc(doc(db, 'profiles', user.id), { headerDismissedConvIds: arrayUnion(id) }, { merge: true });
    } catch {}
  };
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] rounded-md bg-primary px-3 py-2 text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-105">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">AlumSphere</span>
          </div>
        </div>

        {/* User Actions */}
        {currentUser && (
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {Math.min(notifications.length, 9)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                {notifications.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No new notifications</div>
                ) : (
                  <div className="max-h-80 overflow-auto">
                    {notifications.map((n) => (
                      <DropdownMenuItem key={n.id} className="flex items-start gap-2">
                        <div className="flex-1 min-w-0" onClick={() => openNotification(n)}>
                          <div className="text-sm font-medium truncate">{n.title}</div>
                          {n.body && <div className="text-xs text-muted-foreground truncate w-full">{n.body}</div>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                          aria-label="Dismiss notification"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearNotifications}>Clear all</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Messages */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <MessageSquare className="h-5 w-5" />
                  {conversations.filter((c)=>!dismissedConvIds.has(c.id)).length > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {Math.min(conversations.filter((c)=>!dismissedConvIds.has(c.id)).length, 9)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {conversations.filter((c)=>!dismissedConvIds.has(c.id)).length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No conversations yet</div>
                ) : (
                  conversations.filter((c)=>!dismissedConvIds.has(c.id)).slice(0, 6).map((c) => (
                    <DropdownMenuItem key={c.id} className="flex items-start gap-2">
                      <div className="flex-1 min-w-0" onClick={() => openConversation(c)}>
                        <div className="text-sm font-medium truncate w-full">
                          {(c.participants || []).map((p: string) => p).length > 1 ? (c.participantNames ? Object.values(c.participantNames).join(", ") : c.id) : c.id}
                        </div>
                        <div className="text-xs text-muted-foreground truncate w-full">{c.lastMessage || "New conversation"}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => { e.stopPropagation(); dismissConversation(c.id); }}
                        aria-label="Dismiss conversation"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ pathname: "/", search: "?tab=messages" })}>
                  Go to Messages
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback>
                      {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.role}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate({ pathname: "/", search: "?tab=profile" })}>
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Help & Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={logout}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {incomingCall && (
        <div className="w-full border-t bg-primary/10 transition-all duration-300 transform translate-y-0 opacity-100">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-medium">Incoming {incomingCall.type} call</span>
              <span className="mx-1">from</span>
              <span className="font-semibold">{incomingCall.fromName}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default" onClick={() => { setIncomingCall(null); navigate({ pathname: "/", search: `?tab=messages&convId=${incomingCall.convId}&action=acceptCall` }); }}>
                Accept
              </Button>
              <Button size="sm" variant="destructive" onClick={() => { setIncomingCall(null); navigate({ pathname: "/", search: `?tab=messages&convId=${incomingCall.convId}&action=declineCall` }); }}>
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
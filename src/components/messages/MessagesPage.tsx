import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Send, MoreVertical, Phone, Video, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, limit } from "firebase/firestore";
import { useAuth } from "@/store/auth";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const mockConversations = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
    role: "Senior Software Engineer at Google",
    lastMessage: "Sure! I'd be happy to review your resume. Send it over.",
    time: "10 min ago",
    unread: 2,
    online: true
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    role: "Product Manager at Microsoft",
    lastMessage: "The mentorship session was great! Looking forward to our next one.",
    time: "2 hours ago",
    unread: 0,
    online: false
  },
  {
    id: 3,
    name: "Emily Davis",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    role: "Engineering Manager at Tesla",
    lastMessage: "I can introduce you to our recruiting team!",
    time: "1 day ago",
    unread: 1,
    online: true
  }
];

const mockMessages = [
  {
    id: 1,
    sender: "me",
    content: "Hi Sarah! Thanks for agreeing to mentor me. I'm really excited to learn from you!",
    time: "9:45 AM"
  },
  {
    id: 2,
    sender: "them",
    content: "Of course! I'm happy to help. What specific areas are you interested in?",
    time: "9:50 AM"
  },
  {
    id: 3,
    sender: "me",
    content: "I'm particularly interested in software engineering best practices and how to prepare for interviews at top tech companies.",
    time: "9:52 AM"
  },
  {
    id: 4,
    sender: "them",
    content: "Great! Those are both areas I can definitely help with. Do you have a resume I could review?",
    time: "9:55 AM"
  },
  {
    id: 5,
    sender: "me",
    content: "Yes, I do! Should I send it here or via email?",
    time: "10:00 AM"
  },
  {
    id: 6,
    sender: "them",
    content: "Sure! I'd be happy to review your resume. Send it over.",
    time: "10:02 AM"
  }
];

export function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();

  // Subscribe to my conversations list (no orderBy to avoid composite index requirement)
  useEffect(() => {
    if (!user?.id) return;
    const q = query(collection(db, "conversations"), where("participants", "array-contains", user.id));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      // filter out archived conversations for this user
      const filtered = list.filter((c: any) => !(c.archivedBy || []).includes(user.id));
      // sort locally by updatedAt desc if present
      filtered.sort((a: any, b: any) => {
        const ad = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const bd = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return bd - ad;
      });
      setConversations(filtered);
      if (!selectedConversation && filtered.length > 0) setSelectedConversation(filtered[0]);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Ensure/Select conversation from query params
  useEffect(() => {
    const convId = searchParams.get("convId");
    const to = searchParams.get("to");
    const toName = searchParams.get("toName") || "";
    const template = searchParams.get("template") || "";
    if (template) setNewMessage(template);
    if (!user?.id || !to || !convId) return;

    (async () => {
      const ref = doc(db, "conversations", convId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const seed = {
          participants: [user.id, to],
          participantNames: { [user.id]: user.name, [to]: toName },
          lastMessage: "",
          updatedAt: serverTimestamp(),
        };
        await setDoc(ref, seed);
        setSelectedConversation({ id: convId, ...seed });
      } else {
        setSelectedConversation({ id: convId, ...(snap.data() as any) });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.id]);

  // Subscribe to messages for selected conversation
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    if (!selectedConversation?.id) return;
    const q = query(
      collection(db, "conversations", selectedConversation.id, "messages"),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setMessages(list);
    });
    return () => unsub();
  }, [selectedConversation?.id]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (!selectedConversation?.id || !user?.id) return;
    const convRef = doc(db, "conversations", selectedConversation.id);
    setDoc(convRef, { readAt: { [user.id]: serverTimestamp() } }, { merge: true });
  }, [selectedConversation?.id, user?.id]);

  // WebRTC state
  const [callOpen, setCallOpen] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [isCaller, setIsCaller] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const unsubICERef = useRef<() => void>();
  const unsubCallDocRef = useRef<() => void>();
  const [pendingAction, setPendingAction] = useState<null | 'acceptCall' | 'declineCall'>(null);

  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    ],
  };

  const otherParticipantId = useMemo(() => {
    if (!user?.id || !selectedConversation?.participants) return undefined;
    return selectedConversation.participants.find((p: string) => p !== user.id);
  }, [user?.id, selectedConversation?.participants]);

  const attachLocal = (stream: MediaStream) => {
    const v = localVideoRef.current;
    if (v) {
      v.srcObject = stream;
      v.muted = true;
      v.play().catch(() => {});
    }
  };
  const attachRemote = (stream: MediaStream) => {
    const v = remoteVideoRef.current;
    if (v) {
      v.srcObject = stream;
      v.play().catch(() => {});
    }
  };

  const cleanupCall = async () => {
    unsubICERef.current?.();
    unsubICERef.current = undefined;
    unsubCallDocRef.current?.();
    unsubCallDocRef.current = undefined;
    try {
      pcRef.current?.getSenders().forEach((s) => s.track && s.track.stop());
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    const convRef = selectedConversation?.id ? doc(db, "conversations", selectedConversation.id) : null;
    if (convRef) {
      // Clear call state but keep history minimal
      await setDoc(convRef, { call: null }, { merge: true });
      // Optionally clean ICE subcollections (best-effort)
      // Skipped bulk deletion here for simplicity
    }
    setCallOpen(false);
    setIsCaller(false);
  };

  const createPeerConnection = (role: "caller" | "callee") => {
    const pc = new RTCPeerConnection(rtcConfig);
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (stream) attachRemote(stream);
      setCallStatus("connected");
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") setCallStatus("connected");
      if (s === "failed" || s === "disconnected" || s === "closed") setCallStatus("ended");
    };
    pc.onicecandidate = async (e) => {
      if (e.candidate && selectedConversation?.id) {
        const bucket = role === "caller" ? "callerCandidates" : "calleeCandidates";
        await addDoc(collection(db, "conversations", selectedConversation.id, bucket), e.candidate.toJSON());
      }
    };
    pcRef.current = pc;
    return pc;
  };

  const startCall = async (type: "audio" | "video") => {
    if (!user?.id || !selectedConversation?.id || !otherParticipantId) {
      toast({ title: "Cannot start call", description: "Open a conversation first.", variant: "destructive" as any });
      return;
    }
    try {
      setIsCaller(true);
      setCallType(type);
      setCallOpen(true);
      setCallStatus("connecting");
      const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" });
      localStreamRef.current = media;
      attachLocal(media);
      setAudioMuted(false);
      setVideoMuted(false);
      const pc = createPeerConnection("caller");
      media.getTracks().forEach((t) => pc.addTrack(t, media));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const convRef = doc(db, "conversations", selectedConversation.id);
      await setDoc(convRef, {
        call: {
          status: "ringing",
          type,
          fromId: user.id,
          fromName: user.name,
          toId: otherParticipantId,
          offer,
          startedAt: serverTimestamp(),
        },
      }, { merge: true });

      // Listen for answer and callee ICE and call status updates (caller side)
      unsubCallDocRef.current = onSnapshot(convRef, async (snap) => {
        const data: any = snap.data();
        const call = data?.call;
        if (!call) {
          // call cleared remotely
          toast({ title: 'Call ended' });
          cleanupCall();
          return;
        }
        if (call.status === "declined") {
          toast({ title: "Call declined" });
          cleanupCall();
        }
        if (call.answer && pcRef.current && !pcRef.current.currentRemoteDescription) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(call.answer));
          toast({ title: "Call accepted" });
          setCallStatus("connected");
        }
        if (call.status === 'ended') {
          toast({ title: 'Call ended' });
          cleanupCall();
        }
      });
      unsubICERef.current = onSnapshot(collection(db, "conversations", selectedConversation.id, "calleeCandidates"), async (snap) => {
        for (const docc of snap.docChanges()) {
          if (docc.type === "added" && docc.doc.exists() && pcRef.current) {
            try { await pcRef.current.addIceCandidate(new RTCIceCandidate(docc.doc.data() as any)); } catch {}
          }
        }
      });
    } catch (e: any) {
      toast({ title: "Call failed", description: e?.message || String(e), variant: "destructive" as any });
      cleanupCall();
    }
  };

  // Incoming call watcher for the open conversation only (MVP)
  useEffect(() => {
    if (!selectedConversation?.id || !user?.id) return;
    const convRef = doc(db, "conversations", selectedConversation.id);
    const unsub = onSnapshot(convRef, (snap) => {
      const data: any = snap.data();
      const call = data?.call;
      if (call?.status === "ringing" && call.toId === user.id && !isCaller && !callOpen) {
        // show accept UI via toast; keep it simple
        toast({ title: `Incoming ${call.type} call`, description: `From ${call.fromName}` });
      }
      if (call?.status === 'accepted' && !isCaller) {
        // Callee accepted; status handled by acceptCall flow
      }
      if (call?.status === 'declined') {
        toast({ title: 'Call declined' });
        if (callOpen) cleanupCall();
      }
      if (call?.status === 'ended') {
        toast({ title: 'Call ended' });
        if (callOpen) cleanupCall();
      }
      if (!call && callOpen) {
        toast({ title: 'Call ended' });
        cleanupCall();
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id, user?.id]);

  // Handle URL action for call (accept/decline) when landing from header banner
  useEffect(() => {
    const action = searchParams.get('action');
    if (!action) return;
    // if conversation not ready yet, we'll re-enter when selectedConversation changes
    if (!selectedConversation?.id) {
      // pre-open modal so user sees processing immediately (will complete when selection is ready)
      if (action === 'acceptCall') {
        setCallOpen(true);
        setCallStatus('connecting');
      }
      setPendingAction(action as any);
      return;
    }
    if (action === 'acceptCall') acceptCall();
    if (action === 'declineCall') declineCall();
    // Clear action param to avoid stale re-triggers
    const sp = new URLSearchParams(searchParams);
    sp.delete('action');
    window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, selectedConversation?.id]);

  // Run any pending action once conversation becomes ready
  useEffect(() => {
    if (!pendingAction || !selectedConversation?.id) return;
    if (pendingAction === 'acceptCall') acceptCall();
    if (pendingAction === 'declineCall') declineCall();
    setPendingAction(null);
    const sp = new URLSearchParams(window.location.search);
    sp.delete('action');
    window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction, selectedConversation?.id]);

  const acceptCall = async () => {
    if (!selectedConversation?.id || !user?.id) return;
    try {
      setIsCaller(false);
      const convRef = doc(db, "conversations", selectedConversation.id);
      const snap = await getDoc(convRef);
      const data: any = snap.data();
      const call = data?.call;
      if (!call?.offer) return;
      setCallType((call.type as any) || "audio");
      setCallOpen(true);
      setCallStatus("connecting");
      const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.type === "video" });
      localStreamRef.current = media;
      attachLocal(media);
      setAudioMuted(false);
      setVideoMuted(false);
      const pc = createPeerConnection("callee");
      media.getTracks().forEach((t) => pc.addTrack(t, media));
      await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await setDoc(convRef, { call: { ...call, status: "accepted", answer } }, { merge: true });
      toast({ title: 'Call accepted' });

      // Subscribe to caller ICE and call status to react to hangup
      unsubICERef.current = onSnapshot(collection(db, "conversations", selectedConversation.id, "callerCandidates"), async (snap2) => {
        for (const ch of snap2.docChanges()) {
          if (ch.type === "added" && ch.doc.exists() && pcRef.current) {
            try { await pcRef.current.addIceCandidate(new RTCIceCandidate(ch.doc.data() as any)); } catch {}
          }
        }
      });
      unsubCallDocRef.current = onSnapshot(convRef, (s2) => {
        const d2: any = s2.data();
        const c2 = d2?.call;
        if (!c2 || c2.status === 'ended' || c2.status === 'declined') {
          toast({ title: 'Call ended' });
          cleanupCall();
        }
      });
    } catch (e: any) {
      toast({ title: "Failed to answer", description: e?.message || String(e), variant: "destructive" as any });
      cleanupCall();
    }
  };

  const declineCall = async () => {
    if (!selectedConversation?.id) return;
    const convRef = doc(db, "conversations", selectedConversation.id);
    await setDoc(convRef, { call: { status: "declined" } }, { merge: true });
  };

  const endCall = async () => {
    if (selectedConversation?.id) {
      const convRef = doc(db, "conversations", selectedConversation.id);
      await setDoc(convRef, { call: { status: 'ended' } }, { merge: true });
    }
    toast({ title: 'Call ended' });
    await cleanupCall();
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !audioMuted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !enabled));
    setAudioMuted(!audioMuted);
  };
  const toggleVideo = () => {
    if (callType !== "video") return;
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !videoMuted;
    stream.getVideoTracks().forEach((t) => (t.enabled = !enabled));
    setVideoMuted(!videoMuted);
  };

  const handleSendMessage = async () => {
    if (!user?.id || !selectedConversation?.id) return;
    const text = newMessage.trim();
    if (!text) return;
    const convRef = doc(db, "conversations", selectedConversation.id);
    await addDoc(collection(convRef, "messages"), {
      senderId: user.id,
      senderName: user.name,
      text,
      createdAt: serverTimestamp(),
    });
    await setDoc(convRef, { lastMessage: text, lastSenderId: user.id, lastSenderName: user.name, updatedAt: serverTimestamp() }, { merge: true });
    setNewMessage("");
  };

  // Header actions
  const isStarred = !!selectedConversation?.favoritesBy?.includes?.(user?.id);
  const toggleStar = async () => {
    if (!selectedConversation?.id || !user?.id) return;
    const convRef = doc(db, "conversations", selectedConversation.id);
    const op = isStarred ? arrayRemove(user.id) : arrayUnion(user.id);
    await updateDoc(convRef, { favoritesBy: op });
    toast({ title: isStarred ? "Removed from favorites" : "Added to favorites" });
  };
  const markUnread = async () => {
    if (!selectedConversation?.id || !user?.id) return;
    const convRef = doc(db, "conversations", selectedConversation.id);
    await setDoc(convRef, { readAt: { [user.id]: null } }, { merge: true });
    toast({ title: "Marked as unread" });
  };
  const deleteChat = async () => {
    if (!selectedConversation?.id || !user?.id) return;
    const convId = selectedConversation.id;
    const convRef = doc(db, "conversations", convId);
    try {
      // delete all messages in subcollection
      const msgsSnap = await getDocs(collection(convRef, "messages"));
      const deletes = msgsSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.allSettled(deletes);
    } catch {}
    try { await deleteDoc(convRef); } catch {}
    toast({ title: "Conversation deleted" });
    setSelectedConversation(null);
  };
  const reportBlock = async () => {
    if (!selectedConversation?.id || !user?.id) return;
    const convRef = doc(db, "conversations", selectedConversation.id);
    await updateDoc(convRef, { blockedBy: arrayUnion(user.id) });
    toast({ title: "User blocked", description: "You will not receive messages from this conversation." });
  };

  const renderConvName = (conv: any) => {
    if (!conv) return "Conversation";
    const parts: string[] = conv.participants || [];
    const otherId = user?.id ? parts.find((p: string) => p !== user.id) : parts[0];
    const name = conv.participantNames?.[otherId as string] || conv.displayName || "Conversation";
    return name;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          Connect with alumni and mentors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation?.id === conversation.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {renderConvName(conversation).split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm truncate">
                              {renderConvName(conversation)}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">{conversation.lastMessage}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0 flex flex-col h-full">
            {!selectedConversation ? (
              <div className="flex-1 grid place-items-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">No conversation selected</h3>
                  <p className="text-sm">Choose a conversation from the left, or start one from a post.</p>
                </div>
              </div>
            ) : (
            <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {renderConvName(selectedConversation).split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h3 className="font-semibold">{renderConvName(selectedConversation)}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => startCall('audio')}>
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => startCall('video')}>
                  <Video className="h-4 w-4" />
                </Button>
                <Button size="sm" variant={isStarred ? "default" : "ghost"} onClick={toggleStar}>
                  <Star className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={toggleStar}>{isStarred ? "Remove from favorites" : "Add to favorites"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={markUnread}>Mark as unread</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={deleteChat}>Delete chat</DropdownMenuItem>
                    <DropdownMenuItem onClick={reportBlock}>Report / Block</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((m) => {
                  const fromMe = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-lg p-3 ${fromMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p className="text-sm">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[60px] resize-none"
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Incoming call prompt (inline simple controls) */}
      {/* For MVP we rely on the Accept/Decline buttons shown via header toast text. Add explicit buttons if needed */}

      {/* Call Modal */}
      <Dialog open={callOpen} onOpenChange={(o) => { if (!o) endCall(); }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{callType === 'video' ? 'Video Call' : 'Audio Call'}</DialogTitle>
            <DialogDescription>
              {callStatus === 'connecting' && 'Setting up your call...'}
              {callStatus === 'connected' && 'You are connected.'}
              {callStatus === 'ended' && 'Call ended.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div className={`${callType === 'video' ? 'block' : 'hidden'} rounded overflow-hidden bg-black`}>
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-64 bg-black rounded" />
            </div>
            <div className={`rounded overflow-hidden ${callType === 'video' ? '' : 'hidden'}`}>
              <video ref={localVideoRef} autoPlay muted playsInline className="w-40 h-28 bg-black rounded border" />
            </div>
            <div className="text-sm text-muted-foreground">
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'connected' && 'Connected'}
              {callStatus === 'ended' && 'Call ended'}
            </div>
            {callStatus === 'connected' && (
              <div className="flex items-center gap-2">
                <Button variant={audioMuted ? 'default' : 'secondary'} size="sm" onClick={toggleAudio}>
                  {audioMuted ? 'Unmute' : 'Mute'}
                </Button>
                {callType === 'video' && (
                  <Button variant={videoMuted ? 'default' : 'secondary'} size="sm" onClick={toggleVideo}>
                    {videoMuted ? 'Start Camera' : 'Stop Camera'}
                  </Button>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            {!isCaller && callStatus === 'connecting' && (
              <div className="mr-auto flex gap-2">
                <Button variant="default" onClick={acceptCall}>Accept</Button>
                <Button variant="destructive" onClick={declineCall}>Decline</Button>
              </div>
            )}
            {callStatus === 'connected' && (
              <Button variant="destructive" onClick={endCall}>End</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

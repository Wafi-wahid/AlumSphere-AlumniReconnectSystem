import { useEffect, useMemo, useState } from "react";
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
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where, limit } from "firebase/firestore";
import { useAuth } from "@/store/auth";

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
      // sort locally by updatedAt desc if present
      list.sort((a: any, b: any) => {
        const ad = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const bd = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return bd - ad;
      });
      setConversations(list);
      if (!selectedConversation && list.length > 0) setSelectedConversation(list[0]);
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
                <Button size="sm" variant="ghost">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Video className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Star className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
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
    </div>
  );
}

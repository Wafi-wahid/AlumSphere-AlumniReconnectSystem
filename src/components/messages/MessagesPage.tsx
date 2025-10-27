import { useState } from "react";
import { Search, Send, MoreVertical, Phone, Video, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
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
                {mockConversations.map((conversation) => (
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
                            <AvatarImage src={conversation.avatar} alt={conversation.name} />
                            <AvatarFallback>
                              {conversation.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.online && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-success rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm truncate">
                              {conversation.name}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {conversation.time}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.role}
                          </p>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conversation.lastMessage}
                          </p>
                        </div>
                        {conversation.unread > 0 && (
                          <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center p-0 px-1.5">
                            {conversation.unread}
                          </Badge>
                        )}
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
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                    <AvatarFallback>
                      {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.online && (
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-success rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedConversation.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedConversation.role}</p>
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
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === "me"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === "me"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.time}
                      </p>
                    </div>
                  </div>
                ))}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

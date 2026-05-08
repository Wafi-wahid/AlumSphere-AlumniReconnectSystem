import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, Minimize2, Maximize2 } from "lucide-react";
import { useAuth } from "@/store/auth";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  category?: string;
}

interface QuickReply {
  text: string;
  action?: string;
  category?: string;
}

export function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Rule-based response system
  const generateBotResponse = (userMessage: string): { text: string; category?: string } => {
    const message = userMessage.toLowerCase().trim();
    
    // Greetings
    if (message.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return {
        text: `Hello${user?.name ? " " + user.name : ""}! I'm your alumni assistant. How can I help you today?`,
        category: "greeting"
      };
    }

    // Help requests
    if (message.match(/^(help|what can you do|how can you help)/)) {
      return {
        text: "I can help you with:\n\n🎓 **Platform Navigation**\n• Finding alumni\n• Using events\n• Career resources\n\n📝 **Profile Help**\n• Completing your profile\n• Updating skills\n• Adding experience\n\n💼 **Career Support**\n• Job search tips\n• Interview preparation\n• Networking advice\n\nType any question or choose an option below!",
        category: "help"
      };
    }

    // Profile related
    if (message.match(/profile|update|edit|complete/)) {
      return {
        text: "To update your profile:\n\n1. Go to your profile page\n2. Click the 'Edit Profile' button\n3. Add your:\n   • Current position and company\n   • Skills and expertise\n   • Education details\n   • Professional summary\n\nNeed help with a specific section?",
        category: "profile"
      };
    }

    // Alumni search
    if (message.match(/find|search|alumni|directory/)) {
      return {
        text: "To find alumni:\n\n1. Go to Alumni Directory\n2. Use the search bar to find by name\n3. Apply filters for:\n   • Graduation year\n   • Department\n   • Company\n   • Location\n   • Skills\n\n💡 **Tip**: Use advanced filters to find alumni with specific expertise!",
        category: "search"
      };
    }

    // Events
    if (message.match(/event|events|workshop|webinar/)) {
      return {
        text: "For events:\n\n📅 **Upcoming Events**\n• Check the Events tab regularly\n• Filter by type (workshops, webinars, meetups)\n• Register early - spots are limited!\n\n🎯 **Event Types**\n• Career workshops\n• Industry talks\n• Networking sessions\n• Alumni meetups\n\nWant to see upcoming events?",
        category: "events"
      };
    }

    // Career/Jobs
    if (message.match(/job|career|employment|interview/)) {
      return {
        text: "Career resources available:\n\n💼 **Job Board**\n• Browse open positions\n• Filter by industry and role\n• Apply directly through platform\n\n🎯 **Career Support**\n• Resume review tips\n• Interview preparation guides\n• Salary negotiation advice\n\n🤝 **Networking**\n• Connect with alumni in your field\n• Request informational interviews\n• Join industry-specific groups\n\nWhat specific career help do you need?",
        category: "career"
      };
    }

    // Mentorship
    if (message.match(/mentor|mentorship|guidance/)) {
      return {
        text: "Mentorship opportunities:\n\n👥 **Find Mentors**\n• Search by expertise and industry\n• Filter by availability\n• Send mentorship requests\n\n🎓 **Become a Mentor**\n• Share your experience\n• Help current students\n• Give back to the community\n\n💡 **Tips**\n• Be specific in your request\n• Highlight your goals\n• Respect mentors' time\n\nInterested in finding a mentor or becoming one?",
        category: "mentorship"
      };
    }

    // Community
    if (message.match(/community|post|share|connect/)) {
      return {
        text: "Community features:\n\n📝 **Share Updates**\n• Post career achievements\n• Share industry insights\n• Ask questions\n\n💬 **Engage**\n• Comment on posts\n• Like and share content\n• Send direct messages\n\n🤝 **Connect**\n• Send connection requests\n• Join discussions\n• Build your network\n\nRemember to follow community guidelines!",
        category: "community"
      };
    }

    // Technical support
    if (message.match(/problem|issue|bug|error|not working|broken/)) {
      return {
        text: "Technical support:\n\n🔧 **Common Issues**\n• Clear browser cache and refresh\n• Check your internet connection\n• Try a different browser\n\n📞 **Get Help**\n• Contact support team\n• Report bugs through feedback\n• Check system status\n\nWhat specific issue are you experiencing?",
        category: "support"
      };
    }

    // Admin help (for admin users)
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      if (message.match(/admin|dashboard|manage|moderate/)) {
        return {
          text: "Admin features:\n\n📊 **Dashboard**\n• User management\n• Profile moderation\n• Analytics overview\n\n🔧 **Management Tools**\n• Delete inappropriate content\n• Manage user roles\n• View system statistics\n\n📝 **Content Moderation**\n• Review reported posts\n• Enforce community guidelines\n• Handle user reports\n\nNeed help with specific admin tasks?",
          category: "admin"
        };
      }
    }

    // Default response
    return {
      text: "I'm here to help! Here are some things I can assist with:\n\n🎓 Platform navigation\n📝 Profile completion\n🔍 Finding alumni\n📅 Events and workshops\n💼 Career resources\n🤝 Networking tips\n📞 Technical support\n\nCould you be more specific about what you need help with?",
      category: "default"
    };
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = generateBotResponse(text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        sender: "bot",
        timestamp: new Date(),
        category: botResponse.category
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const quickReplies: QuickReply[] = [
    { text: "Find alumni", action: "search", category: "search" },
    { text: "Update profile", action: "profile", category: "profile" },
    { text: "Career help", action: "career", category: "career" },
    { text: "Upcoming events", action: "events", category: "events" },
    { text: "Community rules", action: "community", category: "community" }
  ];

  if (user?.role === 'admin' || user?.role === 'super_admin') {
    quickReplies.push({ text: "Admin help", action: "admin", category: "admin" });
  }

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.text);
  };

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        text: `Hello${user?.name ? " " + user.name : ""}! 👋\n\nI'm your alumni assistant. I can help you navigate the platform, find alumni, discover events, and much more!\n\nWhat can I help you with today?`,
        sender: "bot",
        timestamp: new Date(),
        category: "greeting"
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, user?.name]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 shadow-lg z-50 ${isMinimized ? 'h-14' : 'h-[600px]'} transition-all duration-300`}>
      <CardContent className="p-0 h-full flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Alumni Assistant</h3>
              <p className="text-xs opacity-90">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-blue-700"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-blue-700"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    {message.category && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {message.category}
                      </Badge>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t">
                <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
                <div className="flex flex-wrap gap-1">
                  {quickReplies.map((reply, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleQuickReply(reply)}
                    >
                      {reply.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

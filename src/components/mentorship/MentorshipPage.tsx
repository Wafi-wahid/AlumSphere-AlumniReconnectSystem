import { useState } from "react";
import { Search, Calendar, Heart, Star, Clock, Video, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockMentors = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
    company: "Google",
    role: "Senior Software Engineer",
    expertise: ["Career Guidance", "Technical Skills", "Interview Prep"],
    rating: 4.9,
    sessions: 23,
    available: true,
    nextSlot: "Tomorrow, 2:00 PM"
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    company: "Microsoft",
    role: "Product Manager",
    expertise: ["Product Strategy", "Leadership", "Career Transition"],
    rating: 4.8,
    sessions: 17,
    available: true,
    nextSlot: "Dec 30, 10:00 AM"
  }
];

const mockRequests = [
  {
    id: 1,
    mentor: "Sarah Johnson",
    topic: "Interview Preparation",
    status: "pending",
    requestedDate: "Dec 28, 2024",
    preferredTime: "2:00 PM - 3:00 PM"
  }
];

const mockSessions = [
  {
    id: 1,
    mentor: "Dr. Emily Davis",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    topic: "Career Planning",
    date: "Jan 5, 2025",
    time: "3:00 PM - 4:00 PM",
    status: "upcoming"
  }
];

export function MentorshipPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<typeof mockMentors[0] | null>(null);
  const [requestForm, setRequestForm] = useState({
    topic: "",
    outline: "",
    preferredDate: "",
    preferredTime: ""
  });

  const handleRequestMentorship = (mentor: typeof mockMentors[0]) => {
    setSelectedMentor(mentor);
    setShowRequestDialog(true);
  };

  const handleSubmitRequest = () => {
    console.log("Mentorship request submitted:", { mentor: selectedMentor, ...requestForm });
    setShowRequestDialog(false);
    setRequestForm({ topic: "", outline: "", preferredDate: "", preferredTime: "" });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Mentorship Program</h1>
        <p className="text-muted-foreground">
          Connect with alumni mentors for career guidance and professional development
        </p>
      </div>

      <Tabs defaultValue="find" className="space-y-6">
        <TabsList>
          <TabsTrigger value="find">Find Mentors</TabsTrigger>
          <TabsTrigger value="requests">My Requests ({mockRequests.length})</TabsTrigger>
          <TabsTrigger value="sessions">Upcoming Sessions ({mockSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, expertise, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockMentors.map((mentor) => (
              <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={mentor.avatar} alt={mentor.name} />
                      <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{mentor.name}</h3>
                      <p className="text-sm text-muted-foreground">{mentor.role}</p>
                      <p className="text-sm text-muted-foreground">{mentor.company}</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {mentor.rating} • {mentor.sessions} sessions
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Expertise Areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {mentor.expertise.map((exp) => (
                        <Badge key={exp} variant="outline" className="text-xs">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {mentor.available && (
                    <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <p className="text-sm text-success">Next available: {mentor.nextSlot}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleRequestMentorship(mentor)}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Request Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {mockRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{request.mentor}</h3>
                      <Badge variant={request.status === "pending" ? "secondary" : "default"}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Topic: {request.topic}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Requested: {request.requestedDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {request.preferredTime}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Cancel Request</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {mockSessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={session.avatar} alt={session.mentor} />
                    <AvatarFallback>{session.mentor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold">{session.mentor}</h3>
                      <p className="text-sm text-muted-foreground">{session.topic}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {session.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button size="sm">
                      <Video className="h-4 w-4 mr-2" />
                      Join Meeting
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Mentorship Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedMentor?.avatar} alt={selectedMentor?.name} />
                <AvatarFallback>{selectedMentor?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedMentor?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedMentor?.role} at {selectedMentor?.company}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Select value={requestForm.topic} onValueChange={(value) => setRequestForm(prev => ({ ...prev, topic: value }))}>
                <SelectTrigger id="topic">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="career">Career Guidance</SelectItem>
                  <SelectItem value="technical">Technical Skills</SelectItem>
                  <SelectItem value="interview">Interview Preparation</SelectItem>
                  <SelectItem value="leadership">Leadership Development</SelectItem>
                  <SelectItem value="transition">Career Transition</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outline">Session Outline *</Label>
              <Textarea
                id="outline"
                placeholder="Describe what you'd like to discuss in this mentorship session..."
                value={requestForm.outline}
                onChange={(e) => setRequestForm(prev => ({ ...prev, outline: e.target.value }))}
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Preferred Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={requestForm.preferredDate}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Preferred Time *</Label>
                <Select value={requestForm.preferredTime} onValueChange={(value) => setRequestForm(prev => ({ ...prev, preferredTime: value }))}>
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9-10">9:00 AM - 10:00 AM</SelectItem>
                    <SelectItem value="10-11">10:00 AM - 11:00 AM</SelectItem>
                    <SelectItem value="11-12">11:00 AM - 12:00 PM</SelectItem>
                    <SelectItem value="14-15">2:00 PM - 3:00 PM</SelectItem>
                    <SelectItem value="15-16">3:00 PM - 4:00 PM</SelectItem>
                    <SelectItem value="16-17">4:00 PM - 5:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowRequestDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmitRequest} className="flex-1">
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

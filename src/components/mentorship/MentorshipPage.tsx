import { useEffect, useMemo, useState } from "react";
import { Search, Calendar, Heart, Star, Clock, Video, MessageCircle, CheckCircle, Building2, Briefcase, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/store/auth";
import { MentorshipAPI } from "@/lib/mentorshipApi";
import { useToast } from "@/hooks/use-toast";

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
    nextSlot: "Tomorrow, 2:00 PM",
    batch: "2017",
    location: "Singapore"
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
    nextSlot: "Dec 30, 10:00 AM",
    batch: "2015",
    location: "Kuala Lumpur"
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [topic, setTopic] = useState<string>("all");
  const [batch, setBatch] = useState<string>("all");
  const [minRating, setMinRating] = useState<string>("all");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<typeof mockMentors[0] | null>(null);
  const [requestForm, setRequestForm] = useState({
    topic: "",
    sessionType: "",
    outline: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);

  const handleRequestMentorship = (mentor: typeof mockMentors[0]) => {
    setSelectedMentor(mentor);
    setShowRequestDialog(true);
  };

  const handleOpenProfile = (mentor: typeof mockMentors[0]) => {
    setSelectedMentor(mentor);
    setShowProfileDialog(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedMentor) return;
    if (!user || user.role !== 'student') {
      toast({ title: "Psst", description: "Only students can request mentors. Alumni, take a bow! 🎓", duration: 4000 });
      return;
    }
    const isValid = requestForm.topic && requestForm.sessionType && requestForm.preferredDate && requestForm.preferredTime;
    if (!isValid) {
      toast({ title: "Form incomplete", description: "Please fill all required fields. Even mentors can’t read minds… yet 😄", duration: 4000 });
      return;
    }
    try {
      setSubmitting(true);
      const preferredDateTime = new Date(`${requestForm.preferredDate}T${requestForm.preferredTime}:00`).toISOString();
      await MentorshipAPI.createRequest({
        mentorId: String(selectedMentor.id),
        topic: requestForm.topic,
        sessionType: requestForm.sessionType,
        preferredDateTime,
        notes: requestForm.notes || requestForm.outline || undefined,
      });
      toast({ title: "Request Sent 🚀", description: "Your mentor will get back to you soon." });
      setShowRequestDialog(false);
      setRequestForm({ topic: "", sessionType: "", outline: "", preferredDate: "", preferredTime: "", notes: "" });
    } catch (e: any) {
      toast({ title: "Couldn’t send request", description: e?.message || "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // Load mentors from Cloud Function; fallback to mock
  useEffect(() => {
    (async () => {
      setLoadingMentors(true);
      try {
        const res = await MentorshipAPI.listMentors({ q: searchQuery || undefined, topic: topic !== 'all' ? topic : undefined, batch: batch !== 'all' ? batch : undefined, ratingMin: minRating !== 'all' ? parseFloat(minRating) : undefined });
        setMentors(res.items || []);
      } catch {
        setMentors(mockMentors as any);
      } finally {
        setLoadingMentors(false);
      }
    })();
  }, [searchQuery, topic, batch, minRating]);

  const filteredMentors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const r = minRating === "all" ? 0 : parseFloat(minRating);
    const source = Array.isArray(mentors) && mentors.length ? mentors : (mockMentors as any);
    return source.filter((m: any) => {
      const matchesSearch =
        !q ||
        String(m.name||'').toLowerCase().includes(q) ||
        String(m.company||'').toLowerCase().includes(q) ||
        String(m.role||m.title||'').toLowerCase().includes(q) ||
        (Array.isArray(m.skills||m.expertise) ? (m.skills||m.expertise).some((e: string) => String(e).toLowerCase().includes(q)) : false);
      const expertise = (Array.isArray(m.skills||m.expertise) ? (m.skills||m.expertise).map((e: string)=>String(e).toLowerCase()) : []);
      const matchesTopic = topic === "all" || expertise.includes(topic);
      const matchesBatch = batch === "all" || String(m.batch||m.batchYear||'') === batch;
      const matchesRating = Number(m.rating||m.ratingAvg||0) >= r;
      return matchesSearch && matchesTopic && matchesBatch && matchesRating;
    });
  }, [searchQuery, topic, batch, minRating, mentors]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" style={{ color: "#E5E7EB" }}>Mentorship Directory</h1>
        <p className="text-sm" style={{ color: "#E5E7EB" }}>
          Find alumni mentors for career guidance and professional development
        </p>
      </div>

      <Tabs defaultValue="find" className="space-y-6">
        <TabsList>
          <TabsTrigger value="find">Find Mentors</TabsTrigger>
          <TabsTrigger value="requests">My Requests ({mockRequests.length})</TabsTrigger>
          <TabsTrigger value="sessions">Upcoming Sessions ({mockSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-4">
          {/* Filters Bar */}
          <Card className="border border-white/10" style={{ backgroundColor: "#0A1A3D" }}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#E5E7EB" }} />
                  <Input
                    placeholder="Search by name, expertise, or company"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-white/20 focus-visible:ring-1"
                    style={{ backgroundColor: "transparent", color: "#E5E7EB" }}
                  />
                </div>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger className="border-white/20" style={{ backgroundColor: "transparent", color: "#E5E7EB" }}>
                    <SelectValue placeholder="Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    <SelectItem value="career guidance">Career Guidance</SelectItem>
                    <SelectItem value="technical skills">Technical Skills</SelectItem>
                    <SelectItem value="interview prep">Interview Prep</SelectItem>
                    <SelectItem value="product strategy">Product Strategy</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="career transition">Career Transition</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={batch} onValueChange={setBatch}>
                  <SelectTrigger className="border-white/20" style={{ backgroundColor: "transparent", color: "#E5E7EB" }}>
                    <SelectValue placeholder="Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    <SelectItem value="2015">Batch 2015</SelectItem>
                    <SelectItem value="2017">Batch 2017</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="border-white/20" style={{ backgroundColor: "transparent", color: "#E5E7EB" }}>
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rating</SelectItem>
                    <SelectItem value="4">4.0+</SelectItem>
                    <SelectItem value="4.5">4.5+</SelectItem>
                    <SelectItem value="4.8">4.8+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Directory Grid */}
          {filteredMentors.length === 0 ? (
            <div className="py-20 text-center text-sm" style={{ color: "#E5E7EB" }}>
              No mentors found — keep exploring!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map((mentor) => (
                <Card
                  key={mentor.id}
                  className="group relative overflow-hidden border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ background: "linear-gradient(180deg, rgba(10,26,61,0.85), rgba(10,26,61,0.65))" }}
                >
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 ring-2" style={{ boxShadow: "0 0 0 2px #007BFF inset" }}>
                        <AvatarImage src={mentor.avatar} alt={mentor.name} />
                        <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold" style={{ color: "#E5E7EB" }}>{mentor.name}</h3>
                          <Button size="sm" variant="ghost" onClick={() => handleOpenProfile(mentor)} className="text-xs hover:underline" style={{ color: "#007BFF" }}>
                            View Profile
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs" style={{ color: "#E5E7EB" }}>
                          <Briefcase className="h-3 w-3" /> {mentor.role}
                        </div>
                        <div className="flex items-center gap-2 text-xs" style={{ color: "#E5E7EB" }}>
                          <Building2 className="h-3 w-3" /> {mentor.company} • Batch {mentor.batch}
                        </div>
                        <div className="flex items-center gap-1 text-xs" style={{ color: "#E5E7EB" }}>
                          <Star className="h-3 w-3" style={{ color: "#FFC300" }} />
                          {mentor.rating} • {mentor.sessions} sessions
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {mentor.expertise.map((exp) => (
                        <Badge key={exp} variant="outline" className="text-[10px] border-white/20" style={{ color: "#E5E7EB" }}>
                          {exp}
                        </Badge>
                      ))}
                    </div>

                    {mentor.available && (
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: "rgba(0,123,255,0.12)", color: "#E5E7EB" }}>
                        <CheckCircle className="h-4 w-4" style={{ color: "#007BFF" }} />
                        <p className="text-xs">Next available: {mentor.nextSlot}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 border-white/20" style={{ color: "#E5E7EB" }}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        style={{ backgroundColor: "#FFC300", color: "#0A1A3D" }}
                        onClick={() => handleOpenProfile(mentor)}
                        disabled={!!user && user.role !== 'student'}
                        title={!!user && user.role !== 'student' ? "Only students can request mentorship (mentors need love too 💙)" : undefined}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Request Mentor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

      {/* Profile Modal */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="relative" style={{ backgroundColor: "#0A1A3D" }}>
            {/* Header banner */}
            <div className="h-24 w-full" style={{ background: "linear-gradient(90deg, #0A1A3D, #1e3a8a)" }} />
            <button className="absolute right-4 top-4" onClick={() => setShowProfileDialog(false)}>
              <X className="h-5 w-5" style={{ color: "#E5E7EB" }} />
            </button>
            <div className="-mt-8 px-6">
              <div className="flex items-end gap-4">
                <Avatar className="h-16 w-16 ring-2" style={{ boxShadow: "0 0 0 2px #007BFF inset" }}>
                  <AvatarImage src={selectedMentor?.avatar} alt={selectedMentor?.name} />
                  <AvatarFallback>{selectedMentor?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="pb-2">
                  <h3 className="font-semibold text-lg" style={{ color: "#E5E7EB" }}>{selectedMentor?.name}</h3>
                  <p className="text-xs" style={{ color: "#E5E7EB" }}>{selectedMentor?.role} • {selectedMentor?.company} • Batch {selectedMentor?.batch}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center gap-2 text-xs" style={{ color: "#E5E7EB" }}>
                <Star className="h-3 w-3" style={{ color: "#FFC300" }} /> {selectedMentor?.rating} rating • {selectedMentor?.sessions} sessions
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: "#E5E7EB" }}>Expertise</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMentor?.expertise.map((exp) => (
                    <Badge key={exp} variant="outline" className="text-[10px] border-white/20" style={{ color: "#E5E7EB" }}>
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>
              {selectedMentor?.available && (
                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: "rgba(0,123,255,0.12)", color: "#E5E7EB" }}>
                  <CheckCircle className="h-4 w-4" style={{ color: "#007BFF" }} />
                  <p className="text-xs">Next available: {selectedMentor?.nextSlot}</p>
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 w-full border-t border-white/10 p-4 flex gap-3 justify-end" style={{ backgroundColor: "#0A1A3D" }}>
              <Button variant="outline" className="border-white/20" style={{ color: "#E5E7EB" }} onClick={() => setShowProfileDialog(false)}>
                Close
              </Button>
              <Button style={{ backgroundColor: "#FFC300", color: "#0A1A3D" }} onClick={() => { setShowProfileDialog(false); if (selectedMentor) handleRequestMentorship(selectedMentor); }}>
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <Label htmlFor="stype">Session Type *</Label>
              <Select value={requestForm.sessionType} onValueChange={(value) => setRequestForm(prev => ({ ...prev, sessionType: value }))}>
                <SelectTrigger id="stype">
                  <SelectValue placeholder="Choose duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30m">30 minutes</SelectItem>
                  <SelectItem value="45m">45 minutes</SelectItem>
                  <SelectItem value="60m">60 minutes</SelectItem>
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
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="15:00">3:00 PM</SelectItem>
                    <SelectItem value="16:00">4:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Anything your mentor should know in advance?"
                value={requestForm.notes}
                onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowRequestDialog(false)} className="flex-1" disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRequest} className="flex-1" disabled={submitting || !requestForm.topic || !requestForm.sessionType || !requestForm.preferredDate || !requestForm.preferredTime}>
                {submitting ? 'Sending…' : 'Send Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

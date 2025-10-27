import { useState } from "react";
import { Calendar, MapPin, Users, Clock, Video, CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    rsvpStatus: null
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
    rsvpStatus: null
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
    rsvpStatus: null
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
    rsvpStatus: null
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
  const [events, setEvents] = useState(mockEvents);

  const handleRSVP = (eventId: number, status: string) => {
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, rsvpStatus: status } : event
    ));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Events & Webinars</h1>
        <p className="text-muted-foreground">
          Join alumni events, webinars, and networking opportunities
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
          <TabsTrigger value="my-events">My Events (1)</TabsTrigger>
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
                          <Badge>{event.category}</Badge>
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
                            <Button size="sm" onClick={() => handleRSVP(event.id, 'going')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              I'm Going
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
                              {event.rsvpStatus === 'going' ? "You're Going" : "Interested"}
                            </Badge>
                            <Button size="sm" variant="outline" onClick={() => handleRSVP(event.id, null)}>
                              Cancel RSVP
                            </Button>
                          </div>
                        )}
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
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Events you've RSVP'd to will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

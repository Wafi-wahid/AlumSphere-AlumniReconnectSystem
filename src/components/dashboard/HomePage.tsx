import { Bell, TrendingUp, Users, Calendar, Briefcase, Heart, MessageSquare, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HomePageProps {
  user: any;
  onNavigate: (section: string) => void;
}

export function HomePage({ user, onNavigate }: HomePageProps) {
  const recentActivity = [
    {
      type: "mentorship",
      title: "Mentoring session with Alex Chen",
      time: "2 hours ago",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face"
    },
    {
      type: "job",
      title: "New job posting: Senior Engineer at Meta",
      time: "4 hours ago",
      avatar: null
    },
    {
      type: "event",
      title: "AI/ML Workshop registration confirmed",
      time: "1 day ago",
      avatar: null
    }
  ];

  const quickStats = [
    { label: "Profile Views", value: "124", change: "+12%", icon: Users },
    { label: "Connections", value: "67", change: "+8%", icon: MessageSquare },
    { label: "Mentoring Score", value: "4.9", change: "+0.2", icon: Star },
    { label: "Events Attended", value: "8", change: "+2", icon: Calendar }
  ];

  const upcomingEvents = [
    {
      title: "Career Fair 2024",
      date: "March 15",
      time: "10:00 AM",
      type: "Career",
      attendees: 234
    },
    {
      title: "Alumni Networking Mixer",
      date: "March 20",
      time: "6:00 PM", 
      type: "Networking",
      attendees: 89
    },
    {
      title: "Tech Talk: Future of AI",
      date: "March 25",
      time: "2:00 PM",
      type: "Education",
      attendees: 156
    }
  ];

  const featuredOpportunities = [
    {
      title: "Software Engineer",
      company: "Google",
      type: "Full-time",
      postedBy: "Sarah Johnson",
      applicants: 23
    },
    {
      title: "Product Manager",
      company: "Microsoft",
      type: "Full-time", 
      postedBy: "Michael Chen",
      applicants: 41
    },
    {
      title: "Data Scientist Intern",
      company: "Netflix",
      type: "Internship",
      postedBy: "Emily Davis",
      applicants: 67
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Welcome back, {user.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your alumni network today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <Badge variant="secondary" className="text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Stay updated with your network activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                {activity.avatar ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.avatar} />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {activity.type === "job" && <Briefcase className="h-5 w-5 text-primary" />}
                    {activity.type === "event" && <Calendar className="h-5 w-5 text-primary" />}
                    {activity.type === "mentorship" && <Heart className="h-5 w-5 text-primary" />}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump to what matters most
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-12"
              onClick={() => onNavigate("directory")}
            >
              <Users className="h-5 w-5" />
              Browse Alumni Directory
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-12"
              onClick={() => onNavigate("mentorship")}
            >
              <Heart className="h-5 w-5" />
              Find a Mentor
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-12"
              onClick={() => onNavigate("careers")}
            >
              <Briefcase className="h-5 w-5" />
              Explore Jobs
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-12"
              onClick={() => onNavigate("events")}
            >
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              Don't miss these networking opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.date} at {event.time}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {event.attendees} attending
                    </span>
                  </div>
                </div>
                <Button size="sm">RSVP</Button>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => onNavigate("events")}>
              View All Events
            </Button>
          </CardContent>
        </Card>

        {/* Featured Job Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Featured Opportunities
            </CardTitle>
            <CardDescription>
              Jobs posted by your alumni network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {featuredOpportunities.map((job, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {job.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Posted by {job.postedBy}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.applicants} applicants
                  </p>
                </div>
                <div className="space-y-2">
                  <Button size="sm">Apply</Button>
                  <Button size="sm" variant="outline">
                    Refer
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => onNavigate("careers")}>
              View All Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
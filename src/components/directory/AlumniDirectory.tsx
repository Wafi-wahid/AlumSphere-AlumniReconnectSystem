import { useState } from "react";
import { Search, Filter, MapPin, Briefcase, GraduationCap, MessageCircle, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockAlumni = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
    company: "Google",
    role: "Senior Software Engineer",
    graduationYear: 2018,
    department: "Computer Science",
    location: "Mountain View, CA",
    skills: ["React", "Python", "Machine Learning", "System Design"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.9,
    mentoringSessions: 23
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    company: "Microsoft",
    role: "Product Manager",
    graduationYear: 2019,
    department: "Business",
    location: "Seattle, WA",
    skills: ["Product Strategy", "Leadership", "Analytics", "Roadmapping"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.8,
    mentoringSessions: 17
  },
  {
    id: 3,
    name: "Emily Davis",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    company: "Tesla",
    role: "Engineering Manager",
    graduationYear: 2016,
    department: "Electrical Engineering",
    location: "Austin, TX",
    skills: ["Leadership", "Hardware", "Renewable Energy", "Team Building"],
    mentorAvailable: false,
    linkedinSynced: true,
    rating: 4.7,
    mentoringSessions: 31
  },
  {
    id: 4,
    name: "David Wilson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    company: "Amazon",
    role: "Solutions Architect",
    graduationYear: 2017,
    department: "Computer Science",
    location: "San Francisco, CA",
    skills: ["Cloud Architecture", "DevOps", "System Design", "AWS"],
    mentorAvailable: true,
    linkedinSynced: false,
    rating: 4.6,
    mentoringSessions: 12
  },
  {
    id: 5,
    name: "Jennifer Lee",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    company: "Apple",
    role: "UX Design Lead",
    graduationYear: 2019,
    department: "Design",
    location: "Cupertino, CA",
    skills: ["UI/UX Design", "Figma", "User Research", "Design Systems"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.9,
    mentoringSessions: 28
  },
  {
    id: 6,
    name: "Robert Martinez",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    company: "Meta",
    role: "Data Scientist",
    graduationYear: 2020,
    department: "Computer Science",
    location: "Menlo Park, CA",
    skills: ["Python", "Machine Learning", "Data Visualization", "SQL"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.7,
    mentoringSessions: 15
  },
  {
    id: 7,
    name: "Amanda White",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    company: "Netflix",
    role: "Senior DevOps Engineer",
    graduationYear: 2017,
    department: "Computer Engineering",
    location: "Los Gatos, CA",
    skills: ["Kubernetes", "Docker", "CI/CD", "Terraform"],
    mentorAvailable: false,
    linkedinSynced: true,
    rating: 4.8,
    mentoringSessions: 22
  },
  {
    id: 8,
    name: "Chris Brown",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    company: "Stripe",
    role: "Staff Engineer",
    graduationYear: 2015,
    department: "Computer Science",
    location: "San Francisco, CA",
    skills: ["Java", "Microservices", "Distributed Systems", "PostgreSQL"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.9,
    mentoringSessions: 35
  },
  {
    id: 9,
    name: "Lisa Anderson",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    company: "Salesforce",
    role: "Marketing Director",
    graduationYear: 2018,
    department: "Business",
    location: "San Francisco, CA",
    skills: ["Digital Marketing", "SEO", "Content Strategy", "Analytics"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.6,
    mentoringSessions: 19
  },
  {
    id: 10,
    name: "Kevin Taylor",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
    company: "Uber",
    role: "Mobile Engineering Lead",
    graduationYear: 2016,
    department: "Computer Science",
    location: "San Francisco, CA",
    skills: ["React Native", "iOS", "Android", "Swift"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.8,
    mentoringSessions: 26
  },
  {
    id: 11,
    name: "Rachel Green",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face",
    company: "Airbnb",
    role: "Growth Product Manager",
    graduationYear: 2021,
    department: "Business",
    location: "San Francisco, CA",
    skills: ["Product Management", "Growth Hacking", "A/B Testing", "Analytics"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.7,
    mentoringSessions: 11
  },
  {
    id: 12,
    name: "Tom Harris",
    avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face",
    company: "LinkedIn",
    role: "Backend Engineer",
    graduationYear: 2019,
    department: "Computer Science",
    location: "Sunnyvale, CA",
    skills: ["Java", "Spring Boot", "Redis", "Kafka"],
    mentorAvailable: false,
    linkedinSynced: true,
    rating: 4.5,
    mentoringSessions: 8
  }
];

export function AlumniDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    year: "",
    department: "",
    location: "",
    mentorAvailable: false
  });

  const filteredAlumni = mockAlumni.filter(alumni => {
    const matchesSearch = alumni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alumni.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alumni.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesYear = !filters.year || alumni.graduationYear.toString() === filters.year;
    const matchesDepartment = !filters.department || alumni.department === filters.department;
    const matchesLocation = !filters.location || alumni.location.includes(filters.location);
    const matchesMentor = !filters.mentorAvailable || alumni.mentorAvailable;

    return matchesSearch && matchesYear && matchesDepartment && matchesLocation && matchesMentor;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Alumni Directory</h1>
        <p className="text-muted-foreground">
          Connect with {mockAlumni.length.toLocaleString()} alumni from your university
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Advanced
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Graduation Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
                <SelectItem value="2019">2019</SelectItem>
                <SelectItem value="2018">2018</SelectItem>
                <SelectItem value="2017">2017</SelectItem>
                <SelectItem value="2016">2016</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.location} onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                <SelectItem value="CA">California</SelectItem>
                <SelectItem value="WA">Washington</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
                <SelectItem value="NY">New York</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={filters.mentorAvailable ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, mentorAvailable: !prev.mentorAvailable }))}
              className="gap-2"
            >
              <Heart className="h-4 w-4" />
              Mentors Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAlumni.length} of {mockAlumni.length} alumni
          </p>
          <Select defaultValue="relevance">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Most Relevant</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="year">Graduation Year</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="rating">Mentor Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map((alumni) => (
            <Card key={alumni.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={alumni.avatar} alt={alumni.name} />
                    <AvatarFallback>
                      {alumni.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {alumni.name}
                      </h3>
                      {alumni.linkedinSynced && (
                        <Badge variant="secondary" className="text-xs">
                          LinkedIn
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{alumni.role}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Briefcase className="h-3 w-3" />
                      {alumni.company}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <GraduationCap className="h-3 w-3" />
                      {alumni.department} '&apos;{alumni.graduationYear.toString().slice(-2)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {alumni.location}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {alumni.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {alumni.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{alumni.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Mentor Info */}
                {alumni.mentorAvailable && (
                  <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
                    <Heart className="h-4 w-4 text-success" />
                    <div className="text-sm">
                      <p className="font-medium text-success">Available for mentoring</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {alumni.rating} • {alumni.mentoringSessions} sessions
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                  {alumni.mentorAvailable && (
                    <Button size="sm" variant="outline" className="flex-1">
                      <Heart className="h-4 w-4 mr-2" />
                      Mentor Request
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
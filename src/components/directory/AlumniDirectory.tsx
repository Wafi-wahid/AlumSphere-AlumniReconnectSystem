import { useEffect, useMemo, useState } from "react";
import { Search, Filter, MapPin, Briefcase, GraduationCap, MessageCircle, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

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
    mentoringSessions: 23,
    bio: "Passionate about mentoring the next generation of engineers. Specialized in ML and distributed systems."
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
    skills: ["Product Strategy", "Leadership", "Analytics", "UX Design"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.8,
    mentoringSessions: 17,
    bio: "Helping students transition from technical roles to product management."
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
    skills: ["Leadership", "Hardware", "Renewable Energy", "Team Management"],
    mentorAvailable: false,
    linkedinSynced: true,
    rating: 4.7,
    mentoringSessions: 31,
    bio: "Leading innovation in sustainable energy and electric vehicles."
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
    mentoringSessions: 12,
    bio: "AWS expert helping companies scale their cloud infrastructure."
  },
  {
    id: 5,
    name: "Jessica Martinez",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    company: "Meta",
    role: "UX Designer",
    graduationYear: 2020,
    department: "Design",
    location: "Menlo Park, CA",
    skills: ["UI/UX Design", "Figma", "User Research", "Prototyping"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.9,
    mentoringSessions: 15,
    bio: "Creating delightful user experiences for billions of users worldwide."
  },
  {
    id: 6,
    name: "James Anderson",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    company: "Apple",
    role: "iOS Developer",
    graduationYear: 2019,
    department: "Computer Science",
    location: "Cupertino, CA",
    skills: ["Swift", "iOS Development", "Mobile Apps", "SwiftUI"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.7,
    mentoringSessions: 19,
    bio: "Building beautiful iOS applications and mentoring aspiring mobile developers."
  },
  {
    id: 7,
    name: "Rachel Kim",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    company: "Netflix",
    role: "Data Scientist",
    graduationYear: 2018,
    department: "Data Science",
    location: "Los Angeles, CA",
    skills: ["Python", "Machine Learning", "Data Analysis", "SQL"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.8,
    mentoringSessions: 21,
    bio: "Leveraging data to improve content recommendations and user engagement."
  },
  {
    id: 8,
    name: "Robert Taylor",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    company: "Stripe",
    role: "Backend Engineer",
    graduationYear: 2017,
    department: "Computer Science",
    location: "San Francisco, CA",
    skills: ["Node.js", "Microservices", "API Design", "PostgreSQL"],
    mentorAvailable: false,
    linkedinSynced: true,
    rating: 4.5,
    mentoringSessions: 8,
    bio: "Building scalable payment infrastructure for internet businesses."
  },
  {
    id: 9,
    name: "Linda Garcia",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop&crop=face",
    company: "Adobe",
    role: "Marketing Manager",
    graduationYear: 2020,
    department: "Marketing",
    location: "San Jose, CA",
    skills: ["Digital Marketing", "SEO", "Content Strategy", "Analytics"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.6,
    mentoringSessions: 14,
    bio: "Driving growth through data-driven marketing strategies."
  },
  {
    id: 10,
    name: "Christopher Lee",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    company: "Salesforce",
    role: "Sales Engineer",
    graduationYear: 2019,
    department: "Business",
    location: "San Francisco, CA",
    skills: ["Sales", "CRM", "Technical Presentations", "Cloud Solutions"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.7,
    mentoringSessions: 16,
    bio: "Helping businesses transform with cloud technology."
  },
  {
    id: 11,
    name: "Amanda White",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    company: "Airbnb",
    role: "Product Designer",
    graduationYear: 2018,
    department: "Design",
    location: "San Francisco, CA",
    skills: ["Product Design", "Design Systems", "Sketch", "User Testing"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.9,
    mentoringSessions: 25,
    bio: "Designing experiences that bring people together around the world."
  },
  {
    id: 12,
    name: "Thomas Brown",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
    company: "LinkedIn",
    role: "Software Engineer",
    graduationYear: 2021,
    department: "Computer Science",
    location: "Sunnyvale, CA",
    skills: ["Java", "Spring Boot", "Distributed Systems", "Redis"],
    mentorAvailable: true,
    linkedinSynced: true,
    rating: 4.5,
    mentoringSessions: 9,
    bio: "Building professional networking tools to connect the world's workforce."
  }
];

export function AlumniDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    year: "all",
    department: "all",
    location: "all",
    mentorAvailable: false
  });
  const [audience, setAudience] = useState<"alumni" | "students">("alumni");
  const [people, setPeople] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    const qUsers = query(collection(db, "users"));
    const unsub = onSnapshot(qUsers, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setPeople(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const qProfiles = query(collection(db, "profiles"));
    const unsubProfiles = onSnapshot(qProfiles, (snap) => {
      const map: Record<string, any> = {};
      snap.docs.forEach((d) => {
        map[d.id] = d.data();
      });
      setProfiles(map);
    });
    return () => unsubProfiles();
  }, []);

  const items = useMemo(() => {
    const all = (people.length ? people : []).map((u: any) => {
      const p = profiles[u.id] || {};
      return {
        id: u.id,
        name: p.name || u.name || u.fullName || "Unnamed",
        avatar: p.avatar || p.photoURL || u.avatar || u.photoURL || "",
        company: p.company || u.company || u.employer || "",
        role: p.role || p.title || u.title || u.roleTitle || u.role || "",
        graduationYear: p.graduationYear || u.graduationYear || u.gradYear || "",
        department: p.department || u.department || u.dept || "",
        location: p.location || p.city || u.location || u.city || "",
        skills: Array.isArray(p.skills) ? p.skills : (Array.isArray(u.skills) ? u.skills : []),
        mentorAvailable: p.mentorAvailable ?? !!u.mentorAvailable,
        linkedinSynced: p.linkedinSynced ?? !!u.linkedinSynced,
        rating: p.rating ?? (u.rating || 0),
        mentoringSessions: p.mentoringSessions ?? (u.mentoringSessions || 0),
        isCurrentStudent: (p.isCurrentStudent ?? u.isCurrentStudent) ? true : (u.role === 'student'),
        roleCategory: (p.role === 'student' || p.isCurrentStudent || u.role === 'student' || u.isCurrentStudent) ? 'student' : 'alumni',
        visible: p.visible,
      };
    });
    const peopleIds = new Set((people || []).map((u: any) => u.id));
    const extraProfiles = Object.entries(profiles || {})
      .filter(([pid]) => !peopleIds.has(pid))
      .map(([pid, p]: any) => ({
        id: pid,
        name: p.name || "Unnamed",
        avatar: p.avatar || p.photoURL || "",
        company: p.company || "",
        role: p.role || p.title || "",
        graduationYear: p.graduationYear || "",
        department: p.department || "",
        location: p.location || p.city || "",
        skills: Array.isArray(p.skills) ? p.skills : [],
        mentorAvailable: !!p.mentorAvailable,
        linkedinSynced: !!p.linkedinSynced,
        rating: p.rating || 0,
        mentoringSessions: p.mentoringSessions || 0,
        isCurrentStudent: !!p.isCurrentStudent,
        roleCategory: (p.role === 'student' || p.isCurrentStudent) ? 'student' : 'alumni',
        visible: p.visible,
      }));
    const mockMapped = mockAlumni.map((m: any) => ({
      id: `mock-${m.id}`,
      name: m.name,
      avatar: m.avatar,
      company: m.company,
      role: m.role,
      graduationYear: m.graduationYear,
      department: m.department,
      location: m.location,
      skills: m.skills || [],
      mentorAvailable: !!m.mentorAvailable,
      linkedinSynced: !!m.linkedinSynced,
      rating: m.rating || 0,
      mentoringSessions: m.mentoringSessions || 0,
      isCurrentStudent: false,
      roleCategory: 'alumni',
    }));
    return [...all, ...extraProfiles, ...mockMapped];
  }, [people, profiles]);

  const filteredAlumni = items.filter((alumni: any) => {
    const isVisible = alumni.visible !== false; // default to visible when undefined
    if (!isVisible) return false;
    const matchAudience = audience === 'alumni' ? alumni.roleCategory === 'alumni' : (alumni.isCurrentStudent || alumni.roleCategory === 'student');

    const matchesSearch = (alumni.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (alumni.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (Array.isArray(alumni.skills) ? alumni.skills : []).some((skill: string) => (skill || "").toLowerCase().includes(searchQuery.toLowerCase()));
    const yearStr = alumni.graduationYear ? alumni.graduationYear.toString() : "";
    const matchesYear = filters.year === "all" || yearStr === filters.year;
    const matchesDepartment = filters.department === "all" || alumni.department === filters.department;
    const locationStr = alumni.location || "";
    const matchesLocation = filters.location === "all" || locationStr.includes(filters.location);
    const matchesMentor = !filters.mentorAvailable || !!alumni.mentorAvailable;

    return matchAudience && matchesSearch && matchesYear && matchesDepartment && matchesLocation && matchesMentor;
  });

  const visibleAlumni = useMemo(() => filteredAlumni.slice(0, visibleCount), [filteredAlumni, visibleCount]);

  useEffect(() => {
    setVisibleCount(24);
  }, [searchQuery, filters, audience]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Alumni Directory</h1>
        <p className="text-muted-foreground">
          Connect with {(items.length).toLocaleString()} people from your university
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
            <div className="flex gap-2">
              <Button variant={audience === 'alumni' ? "default" : "outline"} onClick={() => setAudience('alumni')}>Alumni</Button>
              <Button variant={audience === 'students' ? "default" : "outline"} onClick={() => setAudience('students')}>Current Students</Button>
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
                <SelectItem value="all">All Years</SelectItem>
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
                <SelectItem value="all">All Departments</SelectItem>
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
                <SelectItem value="all">All Locations</SelectItem>
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
            Showing {filteredAlumni.length} of {items.length} people
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

        {filteredAlumni.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No results match your filters.</div>
        ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleAlumni.map((alumni: any) => (
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
                      {alumni.department} &apos;{String(alumni.graduationYear || "").slice(-2)}
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
        {filteredAlumni.length > visibleCount && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setVisibleCount((c) => c + 24)}>Load more</Button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
    
  );
}
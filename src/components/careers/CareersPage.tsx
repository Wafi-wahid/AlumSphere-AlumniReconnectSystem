import { useState } from "react";
import { Search, Filter, Briefcase, MapPin, DollarSign, Building2, Clock, Users, Send, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockJobs = [
  {
    id: 1,
    title: "Senior Software Engineer",
    company: "Google",
    logo: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&h=100&fit=crop",
    location: "Mountain View, CA",
    type: "Full-time",
    salary: "$150k - $200k",
    postedBy: {
      name: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=50&h=50&fit=crop&crop=face",
      role: "Recruiter"
    },
    skills: ["React", "TypeScript", "Node.js", "AWS"],
    applicants: 24,
    postedDate: "2 days ago",
    referralAvailable: true,
    description: "We're looking for a Senior Software Engineer to join our dynamic team building next-gen cloud solutions."
  },
  {
    id: 2,
    title: "Product Manager",
    company: "Microsoft",
    logo: "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=100&h=100&fit=crop",
    location: "Seattle, WA",
    type: "Full-time",
    salary: "$130k - $180k",
    postedBy: {
      name: "Michael Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      role: "Alumni"
    },
    skills: ["Product Strategy", "Agile", "Data Analysis", "Leadership"],
    applicants: 18,
    postedDate: "1 week ago",
    referralAvailable: true,
    description: "Join Microsoft as a Product Manager to drive innovation in cloud computing products."
  },
  {
    id: 3,
    title: "UX Designer",
    company: "Apple",
    logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100&h=100&fit=crop",
    location: "Cupertino, CA",
    type: "Full-time",
    salary: "$120k - $160k",
    postedBy: {
      name: "Emily Davis",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
      role: "Alumni"
    },
    skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
    applicants: 32,
    postedDate: "3 days ago",
    referralAvailable: false,
    description: "Design beautiful, intuitive experiences for millions of Apple users worldwide."
  },
  {
    id: 4,
    title: "Data Scientist",
    company: "Amazon",
    logo: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=100&h=100&fit=crop",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$140k - $190k",
    postedBy: {
      name: "David Wilson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
      role: "Alumni"
    },
    skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
    applicants: 41,
    postedDate: "5 days ago",
    referralAvailable: true,
    description: "Help shape the future of e-commerce with advanced machine learning models."
  },
  {
    id: 5,
    title: "DevOps Engineer",
    company: "Netflix",
    logo: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=100&h=100&fit=crop",
    location: "Los Gatos, CA",
    type: "Full-time",
    salary: "$135k - $185k",
    postedBy: {
      name: "Lisa Anderson",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=50&h=50&fit=crop&crop=face",
      role: "Recruiter"
    },
    skills: ["Kubernetes", "Docker", "CI/CD", "AWS"],
    applicants: 15,
    postedDate: "1 day ago",
    referralAvailable: true,
    description: "Build and maintain the infrastructure that delivers entertainment to millions."
  },
  {
    id: 6,
    title: "Mobile Developer",
    company: "Uber",
    logo: "https://images.unsplash.com/photo-1612992295905-7f836720e8a4?w=100&h=100&fit=crop",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$125k - $175k",
    postedBy: {
      name: "James Miller",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face",
      role: "Alumni"
    },
    skills: ["React Native", "iOS", "Android", "Swift"],
    applicants: 28,
    postedDate: "4 days ago",
    referralAvailable: false,
    description: "Create seamless mobile experiences for riders and drivers worldwide."
  },
  {
    id: 7,
    title: "Marketing Manager",
    company: "Airbnb",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop",
    location: "Remote",
    type: "Full-time",
    salary: "$110k - $150k",
    postedBy: {
      name: "Rachel Green",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop&crop=face",
      role: "Recruiter"
    },
    skills: ["Digital Marketing", "SEO", "Analytics", "Content Strategy"],
    applicants: 36,
    postedDate: "1 week ago",
    referralAvailable: true,
    description: "Drive growth and brand awareness for Airbnb's global marketplace."
  },
  {
    id: 8,
    title: "Backend Engineer",
    company: "Stripe",
    logo: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&h=100&fit=crop",
    location: "New York, NY",
    type: "Full-time",
    salary: "$145k - $195k",
    postedBy: {
      name: "Tom Harris",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop&crop=face",
      role: "Alumni"
    },
    skills: ["Java", "Microservices", "PostgreSQL", "Redis"],
    applicants: 19,
    postedDate: "6 days ago",
    referralAvailable: true,
    description: "Build the financial infrastructure that powers internet commerce."
  }
];

const mockReferrals = [
  {
    id: 1,
    student: {
      name: "Alex Thompson",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=50&h=50&fit=crop&crop=face",
      department: "Computer Science"
    },
    job: "Software Engineer at Tesla",
    alumni: {
      name: "Emily Davis",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face"
    },
    status: "pending",
    requestedDate: "2 days ago"
  },
  {
    id: 2,
    student: {
      name: "Maria Garcia",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=50&h=50&fit=crop&crop=face",
      department: "Business"
    },
    job: "Product Manager at Microsoft",
    alumni: {
      name: "Michael Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face"
    },
    status: "approved",
    requestedDate: "5 days ago"
  },
  {
    id: 3,
    student: {
      name: "John Smith",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face",
      department: "Engineering"
    },
    job: "Data Scientist at Amazon",
    alumni: {
      name: "David Wilson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
    },
    status: "referred",
    requestedDate: "1 week ago"
  }
];

export function CareersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    location: "",
    salary: "",
    referralOnly: false
  });

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = !filters.type || job.type === filters.type;
    const matchesLocation = !filters.location || job.location.includes(filters.location);
    const matchesReferral = !filters.referralOnly || job.referralAvailable;

    return matchesSearch && matchesType && matchesLocation && matchesReferral;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Career Opportunities</h1>
        <p className="text-muted-foreground">
          Explore {mockJobs.length} job opportunities posted by alumni and recruiters
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="jobs">Job Board</TabsTrigger>
          <TabsTrigger value="referrals">My Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by job title, company, or skills..."
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
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
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
                    <SelectItem value="Remote">Remote</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.salary} onValueChange={(value) => setFilters(prev => ({ ...prev, salary: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Salary Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Ranges</SelectItem>
                    <SelectItem value="100k">$100k+</SelectItem>
                    <SelectItem value="120k">$120k+</SelectItem>
                    <SelectItem value="150k">$150k+</SelectItem>
                    <SelectItem value="180k">$180k+</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={filters.referralOnly ? "default" : "outline"}
                  onClick={() => setFilters(prev => ({ ...prev, referralOnly: !prev.referralOnly }))}
                  className="gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Referral Available
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {filteredJobs.length} of {mockJobs.length} jobs
              </p>
              <Select defaultValue="recent">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="salary">Highest Salary</SelectItem>
                  <SelectItem value="applicants">Most Applicants</SelectItem>
                  <SelectItem value="company">Company Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Avatar className="h-16 w-16 rounded-lg">
                        <AvatarImage src={job.logo} alt={job.company} />
                        <AvatarFallback className="rounded-lg">{job.company[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span className="font-medium">{job.company}</span>
                            </div>
                          </div>
                          {job.referralAvailable && (
                            <Badge variant="secondary" className="gap-1">
                              <Heart className="h-3 w-3" />
                              Referral Available
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.type}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {job.applicants} applicants
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.postedDate}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={job.postedBy.avatar} alt={job.postedBy.name} />
                              <AvatarFallback>{job.postedBy.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              Posted by <span className="font-medium">{job.postedBy.name}</span> ({job.postedBy.role})
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            {job.referralAvailable ? (
                              <Button size="sm" variant="default" className="gap-2">
                                <Heart className="h-4 w-4" />
                                Request Referral
                              </Button>
                            ) : (
                              <Button size="sm" className="gap-2">
                                <Send className="h-4 w-4" />
                                Apply Now
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Referral Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={referral.student.avatar} alt={referral.student.name} />
                      <AvatarFallback>{referral.student.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium">{referral.student.name}</p>
                      <p className="text-sm text-muted-foreground">{referral.student.department}</p>
                      <p className="text-sm">{referral.job}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge
                        variant={
                          referral.status === "approved"
                            ? "default"
                            : referral.status === "referred"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {referral.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{referral.requestedDate}</p>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={referral.alumni.avatar} alt={referral.alumni.name} />
                      <AvatarFallback>{referral.alumni.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

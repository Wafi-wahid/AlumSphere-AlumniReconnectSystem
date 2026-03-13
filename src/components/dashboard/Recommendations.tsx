import { useEffect, useState } from 'react';
import { RecommendationsAPI } from '@/lib/recommendations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Briefcase, Calendar, Star, Shuffle } from 'lucide-react';

interface Mentor {
  userId: string;
  name: string;
  profilePicture?: string;
  profileHeadline?: string;
  location?: string;
  currentCompany?: string;
  position?: string;
  mentorIndustries: string[];
  mentorInterests: string[];
  mentorSkills: string[];
  score: number;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  location?: string;
  requiredSkills: string[];
  industry?: string;
  tags: string[];
  experienceYears?: number;
  employmentType?: string;
  salaryRange?: string;
  score: number;
}

interface Event {
  _id: string;
  title: string;
  date: string;
  location?: string;
  isVirtual: boolean;
  tags: string[];
  industry?: string;
  organizer?: string;
  registrationLink?: string;
  score: number;
}

export function Recommendations() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [mentorsRes, jobsRes, eventsRes] = await Promise.all([
          RecommendationsAPI.mentors(),
          RecommendationsAPI.jobs(),
          RecommendationsAPI.events(),
        ]);
        setMentors(mentorsRes.mentors);
        setJobs(jobsRes.jobs);
        setEvents(eventsRes.events);
      } catch (e) {
        console.error('Failed to load recommendations', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fallback: if no matches, fetch random items via ?fallback=true
  const loadRandomFallback = async (type: 'mentors' | 'jobs' | 'events') => {
    try {
      let res;
      switch (type) {
        case 'mentors':
          res = await RecommendationsAPI.mentors(true);
          break;
        case 'jobs':
          res = await RecommendationsAPI.jobs(true);
          break;
        case 'events':
          res = await RecommendationsAPI.events(true);
          break;
      }
      const data = res as any;
      const list = data.mentors || data.jobs || data.events || [];
      if (type === 'mentors') setMentors(list);
      if (type === 'jobs') setJobs(list);
      if (type === 'events') setEvents(list);
    } catch (e) {
      console.error('Failed to load random fallback', e);
    }
  };

  // Auto-load fallbacks if initial load is empty
  useEffect(() => {
    if (!loading) {
      if (mentors.length === 0) loadRandomFallback('mentors');
      if (jobs.length === 0) loadRandomFallback('jobs');
      if (events.length === 0) loadRandomFallback('events');
    }
  }, [loading]);

  if (loading) return <div className="p-4">Loading recommendations...</div>;

  return (
    <div className="space-y-6">
      {/* Mentors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Recommended Mentors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mentors.length === 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground">No mentors matched your profile yet. Here are some you might be interested in:</p>
              <Button variant="outline" size="sm" onClick={() => loadRandomFallback('mentors')}>
                <Shuffle className="w-4 h-4 mr-2" />
                Show random mentors
              </Button>
            </div>
          ) : (
            <>
              {mentors.some(m => m.score > 0) && (
                <p className="text-sm text-muted-foreground">Based on your interests and goals</p>
              )}
              {mentors.filter(m => m.score > 0).map((mentor) => (
                <div key={mentor.userId} className="flex items-start gap-4 p-3 border rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={mentor.profilePicture} />
                    <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{mentor.name}</h4>
                      <Badge variant="secondary">Score {mentor.score}</Badge>
                    </div>
                    {mentor.profileHeadline && <p className="text-sm text-muted-foreground">{mentor.profileHeadline}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      {mentor.currentCompany && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{mentor.currentCompany}</span>}
                      {mentor.position && <span>{mentor.position}</span>}
                      {mentor.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{mentor.location}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mentor.mentorIndustries.slice(0, 3).map(ind => <Badge key={ind} variant="outline">{ind}</Badge>)}
                      {mentor.mentorSkills.slice(0, 3).map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}
                    </div>
                  </div>
                </div>
              ))}
              {mentors.some(m => m.score > 0) && mentors.some(m => m.score === 0) && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-3">Apart from your interests, you might also like:</p>
                </div>
              )}
              {mentors.filter(m => m.score === 0).map((mentor) => (
                <div key={mentor.userId} className="flex items-start gap-4 p-3 border rounded-lg opacity-75">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={mentor.profilePicture} />
                    <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{mentor.name}</h4>
                    </div>
                    {mentor.profileHeadline && <p className="text-sm text-muted-foreground">{mentor.profileHeadline}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      {mentor.currentCompany && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{mentor.currentCompany}</span>}
                      {mentor.position && <span>{mentor.position}</span>}
                      {mentor.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{mentor.location}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mentor.mentorIndustries.slice(0, 3).map(ind => <Badge key={ind} variant="outline">{ind}</Badge>)}
                      {mentor.mentorSkills.slice(0, 3).map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Recommended Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobs.length === 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground">No jobs matched your profile yet. Here are some you might be interested in:</p>
              <Button variant="outline" size="sm" onClick={() => loadRandomFallback('jobs')}>
                <Shuffle className="w-4 h-4 mr-2" />
                Show random jobs
              </Button>
            </div>
          ) : (
            <>
              {jobs.some(j => j.score > 0) && (
                <p className="text-sm text-muted-foreground">Based on your skills and interests</p>
              )}
              {jobs.filter(j => j.score > 0).map((job) => (
                <div key={job._id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                        {job.employmentType && <span>{job.employmentType}</span>}
                        {job.salaryRange && <span>{job.salaryRange}</span>}
                      </div>
                    </div>
                    <Badge variant="secondary">Score {job.score}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.requiredSkills.slice(0, 4).map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}
                    {job.tags.slice(0, 2).map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                  </div>
                </div>
              ))}
              {jobs.some(j => j.score > 0) && jobs.some(j => j.score === 0) && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-3">Apart from your interests, you might also like:</p>
                </div>
              )}
              {jobs.filter(j => j.score === 0).map((job) => (
                <div key={job._id} className="p-3 border rounded-lg opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                        {job.employmentType && <span>{job.employmentType}</span>}
                        {job.salaryRange && <span>{job.salaryRange}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.requiredSkills.slice(0, 4).map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}
                    {job.tags.slice(0, 2).map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recommended Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.length === 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground">No events matched your profile yet. Here are some you might be interested in:</p>
              <Button variant="outline" size="sm" onClick={() => loadRandomFallback('events')}>
                <Shuffle className="w-4 h-4 mr-2" />
                Show random events
              </Button>
            </div>
          ) : (
            <>
              {events.some(e => e.score > 0) && (
                <p className="text-sm text-muted-foreground">Based on your interests</p>
              )}
              {events.filter(e => e.score > 0).map((event) => (
                <div key={event._id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.organizer}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(event.date).toLocaleDateString()}</span>
                        {event.isVirtual ? <span>Virtual</span> : event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                      </div>
                    </div>
                    <Badge variant="secondary">Score {event.score}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.tags.slice(0, 4).map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    {event.industry && <Badge variant="outline">{event.industry}</Badge>}
                  </div>
                  {event.registrationLink && (
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">Register</a>
                    </Button>
                  )}
                </div>
              ))}
              {events.some(e => e.score > 0) && events.some(e => e.score === 0) && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-3">Apart from your interests, you might also like:</p>
                </div>
              )}
              {events.filter(e => e.score === 0).map((event) => (
                <div key={event._id} className="p-3 border rounded-lg opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.organizer}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(event.date).toLocaleDateString()}</span>
                        {event.isVirtual ? <span>Virtual</span> : event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.tags.slice(0, 4).map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    {event.industry && <Badge variant="outline">{event.industry}</Badge>}
                  </div>
                  {event.registrationLink && (
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">Register</a>
                    </Button>
                  )}
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { RecommendationsAPI } from '@/lib/recommendations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Briefcase, Calendar, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Mentor {
  userId: string;
  name: string;
  profilePicture?: string;
  profileHeadline?: string;
  location?: string;
  currentCompany?: string;
  position?: string;
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
  score: number;
}

type RecommendationItem = Mentor | Job | Event;

interface RecommendationTeaserProps {
  type: 'mentors' | 'jobs' | 'events';
  title?: string;
  subtitle?: string;
  maxItems?: number;
  showViewAll?: boolean;
}

export function RecommendationTeaser({
  type,
  title,
  subtitle,
  maxItems = 3,
  showViewAll = true,
}: RecommendationTeaserProps) {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        let res;
        switch (type) {
          case 'mentors':
            res = await RecommendationsAPI.mentors();
            break;
          case 'jobs':
            res = await RecommendationsAPI.jobs();
            break;
          case 'events':
            res = await RecommendationsAPI.events();
            break;
        }
        const data = res as any;
        const list = data.mentors || data.jobs || data.events || [];
        setItems(list.slice(0, maxItems));
      } catch (e) {
        console.error(`Failed to load ${type} recommendations`, e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type, maxItems]);

  const renderMentor = (mentor: Mentor) => (
    <div key={mentor.userId} className="flex items-start gap-3 p-3 border rounded-lg">
      <Avatar className="w-10 h-10">
        <AvatarImage src={mentor.profilePicture} />
        <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold truncate">{mentor.name}</h4>
          <Badge variant="secondary" className="text-xs">{mentor.score}</Badge>
        </div>
        {mentor.profileHeadline && <p className="text-xs text-muted-foreground truncate">{mentor.profileHeadline}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          {mentor.currentCompany && <span className="truncate">{mentor.currentCompany}</span>}
          {mentor.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{mentor.location}</span>}
        </div>
      </div>
    </div>
  );

  const renderJob = (job: Job) => (
    <div key={job._id} className="p-3 border rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold truncate">{job.title}</h4>
            <Badge variant="secondary" className="text-xs">{job.score}</Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{job.company}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            {job.location && <span className="truncate">{job.location}</span>}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {job.requiredSkills.slice(0, 3).map(skill => <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>)}
      </div>
    </div>
  );

  const renderEvent = (event: Event) => (
    <div key={event._id} className="p-3 border rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold truncate">{event.title}</h4>
            <Badge variant="secondary" className="text-xs">{event.score}</Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{event.organizer}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(event.date).toLocaleDateString()}</span>
            {event.isVirtual ? <span>Virtual</span> : event.location && <span className="truncate">{event.location}</span>}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {event.tags.slice(0, 3).map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
      </div>
    </div>
  );

  const renderItem = () => {
    switch (type) {
      case 'mentors': return items.map(renderMentor);
      case 'jobs': return items.map(renderJob);
      case 'events': return items.map(renderEvent);
    }
  };

  const defaultTitle = {
    mentors: 'Top mentors for you',
    jobs: 'Top jobs for you',
    events: 'Top events for you',
  }[type];

  const defaultSubtitle = {
    mentors: 'Based on your interests and goals',
    jobs: 'Matching your skills and interests',
    events: 'Events you might like',
  }[type];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="w-5 h-5" />
              {title || defaultTitle}
            </CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {showViewAll && items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/?tab=recommendations')}>
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading recommendations...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recommendations available yet.</div>
        ) : (
          renderItem()
        )}
      </CardContent>
    </Card>
  );
}

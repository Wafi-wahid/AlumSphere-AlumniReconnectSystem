import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const stories = [
  { id: 1, name: "Ayesha Khan", company: "FinTechCo", title: "From Campus to Unicorn Founder", impact: "Scaled to 5M users in 2 years", tags: ["FinTech", "Founder", "Scale"], avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=200&h=200&fit=crop&crop=face" },
  { id: 2, name: "Bilal Ahmed", company: "SpaceX", title: "Launching Reusable Rockets Software", impact: "Reduced launch prep time by 30%", tags: ["Aerospace", "Systems"], avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face" },
  { id: 3, name: "Sara Malik", company: "HealthAI", title: "Building AI to Save Lives", impact: "Deployed ML models to 120 hospitals", tags: ["AI", "HealthTech", "CTO"], avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face" }
];

export function SuccessStories() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Top Alumni Stories</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stories.map(s => (
          <Card key={s.id} className="transition-all duration-200 hover:shadow-strong hover:-translate-y-0.5">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={s.avatar} alt={s.name} />
                  <AvatarFallback>{s.name.split(" ").map(n=>n[0]).join("").toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <CardDescription className="text-xs">{s.company}</CardDescription>
                </div>
              </div>
              <div>
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.impact}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {s.tags.map(t => (
                  <Badge key={t} variant="secondary" className="transition-colors hover:bg-[hsl(var(--brand-secondary)/0.2)]">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const leaders = [
  { id: 1, name: "Ayesha Khan", score: 98, metric: "Mentorship Points", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=200&h=200&fit=crop&crop=face" },
  { id: 2, name: "Bilal Ahmed", score: 92, metric: "Talks & Events", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face" },
  { id: 3, name: "Sara Malik", score: 89, metric: "Donations & Impact", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face" },
  { id: 4, name: "Omar Raza", score: 85, metric: "Research Citations", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" }
];

export function Leaderboard() {
  const top = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Leaderboard</h2>

      <div className="grid gap-6 md:grid-cols-3">
        {top.map((l, idx) => (
          <Card key={l.id} className="transition-all duration-200 hover:shadow-strong hover:-translate-y-0.5">
            <CardHeader className="flex-row items-center gap-4">
              <div className="text-3xl font-bold w-8 text-center text-[hsl(var(--brand-secondary))]">{idx + 1}</div>
              <Avatar className="h-12 w-12">
                <AvatarImage src={l.avatar} alt={l.name} />
                <AvatarFallback>{l.name.split(" ").map(n=>n[0]).join("").toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-base">{l.name}</CardTitle>
                <div className="text-sm text-muted-foreground">{l.metric}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Progress value={l.score} className="h-2 transition-all" />
                <div className="text-sm font-medium w-10 text-right">{l.score}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rest.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {rest.map((l, i) => (
                <li key={l.id} className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
                  <div className="w-6 text-center">{i + 4}</div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={l.avatar} alt={l.name} />
                    <AvatarFallback>{l.name.split(" ").map(n=>n[0]).join("").toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.metric}</div>
                  </div>
                  <div className="flex items-center gap-3 w-40">
                    <Progress value={l.score} className="h-2 transition-all" />
                    <div className="text-sm font-medium w-10 text-right">{l.score}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

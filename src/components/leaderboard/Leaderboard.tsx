import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MentorshipAPI } from "@/lib/mentorshipApi";

export function Leaderboard() {
  const [loading, setLoading] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await MentorshipAPI.leaderboard(10);
        if (cancelled) return;
        setLeaders(Array.isArray(res.items) ? res.items : []);
      } catch {
        if (cancelled) return;
        setLeaders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalized = useMemo(() => {
    return (leaders || []).map((l: any) => {
      const avg = Number(l.avgRating || 0);
      const pct = Math.max(0, Math.min(100, (avg / 5) * 100));
      return {
        id: String(l.mentorId || l.id || ""),
        name: String(l.name || "Unknown"),
        score: pct,
        metric: `Avg rating: ${avg.toFixed(2)} (${Number(l.ratingsCount || 0)})`,
        avatar: String(l.profilePicture || ""),
      };
    });
  }, [leaders]);

  const top = normalized.slice(0, 3);
  const rest = normalized.slice(3);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Leaderboard</h2>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading leaderboard…</div>
      ) : normalized.length === 0 ? (
        <div className="text-sm text-muted-foreground">No ratings yet.</div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

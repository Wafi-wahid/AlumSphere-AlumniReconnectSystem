import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const alumni = [
  { id: 1, name: "Ayesha Khan", batch: 2015, achievement: "Forbes 30 Under 30 – Enterprise Tech", role: "Founder, FinTechCo", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=200&h=200&fit=crop&crop=face" },
  { id: 2, name: "Bilal Ahmed", batch: 2018, achievement: "Lead Engineer at SpaceX", role: "Lead Software Engineer", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face" },
  { id: 3, name: "Sara Malik", batch: 2015, achievement: "CTO at HealthAI", role: "CTO", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face" },
  { id: 4, name: "Omar Raza", batch: 2020, achievement: "Best Paper at NeurIPS", role: "Research Scientist, OpenAI", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" }
];

export function WallOfFame() {
  const [batch, setBatch] = useState<string>("all");

  const batches = useMemo(
    () => Array.from(new Set(alumni.map(a => a.batch))).sort(),
    []
  );

  const filtered = useMemo(
    () => alumni.filter(a => (batch === "all" ? true : a.batch === Number(batch))),
    [batch]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Wall of Fame</h2>
        <div className="w-48">
          <Select value={batch} onValueChange={setBatch}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map(b => (
                <SelectItem key={b} value={String(b)}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(a => (
          <Card key={a.id} className="transition-all duration-200 hover:shadow-strong hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-[hsl(var(--brand-secondary))]">
            <CardHeader className="flex-row items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={a.avatar} alt={a.name} />
                <AvatarFallback>{a.name.split(" ").map(n=>n[0]).join("").toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-base">{a.name}</CardTitle>
                <div className="text-sm text-muted-foreground">{a.role}</div>
              </div>
              <Badge className="ml-auto" variant="secondary">Batch {a.batch}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{a.achievement}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

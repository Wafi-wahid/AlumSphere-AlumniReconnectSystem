import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Award, Target } from "lucide-react";

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
      {/* Hero */}
      <Card className="overflow-hidden rounded-3xl shadow-strong border-0 bg-gradient-to-br from-[#0b1b3a] to-[#1d4ed8]">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          
          <div className="lg:col-span-2 p-6 md:p-10 text-white">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs">
                <Trophy className="h-3.5 w-3.5" /> Hall of Excellence • {filtered.length} featured alumni <Star className="h-3.5 w-3.5 text-orange-300" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Wall of Fame</h1>
              <p className="text-white/80">Celebrating the outstanding achievements of our alumni. From groundbreaking research to entrepreneurial success, discover the leaders making their mark.</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center gap-2 md:gap-3">
              <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto">
                View All Alumni
              </Button>
              <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto">
                Success Stories
              </Button>
              <Button variant="outline" className="h-10 px-5 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 w-full sm:w-auto">
                Nominate Alumni
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_40%)]" />
            <div className="relative h-full w-full p-6 md:p-8 flex items-center justify-center">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-6 text-white text-center max-w-xs">
                <div className="text-sm opacity-90">Achievement Gallery</div>
                <div className="text-lg font-semibold">Discover {filtered.length}+ inspiring success stories</div>
                <Button className="mt-3 h-9 bg-yellow-500 hover:bg-yellow-400 text-[#0b1b3a] w-full">Explore Stories</Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Featured Alumni</h2>
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

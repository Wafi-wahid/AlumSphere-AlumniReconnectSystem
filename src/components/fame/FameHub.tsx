import { WallOfFame } from "@/components/fame/WallOfFame";
import { SuccessStories } from "@/components/stories/SuccessStories";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { Button } from "@/components/ui/button";

export function FameHub() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Button variant="soft" onClick={() => scrollTo("wall")}>Wall of Fame</Button>
        <Button variant="soft" onClick={() => scrollTo("stories")}>Success Stories</Button>
        <Button variant="soft" onClick={() => scrollTo("leaders")}>Leaderboard</Button>
      </div>

      <section id="wall" className="scroll-mt-24 space-y-6">
        <WallOfFame />
      </section>
      <section id="stories" className="scroll-mt-24 space-y-6">
        <SuccessStories />
      </section>
      <section id="leaders" className="scroll-mt-24 space-y-6">
        <Leaderboard />
      </section>
    </div>
  );
}

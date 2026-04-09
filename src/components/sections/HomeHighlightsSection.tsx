import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BadgeCheck, Briefcase, Flame, Star } from "lucide-react";

const outcomes = [
  {
    icon: Flame,
    title: "Learn by Building",
    description: "Short lessons, instant practice, and real project unlocks after each module.",
  },
  {
    icon: Briefcase,
    title: "Portfolio Ready",
    description: "Ship production-style projects you can showcase in your resume and profile.",
  },
  {
    icon: BadgeCheck,
    title: "Career Signals",
    description: "Track progress, complete assessments, and earn skill proof over time.",
  },
];

const socialProof = [
  { value: "6", label: "Core learning modules" },
  { value: "10+", label: "Quiz questions per unit" },
  { value: "Real", label: "Project unlock path" },
  { value: "24/7", label: "AI-powered build flow" },
];

export default function HomeHighlightsSection() {
  return (
    <section className="section-padding pt-2">
      <div className="container-main">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e] p-6 md:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
          <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative grid lg:grid-cols-2 gap-8 items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary mb-4">
                <Star size={12} />
                Why builders choose ZeroCode AI
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">From learning to shipping, in one flow.</h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Stop jumping between random tutorials. Learn concepts, practice immediately, unlock projects,
                and move toward real builder confidence.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/learn">
                  <Button className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest gap-2">
                    Start Learning <ArrowRight size={12} />
                  </Button>
                </Link>
                <Link to="/hackathon">
                  <Button variant="outline" className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest bg-white/5 border-white/10 hover:bg-white/10">
                    Explore Hackathons
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {socialProof.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                  <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 grid md:grid-cols-3 gap-4">
            {outcomes.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-black/30 p-4 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                  <item.icon size={16} className="text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

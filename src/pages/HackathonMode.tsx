import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Clock, Users, Zap, Target, Presentation } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "@/lib/firebase";

const timeline = [
  { time: "0:00 – 0:30", phase: "Setup & Planning", tasks: ["Team role assignment", "Project idea finalization", "Feature list and MVP scope", "Master prompt writing"], color: "text-blue-400" },
  { time: "0:30 – 1:30", phase: "Core Build", tasks: ["Generate initial UI from master prompt", "Set up authentication", "Create database tables", "Wire up core feature"], color: "text-primary" },
  { time: "1:30 – 2:30", phase: "Feature Completion", tasks: ["Complete remaining features", "Connect frontend to backend", "Add data flow and state management", "Test core user flows"], color: "text-yellow-400" },
  { time: "2:30 – 3:15", phase: "Polish & Integration", tasks: ["Fix UI alignment and spacing", "Add loading and error states", "Mobile responsiveness pass", "Add any final integrations"], color: "text-orange-400" },
  { time: "3:15 – 3:45", phase: "Deploy & Test", tasks: ["Push to GitHub", "Deploy to Vercel/Netlify", "Test deployed version end-to-end", "Fix any deployment-specific bugs"], color: "text-purple-400" },
  { time: "3:45 – 4:00", phase: "Demo Prep", tasks: ["Prepare demo script", "Practice presentation flow", "Seed demo data", "Test on presentation device"], color: "text-pink-400" },
];

const roles = [
  { role: "Prompt Lead", desc: "Writes and refines all AI prompts. Owns the master prompt and prompt iterations.", icon: Zap },
  { role: "UI/UX Lead", desc: "Reviews generated UI, fixes alignment, handles design polish and responsiveness.", icon: Target },
  { role: "Backend Lead", desc: "Sets up auth, database, API connections, and data flow.", icon: Users },
  { role: "Demo Lead", desc: "Prepares presentation, seeds data, practices demo flow, handles deployment.", icon: Presentation },
];

type HackathonItem = {
  id: string;
  title: string;
  description?: string;
  mode?: string;
  prize?: string;
  status?: string;
  startDate?: any;
  registrationDeadline?: any;
  tags?: string[];
  previewImageUrl?: string;
  hackathonLink?: string;
};

const HackathonMode = () => {
  const [hackathons, setHackathons] = useState<HackathonItem[]>([]);
  const [loadingHackathons, setLoadingHackathons] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "hackathons"), (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as HackathonItem[];
      setHackathons(rows);
      setLoadingHackathons(false);
    }, () => {
      setLoadingHackathons(false);
    });
    return () => unsub();
  }, []);

  const upcomingHackathons = useMemo(() => {
    const now = Date.now();
    return hackathons
      .filter((h) => {
        const hasUpcomingStatus = String(h.status || "").toLowerCase() === "upcoming";
        const startMs = h.startDate?.toDate ? h.startDate.toDate().getTime() : null;
        return hasUpcomingStatus || (typeof startMs === "number" && startMs > now);
      })
      .sort((a, b) => {
        const aMs = a.startDate?.toDate ? a.startDate.toDate().getTime() : Number.MAX_SAFE_INTEGER;
        const bMs = b.startDate?.toDate ? b.startDate.toDate().getTime() : Number.MAX_SAFE_INTEGER;
        return aMs - bMs;
      });
  }, [hackathons]);

  const formatDate = (value: any) => {
    if (!value?.toDate) return "Date TBA";
    return value.toDate().toLocaleString();
  };

  const statusStyles = (status?: string) => {
    const normalized = String(status || "upcoming").toLowerCase();
    if (normalized === "live") return "bg-green-500/15 text-green-300 border-green-500/30";
    if (normalized === "ended") return "bg-white/10 text-text-muted border-white/15";
    return "bg-primary/10 text-primary border-primary/20";
  };

  const daysLeft = (value: any) => {
    const targetMs = value?.toDate ? value.toDate().getTime() : null;
    if (typeof targetMs !== "number") return null;
    const diff = Math.ceil((targetMs - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-main">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Hackathon Mode</span>
            </h1>
            <p className="text-text-secondary leading-relaxed">
              Ship a complete product in 4 hours. Strategy, roles, timeline, and prompting tips for hackathon success.
            </p>
          </div>

          {/* Upcoming Hackathons */}
          <div className="max-w-5xl mx-auto mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Upcoming Hackathons</h2>
            {loadingHackathons ? (
              <div className="glass rounded-xl p-8 text-center text-sm text-text-secondary">Loading upcoming hackathons...</div>
            ) : upcomingHackathons.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center text-sm text-text-secondary">No upcoming hackathons posted yet.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {upcomingHackathons.map((event) => (
                  <div key={event.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/45 hover:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70 animate-pulse" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-3xl rounded-full opacity-30 group-hover:opacity-70 transition-all duration-500 animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-emerald-500/10 blur-3xl rounded-full opacity-20 group-hover:opacity-50 transition-all duration-500" />

                    <div className="relative">
                      {event.previewImageUrl ? (
                        <img
                          src={event.previewImageUrl}
                          alt={`${event.title} preview`}
                          className="w-full h-40 md:h-44 object-cover"
                        />
                      ) : (
                        <div className="h-40 md:h-44 bg-gradient-to-br from-primary/25 via-primary/5 to-black flex items-center justify-center">
                          <span className="text-xs uppercase tracking-[0.24em] text-primary/80 font-bold">Hackathon Preview</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -left-1/2 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-18deg] animate-[pulse_2.6s_ease-in-out_infinite]" />
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold border backdrop-blur-md shadow-lg animate-pulse ${statusStyles(event.status)}`}>
                          {event.status || "upcoming"}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-bold text-lg text-white drop-shadow-sm">{event.title}</h3>
                        <p className="text-[11px] text-white/75 mt-1">
                          {event.mode || "Online"} • Prize {event.prize || "TBA"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-[10px] uppercase text-text-muted font-bold">Start</p>
                          <p className="text-xs text-white mt-1">{formatDate(event.startDate)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-[10px] uppercase text-text-muted font-bold">Deadline</p>
                          <p className="text-xs text-white mt-1">{formatDate(event.registrationDeadline)}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-text-secondary mb-3">
                        <p><span className="text-white">Mode:</span> {event.mode || "Online"}</p>
                        <p><span className="text-white">Prize:</span> {event.prize || "TBA"}</p>
                      </div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border border-white/15 bg-white/5 text-white">
                          {typeof daysLeft(event.registrationDeadline) === "number"
                            ? daysLeft(event.registrationDeadline)! >= 0
                              ? `${daysLeft(event.registrationDeadline)} Days Left`
                              : "Closed"
                            : "Deadline TBA"}
                        </span>
                        {event.tags?.[0] && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border border-primary/30 bg-primary/10 text-primary">
                            #{event.tags[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/hackathon/${event.id}`}
                          className="inline-flex px-3 py-2 rounded-lg text-[10px] uppercase font-bold border border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all duration-300"
                        >
                          Details
                        </Link>
                        {event.hackathonLink && (
                          <a
                            href={event.hackathonLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex px-3 py-2 rounded-lg text-[10px] uppercase font-bold border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-all duration-300"
                          >
                            Register
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Roles */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Team Roles (4 People)</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {roles.map((r) => (
                <div key={r.role} className="glass rounded-xl p-6 card-hover">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center">
                      <r.icon size={16} className="text-primary" />
                    </div>
                    <h3 className="font-semibold">{r.role}</h3>
                  </div>
                  <p className="text-sm text-text-secondary">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Hour-by-Hour Timeline</h2>
            <div className="space-y-4">
              {timeline.map((block) => (
                <div key={block.phase} className="glass rounded-xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="sm:w-32 shrink-0">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className={block.color} />
                        <span className={`text-sm font-mono font-semibold ${block.color}`}>{block.time}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{block.phase}</h3>
                      <ul className="space-y-1">
                        {block.tasks.map((task) => (
                          <li key={task} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-text-muted shrink-0" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Pro Tips</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { title: "Scope Ruthlessly", desc: "Cut features aggressively. A polished app with 3 features beats a broken app with 10." },
                { title: "Prompt First, Code Never", desc: "In vibecoding hackathons, your prompts ARE your code. Invest time in writing great prompts." },
                { title: "Demo > Features", desc: "Judges evaluate what they see. Prioritize a smooth demo flow over hidden features." },
                { title: "Use Real Data", desc: "Seed your app with realistic demo data. Nothing kills a demo like 'Lorem ipsum' on screen." },
                { title: "Test on the Demo Device", desc: "Always test on the exact device and browser you'll present on. Surprises kill demos." },
                { title: "Tell a Story", desc: "Frame your demo as a user story: 'Meet Sarah, she needs to...' Judges remember stories." },
              ].map((tip) => (
                <div key={tip.title} className="glass rounded-xl p-5 card-hover">
                  <h4 className="font-semibold text-sm mb-2">{tip.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HackathonMode;

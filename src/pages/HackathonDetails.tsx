import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import Layout from "@/components/Layout";
import { db } from "@/lib/firebase";

type HackathonItem = {
  id: string;
  title?: string;
  description?: string;
  mode?: string;
  prize?: string;
  status?: string;
  startDate?: any;
  registrationDeadline?: any;
  tags?: string[];
  previewImageUrl?: string;
  hackathonLink?: string;
  organizer?: string;
  venue?: string;
  teamSize?: string;
  eligibility?: string;
  contactEmail?: string;
  rules?: string;
};

export default function HackathonDetails() {
  const { hackathonId } = useParams();
  const [hackathon, setHackathon] = useState<HackathonItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hackathonId) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "hackathons", hackathonId),
      (snap) => {
        setHackathon(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as HackathonItem) : null);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsub();
  }, [hackathonId]);

  const formatDate = (value: any) => {
    if (!value?.toDate) return "Date TBA";
    return value.toDate().toLocaleString();
  };

  const statusClass = useMemo(() => {
    const s = String(hackathon?.status || "upcoming").toLowerCase();
    if (s === "live") return "bg-green-500/15 text-green-300 border-green-500/30";
    if (s === "ended") return "bg-white/10 text-text-muted border-white/15";
    return "bg-primary/10 text-primary border-primary/25";
  }, [hackathon?.status]);

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-main max-w-5xl">
          <div className="mb-6">
            <Link to="/hackathon" className="inline-flex px-3 py-2 rounded-lg text-[10px] uppercase font-bold border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-all">
              Back to Hackathons
            </Link>
          </div>

          {loading ? (
            <div className="glass rounded-xl p-8 text-center text-sm text-text-secondary">Loading hackathon details...</div>
          ) : !hackathon ? (
            <div className="glass rounded-xl p-8 text-center text-sm text-text-secondary">Hackathon not found.</div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0f0f0f] shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 animate-pulse" />
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 blur-3xl rounded-full opacity-40" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full opacity-30" />

              <div className="relative">
                {hackathon.previewImageUrl ? (
                  <img src={hackathon.previewImageUrl} alt={`${hackathon.title || "Hackathon"} preview`} className="w-full h-72 md:h-96 object-cover" />
                ) : (
                  <div className="w-full h-72 md:h-96 bg-gradient-to-br from-primary/25 via-primary/5 to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute -left-1/2 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-[pulse_2.8s_ease-in-out_infinite]" />
                </div>
                <div className="absolute top-5 right-5">
                  <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold border backdrop-blur-md shadow-lg animate-pulse ${statusClass}`}>
                    {hackathon.status || "upcoming"}
                  </span>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <h1 className="text-2xl md:text-4xl font-bold text-white">{hackathon.title || "Untitled Hackathon"}</h1>
                  <p className="text-sm text-white/75 mt-2">
                    {hackathon.mode || "Online"} • Prize {hackathon.prize || "TBA"}
                  </p>
                </div>
              </div>

              <div className="relative p-6 md:p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
                    <p className="text-[10px] uppercase text-text-muted font-bold">Start</p>
                    <p className="text-sm text-white mt-1">{formatDate(hackathon.startDate)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
                    <p className="text-[10px] uppercase text-text-muted font-bold">Registration Deadline</p>
                    <p className="text-sm text-white mt-1">{formatDate(hackathon.registrationDeadline)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
                    <p className="text-[10px] uppercase text-text-muted font-bold">Mode</p>
                    <p className="text-sm text-white mt-1">{hackathon.mode || "Online"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
                    <p className="text-[10px] uppercase text-text-muted font-bold">Prize</p>
                    <p className="text-sm text-white mt-1">{hackathon.prize || "TBA"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
                    <p className="text-[10px] uppercase text-text-muted font-bold">Organizer</p>
                    <p className="text-sm text-white mt-1">{hackathon.organizer || "TBA"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
                    <p className="text-[10px] uppercase text-text-muted font-bold">Venue</p>
                    <p className="text-sm text-white mt-1">{hackathon.venue || "TBA"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
                    <p className="text-[10px] uppercase text-text-muted font-bold">Team Size</p>
                    <p className="text-sm text-white mt-1">{hackathon.teamSize || "TBA"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
                    <p className="text-[10px] uppercase text-text-muted font-bold">Eligibility</p>
                    <p className="text-sm text-white mt-1">{hackathon.eligibility || "TBA"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 md:col-span-2">
                    <p className="text-[10px] uppercase text-text-muted font-bold">Contact Email</p>
                    <p className="text-sm text-white mt-1 break-all">{hackathon.contactEmail || "TBA"}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
                  <p className="text-[10px] uppercase text-text-muted font-bold mb-2">Full Details</p>
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {hackathon.description || "Full details will be announced soon."}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
                  <p className="text-[10px] uppercase text-text-muted font-bold mb-2">Rules & Judging</p>
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {hackathon.rules || "Rules will be announced soon."}
                  </p>
                </div>

                {hackathon.tags && hackathon.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hackathon.tags.map((tag) => (
                      <span key={`${hackathon.id}_${tag}`} className="px-2.5 py-1 rounded-full text-[10px] bg-primary/10 border border-primary/25 text-primary">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {hackathon.hackathonLink && (
                    <>
                      <a
                        href={hackathon.hackathonLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex px-4 py-2 rounded-lg text-[10px] uppercase font-bold border border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all"
                      >
                        View Hackathon
                      </a>
                      <a
                        href={hackathon.hackathonLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex px-4 py-2 rounded-lg text-[10px] uppercase font-bold border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-all"
                      >
                        Register Now
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

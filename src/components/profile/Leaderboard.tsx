import { useState, useEffect, memo, useMemo } from "react";
import { 
  Trophy, Flame, Zap, CheckCircle2, Medal, TrendingUp, 
  Info, Loader2, Crown, Search, Star, Activity, Sparkles,
  MousePointer2, Globe, ShieldCheck
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, limit, orderBy, 
  doc, getDoc, onSnapshot 
} from "firebase/firestore";

type LeaderboardUser = {
  uid: string;
  name: string;
  username: string;
  streakCount: number;
  tasksCompleted: number;
  promptsUsed: number;
  profilePhoto?: string;
  rank?: number;
};

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<"streakCount" | "tasksCompleted" | "promptsUsed">("streakCount");

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "users"), 
      orderBy(metric, "desc"), 
      limit(15)
    );

    const unsub = onSnapshot(q, (snap) => {
       const leaderboardData = snap.docs.map((d, idx) => ({
          uid: d.id,
          name: d.data().name || "Anonymous Developer",
          username: d.data().username || "anon",
          streakCount: d.data().streakCount || 0,
          tasksCompleted: d.data().tasksCompleted || 0,
          promptsUsed: d.data().promptsUsed || 0,
          profilePhoto: d.data().profilePhoto,
          rank: idx + 1
       } as LeaderboardUser));
       
       setUsers(leaderboardData);
       setLoading(false);
    }, (err) => {
       console.error("Leaderboard Mesh Failure:", err);
       setLoading(false);
    });

    return () => unsub();
  }, [metric]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-32 min-h-[500px] gap-8">
       <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_20px_rgba(34,197,94,0.3)]" />
       <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse italic">Interpreting Global Nodes...</h2>
    </div>
  );

  return (
    <div className="space-y-16">
      
      {/* High-Velocity Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 pb-10 border-b border-white/5">
         <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-2xl relative">
                  <div className="absolute inset-0 bg-primary/5 blur-xl animate-pulse" />
                  <Trophy size={24} className="text-primary group-hover:scale-125 transition-transform" />
               </div>
               <h2 className="text-5xl font-black tracking-tighter uppercase text-white italic">Global <span className="text-primary italic">Mesh</span></h2>
            </div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] italic opacity-60">High-velocity ranking of the top-performing developer nodes in the academy.</p>
         </div>
         
         <div className="flex bg-[#111] p-2 rounded-[32px] border border-white/10 shadow-2xl shadow-primary/5 relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            {[
               { id: "streakCount", label: "Streak Pulse", icon: Flame },
               { id: "tasksCompleted", label: "Operations", icon: CheckCircle2 },
               { id: "promptsUsed", label: "Prompt Yield", icon: Zap },
            ].map(m => (
               <button
                 key={m.id}
                 onClick={() => setMetric(m.id as any)}
                 className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative z-10 ${
                   metric === m.id ? "bg-primary text-black shadow-xl scale-105" : "text-text-muted hover:text-white"
                 }`}
               >
                  <m.icon size={14} strokeWidth={3} />
                  <span className="italic">{m.label}</span>
               </button>
            ))}
         </div>
      </div>

      {/* Leaderboard Matrix (Elite Table) */}
      <div className="bg-[#0b0b0b] border border-white/10 rounded-[64px] overflow-hidden shadow-2xl relative mx-auto max-w-5xl group">
         <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />
         <div className="overflow-x-auto relative z-10 scrollbar-hide">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-white/10 bg-white/[0.01]">
                     <th className="px-12 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-text-muted italic">Rank</th>
                     <th className="px-12 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-text-muted italic text-center">Node Identity</th>
                     <th className="px-12 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-text-muted italic text-right">Intensity</th>
                  </tr>
               </thead>
               <tbody>
                  {users.map((user, idx) => (
                     <tr key={user.uid} className={`group/row transition-all duration-500 border-b border-white/5 last:border-none ${idx < 3 ? 'bg-primary/[0.02]' : 'hover:bg-white/[0.01]'}`}>
                        <td className="px-12 py-10">
                           <div className={`flex items-center justify-center w-12 h-12 rounded-[20px] bg-black border border-white/5 text-[10px] font-black transition-all group-hover/row:border-primary/40 group-hover/row:scale-110 shadow-xl ${idx === 0 ? 'border-yellow-500/40 text-yellow-500 shadow-yellow-500/10' : idx === 1 ? 'border-zinc-400/40 text-zinc-300' : idx === 2 ? 'border-orange-500/40 text-orange-400' : 'text-text-muted'}`}>
                              {idx === 0 ? <Crown size={20} className="animate-bounce" /> : idx + 1}
                           </div>
                        </td>
                        <td className="px-12 py-10">
                           <div className="flex items-center gap-10 justify-center">
                              <div className={`w-16 h-16 rounded-[24px] bg-[#111] border group-hover/row:border-primary/40 flex items-center justify-center overflow-hidden transition-all group-hover/row:scale-105 shadow-2xl ${idx < 3 ? 'border-primary/20' : 'border-white/5'}`}>
                                 {user.profilePhoto ? (
                                    <img src={user.profilePhoto} className="w-full h-full object-cover grayscale group-hover/row:grayscale-0 transition-all duration-700" alt="" />
                                 ) : (
                                    <span className="text-2xl font-black text-primary">{user.name.charAt(0)}</span>
                                 )}
                              </div>
                              <div className="text-center md:text-left space-y-2">
                                 <h4 className="text-xl font-black tracking-tight text-white group-hover/row:text-primary transition-all uppercase italic">{user.name}</h4>
                                 <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${idx < 3 ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60 group-hover/row:opacity-100 italic transition-opacity">@{user.username}</p>
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-12 py-10 text-right">
                           <div className="flex flex-col items-end gap-2 group-hover/row:translate-x-2 transition-transform">
                              <div className="flex items-baseline gap-2">
                                 <span className="text-4xl font-black tracking-tighter text-white italic">
                                    {metric === "streakCount" ? user.streakCount : metric === "tasksCompleted" ? user.tasksCompleted : user.promptsUsed}
                                 </span>
                                 <Star size={12} className="text-primary opacity-20 group-hover/row:opacity-100 transition-opacity animate-spin-slow" />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary italic opacity-60">
                                 {metric.replace('Count', '').replace('Used', '').replace('Completed', '')} Points
                              </span>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Global Pulse Instrumentation */}
      <div className="p-12 bg-primary/[0.03] border border-primary/20 rounded-[64px] flex flex-col md:flex-row items-center gap-12 group relative overflow-hidden shadow-2xl">
         <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
         <div className="w-20 h-20 bg-primary text-black rounded-[28px] flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform relative z-10">
            <TrendingUp size={36} strokeWidth={3} />
         </div>
         <div className="space-y-4 relative z-10 flex-1">
            <div className="flex items-center gap-4">
               <span className="px-4 py-1 bg-primary/10 border border-primary/40 rounded-full text-[9px] font-black text-primary uppercase tracking-widest italic animate-pulse">Mesh Synchronized</span>
               <div className="h-px w-24 bg-primary/20" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter text-white italic">Retaining Momentum</h3>
            <p className="text-xs text-text-muted font-black uppercase tracking-[0.2em] italic opacity-60 leading-relaxed max-w-2xl">System magnitude is recalculated in real-time based on high-frequency node handshakes. Maintain a constant streak to stabilize your coordinates in the global mesh.</p>
         </div>
         <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Live Sync</span>
         </div>
      </div>
    </div>
  );
};

export default memo(Leaderboard);

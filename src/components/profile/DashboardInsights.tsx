import { useUser } from "@/context/UserContext";
import { 
  Zap, Bookmark, FileText, FolderLock, CheckCircle2, Flame, 
  Clock, Activity, History, TrendingUp, Circle, Loader2,
  Sparkles, MousePointer2
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { format } from "date-fns";
import React, { useMemo, memo } from "react";

const DashboardInsights = () => {
  const { activity, dailyStats, projects, tasks, notes, profile, loading } = useUser();

  const statCards = useMemo(() => [
    { label: "Prompts Sync", value: dailyStats?.promptsUsed || 0, icon: Zap, color: "text-primary", bg: "bg-primary/10" },
    { label: "Elite Vault", value: dailyStats?.savedPrompts || 0, icon: Bookmark, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Brain Nodes", value: notes.length, icon: FileText, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Project Yield", value: projects.length, icon: FolderLock, color: "text-orange-400", bg: "bg-orange-400/10" },
    { label: "Tasks Purged", value: tasks.filter(t => t.isCompleted).length, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Daily Streak", value: dailyStats?.streakCount || 0, icon: Flame, color: "text-red-400", bg: "bg-red-400/10" },
  ], [dailyStats, projects, tasks, notes]);

  const graphData = useMemo(() => [
    { day: "M", intensity: 45 },
    { day: "T", intensity: 30 },
    { day: "W", intensity: 60 },
    { day: "T", intensity: 80 },
    { day: "F", intensity: 50 },
    { day: "S", intensity: 20 },
    { day: "S", intensity: 90 },
  ], []);

  if (loading) return (
     <div className="flex flex-col items-center justify-center p-32 min-h-[500px] gap-8">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_20px_rgba(34,197,94,0.3)]" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse italic">Synchronizing ID Matrix...</h2>
     </div>
  );

  return (
    <div className="space-y-16">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-8 border-b border-white/5">
         <div className="space-y-3">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Intelligence Sync: Active</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase text-white italic">Node <span className="text-primary">Insights</span></h1>
            <p className="text-text-muted font-bold text-xs italic opacity-60">Master Identity Cluster: <span className="text-white">v1.4.2_alpha</span></p>
         </div>
         
         <div className="flex items-center gap-6 px-10 py-5 bg-[#111] border border-white/10 rounded-[32px] shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Clock className="text-primary opacity-60 group-hover:rotate-12 transition-transform" size={20} />
            <div className="flex flex-col relative z-10">
               <span className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-60 italic mb-1">Total System Uptime</span>
               <span className="text-3xl font-black text-white tracking-tighter italic">{Math.round(profile?.totalTimeSpent || 0)} <span className="text-[10px] text-primary uppercase ml-1">MIN</span></span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
         {statCards.map((card, idx) => (
            <div key={idx} className="p-8 bg-[#111] border border-white/5 rounded-[40px] hover:border-primary/20 hover:bg-primary/[0.04] transition-all duration-500 group relative overflow-hidden shadow-xl">
               <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
               <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform`}>
                  <card.icon size={22} />
               </div>
               <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2 opacity-50 group-hover:text-white group-hover:opacity-100 transition-all italic">{card.label}</p>
                  <h3 className="text-3xl font-black text-white italic tracking-tight">{card.value}</h3>
               </div>
            </div>
         ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
         <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-6">
               <div className="flex items-center gap-4">
                  <Activity size={18} className="text-primary" />
                  <h2 className="text-[11px] font-black tracking-[0.4em] uppercase text-white italic">Velocity Mesh</h2>
               </div>
               <TrendingUp size={16} className="text-primary font-black animate-bounce" />
            </div>
            <div className="h-[400px] w-full p-10 bg-[#111] border border-white/10 rounded-[64px] shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/[0.02] group-hover:bg-primary/[0.05] transition-colors" />
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                     <defs>
                        <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="10 10" stroke="#ffffff03" vertical={false} />
                     <XAxis 
                        dataKey="day" 
                        stroke="#ffffff10" 
                        fontSize={10} 
                        fontWeight="900" 
                        tickLine={false} 
                        axisLine={false}
                        dy={20}
                     />
                     <YAxis hide />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '24px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                        itemStyle={{ color: '#22C55E' }}
                        cursor={{ stroke: '#22C55E', strokeWidth: 1, strokeDasharray: '4 4' }}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="intensity" 
                        stroke="#22C55E" 
                        strokeWidth={6}
                        fillOpacity={1} 
                        fill="url(#velocityGradient)"
                        animationDuration={2000}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-4 px-6">
               <History size={18} className="text-primary" />
               <h2 className="text-[11px] font-black tracking-[0.4em] uppercase text-white italic">Activity Stream</h2>
            </div>
            <div className="p-10 bg-[#111] border border-white/10 rounded-[64px] shadow-2xl h-[400px] overflow-y-auto scrollbar-hide space-y-6">
               {activity.length > 0 ? (
                  activity.map((event, i) => (
                     <div key={event.id} className="relative pl-10 border-l border-white/5 pb-8 last:pb-0 group">
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_15px_#22C55E] group-hover:scale-150 transition-transform" />
                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                              <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic opacity-40">
                                 {event.timestamp?.toDate ? format(event.timestamp.toDate(), 'HH:mm') : '00:00'}
                              </p>
                              <Sparkles size={10} className="text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                           </div>
                           <h4 className="text-xs font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors italic">
                              {event.action.replace(/_/g, ' ')}
                           </h4>
                           {event.metadata?.target && (
                              <p className="text-[9px] text-text-muted font-bold truncate opacity-60 italic group-hover:opacity-100 transition-opacity">Target: {event.metadata.target}</p>
                           )}
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-4">
                     <div className="w-12 h-12 rounded-full border border-dashed border-primary flex items-center justify-center animate-spin-slow">
                        <MousePointer2 size={18} className="text-primary" />
                     </div>
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] italic">No active handshakes intercepted.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default memo(DashboardInsights);

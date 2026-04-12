import { useState, useMemo, memo } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { 
  Zap, 
  Play, 
  TrendingUp, 
  Award,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Library,
  Wrench,
  Rocket,
  BarChart3,
  Calendar,
  LayoutDashboard,
  CheckCircle2,
  MessageCircle
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useAcademy } from "@/context/AcademyContext";
import { Button } from "@/components/ui/button";
import AnnouncementBanner from "@/components/AnnouncementBanner";

// Optimized Stat Node
const StatNode = memo(({ label, value, color, icon: Icon }: any) => (
  <div className="p-8 bg-[#111] border border-white/5 rounded-[40px] shadow-2xl group hover:border-primary/20 transition-all duration-500 flex flex-col justify-between h-full relative overflow-hidden">
    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
    <div className="flex justify-between items-start mb-6">
       <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${color} group-hover:scale-110 transition-transform`}>
          <Icon size={18} />
       </div>
       <TrendingUp size={12} className="text-primary/40 animate-pulse" />
    </div>
    <div>
       <h4 className="text-4xl font-semibold text-white tracking-tight mb-1">{value}</h4>
       <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted opacity-60 leading-tight">{label}</p>
    </div>
  </div>
));

// Optimized Project Card Node
const ProjectNode = memo(({ project }: any) => (
  <div className="p-6 bg-[#0B0B0B] border border-white/5 rounded-[32px] group hover:border-white/20 transition-all flex items-center justify-between shadow-xl">
    <div className="flex items-center gap-5">
       <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted group-hover:bg-primary/20 group-hover:text-primary transition-all">
          <Rocket size={16} />
       </div>
       <div>
          <h4 className="text-xs font-semibold text-white group-hover:text-primary transition-colors tracking-tight">{project.title}</h4>
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-[0.1em] opacity-40">{project.category}</span>
       </div>
    </div>
    <div className="flex items-center gap-3">
       <div className="w-1 h-1 rounded-full bg-primary" />
       <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted">{project.status}</span>
    </div>
  </div>
));

const Dashboard = () => {
  const { profile, projects, dailyStats, tasks, activity, loading: userLoading } = useUser();
  const { videos, loading: academyLoading } = useAcademy();

  const completionPercent = useMemo(() => {
     if (!dailyStats?.completedVideos || !videos?.length) return 0;
     return Math.round((dailyStats.completedVideos / videos.length) * 100);
  }, [dailyStats, videos]);

  const shortcuts = useMemo(() => [
    { icon: Library, title: "Intelligence Grid", desc: "400+ Ready-Made Prompts", href: "/prompts", color: "text-primary" },
    { icon: Zap, title: "Learn Hub", desc: "Elite Video Learning", href: "/learn", color: "text-orange-500" },
    { icon: Wrench, title: "Tools Node", desc: "Dev Stack Sync", href: "/tools", color: "text-blue-500" },
    { icon: Rocket, title: "Hackathon Mode", desc: "High-Velocity Dev", href: "/hackathon", color: "text-purple-500" },
  ], []);

  const secretChatCode = useMemo(() => {
    if (!profile) return "----";
    if (profile.secretCode) return profile.secretCode;
    return `${profile.uid.slice(0, 4).toUpperCase()}-${profile.uid.slice(-4).toUpperCase()}`;
  }, [profile]);

  if (userLoading || academyLoading) return (
     <Layout>
        <div className="section-padding container-main space-y-12">
           <div className="flex flex-col md:flex-row justify-between items-end gap-10">
              <div className="h-24 w-96 skeleton opacity-20" />
              <div className="flex gap-4">
                 <div className="h-32 w-48 skeleton opacity-10" />
                 <div className="h-32 w-48 skeleton opacity-10" />
              </div>
           </div>
           <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 h-[600px] skeleton opacity-10" />
              <div className="lg:col-span-4 h-[600px] skeleton opacity-10" />
           </div>
        </div>
     </Layout>
  );

  return (
    <Layout>
      <div className="section-padding space-y-16 animate-in fade-in duration-700">
        <div className="w-full space-y-16 px-12">
          
          {/* Important Announcements */}
          <AnnouncementBanner />

          {/* Header Command Cluster */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
            <div className="space-y-4 w-full">
               <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 w-fit rounded-full">
                  <Sparkles size={12} className="text-primary fill-current" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Identity: {profile?.username || "Syncing..."}</span>
               </div>
               <h1 className="text-6xl lg:text-7xl font-bold uppercase tracking-tight text-white leading-[0.9]">MY <span className="text-primary opacity-90">DASHBOARD</span></h1>
               <p className="text-base text-text-secondary font-medium opacity-50 max-w-3xl leading-relaxed">Manage your projects, track your progress, and access your tools in one place. Your profile is up to date.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
               <StatNode label="Intelligence Points" value={dailyStats?.tasksCompleted || tasks.filter(t => t.isCompleted).length} color="text-white" icon={ShieldCheck} />
               <StatNode label="Academy Saturation" value={`${completionPercent}%`} color="text-primary" icon={Zap} />
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
             
             {/* Left Column: Command & Analytics */}
             <div className="lg:col-span-8 space-y-12">
                
                {/* Real-time Continuity Engine */}
                <div className="p-10 md:p-14 bg-[#111] border border-white/10 rounded-[64px] shadow-2xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                   <div className="relative z-10 space-y-10">
                      <div className="flex justify-between items-start">
                         <div className="space-y-2">
                            <div className="flex items-center gap-3 mb-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                               <span className="text-xs font-semibold text-primary uppercase tracking-widest">Session Active</span>
                            </div>
                            <h2 className="text-5xl font-semibold text-white uppercase leading-none">{dailyStats?.lastVideoTitle || "Ready to Initiate"}</h2>
                            <p className="text-xs font-medium uppercase tracking-widest text-text-muted opacity-60">High-Velocity Learning Pathway Protocol</p>
                         </div>
                         <Link to="/learn">
                            <Button className="h-20 px-12 bg-white text-black font-bold uppercase text-xs tracking-widest rounded-3xl hover:bg-primary transition-all shadow-2xl hover:scale-105 active:scale-95">
                               Resume Hub
                            </Button>
                         </Link>
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-text-muted">
                            <span className="flex items-center gap-2"><Clock size={12} className="text-primary" /> Session Drift: 0ms</span>
                            <span className="text-white">{completionPercent}% SATURATED</span>
                         </div>
                         <div className="h-2.5 w-full bg-white/5 border border-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-1000 shadow-[0_0_15px_rgba(34,197,94,0.5)]" style={{ width: `${completionPercent}%` }} />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Intelligence Matrix Shortcuts */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {shortcuts.map(s => (
                     <Link key={s.title} to={s.href} className="p-6 bg-[#111] border border-white/5 rounded-[32px] group hover:border-primary/20 transition-all text-center space-y-4 shadow-xl">
                        <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto transition-all group-hover:bg-primary/10 group-hover:scale-110 ${s.color}`}>
                           <s.icon size={24} />
                        </div>
                        <h5 className="text-xs font-semibold uppercase tracking-widest text-text-muted group-hover:text-white transition-colors">{s.title}</h5>
                     </Link>
                   ))}
                </div>

                {/* Real-time Projects Cluster */}
                <div className="space-y-8">
                   <div className="flex items-center justify-between px-6">
                      <div className="flex items-center gap-4">
                         <LayoutDashboard size={18} className="text-primary" />
                         <span className="text-xs font-semibold uppercase tracking-widest text-white">Active Projects</span>
                      </div>
                      <Link to="/tools" className="text-xs font-semibold uppercase tracking-widest text-text-muted hover:text-primary transition-colors">Expand Mesh</Link>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.length > 0 ? projects.map(p => (
                        <ProjectNode key={p.id} project={p} />
                      )) : (
                        <div className="col-span-full h-24 rounded-[32px] border border-dashed border-white/5 flex items-center justify-center text-xs font-medium uppercase tracking-widest text-text-muted opacity-40">No production nodes active.</div>
                      )}
                   </div>
                </div>

             </div>

             {/* Right Column: High-Intensity Activity Mesh */}
             <div className="lg:col-span-4 space-y-12">
                
                {/* Stats Ledger Node */}
                <div className="p-10 bg-[#111] border border-white/10 rounded-[56px] shadow-2xl space-y-10">
                   <div className="flex items-center gap-4">
                      <BarChart3 size={18} className="text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-white">Node Metrics</span>
                   </div>
                   
                   <div className="space-y-8">
                      {[
                        { label: "Active Time", value: `${Math.round(profile?.totalTimeSpent || 0)}m`, detail: "System Uptime" },
                        { label: "Prompts Sync", value: dailyStats?.promptsUsed || 0, detail: "Total Deployment" },
                        { label: "Tasks Concluded", value: projects.filter(p => p.status === 'completed').length, detail: "Atomic Success" }
                      ].map(metric => (
                        <div key={metric.label} className="flex justify-between items-center group">
                           <div>
                              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1 opacity-60 group-hover:opacity-100 transition-opacity">{metric.label}</p>
                              <p className="text-[10px] font-medium text-primary uppercase tracking-widest">{metric.detail}</p>
                           </div>
                           <span className="text-3xl font-semibold text-white tracking-tighter">{metric.value}</span>
                        </div>
                      ))}
                   </div>

                   <Button className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all mt-4">
                      Download Report
                   </Button>
                </div>

                {/* Secure Chat Node */}
                <div className="p-10 bg-[#111] border border-white/10 rounded-[56px] shadow-2xl space-y-6">
                   <div className="flex items-center gap-3">
                      <MessageCircle size={18} className="text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-white">Secure Chat</span>
                   </div>
                   <p className="text-sm text-text-muted leading-relaxed">Use your private secret code to open the secure chat room. Share it only with trusted team members.</p>
                   <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <p className="text-xs uppercase tracking-widest text-text-muted mb-2">Your Secure Code</p>
                      <div className="text-4xl font-semibold tracking-widest uppercase text-white">{secretChatCode}</div>
                   </div>
                   <Link to={`/chat?code=${secretChatCode}`}>
                      <Button className="w-full h-14 bg-primary text-black font-bold uppercase text-xs tracking-widest rounded-2xl hover:bg-primary/90 transition-all">
                         Open Secure Chat
                      </Button>
                   </Link>
                </div>

                {/* Real-time Activity Feed Node */}
                <div className="space-y-8">
                   <div className="flex items-center justify-between px-6">
                      <span className="text-xs font-semibold uppercase tracking-widest text-white">Activity Stream</span>
                      <TrendingUp size={14} className="text-primary animate-pulse" />
                   </div>
                   <div className="space-y-4">
                      {activity.slice(0, 6).map(act => (
                        <div key={act.id} className="p-5 bg-[#111] border border-white/5 rounded-[24px] flex items-center gap-4 group hover:border-white/20 transition-all">
                           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <CheckCircle2 size={14} />
                           </div>
                           <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-semibold uppercase tracking-tight text-white truncate">{act.action.replace('_', ' ')}</p>
                              <p className="text-[10px] font-medium text-text-muted opacity-40">Timestamp: {act.timestamp?.toDate().toLocaleTimeString() || "Synchronizing..."}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

             </div>

          </div>

        </div>
      </div>
    </Layout>
  );
};

export default memo(Dashboard);

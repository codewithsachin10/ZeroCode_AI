import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  User,
  Github,
  Linkedin,
  Zap,
  Database,
  Flame,
  Globe2,
  ExternalLink,
  ShieldCheck,
  Trophy,
  Activity,
  Award,
  Calendar,
  Clock,
  LayoutGrid,
  History as HistoryIcon,
  TrendingUp,
  Target,
  ArrowUpRight,
  ChevronLeft,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, where, orderBy, limit, doc, getDoc, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type UserRecord = {
  uid: string;
  name: string;
  email: string;
  username: string;
  role: string;
  profilePhoto?: string;
  createdAt?: any;
  isPublic?: boolean;
  bio?: string;
  githubLink?: string;
  linkedinLink?: string;
  vercelLink?: string;
  supabaseLink?: string;
  firebaseLink?: string;
  portfolioUrl?: string;
};

type UserDetail = {
  projects: any[];
  activity: any[];
  streak: any;
  stats: {
    prompts: number;
    notes: number;
    tasks: number;
    timeSpent: string;
  };
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserRecord)));
    } catch (e) {
      console.error("Admin Fetch Failure:", e);
      toast.error("Failed to synchronize user mesh.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (user: UserRecord) => {
    setLoadingDetail(true);
    setShowDetail(true);
    setSelectedUser(user);
    try {
      const [projectsSnap, activitySnap, streakSnap, statsSnap] = await Promise.all([
        getDocs(query(collection(db, "projects"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "user_activity"), where("userId", "==", user.uid), orderBy("timestamp", "desc"), limit(10))),
        getDoc(doc(db, "streaks", user.uid)),
        getDocs(query(collection(db, "daily_stats"), where("userId", "==", user.uid)))
      ]);

      const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const activity = activitySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const streak = streakSnap.exists() ? streakSnap.data() : null;
      
      // Calculate aggregate stats
      let totalPrompts = 0;
      let totalTasks = 0;
      let totalMinutes = 0;
      statsSnap.docs.forEach(d => {
         const data = d.data();
         totalPrompts += (data.promptsUsed || 0);
         totalTasks += (data.tasksCompleted || 0);
         totalMinutes += (data.timeSpent || 0);
      });

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      setUserDetail({
        projects,
        activity,
        streak,
        stats: {
          prompts: totalPrompts,
          notes: 0, // Notes count from notes collection usually
          tasks: totalTasks,
          timeSpent: `${hours}h ${mins}m`
        }
      });
    } catch (e) {
      console.error("Detail Sync Error:", e);
      toast.error("Failed to populate intelligence profile.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 relative">
      {/* Metrics Bar */}
      <div className="grid md:grid-cols-4 gap-4">
         {[
           { label: "Total Users", value: users.length, icon: Users, color: "text-primary" },
           { label: "Admin Core", value: users.filter(u => u.role === 'admin').length, icon: ShieldCheck, color: "text-blue-500" },
           { label: "Public Nodes", value: users.filter(u => u.isPublic).length, icon: Globe2, color: "text-green-500" },
           { label: "New Joins", value: users.filter(u => {
              const date = u.createdAt?.toDate();
              return date && date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
           }).length, icon: Award, color: "text-orange-500" }
         ].map(stat => (
           <div key={stat.label} className="p-6 bg-[#111] border border-white/5 rounded-[28px] space-y-2 group hover:border-white/10 transition-all shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none blur-3xl" />
              <div className={`p-2.5 w-fit bg-white/5 rounded-xl ${stat.color} group-hover:scale-110 transition-transform relative z-10`}>
                 <stat.icon size={16} />
              </div>
              <div className="relative z-10">
                 <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic">{stat.label}</p>
                 <h4 className="text-xl font-black text-white tracking-widest">{stat.value}</h4>
              </div>
           </div>
         ))}
      </div>

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
         <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-0.5">Intelligence</h2>
            <p className="text-[10px] text-text-muted font-bold italic opacity-60">Architecting and monitoring the developer mesh.</p>
         </div>
         <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={16} />
            <input 
              type="text" 
              placeholder="Search identity..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 text-xs font-bold text-white focus:border-primary/40 outline-none transition-all placeholder:text-white/10"
            />
         </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                     <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Identity</th>
                     <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Username</th>
                     <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Role</th>
                     <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Sync</th>
                     <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Status</th>
                     <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted"></th>
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                    [1,2,3,4,5].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-4 border-b border-white/5 h-12 bg-white/[0.01]" />
                      </tr>
                    ))
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map(u => (
                      <tr 
                        key={u.uid} 
                        onClick={() => fetchUserDetails(u)}
                        className="border-b border-white/5 hover:bg-white/[0.03] transition-all cursor-pointer group"
                      >
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-lg border border-white/10 overflow-hidden relative group-hover:border-primary/40 transition-all">
                                  {u.profilePhoto ? (
                                    <img src={u.profilePhoto} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-surface-dark flex items-center justify-center text-text-muted"><User size={16} /></div>
                                  )}
                               </div>
                               <div className="space-y-0.5">
                                  <p className="font-bold text-white text-xs group-hover:text-primary transition-colors">{u.name}</p>
                                  <p className="text-[9px] font-bold text-text-muted opacity-60 italic">{u.email}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-[10px] font-bold text-primary italic truncate max-w-[120px]">@{u.username}</td>
                         <td className="px-6 py-4">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                               u.role === 'admin' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-white/5 border-white/10 text-white/40'
                            }`}>{u.role || 'user'}</span>
                         </td>
                         <td className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-muted">
                            {u.createdAt ? format(u.createdAt.toDate(), "MMM dd, yy") : "Alpha"}
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                               <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                               <span className="text-[8px] font-black uppercase tracking-widest text-green-500">ACTIVE</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <button className="p-1.5 text-text-muted hover:text-white transition-colors opacity-0 group-hover:opacity-100"><MoreVertical size={14} /></button>
                         </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center opacity-20 italic font-black uppercase tracking-widest text-[10px]">Zero nodes detected.</td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* User Detail Side-Panel (SaaS Intelligence View) */}
      <div className={`fixed inset-y-0 right-0 w-full lg:w-[500px] bg-[#0d0d0d] border-l border-white/10 z-[100] transform transition-transform duration-500 shadow-[-30px_0_60px_rgba(0,0,0,0.8)] flex flex-col ${showDetail ? 'translate-x-0' : 'translate-x-full'}`}>
         {selectedUser && (
           <>
             {/* Detail Header */}
             <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 shrink-0 bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                   <button onClick={() => setShowDetail(false)} className="p-1.5 -ml-1 text-text-muted hover:text-white transition-all"><ArrowLeft size={18} /></button>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">Intelligence Node</h3>
                </div>
                <div className="flex gap-3">
                   <Button variant="outline" className="h-8 text-[8px] font-black uppercase tracking-widest px-4 border-white/10 rounded-lg" onClick={() => window.open(`/u/${selectedUser.username}`, '_blank')}>View Public</Button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-32 scrollbar-hide">
                {loadingDetail ? (
                   <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 size={32} className="animate-spin text-primary mb-6" />
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary italic">Syncing...</p>
                   </div>
                ) : (
                  <>
                    {/* Section A: Identity Card */}
                    <div className="flex items-start gap-6">
                       <div className="relative group shrink-0">
                          <div className="absolute inset-0 bg-primary/20 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative w-32 h-32 rounded-[32px] border border-white/10 overflow-hidden shadow-xl">
                             {selectedUser.profilePhoto ? (
                               <img src={selectedUser.profilePhoto} className="w-full h-full object-cover grayscale transition-all duration-700" />
                             ) : (
                               <div className="w-full h-full bg-surface-dark flex items-center justify-center text-text-muted"><User size={32} /></div>
                             )}
                          </div>
                       </div>
                       <div className="space-y-4 flex-1">
                          <div>
                             <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">{selectedUser.name}</h2>
                             <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm font-bold text-primary italic opacity-70">@{selectedUser.username}</span>
                                <span className="px-2 py-0.5 bg-primary/5 border border-primary/20 rounded-md text-[7px] font-black tracking-widest uppercase text-primary">NODE_ACTIVE</span>
                             </div>
                          </div>
                          <p className="text-[10px] text-text-secondary font-bold leading-relaxed italic opacity-80 line-clamp-2">{selectedUser.bio || "No developer mission initialized."}</p>
                          <div className="flex items-center gap-6 text-[8px] font-black uppercase tracking-widest text-text-muted">
                             <div className="flex items-center gap-1.5"><Clock size={10} className="text-primary" /> {selectedUser.createdAt ? format(selectedUser.createdAt.toDate(), "MMM yyyy") : "Alpha"}</div>
                          </div>
                       </div>
                    </div>

                    {/* Section G: Usage Stats Grid */}
                    <div className="grid grid-cols-4 gap-4">
                       {[
                         { label: "Prompts", value: userDetail?.stats.prompts, icon: Zap, color: "text-primary" },
                         { label: "Notes", value: userDetail?.stats.notes, icon: BookOpen, color: "text-blue-500" },
                         { label: "Tasks", value: userDetail?.stats.tasks, icon: Target, color: "text-green-500" },
                         { label: "Time", value: userDetail?.stats.timeSpent, icon: HistoryIcon, color: "text-orange-500" }
                       ].map(stat => (
                         <div key={stat.label} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-center space-y-1.5 group hover:border-white/10 transition-all">
                            <div className={`p-2 w-fit bg-black/40 rounded-lg ${stat.color} mx-auto transition-transform group-hover:scale-110`}>
                               <stat.icon size={12} />
                            </div>
                            <h4 className="text-[7px] font-black uppercase tracking-widest text-text-muted opacity-40">{stat.label}</h4>
                            <p className="text-xs font-black text-white">{stat.value}</p>
                         </div>
                       ))}
                    </div>

                    {/* Section D: Leaderboard Intelligence */}
                    <div className="p-6 bg-black/40 border border-white/5 rounded-[32px] flex items-center justify-between group overflow-hidden relative">
                       <div className="flex items-center gap-6 relative z-10">
                          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                             <Trophy className="text-primary" size={24} />
                          </div>
                          <div className="space-y-1">
                             <h4 className="text-[8px] font-black uppercase tracking-[0.1em] text-text-muted">Leaderboard Node</h4>
                             <div className="flex items-center gap-4">
                                <div className="space-y-0">
                                   <p className="text-xl font-black text-white tracking-widest">{userDetail?.streak?.currentStreak || 0}</p>
                                   <p className="text-[7px] font-black uppercase tracking-widest text-primary italic">Streak</p>
                                </div>
                                <div className="h-6 w-px bg-white/5 mx-1" />
                                <div className="space-y-0">
                                   <p className="text-xl font-black text-white tracking-widest">{userDetail?.streak?.longestStreak || 0}</p>
                                   <p className="text-[7px] font-black uppercase tracking-widest text-orange-500 italic">Longest</p>
                                </div>
                             </div>
                          </div>
                       </div>
                       <div className="text-right relative z-10">
                          <h4 className="text-xl font-black text-primary tracking-widest">
                             {((userDetail?.streak?.currentStreak || 0) * 5) + (userDetail?.stats.tasks || 0) * 2 + (userDetail?.stats.prompts || 0)} Pts
                          </h4>
                          <p className="text-[8px] font-black uppercase tracking-widest text-text-muted italic opacity-40">Intelligence Rating</p>
                       </div>
                    </div>

                    {/* Section B/C: Digital Footprint Cards */}
                    <div className="space-y-6">
                       <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-white/5" />
                          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted italic">Footprint</h3>
                          <div className="h-px flex-1 bg-white/5" />
                       </div>
                       <div className="grid grid-cols-3 gap-4">
                          {[
                            { label: "Profile", link: `/u/${selectedUser.username}`, icon: Globe2, color: "text-primary" },
                            { label: "GitHub", link: selectedUser.githubLink, icon: Github, color: "text-slate-300" },
                            { label: "LinkedIn", link: selectedUser.linkedinLink, icon: Linkedin, color: "text-[#0A66C2]" },
                            { label: "Vercel", link: selectedUser.vercelLink, icon: Zap, color: "text-white" },
                            { label: "Supabase", link: selectedUser.supabaseLink, icon: Database, color: "text-[#3ECF8E]" },
                            { label: "Firebase", link: selectedUser.firebaseLink, icon: Flame, color: "text-[#FFCA28]" }
                          ].map(item => (
                             <a 
                               key={item.label}
                               href={item.link?.startsWith("http") ? item.link : (item.link?.startsWith("/") ? item.link : `https://${item.link}`)}
                               target="_blank"
                               className={`p-4 border rounded-2xl flex flex-col items-center gap-2 group transition-all ${
                                  item.link ? 'bg-surface border-white/5 hover:border-primary/20' : 'bg-black/40 border-dashed border-white/5 opacity-10 pointer-events-none'
                               }`}
                             >
                                <item.icon className={`${item.color} group-hover:scale-110 transition-transform`} size={18} />
                                <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">{item.label}</span>
                             </a>
                          ))}
                       </div>
                    </div>

                    {/* Section E: Production Matrix */}
                    <div className="space-y-6">
                       <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted italic px-2">Production ({userDetail?.projects.length})</h3>
                       <div className="grid gap-3">
                          {userDetail?.projects.length ? userDetail.projects.map(p => (
                             <div key={p.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-all">
                                <div>
                                   <h4 className="text-[11px] font-black text-white group-hover:text-primary transition-colors italic">{p.title}</h4>
                                   <p className="text-[7px] font-black uppercase tracking-widest text-text-muted opacity-40 italic">{p.status || 'ACTIVE'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                   <div className="text-right">
                                      <p className="text-base font-black text-white">{p.progress || 0}%</p>
                                   </div>
                                   <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                      <TrendingUp size={12} className="text-primary opacity-40" />
                                   </div>
                                </div>
                             </div>
                          )) : (
                             <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-[32px] opacity-10 font-black text-[9px] uppercase tracking-widest italic">Zero Builds Staged</div>
                          )}
                       </div>
                    </div>

                    {/* Section F: Activity Timeline */}
                    <div className="space-y-8">
                       <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted italic px-2">Temporal Sequence</h3>
                       <div className="space-y-4 relative ml-3">
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-white/5" />
                          {userDetail?.activity.length ? userDetail.activity.map((a, i) => (
                             <div key={a.id} className="relative pl-8 group">
                                <div className={`absolute left-[-3.5px] top-1.5 w-1.5 h-1.5 rounded-full border border-[#0d0d0d] ${
                                   i === 0 ? 'bg-primary shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-white/10'
                                }`} />
                                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl group-hover:border-primary/20 transition-all">
                                   <div className="flex justify-between items-start mb-1">
                                      <h4 className="text-[9px] font-black uppercase tracking-widest text-white">{a.action.replace('_', ' ')}</h4>
                                      <span className="text-[7px] font-bold text-text-muted opacity-30">{format(a.timestamp?.toDate() || new Date(), "MMM dd • HH:mm")}</span>
                                   </div>
                                   <p className="text-[8px] text-text-muted italic font-medium opacity-40 truncate">Hash: {a.id.slice(0, 8)}</p>
                                </div>
                             </div>
                          )) : (
                             <div className="p-8 text-center opacity-10 font-black text-[9px] uppercase tracking-widest italic ml-[-15px]">Timeline Sequence Empty</div>
                          )}
                       </div>
                    </div>
                  </>
                )}
             </div>
           </>
         )}
      </div>

      {/* Overlay */}
      {showDetail && (
         <div 
           className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90]"
           onClick={() => setShowDetail(false)}
         />
      )}
    </div>
  );
};

const BookOpen = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export default AdminUsers;

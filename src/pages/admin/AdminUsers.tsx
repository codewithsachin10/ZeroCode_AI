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
  ArrowLeft,
  Mail,
  Fingerprint,
  CalendarDays,
  Layers
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
  progress: any[];
  quizScores: any[];
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
      const [projectsSnap, activitySnap, streakSnap, statsSnap, progressSnap, quizSnap] = await Promise.all([
        getDocs(query(collection(db, "projects"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "user_activity"), where("userId", "==", user.uid), orderBy("timestamp", "desc"), limit(10))),
        getDoc(doc(db, "streaks", user.uid)),
        getDocs(query(collection(db, "daily_stats"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "user_progress"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "quiz_results"), where("userId", "==", user.uid)))
      ]);

      const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const activity = activitySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const streak = streakSnap.exists() ? streakSnap.data() : null;
      const progress = progressSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const quizScores = quizSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
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
        progress,
        quizScores,
        stats: {
          prompts: totalPrompts,
          notes: 0,
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
    <div className="space-y-12 relative max-w-7xl">
      {/* Dynamic Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: "Developer Mesh", value: users.length, icon: Users, color: "text-primary" },
           { label: "Admin Core", value: users.filter(u => u.role === 'admin').length, icon: ShieldCheck, color: "text-blue-500" },
           { label: "Public Nodes", value: users.filter(u => u.isPublic).length, icon: Globe2, color: "text-green-500" },
           { label: "Active Stints", value: users.filter(u => u.createdAt?.toDate() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length, icon: Zap, color: "text-orange-500" }
         ].map(stat => (
           <div key={stat.label} className="p-6 bg-[#0B0B0B] border border-white/5 rounded-[2px] group hover:border-primary/20 transition-all shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-4">
                 <div className={`p-2 w-fit bg-white/5 rounded-[2px] ${stat.color}`}>
                    <stat.icon size={14} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black text-white tracking-widest leading-none mb-1">{stat.value}</h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">{stat.label}</p>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {/* Identity Control Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
         <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
               <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Intelligence Active</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">Developer <span className="text-primary italic">Directory</span></h2>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-40 italic">Monitoring verified identities across the academy mesh</p>
         </div>
         <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={14} />
            <input 
              type="text" 
              placeholder="Search identity by name, email, or hash..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-[2px] pl-12 pr-4 text-[11px] font-bold text-white focus:border-primary/20 outline-none transition-all placeholder:opacity-20 shadow-inner"
            />
         </div>
      </div>

      {/* User Grid (Primary Card View) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-48 bg-white/[0.02] border border-white/5 rounded-[2px] animate-pulse" />
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredUsers.map(u => (
              <div 
                key={u.uid}
                onClick={() => fetchUserDetails(u)}
                className="group relative flex flex-col p-8 bg-[#0B0B0B] border border-white/5 rounded-[2px] hover:border-primary/20 transition-all cursor-pointer shadow-2xl overflow-hidden"
              >
                 {/* High-fidelity background elements */}
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                    <Fingerprint size={48} className="text-primary" />
                 </div>
                 <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />

                 <div className="relative z-10 space-y-6">
                    <div className="flex items-start justify-between">
                       <div className="w-14 h-14 rounded-[2px] border border-white/10 overflow-hidden bg-white/5 group-hover:border-primary/40 transition-all shadow-inner relative">
                          {u.profilePhoto ? (
                             <img src={u.profilePhoto} className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-text-muted opacity-40"><User size={24} /></div>
                          )}
                          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <div className={`px-2 py-0.5 rounded-[2px] border text-[8px] font-black uppercase tracking-widest ${
                          u.role === 'admin' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-white/5 border-white/10 text-white/40'
                       }`}>
                          {u.role || 'Initiate'}
                       </div>
                    </div>

                    <div className="space-y-1">
                       <h3 className="text-[15px] font-black text-white uppercase tracking-tight italic group-hover:text-primary transition-colors">{u.name}</h3>
                       <p className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60 italic">@{u.username}</p>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-white/[0.03]">
                       <div className="flex items-center gap-3 text-text-muted group-hover:text-white/60 transition-colors">
                          <Mail size={12} className="opacity-40" />
                          <span className="text-[10px] font-bold truncate lowercase max-w-[200px]">{u.email}</span>
                       </div>
                       <div className="flex items-center gap-3 text-text-muted group-hover:text-white/60 transition-colors">
                          <CalendarDays size={12} className="opacity-40" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Joined: {u.createdAt ? format(u.createdAt.toDate(), "MMM dd, yyyy") : 'Pre-Alpha'}</span>
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Node Active</span>
                       </div>
                       <ChevronRight size={14} className="text-text-muted group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="py-40 text-center border border-dashed border-white/5 rounded-[2px] bg-white/[0.01]">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted italic opacity-20">Scan Termination: Zero Identities Registered</p>
        </div>
      )}

      {/* User Intelligence Side-Panel */}
      <div className={`fixed inset-y-0 right-0 w-full lg:w-[500px] bg-[#0B0B0B] border-l border-white/10 z-[100] transform transition-transform duration-500 shadow-[-30px_0_60px_rgba(0,0,0,1)] flex flex-col ${showDetail ? 'translate-x-0' : 'translate-x-full'}`}>
         {selectedUser && (
           <>
             <div className="h-20 flex items-center justify-between px-8 border-b border-white/5 shrink-0 bg-[#0B0B0B]/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                   <button onClick={() => setShowDetail(false)} className="p-2 -ml-2 text-text-muted hover:text-white transition-all"><ArrowLeft size={20} /></button>
                   <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white italic">Intelligence Mesh</h3>
                </div>
                <Button variant="outline" className="h-10 text-[9px] font-black uppercase tracking-widest px-6 border-white/5 bg-transparent rounded-[2px] hover:text-primary" onClick={() => window.open(`/u/${selectedUser.username}`, '_blank')}>View Public ID</Button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-32 scrollbar-hide">
                {loadingDetail ? (
                   <div className="flex flex-col items-center justify-center py-40">
                      <Loader2 size={42} className="animate-spin text-primary mb-6" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Syncing Node...</p>
                   </div>
                ) : (
                  <>
                    {/* Identity Matrix */}
                    <div className="flex items-start gap-8">
                       <div className="w-40 h-40 rounded-[2px] border border-white/10 overflow-hidden relative shadow-2xl group shrink-0">
                          {selectedUser.profilePhoto ? (
                             <img src={selectedUser.profilePhoto} className="w-full h-full object-cover transition-all duration-700" />
                          ) : (
                             <div className="w-full h-full bg-white/5 flex items-center justify-center text-text-muted"><User size={48} /></div>
                          )}
                          <div className="absolute inset-0 bg-primary/20 opacity-20" />
                       </div>
                       <div className="space-y-6 flex-1">
                          <div className="space-y-2">
                             <h2 className="text-3xl font-black text-white tracking-widest uppercase italic leading-none">{selectedUser.name}</h2>
                             <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-primary uppercase tracking-widest italic opacity-60">@{selectedUser.username}</span>
                                <div className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className="text-[9px] font-black uppercase text-text-muted opacity-40">{selectedUser.role || 'Academy Initiate'}</span>
                             </div>
                          </div>
                          <p className="text-[11px] text-text-secondary leading-relaxed font-bold italic opacity-60 border-l border-primary/20 pl-4">{selectedUser.bio || "Zero-code explorer from the academy mesh."}</p>
                       </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4">
                       {[
                         { label: "Prompts", value: userDetail?.stats.prompts, icon: Zap, color: "text-primary" },
                         { label: "Checkpoints", value: userDetail?.progress.length, icon: Target, color: "text-blue-500" },
                         { label: "Builds", value: userDetail?.projects.length, icon: Layers, color: "text-green-500" },
                         { label: "Training", value: userDetail?.stats.timeSpent, icon: Clock, color: "text-orange-500" }
                       ].map(stat => (
                         <div key={stat.label} className="p-4 bg-white/[0.02] border border-white/5 rounded-[2px] text-center space-y-2 group hover:border-white/10 transition-all">
                            <div className={`p-2 w-fit bg-black/40 rounded-[2px] ${stat.color} mx-auto transition-transform group-hover:scale-110`}>
                               <stat.icon size={14} />
                            </div>
                            <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">{stat.label}</h4>
                            <p className="text-xs font-black text-white">{stat.value}</p>
                         </div>
                       ))}
                    </div>

                    {/* Social/Link Matrix */}
                    <div className="grid grid-cols-3 gap-3">
                       {[
                         { label: "GH", link: selectedUser.githubLink, icon: Github, active: !!selectedUser.githubLink },
                         { label: "LI", link: selectedUser.linkedinLink, icon: Linkedin, active: !!selectedUser.linkedinLink },
                         { label: "WEB", link: selectedUser.portfolioUrl, icon: Globe2, active: !!selectedUser.portfolioUrl }
                       ].map(item => (
                          <a 
                            key={item.label}
                            href={item.link?.startsWith("http") ? item.link : `https://${item.link}`}
                            target="_blank"
                            className={`h-11 border rounded-[2px] flex items-center justify-center gap-3 group transition-all ${
                               item.active ? 'bg-white/[0.02] border-white/10 hover:border-primary/40' : 'bg-transparent border-dashed border-white/5 opacity-10 pointer-events-none'
                            }`}
                          >
                             <item.icon className="group-hover:text-primary transition-all" size={16} />
                             <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                          </a>
                       ))}
                    </div>

                    {/* Active Activity Feed */}
                    <div className="space-y-8">
                       <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <div className="flex items-center gap-3">
                             <Activity size={16} className="text-primary" />
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-white italic">Recent Sequence</h3>
                          </div>
                       </div>
                       <div className="space-y-4">
                          {userDetail?.activity.length ? userDetail.activity.map((a, i) => (
                             <div key={a.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-[2px] flex items-center justify-between group hover:border-white/10 transition-all">
                                <div className="space-y-1">
                                   <h4 className="text-[10px] font-black uppercase text-white tracking-widest">{a.action.replace('_', ' ')}</h4>
                                   <p className="text-[8px] font-bold text-text-muted uppercase opacity-40">{format(a.timestamp?.toDate() || new Date(), "MMM dd • HH:mm")}</p>
                                </div>
                                <ArrowUpRight size={14} className="text-text-muted opacity-0 group-hover:opacity-40 transition-all" />
                             </div>
                          )) : (
                             <div className="p-10 text-center opacity-10 font-black text-[9px] uppercase tracking-widest italic border border-dashed border-white/5 rounded-[2px]">Empty Sequence</div>
                          )}
                       </div>
                    </div>
                  </>
                )}
             </div>
           </>
         )}
      </div>

      {/* Background Dimming Overlay */}
      {showDetail && (
         <div 
           className="fixed inset-0 bg-black/95 z-[90] backdrop-blur-sm animate-in fade-in duration-300"
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

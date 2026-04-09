import { useEffect, useState } from "react";
import { 
  Users, 
  Library, 
  TrendingUp, 
  Search,
  Video,
  Tags,
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  Activity, 
  Target, 
  Trophy, 
  Award,
  History as HistoryIcon,
  Clock,
  LayoutGrid,
  ChevronRight,
  PlusCircle,
  MessageCircle,
  Loader2
} from "lucide-react";
import { collection, getCountFromServer, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

type DashboardStats = {
  users: number;
  prompts: number;
  projects: number;
  tasks: number;
  categories: number;
  videos: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    prompts: 0,
    projects: 0,
    tasks: 0,
    categories: 0,
    videos: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState("");
  const [searchResult, setSearchResult] = useState<null | {
    found: boolean;
    user?: any;
    roomId?: string;
    code?: string;
    message: string;
  }>(null);
  const [searching, setSearching] = useState(false);
  const [hackathons, setHackathons] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [usersSnap, promptsSnap, projectsSnap, tasksSnap, categoriesSnap, videosSnap] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getCountFromServer(collection(db, "prompts")),
          getCountFromServer(collection(db, "projects")),
          getCountFromServer(collection(db, "tasks")),
          getCountFromServer(collection(db, "video_categories")),
          getCountFromServer(collection(db, "videos"))
        ]);

        setStats({
          users: usersSnap.data().count,
          prompts: promptsSnap.data().count,
          projects: projectsSnap.data().count,
          tasks: tasksSnap.data().count,
          categories: categoriesSnap.data().count,
          videos: videosSnap.data().count
        });

        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
        const recentSnap = await getDocs(usersQuery);
        setRecentUsers(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const hackathonsQuery = query(collection(db, "hackathons"), orderBy("updatedAt", "desc"), limit(5));
        const hackathonsSnap = await getDocs(hackathonsQuery);
        setHackathons(hackathonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Admin Fetch Failure:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Prompts", value: stats.prompts, icon: Library, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Course Lessons", value: stats.videos, icon: Video, color: "text-primary", bg: "bg-primary/10" },
    { label: "System Uptime", value: "99.9%", icon: ShieldCheck, color: "text-green-500", bg: "bg-green-500/10" },
  ];

  const pieData = [
    { name: 'Users', value: stats.users || 1, color: '#22c55e' },
    { name: 'Prompts', value: stats.prompts || 1, color: '#a855f7' },
    { name: 'Nodes', value: stats.videos || 1, color: '#3b82f6' },
  ];

  const handleSecretChatLookup = async () => {
    const normalized = searchCode.trim().toUpperCase();
    if (!normalized) return;

    setSearching(true);
    try {
      const usersQuery = query(collection(db, "users"), where("secretCode", "==", normalized), limit(1));
      const usersSnap = await getDocs(usersQuery);
      const roomQuery = query(collection(db, "chatRooms"), where("code", "==", normalized), limit(1));
      const roomSnap = await getDocs(roomQuery);

      const foundUser = usersSnap.empty ? null : { id: usersSnap.docs[0].id, ...usersSnap.docs[0].data() };
      const foundRoom = roomSnap.empty ? null : roomSnap.docs[0];

      setSearchResult({
        found: !!foundUser || !!foundRoom,
        user: foundUser || undefined,
        roomId: foundRoom?.id,
        code: normalized,
        message: foundUser
          ? `Found user ${foundUser.username || foundUser.name}`
          : foundRoom
          ? 'Secure chat room found'
          : 'No matching secure chat code found'
      });
    } catch (error) {
      console.error('Secret chat lookup failed:', error);
      setSearchResult({ found: false, message: 'Lookup failed', code: normalized });
    } finally {
      setSearching(false);
    }
  };

  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Syncing...</p>
     </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold uppercase text-white">Overview</h2>
        <p className="text-xs text-text-muted font-medium">Real-time platform status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="p-4 bg-[#111] border border-white/5 rounded-lg flex items-center gap-4">
            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{stat.label}</p>
              <h3 className="text-base font-bold text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
           <div className="bg-[#111] border border-white/5 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" />
                    <h3 className="text-xs font-bold uppercase text-white">Distribution</h3>
                 </div>
                 <Link to="/admin/analytics">
                    <Button variant="ghost" className="text-[9px] font-bold uppercase h-8 px-3">View More</Button>
                 </Link>
              </div>
              <div className="h-[280px] w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                       >
                          {pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} />
                          ))}
                       </Pie>
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#0A0A0A', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', padding: '4px 8px' }}
                          itemStyle={{ color: '#fff', fontSize: '10px' }}
                       />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                       <p className="text-lg font-bold text-white tracking-widest">{stats.users + stats.prompts + stats.videos}</p>
                       <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Total Nodes</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
           <div className="p-6 bg-[#111] border border-white/5 rounded-lg flex flex-col gap-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Course Control</h3>
              <div className="space-y-2">
                 <Button className="w-full h-10 bg-primary text-black font-bold uppercase text-[9px] tracking-widest rounded-lg transition-all gap-2" asChild>
                    <Link to="/admin/prompts"><PlusCircle size={14} /> New Prompt</Link>
                 </Button>
                 <Button className="w-full h-10 bg-white/5 border border-white/10 text-white font-bold uppercase text-[9px] tracking-widest rounded-lg hover:bg-white/10 transition-all gap-2" asChild>
                    <Link to="/admin/learning?tab=videos"><ArrowRight size={14} /> Manage Lessons</Link>
                 </Button>
                 <Button className="w-full h-10 bg-white/5 border border-white/10 text-white font-bold uppercase text-[9px] tracking-widest rounded-lg hover:bg-white/10 transition-all gap-2" asChild>
                    <Link to="/admin/learning?tab=files"><ArrowRight size={14} /> Manage Files</Link>
                 </Button>
                 <Button className="w-full h-10 bg-white/5 border border-white/10 text-white font-bold uppercase text-[9px] tracking-widest rounded-lg hover:bg-white/10 transition-all gap-2" asChild>
                    <Link to="/admin/learning?tab=categories"><ArrowRight size={14} /> Manage Roadmap</Link>
                 </Button>
                 <Button className="w-full h-10 bg-white/5 border border-white/10 text-white font-bold uppercase text-[9px] tracking-widest rounded-lg hover:bg-white/10 transition-all gap-2" asChild>
                    <Link to="/admin/learning?tab=quiz_studio"><ArrowRight size={14} /> Manage Quiz Studio</Link>
                 </Button>
                 <Button className="w-full h-10 bg-white/5 border border-white/10 text-white font-bold uppercase text-[9px] tracking-widest rounded-lg hover:bg-white/10 transition-all gap-2" asChild>
                    <Link to="/admin/hackathons"><ArrowRight size={14} /> Manage Hackathons</Link>
                 </Button>
              </div>
           </div>

           <div className="p-6 bg-[#111] border border-white/5 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Hackathons</h3>
                 <Link to="/admin/hackathons" className="text-[9px] font-bold uppercase tracking-widest text-primary hover:opacity-80">
                    Manage
                 </Link>
              </div>
              {hackathons.length > 0 ? (
                <div className="space-y-2">
                  {hackathons.map((hack) => (
                    <div key={hack.id} className="p-3 bg-black/30 border border-white/10 rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold text-white truncate">{hack.title}</p>
                        <span className="text-[8px] uppercase text-primary">{hack.status || "upcoming"}</span>
                      </div>
                      <p className="text-[9px] text-text-muted mt-1 truncate">{hack.mode || "Online"} • {hack.prize || "Prize TBA"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-text-muted">No hackathons posted yet.</p>
              )}
              <Button className="w-full h-9 bg-white/5 border border-white/10 text-white font-bold uppercase text-[9px] tracking-widest rounded-lg hover:bg-white/10 transition-all" asChild>
                <Link to="/admin/hackathons"><PlusCircle size={12} /> Post Hackathon</Link>
              </Button>
           </div>

           <div className="p-6 bg-[#111] border border-white/5 rounded-lg space-y-4">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <MessageCircle size={14} className="text-primary" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Secure Chat Lookup</h3>
                 </div>
                 <span className="text-[8px] uppercase tracking-[0.3em] text-text-muted">Admin only</span>
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed">Search by a user's secret chat code to locate or open their secure conversation room.</p>
              <div className="grid gap-3">
                 <input
                   type="text"
                   value={searchCode}
                   onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                   placeholder="XXXX-YYYY"
                   className="w-full bg-[#0B0B0B] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 transition-all"
                 />
                 <button
                   type="button"
                   onClick={handleSecretChatLookup}
                   disabled={!searchCode.trim() || searching}
                   className="w-full h-11 rounded-2xl bg-primary text-black font-black uppercase text-[10px] tracking-[0.3em] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {searching ? 'Looking up...' : 'Lookup Secret Chat'}
                 </button>
                 {searchResult && (
                   <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                     <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted mb-2">Result</p>
                     <p className={`text-sm font-bold ${searchResult.found ? 'text-white' : 'text-red-400'}`}>{searchResult.message}</p>
                     {searchResult.user && (
                       <p className="text-[10px] text-text-muted mt-2">User: @{searchResult.user.username || searchResult.user.name}</p>
                     )}
                     {searchResult.code && (
                       <p className="text-[10px] text-text-muted">Code: {searchResult.code}</p>
                     )}
                     <div className="mt-3">
                       <Link
                         to={`/chat?code=${searchResult.code}`}
                         className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-[9px] font-black uppercase tracking-[0.35em] text-black"
                       >
                         Open Chat
                       </Link>
                     </div>
                   </div>
                 )}
              </div>
           </div>

           <div className="p-6 bg-[#111] border border-white/5 rounded-lg flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Recent Users</h3>
                 <Users size={14} className="text-text-muted opacity-40" />
              </div>
              <div className="space-y-2 flex-1">
                 {recentUsers.length > 0 ? recentUsers.map(user => (
                    <div key={user.id} className="p-2 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between group hover:border-primary/10 transition-all">
                       <div className="flex items-center gap-3 min-w-0">
                          <div className="w-6 h-6 rounded bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold uppercase text-[8px]">
                             {user.username?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                             <h4 className="text-[10px] font-bold text-white truncate w-24">{user.name}</h4>
                             <p className="text-[8px] font-bold uppercase text-text-muted opacity-60">Joined {user.createdAt ? format(user.createdAt.toDate(), "MMM dd") : 'Today'}</p>
                          </div>
                       </div>
                       <ChevronRight size={10} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                 )) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                       <ShieldCheck size={24} className="mb-2" />
                       <p className="text-[8px] font-bold uppercase tracking-widest text-center">No data</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

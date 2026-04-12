import { useEffect, useState } from "react";
import { 
  Users, 
  Layers, 
  Play, 
  Library, 
  Activity,
  Loader2,
  TrendingUp,
  MessageCircle,
  Trophy,
  PlusCircle,
  ArrowRight
} from "lucide-react";
import { collection, getCountFromServer, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState("");
  const [searchResult, setSearchResult] = useState<null | {
    found: boolean;
    user?: any;
    message: string;
    code: string;
  }>(null);
  const [searching, setSearching] = useState(false);

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

        const hackathonsQuery = query(collection(db, "hackathons"), orderBy("updatedAt", "desc"), limit(3));
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

  const handleSecretChatLookup = async () => {
    const normalized = searchCode.trim().toUpperCase();
    if (!normalized) return;
    setSearching(true);
    try {
      const usersQuery = query(collection(db, "users"), where("secretCode", "==", normalized), limit(1));
      const usersSnap = await getDocs(usersQuery);
      const foundUser = usersSnap.empty ? null : { id: usersSnap.docs[0].id, ...usersSnap.docs[0].data() };

      setSearchResult({
        found: !!foundUser,
        user: foundUser,
        code: normalized,
        message: foundUser ? `Identity Found: ${foundUser.name}` : "No matching identity in mesh"
      });
    } catch (error) {
      setSearchResult({ found: false, message: "Lookup failed", code: normalized });
    } finally {
      setSearching(false);
    }
  };

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Total Modules", value: stats.categories, icon: Layers }, 
    { label: "Total Lessons", value: stats.videos, icon: Play },
    { label: "Total Projects", value: stats.projects, icon: Library },
    { label: "Active Nodes", value: stats.users, icon: Activity }, 
  ];

  const pieData = [
    { name: 'Users', value: stats.users || 1, color: '#22d3ee' },
    { name: 'Prompts', value: stats.prompts || 1, color: '#a855f7' },
    { name: 'Lessons', value: stats.videos || 1, color: '#3b82f6' },
  ];

  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary mb-4" size={24} />
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Synchronizing Nexus...</p>
     </div>
  );

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-sm font-black uppercase text-white tracking-[0.2em] leading-none mb-1">Nexus Unified Command</h2>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Complete Academic & Platform Oversight</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="p-5 bg-[#0B0B0B] border border-white/5 rounded-[2px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
               <stat.icon size={16} className="text-primary" />
               <span className="text-[9px] font-black uppercase text-text-muted opacity-40">Metric</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">{stat.label}</p>
              <h3 className="text-xl font-black text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
            {/* Distribution Graph */}
            <div className="bg-[#0B0B0B] border border-white/5 rounded-[2px] p-8">
               <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                     <TrendingUp size={14} className="text-primary" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Neural Mesh Distribution</h3>
                  </div>
               </div>
               <div className="h-[300px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={pieData}
                           cx="50%"
                           cy="50%"
                           innerRadius={70}
                           outerRadius={100}
                           paddingAngle={8}
                           dataKey="value"
                           stroke="none"
                        >
                           {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} />
                           ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#0B0B0B', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.05)', padding: '8px' }}
                           itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                        />
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="text-center">
                        <p className="text-2xl font-black text-white tracking-widest">{stats.users + stats.prompts + stats.videos}</p>
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Total Nodes</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Recent Growth */}
            <div className="p-8 bg-[#0B0B0B] border border-white/5 rounded-[2px] space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-white border-b border-white/5 pb-4">Recent Identity Joins</h3>
               <div className="space-y-4">
                  {recentUsers.map(user => (
                     <div key={user.id} className="flex items-center justify-between py-2 border-b border-white/[0.02]">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-[2px] bg-white/5 flex items-center justify-center text-[11px] font-black text-primary border border-white/5">{user.username?.charAt(0)}</div>
                           <div>
                              <p className="text-sm font-bold text-white leading-none">{user.name}</p>
                              <p className="text-[9px] font-bold uppercase text-text-muted mt-1.5">{user.email}</p>
                           </div>
                        </div>
                        <span className="text-[9px] font-black uppercase text-text-muted opacity-40">{user.createdAt ? format(user.createdAt.toDate(), "MMM dd") : 'Today'}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-8">
            {/* System Utilities */}
            <div className="p-8 bg-[#0B0B0B] border border-white/5 rounded-[2px] space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-white border-b border-white/5 pb-4">Nexus Utilities</h3>
               <div className="grid grid-cols-1 gap-3">
                  <Button asChild variant="outline" className="justify-start h-12 border-white/5 bg-transparent rounded-[2px] text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all gap-3 group">
                     <Link to="/admin/courses"><Video size={14} className="group-hover:text-primary" /> Course Factory</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start h-12 border-white/5 bg-transparent rounded-[2px] text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all gap-3 group">
                     <Link to="/admin/lessons"><Play size={14} className="group-hover:text-primary" /> Lesson Studio</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start h-12 border-white/5 bg-transparent rounded-[2px] text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all gap-3 group">
                     <Link to="/admin/quizzes"><Award size={14} className="group-hover:text-primary" /> Calibration Hub</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start h-12 border-white/5 bg-transparent rounded-[2px] text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all gap-3 group">
                     <Link to="/admin/users"><Users size={14} className="group-hover:text-primary" /> Identity Mesh</Link>
                  </Button>
               </div>
            </div>

            {/* Secure Chat Lookup */}
            <div className="p-8 bg-[#0B0B0B] border border-white/5 rounded-[2px] space-y-6">
               <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <MessageCircle size={14} className="text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Identity Scan</h3>
               </div>
               <p className="text-[10px] text-text-muted leading-relaxed font-bold uppercase tracking-tight opacity-60">Locate secure rooms via identity codes.</p>
               <div className="space-y-4">
                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-YYYY"
                    className="w-full h-11 bg-white/5 border border-white/5 rounded-[2px] px-4 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all"
                  />
                  <Button
                    onClick={handleSecretChatLookup}
                    disabled={!searchCode.trim() || searching}
                    className="w-full h-11 bg-primary text-black font-black uppercase text-[10px] tracking-widest"
                  >
                    {searching ? "Scanning..." : "Execute Scan"}
                  </Button>
                  {searchResult && (
                    <div className="p-4 bg-white/5 border border-white/5 rounded-[2px]">
                       <p className={`text-[10px] font-black uppercase ${searchResult.found ? 'text-primary' : 'text-red-500'}`}>{searchResult.message}</p>
                       {searchResult.found && (
                          <Link to={`/chat?code=${searchResult.code}`} className="inline-block mt-3 text-[9px] font-black uppercase text-white hover:text-primary transition-colors border-b border-white/10">Open Protocol</Link>
                       )}
                    </div>
                  )}
               </div>
            </div>

            {/* Hackathons */}
            <div className="p-8 bg-[#0B0B0B] border border-white/5 rounded-[2px] space-y-6">
               <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Active Matrix Events</h3>
                  <Trophy size={14} className="text-primary" />
               </div>
               <div className="space-y-3">
                  {hackathons.length > 0 ? hackathons.map(hack => (
                     <div key={hack.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-[2px]">
                        <div className="flex items-center justify-between mb-1">
                           <p className="text-[10px] font-black text-white truncate">{hack.title}</p>
                           <span className="text-[8px] font-black uppercase text-primary">{hack.status}</span>
                        </div>
                        <p className="text-[8px] font-black uppercase text-text-muted opacity-40">{hack.mode} • {hack.prize || 'Award TBA'}</p>
                     </div>
                  )) : (
                     <p className="text-[9px] font-bold uppercase text-text-muted opacity-20 py-4 text-center">No active simulations detected</p>
                  )}
               </div>
               <Button asChild variant="outline" className="w-full h-10 border-white/5 bg-transparent rounded-[2px] text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all">
                  <Link to="/admin/hackathons">Event Control</Link>
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}

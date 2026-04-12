import { useState, useEffect } from "react";
import { 
  Search, 
  Loader2,
  Terminal,
  Zap,
  Cpu,
  Globe,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { 
  collection, 
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export default function ProjectHub() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [userProjects, setUserProjects] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // 1. Fetch Projects
    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      const allProjects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const published = allProjects
        .filter((p: any) => p.isPublished)
        .sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate?.() || 0;
          const dateB = b.createdAt?.toDate?.() || 0;
          return dateB - dateA;
        });
      setProjects(published);
      setLoading(false);
    });

    // 2. Fetch User Progress if logged in
    let unsubUP = () => {};
    if (user) {
      const upQuery = query(collection(db, "user_projects"), where("userId", "==", user.uid));
      unsubUP = onSnapshot(upQuery, (snap) => {
        const progress: Record<string, any> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          progress[data.projectId] = data;
        });
        setUserProjects(progress);
      });
    }

    return () => {
      unsubProjects();
      unsubUP();
    };
  }, [user]);

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    { title: "Easy", icon: Terminal, color: "#22c55e", label: "🟢 FORGE INITIATE" },
    { title: "Medium", icon: Zap, color: "#eab308", label: "🟡 SYSTEM ARCHITECT" },
    { title: "Hard", icon: Cpu, color: "#ef4444", label: "🔴 CORE ENGINEER" }
  ];

  const getProjectsByDifficulty = (difficulty: string) => {
    return filteredProjects.filter(p => p.difficulty === difficulty);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-32 pt-16">
      <div className="max-w-7xl mx-auto px-6 space-y-20">
        
        {/* Cinematic Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                 <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Academy Mesh Active</span>
              </div>
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none">
                 Engineering <span className="text-primary italic">Builds</span>
              </h1>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.3em] leading-relaxed max-w-lg opacity-40">
                 Convert theory into production-ready SaaS protocols. 
                 Complete targets to earn engineering badges and rank.
              </p>
           </div>

           <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={14} />
              <input 
                type="text"
                placeholder="Search build targets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 bg-white/[0.02] border border-white/5 rounded-[2px] pl-12 pr-6 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all placeholder:opacity-20 shadow-inner"
              />
           </div>
        </div>

        {loading ? (
           <div className="flex justify-center py-40">
              <Loader2 className="animate-spin text-primary" size={32} />
           </div>
        ) : (
           <div className="space-y-32">
             {categories.map((category) => {
               const categorizedProjects = getProjectsByDifficulty(category.title);
               if (categorizedProjects.length === 0) return null;

               return (
                 <div key={category.title} className="space-y-10">
                    <div className="flex items-center gap-6">
                       <h2 className="text-[13px] font-black uppercase tracking-[0.4em] whitespace-nowrap" style={{ color: category.color }}>{category.label}</h2>
                       <div className="h-[1px] w-full bg-white/[0.05] relative">
                          <div className="absolute left-0 top-0 h-full w-24" style={{ background: `linear-gradient(to right, ${category.color}40, transparent)` }} />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {categorizedProjects.map((project) => {
                          const status = userProjects[project.id]?.status;
                          return (
                             <Link 
                               key={project.id} 
                               to={`/projects/${project.id}`}
                               className="group relative flex flex-col p-1 bg-white/[0.02] border border-white/5 rounded-[2px] transition-all hover:border-white/20 hover:scale-[1.01] active:scale-[0.99] shadow-2xl overflow-hidden"
                             >
                                {/* Active colored accent strip */}
                                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: category.color, opacity: 0.3 }} />
                                
                                <div className="p-8 space-y-8 flex-1 flex flex-col relative z-10 bg-[#0B0B0B]">
                                   <div className="flex items-start justify-between">
                                      <div 
                                        className="p-3 bg-white/[0.03] border border-white/5 rounded-[2px] transition-all group-hover:bg-primary/5 group-hover:border-primary/20" 
                                        style={{ color: category.color }}
                                      >
                                         <category.icon size={20} />
                                      </div>
                                      
                                      {status ? (
                                         <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                            status === 'submitted' || status === 'completed' 
                                            ? 'bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e]' 
                                            : 'bg-[#eab308]/10 border-[#eab308]/20 text-[#eab308]'
                                         }`}>
                                            {status === 'submitted' || status === 'completed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                            {status}
                                         </div>
                                      ) : (
                                         <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted opacity-20 group-hover:opacity-40 transition-opacity">Ready For Build</span>
                                      )}
                                   </div>

                                   <div className="space-y-3 flex-1">
                                      <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{project.title}</h3>
                                      <p className="text-[11px] font-bold text-text-muted leading-relaxed opacity-40 line-clamp-3 italic">
                                         {project.description}
                                      </p>
                                   </div>

                                   <div className="pt-6 border-t border-white/[0.03] flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                         <Globe size={11} className="transition-colors group-hover:text-primary opacity-40 group-hover:opacity-100" />
                                         <span className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40 group-hover:opacity-100 transition-opacity">Open Module</span>
                                      </div>
                                      <ArrowRight size={14} className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                   </div>
                                </div>
                             </Link>
                          );
                       })}
                    </div>
                 </div>
               );
             })}
           </div>
        )}

        {!loading && filteredProjects.length === 0 && (
           <div className="py-40 text-center border border-dashed border-white/5 rounded-[2px] bg-white/[0.01]">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted italic opacity-20 animate-pulse">Scanning Mesh: Zero Build Targets Found</p>
           </div>
        )}
      </div>
    </div>
  );
}

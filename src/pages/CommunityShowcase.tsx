import { useState, useEffect } from "react";
import { 
  Globe, 
  Search, 
  ExternalLink, 
  Loader2,
  Heart,
  Share2,
  User,
  Zap,
  Terminal,
  Cpu,
  Trophy
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  doc,
  setDoc,
  deleteDoc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function CommunityShowcase() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // 1. Fetch Master Projects
    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Fetch submissions and filter in memory to avoid index requirements
    const unsubSub = onSnapshot(collection(db, "project_submissions"), (snap) => {
      const allSubs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const approved = allSubs
        .filter((s: any) => s.status === 'approved')
        .sort((a: any, b: any) => {
          const dateA = a.submittedAt?.toDate?.() || 0;
          const dateB = b.submittedAt?.toDate?.() || 0;
          return dateB - dateA;
        });
      setSubmissions(approved);
      setLoading(false);
    });

    // 3. Track Likes (Simplified for this version)
    const unsubLikes = onSnapshot(collection(db, "project_likes"), (snap) => {
      const counts: Record<string, number> = {};
      const userLikes: Record<string, boolean> = {};
      
      snap.docs.forEach(d => {
        const data = d.data();
        counts[data.submissionId] = (counts[data.submissionId] || 0) + 1;
        if (user && data.userId === user.uid) {
           userLikes[data.submissionId] = true;
        }
      });
      setLikeCounts(counts);
      setLikes(userLikes);
    });

    return () => {
      unsubProjects();
      unsubSub();
      unsubLikes();
    };
  }, [user]);

  const toggleLike = async (submissionId: string) => {
    if (!user) return toast.error("Authentication required to engage.");
    const likeId = `${user.uid}_${submissionId}`;
    try {
      if (likes[submissionId]) {
        await deleteDoc(doc(db, "project_likes", likeId));
      } else {
        await setDoc(doc(db, "project_likes", likeId), {
          userId: user.uid,
          submissionId: submissionId,
          createdAt: new Date()
        });
        toast.success("Engagement logged.");
      }
    } catch (err) {
      toast.error("Process failed.");
    }
  };

  const shareBuild = (sub: any) => {
    const url = sub.projectLink;
    navigator.clipboard.writeText(url);
    toast.success("Build link hashed to clipboard.");
  };

  const filteredSubmissions = submissions.filter(sub => {
    const project = projects.find(p => p.id === sub.projectId);
    return (
      sub.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) return (
     <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Syncing Showcase Mesh...</p>
     </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-20 pt-10">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Header */}
        <div className="space-y-4 max-w-2xl">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
              <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Community Pulse Live</span>
           </div>
           <h1 className="text-4xl font-black text-white uppercase tracking-tight italic leading-none">Engineering Showcase</h1>
           <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] leading-relaxed max-w-lg opacity-40">
              Discover the top-tier builds from the ZeroCode community. 
              Real-world engineering proofs, vetted and verified.
           </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={14} />
           <input 
             type="text"
             placeholder="Search by engineer or project..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full h-12 bg-[#0B0B0B] border border-white/5 rounded-[2px] pl-12 pr-6 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all placeholder:opacity-20"
           />
        </div>

        {/* Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredSubmissions.map((sub) => {
              const project = projects.find(p => p.id === sub.projectId);
              const difficultyColor = project?.difficulty === 'Hard' ? '#ef4444' : project?.difficulty === 'Medium' ? '#eab308' : '#22c55e';
              
              return (
                 <div key={sub.id} className="group flex flex-col bg-[#0B0B0B] border border-white/5 rounded-[2px] hover:border-white/10 transition-all overflow-hidden shadow-2xl">
                    <div className="aspect-video bg-white/5 relative overflow-hidden">
                       {sub.images?.[0] ? (
                          <img src={sub.images[0]} alt="Build" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-10">
                             <Globe size={48} />
                          </div>
                       )}
                       <div className="absolute top-4 left-4">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[2px] border bg-black/80`} style={{ borderColor: `${difficultyColor}40`, color: difficultyColor }}>
                             {project?.difficulty || 'Standard'}
                          </span>
                       </div>
                    </div>

                    <div className="p-8 space-y-6 flex-1 flex flex-col">
                       <div className="space-y-1.5 flex-1">
                          <p className="text-[9px] font-black text-primary uppercase tracking-widest">{project?.title || 'Engineering Build'}</p>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight italic">by {sub.userName}</h3>
                       </div>

                       <div className="flex items-center justify-between pt-6 border-t border-white/[0.03]">
                          <div className="flex items-center gap-4">
                             <button 
                               onClick={() => toggleLike(sub.id)}
                               className={`flex items-center gap-2 transition-colors ${likes[sub.id] ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                             >
                                <Heart size={16} fill={likes[sub.id] ? "currentColor" : "none"} />
                                <span className="text-[10px] font-black">{likeCounts[sub.id] || 0}</span>
                             </button>
                             <button onClick={() => shareBuild(sub)} className="text-text-muted hover:text-white transition-colors">
                                <Share2 size={16} />
                             </button>
                          </div>
                          <a 
                            href={sub.projectLink} 
                            target="_blank" 
                            className="h-10 px-4 bg-white/5 border border-white/5 rounded-[2px] text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 hover:bg-primary hover:text-black transition-all"
                          >
                             View Site <ExternalLink size={12} />
                          </a>
                       </div>
                    </div>
                 </div>
              );
           })}
        </div>

        {filteredSubmissions.length === 0 && !loading && (
           <div className="py-40 text-center border border-dashed border-white/5 rounded-[2px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic opacity-20">Zero Verified Builds Found In This Node</p>
           </div>
        )}
      </div>
    </div>
  );
}

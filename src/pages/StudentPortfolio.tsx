import { useState, useEffect } from "react";
import { 
  Terminal, 
  ExternalLink, 
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  LayoutGrid,
  Send,
  User,
  Award,
  BookOpen
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function StudentPortfolio() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch master projects for metadata
    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const upQuery = query(collection(db, "user_projects"), where("userId", "==", user.uid));
    const unsubUP = onSnapshot(upQuery, (snap) => {
      setUserProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const subQuery = query(collection(db, "project_submissions"), where("userId", "==", user.uid), orderBy("submittedAt", "desc"));
    const unsubSub = onSnapshot(subQuery, (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubProjects();
      unsubUP();
      unsubSub();
    };
  }, [user]);

  if (loading) return (
     <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Syncing Portfolio Node...</p>
     </div>
  );

  const statusColors: any = {
    "pending": "text-[#eab308] border-[#eab308]/20 bg-[#eab308]/10",
    "approved": "text-[#22c55e] border-[#22c55e]/20 bg-[#22c55e]/10",
    "rejected": "text-[#ef4444] border-[#ef4444]/20 bg-[#ef4444]/10",
    "in-progress": "text-primary border-primary/20 bg-primary/10"
  };

  const approvedCount = submissions.filter(s => s.status === 'approved').length;

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-20 pt-10">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
           <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary overflow-hidden">
                    {user?.photoURL ? <img src={user.photoURL} alt="ID" className="w-full h-full object-cover" /> : <User size={24} />}
                 </div>
                 <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight italic">{user?.displayName || 'Student ID'}</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1 opacity-40">Engineering Mesh Status: Active</p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-text-muted opacity-40">Builds Deployed</p>
                 <p className="text-2xl font-black text-white">{submissions.length}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-text-muted opacity-40">Verified Proofs</p>
                 <p className="text-2xl font-black text-primary">{approvedCount}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-text-muted opacity-40">Academy Rank</p>
                 <p className="text-2xl font-black text-white">{approvedCount > 10 ? 'Elite' : approvedCount > 3 ? 'Professional' : 'Initiate'}</p>
              </div>
           </div>
        </div>

        {/* Action Grid */}
        <div className="grid lg:grid-cols-12 gap-12">
           <div className="lg:col-span-8 space-y-12">
              <div className="space-y-8">
                 <div className="flex items-center gap-3">
                    <Send size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Deployment Registry</h3>
                 </div>

                 {submissions.length > 0 ? (
                    <div className="space-y-4">
                       {submissions.map(sub => {
                          const project = projects.find(p => p.id === sub.projectId);
                          return (
                             <div key={sub.id} className="p-6 bg-[#0B0B0B] border border-white/5 rounded-[2px] hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                <div className="space-y-1.5">
                                   <div className="flex items-center gap-3">
                                      <h4 className="text-[13px] font-black text-white uppercase tracking-tight">{project?.title || 'Unknown Build'}</h4>
                                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[2px] border ${statusColors[sub.status]}`}>
                                         {sub.status}
                                      </span>
                                   </div>
                                   <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-40 italic">
                                      Submitted: {sub.submittedAt ? format(sub.submittedAt.toDate(), "MMM dd, yyyy") : 'Syncing...'}
                                   </p>
                                </div>

                                <div className="flex items-center gap-4">
                                   <a href={sub.projectLink} target="_blank" className="p-2.5 bg-white/5 border border-white/5 rounded-[2px] text-text-muted hover:text-primary transition-all">
                                      <ExternalLink size={14} />
                                   </a>
                                   <Link to={`/projects/${sub.projectId}`} className="px-4 h-10 bg-white/5 border border-white/5 rounded-[2px] text-[10px] font-black uppercase tracking-widest text-white flex items-center hover:bg-white/10 transition-all">
                                      Edit / Update
                                   </Link>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 ) : (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-[2px]">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic opacity-20">Zero Deployments Detected</p>
                       <Link to="/projects" className="inline-block mt-4 text-[10px] font-black uppercase tracking-widest text-primary hover:border-b border-primary transition-all">Start First Build</Link>
                    </div>
                 )}
              </div>

              {/* In Progress Builds */}
              <div className="space-y-8">
                 <div className="flex items-center gap-3">
                    <Clock size={16} className="text-[#eab308]" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Active Build Nodes</h3>
                 </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    {userProjects.filter(up => up.status === 'in-progress').map(up => {
                       const project = projects.find(p => p.id === up.projectId);
                       return (
                          <Link key={up.id} to={`/projects/${up.projectId}`} className="p-4 bg-white/[0.02] border border-white/5 rounded-[2px] hover:border-[#eab308]/20 transition-all group">
                             <p className="text-[11px] font-black text-white uppercase mb-1">{project?.title}</p>
                             <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">{project?.difficulty} Complexity</p>
                          </Link>
                       );
                    })}
                 </div>
              </div>
           </div>

           {/* Sidebar Info */}
           <div className="lg:col-span-4 space-y-12">
              <div className="p-8 bg-[#111] border border-white/5 rounded-[2px] space-y-8">
                 <div className="flex items-center gap-3">
                    <Award size={18} className="text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Earned Badges</h3>
                 </div>
                 <div className="flex flex-wrap gap-3">
                    {approvedCount >= 1 && (
                       <div className="px-3 py-2 bg-primary/10 border border-primary/20 rounded-[2px] text-[9px] font-black text-primary uppercase tracking-widest">Beginner Builder</div>
                    )}
                    {submissions.some(s => s.status === 'approved' && projects.find(p => p.id === s.projectId)?.difficulty === 'Hard') && (
                       <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-[2px] text-[9px] font-black text-red-500 uppercase tracking-widest">Engineering Elite</div>
                    )}
                     {submissions.some(s => s.status === 'approved' && projects.find(p => p.id === s.projectId)?.techStack?.includes('API')) && (
                       <div className="px-3 py-2 bg-[#eab308]/10 border border-[#eab308]/20 rounded-[2px] text-[9px] font-black text-[#eab308] uppercase tracking-widest">API Specialist</div>
                    )}
                 </div>
                 {!approvedCount && (
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-30 italic">Deploy projects to unlock badges.</p>
                 )}
              </div>

              <div className="p-8 bg-[#0B0B0B] border border-white/5 rounded-[2px] space-y-6">
                 <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-white opacity-40" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Portfolio Rules</h3>
                 </div>
                 <ul className="space-y-4">
                    <li className="flex gap-3 text-[10px] font-bold text-text-muted uppercase leading-relaxed opacity-60 italic">
                       <CheckCircle2 size={12} className="text-[#22c55e] shrink-0" /> Approved projects are added to your public ID Card.
                    </li>
                    <li className="flex gap-3 text-[10px] font-bold text-text-muted uppercase leading-relaxed opacity-60 italic">
                       <XCircle size={12} className="text-[#ef4444] shrink-0" /> Rejected builds can be resubmitted with fixes.
                    </li>
                 </ul>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

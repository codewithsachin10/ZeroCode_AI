import { useState, useEffect } from "react";
import { 
  Search, 
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  User,
  Clock,
  LayoutGrid,
  Filter,
  Eye,
  Check,
  X,
  FileText
} from "lucide-react";
import { 
  collection, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    // Fetch projects for mapping titles
    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubSubmissions = onSnapshot(query(collection(db, "project_submissions"), orderBy("submittedAt", "desc")), (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubProjects();
      unsubSubmissions();
    };
  }, []);

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      await updateDoc(doc(db, "project_submissions", id), { 
        status,
        updatedAt: serverTimestamp() 
      });
      toast.success(`Submission ${status}`);
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    const project = projects.find(p => p.id === s.projectId);
    const matchesSearch = (project?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.userName?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase text-white tracking-widest leading-none mb-1">Build Reviews</h2>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Verify and validate student engineering submissions</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={14} />
          <input 
            placeholder="Search by student or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-[#0B0B0B] border border-white/5 rounded-[2px] pl-10 pr-4 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all placeholder:opacity-30"
          />
        </div>
        <div className="flex gap-2">
           {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 h-11 rounded-[2px] text-[9px] font-black uppercase tracking-widest border transition-all ${
                  filterStatus === status ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-[#0B0B0B] border-white/5 text-text-muted hover:border-white/10'
                }`}
              >
                {status}
              </button>
           ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <div className="bg-[#0B0B0B] border border-white/5 rounded-[2px] overflow-hidden shadow-2xl overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Build Node</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Temporal Hash</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Validation Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map(sub => (
                <tr key={sub.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[2px] bg-white/5 border border-white/5 flex items-center justify-center text-primary">
                        <User size={14} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white">{sub.userName}</p>
                        <p className="text-[8px] font-black uppercase text-text-muted opacity-40">User: {sub.userId?.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase text-white/60">
                      {projects.find(p => p.id === sub.projectId)?.title || "Unknown Build"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-text-muted">
                        <Clock size={12} className="opacity-40" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                           {sub.submittedAt ? format(sub.submittedAt.toDate(), "MMM dd, HH:mm") : 'Syncing...'}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[2px] border ${
                      sub.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 
                      sub.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                      'bg-orange-500/10 border-orange-500/20 text-orange-500'
                    }`}>
                      {sub.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setSelectedSubmission(sub)}
                        className="p-2 text-text-muted hover:text-white transition-colors"
                        title="View Submission"
                      >
                         <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => handleStatusChange(sub.id, 'approved')}
                        className="p-2 text-text-muted hover:text-green-500 transition-colors"
                        title="Approve"
                      >
                         <Check size={14} />
                      </button>
                      <button 
                        onClick={() => handleStatusChange(sub.id, 'rejected')}
                        className="p-2 text-text-muted hover:text-red-500 transition-colors"
                        title="Reject"
                      >
                         <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSubmissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">
                    Submission Mesh Empty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#0B0B0B] border border-white/5 rounded-[2px] shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-white/5 text-white">
              <div className="flex items-center gap-3">
                 <FileText size={16} className="text-primary" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest">Build Inspection Node</h3>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="text-text-muted hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Student Node</label>
                        <p className="text-sm font-bold text-white uppercase italic">{selectedSubmission.userName}</p>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Deploy Target</label>
                        <p className="text-sm font-bold text-white uppercase italic">
                           {projects.find(p => p.id === selectedSubmission.projectId)?.title}
                        </p>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Production URL</label>
                        <a 
                          href={selectedSubmission.projectLink} 
                          target="_blank" 
                          className="flex items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-[2px] text-xs font-bold text-primary group hover:border-primary/20 transition-all truncate"
                        >
                           {selectedSubmission.projectLink}
                           <ExternalLink size={12} className="shrink-0" />
                        </a>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Build Visuals</label>
                     <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                        {selectedSubmission.images?.map((url: string, i: number) => (
                           <a key={i} href={url} target="_blank" className="aspect-video border border-white/5 rounded-[2px] overflow-hidden bg-white/5 group hover:border-primary/20 transition-all">
                              <img src={url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Capture" />
                           </a>
                        ))}
                        {!selectedSubmission.images?.length && (
                          <div className="col-span-2 py-10 text-center border border-dashed border-white/5 rounded-[2px] text-[9px] font-black uppercase tracking-widest text-text-muted opacity-20">Zero Media Buffers</div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-8 border-t border-white/5">
                  <Button 
                    onClick={() => {
                       handleStatusChange(selectedSubmission.id, 'approved');
                       setSelectedSubmission(null);
                    }}
                    className="flex-1 h-12 bg-green-500 text-black font-black uppercase text-[10px] tracking-widest rounded-[2px]"
                  >
                     Authorize Build (Approve)
                  </Button>
                  <Button 
                    onClick={() => {
                       handleStatusChange(selectedSubmission.id, 'rejected');
                       setSelectedSubmission(null);
                    }}
                    variant="outline"
                    className="flex-1 h-12 border-red-500 text-red-500 bg-transparent hover:bg-red-500 hover:text-black font-black uppercase text-[10px] tracking-widest rounded-[2px]"
                  >
                     Decline Build (Reject)
                  </Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

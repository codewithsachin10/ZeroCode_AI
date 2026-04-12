import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Search, 
  Loader2,
  Trash2,
  User,
  Clock,
  Filter,
  Bug,
  Lightbulb,
  MessageCircle,
  Hash
} from "lucide-react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this feedback permanently?")) return;
    try {
      await deleteDoc(doc(db, "feedback", id));
      toast.success("Feedback cleared");
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "bug": return <Bug size={14} className="text-red-500" />;
      case "feature": return <Lightbulb size={14} className="text-[#eab308]" />;
      case "content": return <MessageCircle size={14} className="text-primary" />;
      default: return <Hash size={14} className="text-text-muted" />;
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = f.message?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || f.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-sm font-black uppercase text-white tracking-widest leading-none mb-1">Feedback Intake</h2>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Listen to the academy community</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={14} />
          <input 
            placeholder="Search feedback messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-[#0B0B0B] border border-white/5 rounded-[2px] pl-10 pr-4 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all"
          />
        </div>
        <div className="flex bg-[#0B0B0B] border border-white/5 rounded-[2px] p-1">
          {["all", "general", "bug", "feature", "content"].map((t) => (
            <button 
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-[1px] transition-all ${filterType === t ? 'bg-primary text-black' : 'text-text-muted hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((f) => (
            <div key={f.id} className="p-6 bg-[#0B0B0B] border border-white/5 rounded-[2px] group relative hover:border-white/10 transition-all">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/[0.02] border border-white/5 rounded-[2px]">
                       {getIcon(f.type)}
                    </div>
                    <div>
                       <span className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-40 block mb-0.5">{f.type} REPORT</span>
                       <h3 className="text-[11px] font-black text-white uppercase tracking-tight italic">From: {f.userName}</h3>
                    </div>
                 </div>
                 <button onClick={() => handleDelete(f.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/5 rounded-[2px] transition-all">
                    <Trash2 size={14} />
                 </button>
              </div>

              <p className="text-sm font-medium text-text-secondary leading-loose italic opacity-80 mb-6 bg-white/[0.01] p-4 border-l-2 border-primary/20">
                 "{f.message}"
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-white/[0.02]">
                 <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">
                    <div className="flex items-center gap-1.5">
                       <User size={12} />
                       {f.userEmail}
                    </div>
                    <div className="flex items-center gap-1.5">
                       <Clock size={12} />
                       {f.createdAt ? format(f.createdAt.toDate(), "MMM dd, HH:mm") : 'Syncing...'}
                    </div>
                 </div>
              </div>
            </div>
          ))}

          {filteredFeedbacks.length === 0 && (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-[2px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-20 italic">No community feedback matching criteria found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

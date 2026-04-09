import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, Clock, Trash2, Mail, User, ShieldCheck } from "lucide-react";

type Feedback = {
  id: string;
  userId?: string;
  userEmail?: string;
  message: string;
  status: "pending" | "resolved";
  createdAt?: any;
};

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setFeedback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback)));
    } catch (error) {
      console.error("Error fetching feedback", error);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  const markResolved = async (id: string) => {
    try {
      await updateDoc(doc(db, "feedback", id), { status: "resolved" });
      setFeedback(feedback.map(f => f.id === id ? { ...f, status: "resolved" } : f));
      toast({ title: "Resolved", description: "Message marked as resolved." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this feedback?")) return;
    try {
      await deleteDoc(doc(db, "feedback", id));
      setFeedback(feedback.filter(f => f.id !== id));
      toast({ title: "Deleted", description: "Feedback removed from system." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const filteredFeedback = feedback.filter(f => {
    if (filter === "all") return true;
    return f.status === filter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">User Communication</h2>
          <p className="text-text-secondary text-sm">Review incoming feedback and resolve support requests.</p>
        </div>
        <div className="flex bg-surface border border-border p-1 rounded-xl">
          {(["all", "pending", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-muted text-sm italic">Loading your inbox...</p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="glass rounded-2xl p-20 text-center border-dashed border-border/60">
            <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
              <Mail className="text-text-muted opacity-40" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Clean Slate</h3>
            <p className="text-text-secondary max-w-xs mx-auto text-sm italic">
               {filter === 'all' ? "No feedback has been received yet." : `No messages match the "${filter}" filter.`}
            </p>
          </div>
        ) : (
          filteredFeedback.map(item => (
            <div key={item.id} className="glass rounded-2xl p-6 hover:bg-surface/30 transition-all border-border/40 group relative overflow-hidden">
              {/* Status strip */}
              <div 
                className={`absolute inset-y-0 left-0 w-1.5 ${item.status === 'resolved' ? 'bg-emerald-500/50' : 'bg-amber-500/50'}`}
              />
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-tighter uppercase flex items-center gap-1.5 border shadow-sm ${
                      item.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {item.status === 'resolved' ? <ShieldCheck size={12}/> : <Clock size={12}/>}
                      {item.status}
                    </span>
                    <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase">
                      {item.createdAt ? new Date(item.createdAt.toDate?.() || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'DATE_ERROR'}
                    </span>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface/50 border border-border text-[11px] text-text-secondary font-medium">
                      <User size={12} className="text-primary" />
                      {item.userEmail || "anonymous_user"}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <p className="text-base leading-relaxed text-foreground/90 font-medium italic pl-4 border-l-2 border-primary/20">
                      "{item.message}"
                    </p>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 self-end md:self-start opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.status === 'pending' && (
                    <button 
                      onClick={() => markResolved(item.id)}
                      className="flex-1 md:w-32 flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      <CheckCircle size={14} />
                      Resolve
                    </button>
                  )}
                  <button 
                    onClick={() => deleteFeedback(item.id)}
                    className="flex-1 md:w-32 flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-xl bg-surface border border-border text-text-muted font-bold hover:text-destructive hover:border-destructive/40 transition-all group/del"
                  >
                    <Trash2 size={14} className="group-hover/del:scale-110 transition-transform" />
                    Discard
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


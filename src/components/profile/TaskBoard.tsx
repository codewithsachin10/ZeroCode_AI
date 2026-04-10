import { useState, useEffect, memo, useMemo } from "react";
import { 
  Plus, Trash2, CheckCircle2, Circle, Search, Loader2, 
  Kanban, Check, MoreVertical, X, Target, ArrowRight,
  ShieldCheck, AlertCircle, Sparkles
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, doc, setDoc, 
  updateDoc, deleteDoc, serverTimestamp, orderBy, addDoc 
} from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useUser } from "@/context/UserContext";

const TaskBoard = () => {
  const { trackEvent } = useActivityTracker();
  const { tasks, projects, loading: userLoading } = useUser();
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const createTask = async () => {
    if (!auth.currentUser || !newTitle) return;
    try {
      const taskData = {
        userId: auth.currentUser.uid,
        title: newTitle,
        projectId: selectedProjectId || null,
        isCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, "tasks"), taskData);
      setShowNewModal(false);
      setNewTitle("");
      setSelectedProjectId("");
      toast.success("Task node initialized.");
    } catch (e) {
      toast.error("Initialization failure.");
    }
  };

  const toggleTask = async (task: any) => {
    try {
      const isFinishing = !task.isCompleted;
      await updateDoc(doc(db, "tasks", task.id), {
        isCompleted: isFinishing,
        updatedAt: serverTimestamp()
      });
      if (isFinishing) trackEvent("task_complete", { title: task.title });
    } catch (e) {
      toast.error("State sync failed.");
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, "tasks", id));
      toast.success("Task de-allocated.");
    } catch (e) {
      toast.error("De-allocation failure.");
    }
  };

  const filteredTasks = useMemo(() => {
    const term = search.toLowerCase();
    return tasks.filter(t => t.title.toLowerCase().includes(term));
  }, [tasks, search]);

  const pending = useMemo(() => filteredTasks.filter(t => !t.isCompleted), [filteredTasks]);
  const completed = useMemo(() => filteredTasks.filter(t => t.isCompleted), [filteredTasks]);

  if (userLoading) return (
     <div className="flex flex-col items-center justify-center p-32 min-h-[400px] gap-6">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse italic">Synchronizing Task Grid...</h2>
     </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
         <div className="relative flex-1 w-full max-w-xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Scan active task nodes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-[32px] h-20 pl-16 pr-10 text-xs font-black text-white outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-text-muted/30 italic shadow-2xl"
            />
         </div>
         <Button onClick={() => setShowNewModal(true)} className="h-20 px-12 rounded-[32px] bg-primary text-black font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_0_30px_rgba(34,197,94,0.1)] hover:scale-105 active:scale-95 transition-all gap-5">
            New Task Node <Plus size={20} strokeWidth={3} />
         </Button>
      </div>

      <div className="grid grid-cols-1 gap-12">
         <div className="space-y-10">
            <div className="flex items-center gap-6 px-4">
               <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-text-muted italic opacity-60">Active Operations ({pending.length})</h3>
               <div className="h-px flex-1 bg-white/5" />
            </div>
            
            <div className="space-y-4">
               {pending.length > 0 ? (
                  pending.map(task => {
                     const p = projects.find(proj => proj.id === task.projectId);
                     return (
                        <div key={task.id} className="p-10 bg-[#111] border border-white/5 rounded-[48px] flex items-center justify-between group hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-500 shadow-2xl relative overflow-hidden">
                           <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                           <div className="flex items-center gap-10 relative z-10">
                              <button onClick={() => toggleTask(task)} className="w-14 h-14 rounded-2xl border-2 border-white/5 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/40 transition-all active:scale-90 bg-black group-hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                 <Circle size={24} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                              </button>
                              <div className="space-y-2">
                                 <h4 className="text-2xl font-black tracking-tighter text-white group-hover:text-primary transition-colors uppercase italic">{task.title}</h4>
                                 <div className="flex items-center gap-4">
                                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] italic bg-primary/5 px-4 py-1 rounded-full border border-primary/20">
                                       Linked Node: {p?.title || "Global Vector"}
                                    </span>
                                 </div>
                              </div>
                           </div>
                           <button onClick={() => deleteTask(task.id)} className="w-12 h-12 flex items-center justify-center rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all active:scale-90 border border-transparent hover:border-red-500/20"><Trash2 size={18} /></button>
                        </div>
                     );
                  })
               ) : (
                  <div className="py-40 text-center bg-[#111]/30 border-2 border-dashed border-white/5 rounded-[64px] flex flex-col items-center justify-center space-y-8 animate-pulse">
                     <CheckCircle2 size={48} className="text-primary opacity-20" />
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted italic opacity-40">No pending task nodes detected in current mesh.</p>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted opacity-40">No pending task nodes detected in current mesh.</p>
                     <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted italic opacity-40">No pending task nodes detected in current mesh.</p>
                  </div>
               )}
            </div>
         </div>

         {completed.length > 0 && (
            <div className="pt-20 space-y-8">
               <div className="flex items-center gap-6 px-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/40">Operation Logs ({completed.length})</h3>
                  <div className="h-px flex-1 bg-primary/5" />
               </div>
               <div className="grid lg:grid-cols-2 gap-4">
                  {completed.slice(0, 8).map(task => (
                     <div key={task.id} className="p-6 bg-white/[0.01] border border-white/5 rounded-[32px] flex items-center justify-between opacity-40 hover:opacity-100 transition-all hover:bg-primary/[0.03] hover:border-primary/10 group">
                        <div className="flex items-center gap-6">
                           <button onClick={() => toggleTask(task)} className="text-primary hover:text-white transition-all scale-110">
                              <CheckCircle2 size={24} strokeWidth={3} />
                           </button>
                           <div>
                              <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Status: Concluded</p>
                           </div>
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="p-3 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </div>

      {showNewModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="bg-[#0B0B0B] border border-white/10 rounded-[64px] p-16 max-w-2xl w-full shadow-2xl relative overflow-hidden">
               <div className="absolute top-10 right-10">
                  <button onClick={() => setShowNewModal(false)} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors">✕</button>
               </div>
               
               <h3 className="text-4xl font-black uppercase tracking-tighter text-white mb-2 italic underline decoration-primary decoration-4 underline-offset-8">New Task Vector</h3>
               <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-12 italic opacity-60">Define the next atomic objective for your production mesh.</p>
               
               <div className="space-y-10">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-6 block">Target Objective</label>
                     <input 
                       autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                       className="w-full bg-[#111] border border-white/10 rounded-2xl h-16 px-10 text-xs font-black text-white focus:border-primary/40 outline-none transition-all shadow-inner font-mono"
                       placeholder="e.g. Optimize_Search_Nodes"
                     />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-6 flex items-center gap-3 italic">
                        <Kanban size={14} className="text-primary" /> Associated Production Node
                     </label>
                     <select 
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-2xl h-16 px-10 text-xs font-black text-white focus:border-primary/40 outline-none transition-all appearance-none cursor-pointer italic"
                     >
                        <option value="" className="bg-[#0B0B0B]">Global Vector (Standalone)</option>
                        {projects.map(p => <option key={p.id} value={p.id} className="bg-[#0B0B0B]">{p.title}</option>)}
                     </select>
                  </div>
               </div>

               <div className="flex gap-6 mt-16">
                  <Button onClick={() => setShowNewModal(false)} className="flex-1 h-20 rounded-[32px] bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary hover:text-white">Abandone Vector</Button>
                  <Button onClick={createTask} className="flex-1 h-20 rounded-[32px] bg-primary text-black font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Initialize Task Node</Button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default memo(TaskBoard);

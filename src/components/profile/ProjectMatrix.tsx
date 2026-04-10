import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { 
  Plus, Search, Trash2, LayoutGrid, CheckCircle2, Clock, 
  Loader2, AlertCircle, TrendingUp, MoreVertical, ChevronRight,
  Zap, Box, Save, Copy, Layers, FileBox
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, addDoc, updateDoc, 
  doc, deleteDoc, serverTimestamp, orderBy, onSnapshot
} from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useUser } from "@/context/UserContext";

type ProjectStage = { id: string; label: string; isCompleted: boolean; };
type Project = { id: string; title: string; description: string; status: "active" | "completed" | "on-deck"; progressPercent: number; stages: ProjectStage[]; userId: string; updatedAt: any; };
type Template = { id: string; title: string; description: string; stages: ProjectStage[]; };

const DEFAULT_STAGES = [
  { id: "1", label: "Idea Validation", isCompleted: false },
  { id: "2", label: "Prompt Architecture", isCompleted: false },
  { id: "3", label: "UI Geometry", isCompleted: false },
  { id: "4", label: "Backend Core", isCompleted: false },
  { id: "5", label: "Edge Auth", isCompleted: false },
  { id: "6", label: "API Mesh", isCompleted: false },
  { id: "7", label: "System Sync", isCompleted: false },
  { id: "8", label: "Final Polish", isCompleted: false },
];

const ProjectMatrix = () => {
  const { trackEvent } = useActivityTracker();
  const { projects, loading: userLoading } = useUser();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(query(collection(db, "project_templates"), where("userId", "==", auth.currentUser.uid)), (snap) => {
       setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as Template)));
       setLoadingTemplates(false);
    });
    return () => unsub();
  }, []);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !auth.currentUser) return;

    try {
      let projectStages = DEFAULT_STAGES;
      if (selectedTemplateId) {
        const template = templates.find(t => t.id === selectedTemplateId);
        if (template) projectStages = template.stages.map(s => ({ ...s, isCompleted: false }));
      }

      await addDoc(collection(db, "projects"), {
        userId: auth.currentUser.uid,
        title: newTitle,
        description: newDesc,
        status: "active",
        progressPercent: 0,
        stages: projectStages,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      trackEvent("project_create", { title: newTitle });
      setShowNewModal(false);
      setNewTitle("");
      setNewDesc("");
      setSelectedTemplateId(null);
      toast.success("Execution Node Spawned.");
    } catch (e) {
      toast.error("Initialization failure.");
    }
  };

  const toggleStage = async (project: Project, stageId: string) => {
    const updatedStages = project.stages.map(s => s.id === stageId ? { ...s, isCompleted: !s.isCompleted } : s);
    const completedCount = updatedStages.filter(s => s.isCompleted).length;
    const progressPercent = Math.round((completedCount / updatedStages.length) * 100);
    
    try {
      await updateDoc(doc(db, "projects", project.id), {
        stages: updatedStages,
        progressPercent,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      toast.error("Critical State Sync Failure.");
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("De-allocate this project node? All stage data will be erased.")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      toast.success("Execution node de-allocated.");
    } catch (e) {
      toast.error("De-allocation failed.");
    }
  };

  if (userLoading) return (
    <div className="flex flex-col items-center justify-center h-[500px] gap-6">
       <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
       <p className="text-xs font-black uppercase tracking-[0.2em] text-primary italic animate-pulse">Syncing Build Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
         <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Intelligence Repository</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight uppercase text-white leading-none">Project <span className="text-primary opacity-90">Matrix</span></h1>
            <p className="text-text-muted font-medium text-xs opacity-50">Architect and deploy your high-velocity production nodes.</p>
         </div>
         <Button onClick={() => setShowNewModal(true)} className="h-20 px-12 rounded-[32px] bg-primary text-black font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-5">
            <Plus size={20} strokeWidth={3} /> Initialize Build Node
         </Button>
      </div>

      {projects.length > 0 ? (
         <div className="grid lg:grid-cols-2 gap-10">
            {projects.map(project => (
               <div key={project.id} className="p-10 bg-[#111] border border-white/10 rounded-[56px] hover:border-primary/20 transition-all duration-500 group shadow-2xl flex flex-col min-h-[600px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-10 relative z-10">
                     <div className="space-y-12">
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary italic">Node: {project.id.slice(0, 8)}</span>
                           </div>
                           <h3 className="text-5xl font-black tracking-tight text-white group-hover:text-primary transition-colors uppercase italic leading-none">{project.title}</h3>
                        </div>
                        <p className="text-xs text-text-muted font-black uppercase tracking-[0.2em] italic opacity-40 line-clamp-2">{project.description || "Deploying production logic..."}</p>
                     </div>
                     <div className="flex gap-3">
                        <button onClick={() => deleteProject(project.id)} className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center active:scale-90" title="Retract Node"><Trash2 size={18} /></button>
                     </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-4 mb-8 relative z-10">
                     {project.stages.map(stage => (
                        <button 
                           key={stage.id}
                           onClick={() => toggleStage(project, stage.id)}
                           className={`p-6 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between h-32 group/stage relative overflow-hidden ${
                              stage.isCompleted 
                               ? 'bg-primary/20 border-primary/40 text-primary shadow-xl shadow-primary/5' 
                               : 'bg-black/60 border-white/5 text-text-muted hover:border-white/20'
                           }`}
                        >
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] italic pr-4">{stage.label}</span>
                           <div className="flex justify-between items-center w-full">
                              {stage.isCompleted ? <CheckCircle2 size={24} strokeWidth={3} className="animate-in zoom-in duration-300" /> : <div className="w-6 h-6 rounded-xl border-2 border-white/10 transition-all group-hover/stage:border-primary/40" />}
                           </div>
                        </button>
                     ))}
                  </div>

                  <div className="pt-10 border-t border-white/5 flex items-center justify-between mt-auto relative z-10">
                     <div className="flex items-center gap-8">
                        <div className="space-y-1">
                           <span className="text-[9px] font-black uppercase tracking-widest text-text-muted italic opacity-40">Velocity Mesh</span>
                           <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-black text-white italic tracking-tighter">{project.progressPercent}%</span>
                              <span className="text-[10px] font-black text-primary uppercase italic">SYNCED</span>
                           </div>
                        </div>
                        <div className="h-12 w-px bg-white/5" />
                        <div className="space-y-1">
                           <span className="text-[9px] font-black uppercase tracking-widest text-text-muted italic opacity-40">Grid Status</span>
                           <div className={`px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest italic ${project.progressPercent === 100 ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-white'}`}>
                              {project.progressPercent === 100 ? "PROD READY" : "IN BUILD"}
                           </div>
                        </div>
                     </div>
                     <TrendingUp size={32} className="text-primary opacity-20 animate-pulse" />
                  </div>
               </div>
            ))}
         </div>
      ) : (
         <div className="py-48 text-center bg-[#111] border-2 border-dashed border-white/5 rounded-[64px] flex flex-col items-center justify-center space-y-8 animate-pulse">
            <div className="w-24 h-24 rounded-[40px] bg-white/5 flex items-center justify-center text-text-muted border border-white/10">
               <Box size={48} strokeWidth={1} />
            </div>
            <div>
               <h3 className="text-3xl font-black uppercase tracking-tighter text-white italic">Zero Active Handshakes</h3>
               <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] italic mt-4 opacity-40">Establish your production protocol by spawning a project node.</p>
            </div>
            <Button onClick={() => setShowNewModal(true)} className="h-16 px-10 bg-primary/10 border border-primary/40 text-primary font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-primary hover:text-black transition-all">Initialize Matrix</Button>
         </div>
      )}

      {showNewModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="bg-[#0B0B0B] border border-white/10 rounded-[64px] p-16 max-w-2xl w-full shadow-2xl relative overflow-hidden">
               <div className="absolute top-10 right-10">
                  <button onClick={() => setShowNewModal(false)} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white transition-all active:scale-90">✕</button>
               </div>
               
               <h3 className="text-4xl font-black uppercase tracking-tighter text-white mb-2 italic underline decoration-primary decoration-4 underline-offset-8">Initialize Node</h3>
               <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-12 italic opacity-60">Define the core parameters for the execution matrix.</p>
               
               <form onSubmit={createProject} className="space-y-10">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-6 block">Node Identifier (Title)</label>
                     <input 
                       autoFocus required type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                       placeholder="e.g. Master_Sync_Engine"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-10 text-xs font-black text-white focus:border-primary/40 outline-none transition-all shadow-inner font-mono"
                     />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-6 block">Mission Protocol (Description)</label>
                     <textarea 
                       required value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                       placeholder="Define the node's function trajectory..."
                       className="w-full bg-white/5 border border-white/10 rounded-3xl p-10 h-32 text-xs font-black text-white focus:border-primary/40 outline-none transition-all resize-none shadow-inner italic"
                     />
                  </div>

                  {templates.length > 0 && (
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-6 flex items-center gap-3 italic">
                          <Layers size={14} className="text-primary" /> Structure Loop (Template)
                       </label>
                       <select 
                         value={selectedTemplateId || ""} onChange={(e) => setSelectedTemplateId(e.target.value || null)}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 px-10 text-xs font-black text-white focus:border-primary/40 outline-none transition-all appearance-none cursor-pointer italic"
                       >
                          <option value="" className="bg-[#0B0B0B]">Default VibeCode Protocol</option>
                          {templates.map(t => <option key={t.id} value={t.id} className="bg-[#0B0B0B]">{t.title}</option>)}
                       </select>
                    </div>
                  )}

                  <div className="flex gap-6 pt-10">
                     <Button type="button" onClick={() => setShowNewModal(false)} className="flex-1 h-20 rounded-[32px] bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary hover:text-white transition-all">Abandone</Button>
                     <Button type="submit" className="flex-1 h-20 rounded-[32px] bg-primary text-black font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-primary/20 transition-all hover:rotate-2 hover:scale-105 active:scale-95">Initialize Node</Button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default memo(ProjectMatrix);

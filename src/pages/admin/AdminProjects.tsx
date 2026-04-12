import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2,
  X,
  Code2,
  Terminal,
  Zap,
  Eye,
  EyeOff,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Cpu,
  BarChart3
} from "lucide-react";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  getCountFromServer
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    instructions: "",
    techStack: "",
    image: "",
    exampleOutput: "",
    isPublished: false
  });

  useEffect(() => {
    const unsubProjects = onSnapshot(query(collection(db, "projects"), orderBy("createdAt", "desc")), async (snap) => {
      const projs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProjects(projs);
      
      // Fetch basic analytics for each project
      const stats: Record<string, any> = {};
      for (const p of projs) {
        const startedQ = query(collection(db, "user_projects"), where("projectId", "==", p.id));
        const completedQ = query(collection(db, "user_projects"), where("projectId", "==", p.id), where("status", "==", "completed"));
        
        const [startedSnap, completedSnap] = await Promise.all([
          getCountFromServer(startedQ),
          getCountFromServer(completedQ)
        ]);
        
        stats[p.id] = {
          started: startedSnap.data().count,
          completed: completedSnap.data().count
        };
      }
      setAnalytics(stats);
      setLoading(false);
    });

    return () => unsubProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required");

    try {
      const payload = { ...formData, updatedAt: serverTimestamp() };
      if (editingId) {
        await updateDoc(doc(db, "projects", editingId), payload);
        toast.success("Project updated");
      } else {
        await addDoc(collection(db, "projects"), { ...payload, createdAt: serverTimestamp() });
        toast.success("Project deployed");
      }
      resetForm();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const togglePublish = async (id: string, currentState: boolean) => {
    try {
      await updateDoc(doc(db, "projects", id), { isPublished: !currentState });
      toast.success(!currentState ? "Project Published" : "Project Offline");
    } catch (err) {
      toast.error("Process failed");
    }
  };

  const handleEdit = (project: any) => {
    setFormData({
      title: project.title,
      description: project.description || "",
      difficulty: project.difficulty || "Easy",
      instructions: project.instructions || "",
      techStack: project.techStack || "",
      image: project.image || "",
      exampleOutput: project.exampleOutput || "",
      isPublished: project.isPublished || false
    });
    setEditingId(project.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Decommission this project module?")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      toast.success("Project offline");
    } catch (err) {
      toast.error("Process failed");
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", difficulty: "Easy", instructions: "", techStack: "", image: "", exampleOutput: "", isPublished: false });
    setEditingId(null);
    setShowModal(false);
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase text-white tracking-widest leading-none mb-1">Engineering Projects</h2>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Manage high-fidelity academy builds</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-[2px]"
        >
          <Plus size={14} className="mr-2" /> Add Project
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={14} />
        <input 
          placeholder="Filter engineering builds..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 bg-[#0B0B0B] border border-white/5 rounded-[2px] pl-10 pr-4 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all placeholder:opacity-30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map(project => (
            <div key={project.id} className="group p-6 bg-[#0B0B0B] border border-white/5 rounded-[2px] hover:border-primary/20 transition-all shadow-2xl relative">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[2px] border mb-2 inline-block ${
                      project.difficulty === 'Hard' ? 'bg-[#ef4444]/10 border-[#ef4444]/20 text-[#ef4444]' : 
                      project.difficulty === 'Medium' ? 'bg-[#eab308]/10 border-[#eab308]/20 text-[#eab308]' :
                      'bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e]'
                    }`}>
                      {project.difficulty}
                    </span>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{project.title}</h3>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => togglePublish(project.id, project.isPublished)}
                      className={`p-1.5 rounded-[2px] border ${project.isPublished ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/5 text-text-muted'}`}
                    >
                      {project.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button onClick={() => handleEdit(project)} className="p-1.5 rounded-[2px] border border-white/5 text-text-muted hover:text-white transition-colors">
                       <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(project.id)} className="p-1.5 rounded-[2px] border border-white/5 text-text-muted hover:text-red-500 transition-colors">
                       <Trash2 size={12} />
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="p-3 bg-white/[0.02] border border-white/5 rounded-[2px]">
                    <p className="text-[8px] font-black text-text-muted uppercase mb-1">Started</p>
                    <p className="text-sm font-black text-white">{analytics[project.id]?.started || 0}</p>
                 </div>
                 <div className="p-3 bg-white/[0.02] border border-white/5 rounded-[2px]">
                    <p className="text-[8px] font-black text-text-muted uppercase mb-1">Completed</p>
                    <p className="text-sm font-black text-white">{analytics[project.id]?.completed || 0}</p>
                 </div>
                 <div className="p-3 bg-white/[0.02] border border-white/5 rounded-[2px]">
                    <p className="text-[8px] font-black text-text-muted uppercase mb-1">Success Rate</p>
                    <p className="text-sm font-black text-primary">
                      {analytics[project.id]?.started > 0 ? Math.round((analytics[project.id]?.completed / analytics[project.id]?.started) * 100) : 0}%
                    </p>
                 </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/[0.02] text-text-muted">
                 <div className="flex items-center gap-1.5">
                    <Code2 size={12} className="opacity-40" />
                    <span className="text-[9px] font-black uppercase truncate max-w-[150px]">{project.techStack || 'No Stack'}</span>
                 </div>
                 {project.exampleOutput && (
                    <div className="flex items-center gap-1.5">
                       <ExternalLink size={12} className="text-primary" />
                       <span className="text-[9px] font-black uppercase text-primary">Demo Active</span>
                    </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0B0B0B] border border-white/5 rounded-[2px] shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">{editingId ? 'Modify Project' : 'Deploy New Project'}</h3>
              <button onClick={resetForm} className="text-text-muted hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Build Title</label>
                    <input 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. Link Shortener SaaS"
                      className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Difficulty Rank</label>
                    <select 
                      value={formData.difficulty}
                      onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                      className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-xs font-bold text-white/60 focus:border-primary/20 outline-none"
                    >
                      <option value="Easy" className="bg-black">Easy</option>
                      <option value="Medium" className="bg-black">Medium</option>
                      <option value="Hard" className="bg-black">Hard</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Simple Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Make long web links short and easy to share..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/5 rounded-[2px] p-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Steps to Build</label>
                <textarea 
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  placeholder="1. Setup React... 2. Add API URL..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/5 rounded-[2px] p-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all resize-none"
                />
              </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Tech Stack</label>
                    <input 
                      value={formData.techStack}
                      onChange={(e) => setFormData({...formData, techStack: e.target.value})}
                      placeholder="React, Firebase, Tailwind"
                      className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Example Output (Image/Demo URL)</label>
                    <input 
                      value={formData.exampleOutput}
                      onChange={(e) => setFormData({...formData, exampleOutput: e.target.value})}
                      placeholder="https://demo.vercel.app"
                      className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all"
                    />
                  </div>
               </div>

               <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                    className="w-4 h-4 rounded-[2px] bg-white/5 border border-white/5 accent-primary"
                  />
                  <label htmlFor="isPublished" className="text-[9px] font-black uppercase tracking-widest text-text-muted">Publish Build to Hub</label>
               </div>

              <Button type="submit" className="w-full h-11 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-[2px]">
                {editingId ? 'Execute Update' : 'Initialize Engineering Build'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

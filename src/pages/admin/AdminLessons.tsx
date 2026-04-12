import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2,
  X,
  Play,
  PlusCircle,
  MinusCircle
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
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminLessons() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    moduleId: "",
    videoUrl: "",
    animationData: "", // JSON string or simple text
    shortNote: "",
    keyPoints: [""] as string[],
    miniTask: ""
  });

  useEffect(() => {
    const unsubModules = onSnapshot(collection(db, "modules"), (snap) => {
      setModules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubLessons = onSnapshot(query(collection(db, "lessons"), orderBy("createdAt", "desc")), (snap) => {
      setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubModules();
      unsubLessons();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.moduleId) return toast.error("Title and Module are required");

    try {
      const payload = {
        ...formData,
        keyPoints: formData.keyPoints.filter(p => p.trim() !== ""),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "lessons", editingId), payload);
        toast.success("Lesson updated");
      } else {
        await addDoc(collection(db, "lessons"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        toast.success("Lesson deployed");
      }
      resetForm();
    } catch (err) {
      toast.error("Failed to save lesson");
    }
  };

  const handleEdit = (lesson: any) => {
    setFormData({
      title: lesson.title,
      moduleId: lesson.moduleId,
      videoUrl: lesson.videoUrl || "",
      animationData: lesson.animationData || "",
      shortNote: lesson.shortNote || "",
      keyPoints: lesson.keyPoints && lesson.keyPoints.length > 0 ? lesson.keyPoints : [""],
      miniTask: lesson.miniTask || ""
    });
    setEditingId(lesson.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await deleteDoc(doc(db, "lessons", id));
      toast.success("Lesson deleted");
    } catch (err) {
      toast.error("Failed to delete lesson");
    }
  };

  const resetForm = () => {
    setFormData({ 
      title: "", 
      moduleId: "", 
      videoUrl: "", 
      animationData: "", 
      shortNote: "", 
      keyPoints: [""], 
      miniTask: "" 
    });
    setEditingId(null);
    setShowModal(false);
  };

  const addKeyPoint = () => setFormData({...formData, keyPoints: [...formData.keyPoints, ""]});
  const removeKeyPoint = (idx: number) => setFormData({...formData, keyPoints: formData.keyPoints.filter((_, i) => i !== idx)});
  const updateKeyPoint = (idx: number, val: string) => {
    const newPoints = [...formData.keyPoints];
    newPoints[idx] = val;
    setFormData({...formData, keyPoints: newPoints});
  };

  const filteredLessons = lessons.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modules.find(m => m.id === l.moduleId)?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase text-white tracking-widest leading-none mb-1">Lesson Studio</h2>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Deploy precision technical content</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-[2px]"
        >
          <Plus size={14} className="mr-2" /> Add Lesson
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
        <input 
          placeholder="Search lessons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 bg-[#0B0B0B] border border-white/5 rounded-[2px] pl-10 pr-4 text-xs font-medium text-white focus:border-primary/20 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <div className="bg-[#0B0B0B] border border-white/5 rounded-[2px] overflow-hidden shadow-2xl overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Lesson Hub</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Module Association</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Assets</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map(lesson => (
                <tr key={lesson.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[2px] bg-white/5 border border-white/5 flex items-center justify-center text-primary">
                        <Play size={12} />
                      </div>
                      <span className="text-sm font-bold text-white">{lesson.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase bg-white/5 px-2 py-1 rounded-[2px] text-text-muted tracking-widest">
                      {modules.find(m => m.id === lesson.moduleId)?.title || "Detached"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       <div className={`w-3 h-3 rounded-full ${lesson.videoUrl ? 'bg-primary' : 'bg-white/5'}`} title="Video Asset" />
                       <div className={`w-3 h-3 rounded-full ${lesson.animationData ? 'bg-purple-400' : 'bg-white/5'}`} title="Animation Logic" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleEdit(lesson)} className="p-2 text-text-muted hover:text-white transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(lesson.id)} className="p-2 text-text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLessons.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">
                    Nexus database empty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0B0B0B] border border-white/10 rounded-[2px] shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">{editingId ? 'Edit Performance Node' : 'Deploy Performance Node'}</h3>
              <button onClick={resetForm} className="text-text-muted hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Lesson Title</label>
                    <input 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. Asynchronous Request Flow"
                      className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Target Module</label>
                    <select 
                      value={formData.moduleId}
                      onChange={(e) => setFormData({...formData, moduleId: e.target.value})}
                      className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-xs font-bold text-white/60 focus:border-primary/20 outline-none transition-all"
                    >
                      <option value="" className="bg-black">Select Module</option>
                      {modules.map(m => <option key={m.id} value={m.id} className="bg-black">{m.title}</option>)}
                    </select>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">YouTube Video ID/URL</label>
                    <input 
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                      placeholder="e.g. dQw4w9WgXcQ"
                      className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Animation Logic (JSON)</label>
                    <input 
                      value={formData.animationData}
                      onChange={(e) => setFormData({...formData, animationData: e.target.value})}
                      placeholder='{ "type": "flow", "steps": [...] }'
                      className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all"
                    />
                  </div>
               </div>

               <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Executive Summary (Short Note)</label>
                <textarea 
                  value={formData.shortNote}
                  onChange={(e) => setFormData({...formData, shortNote: e.target.value})}
                  placeholder="High-level overview of the lesson..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/5 rounded-[2px] p-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Key Learning Nodes (Key Points)</label>
                    <button type="button" onClick={addKeyPoint} className="text-primary hover:opacity-80 transition-all">
                       <PlusCircle size={16} />
                    </button>
                 </div>
                 <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar pr-2">
                    {formData.keyPoints.map((pt, idx) => (
                       <div key={idx} className="flex gap-2">
                          <input 
                            value={pt}
                            onChange={(e) => updateKeyPoint(idx, e.target.value)}
                            placeholder={`Learning objective #${idx+1}`}
                            className="flex-1 h-9 bg-white/5 border border-white/5 rounded-[2px] px-3 text-[10px] font-bold text-white focus:border-primary/10 outline-none"
                          />
                          <button type="button" onClick={() => removeKeyPoint(idx)} className="text-red-500/40 hover:text-red-500 transition-colors">
                             <MinusCircle size={16} />
                          </button>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Capstone MiniTask</label>
                <input 
                  value={formData.miniTask}
                  onChange={(e) => setFormData({...formData, miniTask: e.target.value})}
                  placeholder="e.g. Build a basic fetch loop"
                  className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all"
                />
              </div>

              <Button type="submit" className="w-full h-11 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-[2px]">
                {editingId ? 'Finalize Synchronization' : 'Commit Lesson'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

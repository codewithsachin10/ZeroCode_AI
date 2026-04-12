import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2,
  X,
  Layers
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

export default function AdminModules() {
  const [modules, setModules] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    courseId: "",
    order: 1,
    description: ""
  });

  useEffect(() => {
    // Sync Courses for selection
    const unsubCourses = onSnapshot(collection(db, "courses"), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubModules = onSnapshot(query(collection(db, "modules"), orderBy("order", "asc")), (snap) => {
      setModules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubCourses();
      unsubModules();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.courseId) return toast.error("Title and Course are required");

    try {
      if (editingId) {
        await updateDoc(doc(db, "modules", editingId), {
          ...formData,
          order: Number(formData.order),
          updatedAt: serverTimestamp()
        });
        toast.success("Module updated");
      } else {
        await addDoc(collection(db, "modules"), {
          ...formData,
          order: Number(formData.order),
          createdAt: serverTimestamp()
        });
        toast.success("Module created");
      }
      resetForm();
    } catch (err) {
      toast.error("Failed to save module");
    }
  };

  const handleEdit = (mod: any) => {
    setFormData({
      title: mod.title,
      courseId: mod.courseId,
      order: mod.order || 1,
      description: mod.description || ""
    });
    setEditingId(mod.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this module?")) return;
    try {
      await deleteDoc(doc(db, "modules", id));
      toast.success("Module deleted");
    } catch (err) {
      toast.error("Failed to delete module");
    }
  };

  const resetForm = () => {
    setFormData({ title: "", courseId: "", order: modules.length + 1, description: "" });
    setEditingId(null);
    setShowModal(false);
  };

  const filteredModules = modules.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    courses.find(c => c.id === m.courseId)?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase text-white tracking-widest leading-none mb-1">Module Architecture</h2>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Organize lessons into logical blocks</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-[2px]"
        >
          <Plus size={14} className="mr-2" /> Add Module
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
        <input 
          placeholder="Search modules..."
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
        <div className="bg-[#0B0B0B] border border-white/5 rounded-[2px] overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted w-16">Seq</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Module Title</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Parent Course</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredModules.map(mod => (
                <tr key={mod.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all group">
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-primary opacity-60">#{mod.order}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[2px] bg-white/5 border border-white/5 flex items-center justify-center text-text-muted">
                        <Layers size={14} />
                      </div>
                      <span className="text-sm font-bold text-white">{mod.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase bg-white/5 px-2 py-1 rounded-[2px] text-text-muted tracking-widest">
                      {courses.find(c => c.id === mod.courseId)?.title || "Unknown Course"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleEdit(mod)} className="p-2 text-text-muted hover:text-white transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(mod.id)} className="p-2 text-text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredModules.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">
                    No modules deployed
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0B0B0B] border border-white/10 rounded-[2px] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">{editingId ? 'Update Module' : 'Deploy Module'}</h3>
              <button onClick={resetForm} className="text-text-muted hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Module Title</label>
                <input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Introduction to Neural Nets"
                  className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-sm text-white focus:border-primary/20 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Parent Course</label>
                  <select 
                    value={formData.courseId}
                    onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                    className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-sm text-white/60 focus:border-primary/20 outline-none transition-all"
                  >
                    <option value="" className="bg-black">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id} className="bg-black">{c.title}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Order Seq</label>
                  <input 
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: Number(e.target.value)})}
                    className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-sm text-white focus:border-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Module objectives..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/5 rounded-[2px] p-3 text-sm text-white focus:border-primary/20 outline-none transition-all resize-none"
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-[2px]">
                {editingId ? 'Apply Deployment' : 'Launch Module'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

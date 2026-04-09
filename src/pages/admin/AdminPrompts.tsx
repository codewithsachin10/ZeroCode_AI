import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, X, Copy, Check, Loader2, Library, BookOpen, Clock, AlertCircle } from "lucide-react";
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";

type Prompt = {
  id: string;
  title: string;
  categoryId: string;
  category?: string;
  description: string;
  content: string;
  difficulty: "Beginner" | "Pro";
  rolePack?: "frontend" | "backend" | "testing" | "uiux" | "general";
  version?: number;
  changelog?: string[];
  likesCount?: number;
  copySuccessCount?: number;
  createdAt?: any;
};

type Category = {
  id: string;
  name: string;
};

// Optimized Table Row Component
const PromptRow = memo(({ prompt, categoryName, onEdit, onDelete, onCopy, copiedId }: any) => (
  <tr key={prompt.id} className="group hover:bg-white/[0.02] transition-colors border-b border-white/5">
    <td className="px-6 py-3">
      <div className="font-bold text-white text-xs">{prompt.title}</div>
      <div className="text-[10px] text-text-muted mt-0.5 line-clamp-1 max-w-sm">{prompt.description}</div>
    </td>
    <td className="px-6 py-3">
      <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">
        {categoryName}
      </span>
    </td>
    <td className="px-6 py-3">
      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
        prompt.difficulty === "Pro" 
          ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
          : "bg-primary/10 text-primary border-primary/20"
      }`}>
        {prompt.difficulty}
      </span>
    </td>
    <td className="px-6 py-3">
      <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
        {prompt.rolePack || "general"}
      </span>
      <div className="text-[9px] text-text-muted mt-1">v{prompt.version || 1}</div>
    </td>
    <td className="px-6 py-3 text-right">
      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button 
          title="Copy"
          onClick={() => onCopy(prompt.content, prompt.id)}
          className="p-1.5 text-text-muted hover:text-white transition-colors"
        >
          {copiedId === prompt.id ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
        </button>
        <button 
          title="Edit"
          onClick={() => onEdit(prompt)}
          className="p-1.5 text-text-muted hover:text-primary transition-colors"
        >
          <Edit2 size={14} />
        </button>
        <button 
          title="Delete"
          onClick={() => onDelete(prompt.id)}
          className="p-1.5 text-text-muted hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </td>
  </tr>
));

export default function AdminPrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Partial<Prompt>>({ difficulty: "Beginner", rolePack: "general", version: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Parallel Load
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pSnap, cSnap] = await Promise.all([
          getDocs(query(collection(db, "prompts"), orderBy("createdAt", "desc"))),
          getDocs(query(collection(db, "categories"), orderBy("name", "asc")))
        ]);
        setPrompts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt)));
        setCategories(cSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      } catch (error) {
        console.error("Cloud Sync Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenModal = useCallback((prompt?: Prompt) => {
    if (prompt) {
      setCurrentPrompt(prompt);
    } else {
      setCurrentPrompt({ difficulty: "Beginner", rolePack: "general", version: 1, title: "", categoryId: categories[0]?.id || "", description: "", content: "", changelog: [] });
    }
    setIsModalOpen(true);
  }, [categories]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentPrompt({});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPrompt.title || !currentPrompt.content) {
      toast({ title: "Validation Protocol Alert", description: "Title and content nodes required.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const data: any = {
        title: currentPrompt.title,
        categoryId: currentPrompt.categoryId || "",
        category: getCategoryName(currentPrompt.categoryId || ""),
        description: currentPrompt.description || "",
        content: currentPrompt.content,
        difficulty: currentPrompt.difficulty || "Beginner",
        rolePack: currentPrompt.rolePack || "general",
        version: Number(currentPrompt.version || 1),
        changelog: Array.isArray(currentPrompt.changelog) ? currentPrompt.changelog : [],
        updatedAt: serverTimestamp(),
      };

      if (currentPrompt.id) {
        await updateDoc(doc(db, "prompts", currentPrompt.id), data);
        toast({ title: "Success", description: "Intelligence Node Updated" });
      } else {
        const docRef = await addDoc(collection(db, "prompts"), {
          ...data,
          likesCount: 0,
          copySuccessCount: 0,
          usageCount: 0,
          createdAt: serverTimestamp(),
        });
        // Optimistic UI update
        const newPrompt = { id: docRef.id, ...data, createdAt: new Date() } as Prompt;
        setPrompts(prev => [newPrompt, ...prev]);
        toast({ title: "Success", description: "Intelligence Node Deployed" });
      }
      setIsModalOpen(false);
      setCurrentPrompt({});
    } catch (error) {
      toast({ title: "Error", description: "Node Propagation Failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to purge this intelligence node?")) return;
    try {
      await deleteDoc(doc(db, "prompts", id));
      toast({ title: "Success", description: "Node Purged" });
      setPrompts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      toast({ title: "Error", description: "Purge Protocol Failed", variant: "destructive" });
    }
  }, [toast]);

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied", description: "Mesh Source Synchronized" });
  }, [toast]);

  const filteredPrompts = useMemo(() => 
    prompts.filter(p => 
      p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
      p.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [prompts, debouncedSearch]
  );

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || "External Node";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase text-white">Prompts</h2>
          <p className="text-xs text-text-muted font-medium">Manage the global prompt library.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-black px-6 h-10 rounded-lg font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all"
        >
          <PlusCircle className="w-4 h-4" /> New Prompt
        </button>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full sm:max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <input 
              type="text" 
              placeholder="Search prompts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs font-medium text-white outline-none focus:border-primary/40 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-black/40 border border-white/10">
             <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Count: {filteredPrompts.length}</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">Pack/Version</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                       <div className="h-8 w-full skeleton" />
                    </td>
                  </tr>
                ))
              ) : filteredPrompts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <AlertCircle size={32} />
                      <p className="text-xs font-bold uppercase tracking-widest">No prompts found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPrompts.map((prompt) => (
                  <PromptRow 
                    key={prompt.id}
                    prompt={prompt}
                    categoryName={getCategoryName(prompt.categoryId)}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                    onCopy={copyToClipboard}
                    copiedId={copiedId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optimized Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80">
          <div className="bg-[#0B0B0B] border border-white/10 w-full max-w-2xl rounded-xl flex flex-col max-h-[90vh] overflow-hidden relative">
            <div className="absolute top-6 right-6 z-10">
               <button onClick={handleCloseModal} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white transition-all">
                 <X size={16} />
               </button>
            </div>

            <div className="p-6 border-b border-white/5">
                <h3 className="text-lg font-bold uppercase">{currentPrompt.id ? "Edit Prompt" : "New Prompt"}</h3>
                <p className="text-xs text-text-muted font-medium mt-1">Configure the prompt details.</p>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Title</label>
                <input 
                  required
                  type="text" 
                  value={currentPrompt.title || ""}
                  onChange={(e) => setCurrentPrompt({...currentPrompt, title: e.target.value})}
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-4 text-xs font-bold text-white outline-none focus:border-primary/40 transition-all"
                  placeholder="e.g. Master Intelligence"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Category</label>
                  <select 
                    value={currentPrompt.categoryId || ""}
                    onChange={(e) => setCurrentPrompt({...currentPrompt, categoryId: e.target.value})}
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-4 text-xs font-bold text-white/50 outline-none focus:border-primary/40 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id} className="bg-[#0B0B0B]">{cat.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Difficulty</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Beginner", "Pro"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setCurrentPrompt({...currentPrompt, difficulty: level as any})}
                        className={`h-10 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
                          currentPrompt.difficulty === level 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-white/5 border-white/5 text-text-muted hover:text-white"
                        }`}
                      >
                         {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Prompt Content</label>
                <textarea 
                  required
                  rows={6}
                  value={currentPrompt.content || ""}
                  onChange={(e) => setCurrentPrompt({...currentPrompt, content: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-xs font-medium leading-relaxed text-white outline-none focus:border-primary/40 transition-all resize-none"
                  placeholder="Paste prompt content here..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Role Pack</label>
                  <select
                    value={currentPrompt.rolePack || "general"}
                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, rolePack: e.target.value as any })}
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-4 text-xs font-bold text-white outline-none focus:border-primary/40"
                  >
                    <option value="general" className="bg-[#0B0B0B]">General</option>
                    <option value="frontend" className="bg-[#0B0B0B]">Frontend</option>
                    <option value="backend" className="bg-[#0B0B0B]">Backend</option>
                    <option value="testing" className="bg-[#0B0B0B]">Testing</option>
                    <option value="uiux" className="bg-[#0B0B0B]">UI/UX</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Version</label>
                  <input
                    type="number"
                    min={1}
                    value={currentPrompt.version || 1}
                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, version: Number(e.target.value || 1) })}
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-4 text-xs font-bold text-white outline-none focus:border-primary/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Changelog (one line each)</label>
                <textarea
                  rows={4}
                  value={(currentPrompt.changelog || []).join("\n")}
                  onChange={(e) =>
                    setCurrentPrompt({
                      ...currentPrompt,
                      changelog: e.target.value
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-xs font-medium leading-relaxed text-white outline-none focus:border-primary/40 transition-all resize-none"
                  placeholder="- Added reusable auth middleware"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 h-12 bg-primary text-black font-bold uppercase text-[10px] tracking-widest rounded-lg transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {currentPrompt.id ? "Update Prompt" : "Save Prompt"}
                </Button>
                <Button 
                  type="button" 
                  onClick={handleCloseModal}
                  variant="ghost"
                  className="h-12 px-8 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const PlusCircle = memo(({ className }: { className?: string }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
));

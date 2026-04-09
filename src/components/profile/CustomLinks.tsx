import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Globe, 
  Loader2, 
  Link2, 
  ExternalLink, 
  Github, 
  Linkedin, 
  Twitter, 
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sanitizeExternalUrl } from "@/lib/security";

type CustomLink = {
  id: string;
  title: string;
  url: string;
};

const getSmartIcon = (url: string) => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("github.com")) return Github;
  if (lowerUrl.includes("linkedin.com")) return Linkedin;
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) return Twitter;
  if (lowerUrl.includes("vercel.app")) return Cpu;
  if (lowerUrl.includes("supabase.com")) return ShieldCheck;
  return Globe;
};

const CustomLinks = () => {
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "custom_links"), 
      where("userId", "==", auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as CustomLink))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setLinks(data);
      setLoading(false);
    }, (error) => {
       console.error("Custom Links Error:", error);
       setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) {
      toast.error("Protocol error: Specify both Title and URL.");
      return;
    }

    setIsAdding(true);
    try {
      const formattedUrl = sanitizeExternalUrl(newUrl);
      if (!formattedUrl) {
        toast.error("Enter a valid URL.");
        return;
      }
      await addDoc(collection(db, "custom_links"), {
        userId: auth.currentUser?.uid,
        title: newTitle.trim(),
        url: formattedUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewTitle("");
      setNewUrl("");
      toast.success("External node successfully mapped.");
    } catch (error) {
      toast.error("Mapping failure.");
    } finally {
      setIsAdding(false);
    }
  };

  const testLink = (url: string, id: string) => {
    setTestingId(id);
    setTimeout(() => {
      const safeUrl = sanitizeExternalUrl(url);
      if (!safeUrl) {
        toast.error("Invalid URL.");
        setTestingId(null);
        return;
      }
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
      setTestingId(null);
      toast.success("Connection established.");
    }, 800);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("De-allocate this external node?")) return;
    try {
      await deleteDoc(doc(db, "custom_links", id));
      toast.success("Node de-allocated.");
    } catch (error) {
      toast.error("De-allocation failed.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[400px]">
       <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="space-y-12">
      <div>
         <h2 className="text-3xl font-black tracking-tight uppercase">Custom Mesh Nodes</h2>
         <p className="text-xs text-text-muted font-bold italic opacity-60">Manage your external workspace project nodes and destination URIs.</p>
      </div>

      {/* New Link Form */}
      <form onSubmit={handleAddLink} className="p-10 bg-[#111] border border-white/5 rounded-[40px] space-y-8 shadow-2xl relative overflow-hidden group">
         <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none blur-3xl"></div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">Node Assignment (Title)</label>
               <input 
                 type="text" 
                 placeholder="e.g. Production Console"
                 value={newTitle}
                 onChange={(e) => setNewTitle(e.target.value)}
                 className="w-full bg-black border border-white/10 rounded-2xl h-14 px-8 text-sm font-bold text-foreground outline-none focus:border-primary transition-all shadow-inner"
               />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">Routing URI (URL)</label>
               <input 
                 type="text" 
                 placeholder="https://..."
                 value={newUrl}
                 onChange={(e) => setNewUrl(e.target.value)}
                 className="w-full bg-black border border-white/10 rounded-2xl h-14 px-8 text-sm font-bold text-foreground outline-none focus:border-primary transition-all shadow-inner"
               />
            </div>
         </div>
         <Button type="submit" disabled={isAdding} className="w-full h-16 rounded-2xl bg-primary text-black font-black uppercase text-xs tracking-[0.2em] shadow-2xl">
            {isAdding ? <Loader2 className="animate-spin" /> : <Plus size={18} className="mr-3" />}
            Map External Node
         </Button>
      </form>

      {/* Links Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {links.length > 0 ? (
           links.map((link) => {
              const Icon = getSmartIcon(link.url);
              return (
                 <div key={link.id} className="p-8 bg-[#111] border border-white/5 rounded-[32px] flex items-center justify-between group hover:border-primary/20 transition-all shadow-xl">
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Icon className="text-text-muted group-hover:text-primary transition-colors" size={24} />
                       </div>
                       <div className="max-w-[180px]">
                          <h4 className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">{link.title}</h4>
                          <p className="text-[10px] text-text-muted truncate font-bold uppercase tracking-widest opacity-40 italic">{link.url}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => testLink(link.url, link.id)}
                         disabled={testingId === link.id}
                         className="p-3 text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all"
                         title="Test Connection"
                       >
                          {testingId === link.id ? <Loader2 className="animate-spin" size={18} /> : <ExternalLink size={18} />}
                       </button>
                       <button 
                         onClick={() => handleDelete(link.id)}
                         className="p-3 text-text-muted hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                         title="De-allocate"
                       >
                          <Trash2 size={18} />
                       </button>
                    </div>
                 </div>
              );
           })
        ) : (
           <div className="md:col-span-2 py-32 text-center bg-surface/30 border border-dashed border-white/5 rounded-[40px] opacity-30">
              <Link2 className="mx-auto mb-6 opacity-30" size={40} />
              <h3 className="text-xl font-black uppercase tracking-tighter mb-2 italic">No Custom Nodes Mapped</h3>
              <p className="text-xs font-bold text-text-muted opacity-60">Establish external connections to external project URIs.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default CustomLinks;

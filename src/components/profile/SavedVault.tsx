import { useState, useEffect } from "react";
import { 
  Bookmark, 
  Search, 
  Trash2, 
  Download, 
  ExternalLink,
  Loader2,
  AlertCircle,
  Copy,
  Zap,
  ArrowUpRight,
  Share2,
  Clock
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  Timestamp,
  limit
} from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useActivityTracker } from "@/hooks/useActivityTracker";

type SavedPrompt = {
  id: string;
  promptId: string;
  userId: string;
  createdAt: Timestamp;
  // Denormalized data for instant display
  title?: string;
  category?: string;
  content?: string;
};

const SavedVault = () => {
  const { trackEvent } = useActivityTracker();
  const [favorites, setFavorites] = useState<SavedPrompt[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchVaultData = async () => {
      if (!auth.currentUser) return;
      try {
        const [favSnap, recentSnap] = await Promise.all([
          getDocs(query(collection(db, "favorites"), where("userId", "==", auth.currentUser.uid))),
          getDocs(query(collection(db, "recent_prompts"), where("userId", "==", auth.currentUser.uid), limit(4)))
        ]);
        
        setFavorites(favSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as SavedPrompt))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        );
        setRecent(recentSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.lastUsedAt?.toMillis?.() || 0) - (a.lastUsedAt?.toMillis?.() || 0))
        );
      } catch (e) {
        console.error("Vault Resolution Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchVaultData();
  }, []);

  const removeFavorite = async (id: string) => {
    try {
      await deleteDoc(doc(db, "favorites", id));
      setFavorites(favorites.filter(f => f.id !== id));
      toast.success("Prompt removed from vault.");
    } catch (e) {
      toast.error("Failed to remove prompt.");
    }
  };

  const copyToClipboard = (prompt: SavedPrompt) => {
    navigator.clipboard.writeText(prompt.content || "");
    trackEvent("prompt_copy", { promptId: prompt.promptId, title: prompt.title });
    toast.success("Knowledge pattern copied to clipboard.");
  };

  const exportVault = () => {
    const content = favorites.map(f => `TITLE: ${f.title}\nCATEGORY: ${f.category}\n---\n${f.content}\n\n`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ZeroCode_Prompt_Vault_Export.txt";
    link.click();
    toast.success("Vault exported successfully.");
  };

  const filtered = favorites.filter(f => 
    f.title?.toLowerCase().includes(search.toLowerCase()) || 
    f.content?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[400px]">
       <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Recently Used Layer */}
      {recent.length > 0 && (
         <div className="space-y-6">
            <div className="flex items-center gap-3">
               <Clock size={16} className="text-primary italic opacity-60" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Recently Used</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {recent.map((r) => (
                  <div key={r.id} className="p-5 bg-surface border border-white/5 rounded-2xl hover:border-primary/20 transition-all flex items-center justify-between group">
                     <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                           <Zap size={16} className="text-primary" />
                        </div>
                        <div className="overflow-hidden">
                           <h4 className="text-[11px] font-black truncate text-foreground uppercase tracking-tight">{r.title}</h4>
                           <p className="text-[9px] text-text-muted italic opacity-40 uppercase truncate">Last Active Node</p>
                        </div>
                     </div>
                     <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-primary"><ArrowUpRight size={14} /></button>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* Vault Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10 border-t border-white/5">
         <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search saved patterns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-2xl h-14 pl-12 pr-6 text-sm font-bold text-foreground outline-none focus:border-primary/40 transition-all placeholder:text-text-muted/30 shadow-inner"
            />
         </div>
         <div className="flex items-center gap-4">
            <Button 
              onClick={exportVault}
              className="h-14 px-8 rounded-2xl bg-surface border border-white/5 hover:border-primary/20 text-xs font-black uppercase tracking-widest transition-all gap-3"
            >
               <Download size={18} />
               Export Vault
            </Button>
         </div>
      </div>

      {/* Grid of Saved States */}
      {filtered.length > 0 ? (
         <div className="grid md:grid-cols-2 gap-6">
            {filtered.map(fav => (
               <div key={fav.id} className="p-8 bg-[#111] border border-white/5 rounded-[32px] hover:border-primary/20 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[280px]">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Bookmark size={80} />
                  </div>

                  <div>
                     <div className="flex justify-between items-start mb-6">
                        <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                           <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">{fav.category || "General"}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => copyToClipboard(fav)} className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-white" title="Copy Prompt"><Copy size={16} /></button>
                           <button onClick={() => removeFavorite(fav.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-text-muted hover:text-destructive" title="Remove"><Trash2 size={16} /></button>
                        </div>
                     </div>
                     <h3 className="text-xl font-black mb-3 tracking-tighter text-foreground group-hover:text-primary transition-colors">{fav.title || "Undefined Pattern"}</h3>
                     <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed opacity-60 font-medium italic mb-6">
                        {fav.content || "No content fragment saved for this node."}
                     </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted tracking-widest uppercase italic opacity-40">
                        <Zap size={12} className="text-primary" />
                        Ref: {fav.promptId.slice(0, 8)}
                     </div>
                     <button className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest hover:underline translate-x-2 group-hover:translate-x-0 transition-transform">
                        Launch Node <ArrowUpRight size={14} />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      ) : (
         <div className="py-32 text-center bg-surface/30 border border-dashed border-white/5 rounded-[40px]">
            <div className="w-20 h-20 bg-primary/5 rounded-[32px] flex items-center justify-center mx-auto mb-8">
               <Bookmark size={32} className="text-primary opacity-40" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-3">Your Favorites are Empty</h3>
            <p className="text-sm text-text-muted font-bold italic opacity-60">Save prompts to this section for quick access later.</p>
         </div>
      )}
    </div>
  );
};

export default SavedVault;

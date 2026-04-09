import { useState } from "react";
import { Copy, Check, Star, Zap, Rocket, Info, Loader2, User, ShieldCheck, Code2, Target, Wand2, GitFork, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import { collection, doc, updateDoc, increment, addDoc, serverTimestamp, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Prompt = {
  id: string;
  title: string;
  category: string;
  difficulty: "beginner" | "pro";
  description: string;
  content: string;
  tags: string[];
  usageCount: number;
  likesCount?: number;
  version?: number;
  changelog?: string[];
  rolePack?: "frontend" | "backend" | "testing" | "uiux" | "general";
};

const PromptCard = ({ 
  prompt, 
  isFavorite = false, 
  onFavoriteToggle,
  onAddToCollection
}: { 
  prompt: Prompt; 
  isFavorite?: boolean; 
  onFavoriteToggle?: (id: string, state: boolean) => void;
  onAddToCollection?: (promptId: string) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(prompt.likesCount || 0);

  const qualityScore = Math.min(
    100,
    Math.round((prompt.usageCount || 0) * 0.12 + (likesCount || 0) * 4)
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");

      // 1. Atomic usage increment
      const promptRef = doc(db, "prompts", prompt.id);
      await updateDoc(promptRef, {
        usageCount: increment(1)
      });

      // 2. Track analytics
      if (auth.currentUser) {
        await addDoc(collection(db, "analytics"), {
          event: "prompt_copy",
          promptId: prompt.id,
          userId: auth.currentUser.uid,
          timestamp: serverTimestamp()
        });
      }

      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error("Failed to copy prompt.");
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      toast.error("Please login to save prompts.");
      return;
    }

    setIsFavoriting(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const favQuery = query(
          collection(db, "favorites"), 
          where("userId", "==", auth.currentUser.uid),
          where("promptId", "==", prompt.id)
        );
        const snapshot = await getDocs(favQuery);
        snapshot.forEach(async (d) => await deleteDoc(d.ref));
        onFavoriteToggle?.(prompt.id, false);
        toast.info("Removed from saved.");
      } else {
        // Add to favorites
        await addDoc(collection(db, "favorites"), {
          userId: auth.currentUser.uid,
          promptId: prompt.id,
          createdAt: serverTimestamp()
        });
        onFavoriteToggle?.(prompt.id, true);
        toast.success("Saved to your collection!");
      }
    } catch (e) {
      toast.error("Vibe check failed. Try again.");
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleFork = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      toast.error("Please login to fork prompts.");
      return;
    }
    setIsForking(true);
    try {
      await addDoc(collection(db, "prompts"), {
        title: `${prompt.title} (Fork)`,
        category: prompt.category,
        difficulty: prompt.difficulty,
        description: prompt.description,
        content: prompt.content,
        tags: prompt.tags || [],
        usageCount: 0,
        likesCount: 0,
        rolePack: prompt.rolePack || "general",
        version: 1,
        changelog: [`Forked from ${prompt.id}`],
        forkedFromId: prompt.id,
        forkedBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await updateDoc(doc(db, "prompts", prompt.id), { forkCount: increment(1) });
      toast.success("Prompt forked to your workspace.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to fork prompt.");
    } finally {
      setIsForking(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      toast.error("Please login to like prompts.");
      return;
    }
    setIsLiking(true);
    try {
      const likesRef = collection(db, "prompt_likes");
      const q = query(likesRef, where("userId", "==", auth.currentUser.uid), where("promptId", "==", prompt.id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        for (const d of snap.docs) await deleteDoc(d.ref);
        await updateDoc(doc(db, "prompts", prompt.id), { likesCount: increment(-1) });
        setLikesCount((prev) => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        await addDoc(likesRef, { userId: auth.currentUser.uid, promptId: prompt.id, createdAt: serverTimestamp() });
        await updateDoc(doc(db, "prompts", prompt.id), { likesCount: increment(1) });
        setLikesCount((prev) => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update like.");
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <>
      <div className="glass rounded-[32px] p-8 border-border/40 hover:border-primary/40 transition-all group flex flex-col relative overflow-hidden h-full">
        {/* Visual Identity */}
        <div className="flex items-start justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 bg-surface border border-border group-hover:scale-110 active:scale-95`}>
                 {prompt.difficulty === "pro" ? <Rocket className="text-orange-500" size={28} /> : <Zap className="text-primary" size={28} /> }
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tighter group-hover:text-foreground transition-colors line-clamp-1">{prompt.title}</h3>
                <div className="flex gap-2 items-center mt-1">
                   <span className={`text-[8px] uppercase font-black tracking-[0.2em] px-2 py-0.5 rounded-md border ${prompt.difficulty === "pro" ? 'text-orange-500 border-orange-500/20' : 'text-primary border-primary/20'}`}>{prompt.difficulty}</span>
                   <span className="text-[8px] uppercase font-black tracking-[0.2em] text-text-muted/60">{prompt.category}</span>
                   <span className="text-[8px] uppercase font-black tracking-[0.2em] text-text-muted/60">v{prompt.version || 1}</span>
                </div>
              </div>
           </div>
           <button 
             onClick={handleFavorite} 
             disabled={isFavoriting}
             className={`w-10 h-10 rounded-xl border border-border/40 flex items-center justify-center transition-all ${isFavorite ? 'bg-primary/20 text-primary border-primary/30' : 'text-text-muted hover:text-primary active:scale-90'}`}
           >
              {isFavoriting ? <Loader2 size={16} className="animate-spin" /> : <Star size={18} fill={isFavorite ? "currentColor" : "none"} />}
           </button>
        </div>

        <p className="text-text-secondary text-sm mb-10 leading-relaxed font-medium italic line-clamp-3">
          &ldquo;{prompt.description}&rdquo;
        </p>

        {/* Custom Progress Node */}
        <div className="mb-10">
           <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-text-muted/40 mb-2">
              <span>Quality Score</span>
              <span>{qualityScore}/100</span>
           </div>
           <div className="h-1 bg-surface rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/40 transition-all duration-1000" 
                style={{ width: `${qualityScore}%` }}
              ></div>
           </div>
           <div className="mt-2 text-[9px] text-text-muted uppercase tracking-widest font-bold">
             {(prompt.usageCount || 0)} uses • {likesCount} likes • {prompt.rolePack || "general"} pack
           </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-border/40">
           <Button
            onClick={handleCopy}
            className={`h-12 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 transition-all ${copied ? 'bg-emerald-500 scale-95 shadow-none' : 'bg-primary shadow-2xl shadow-primary/10 hover:scale-105 active:scale-95'}`}
           >
             {copied ? <Check size={14} /> : <Copy size={14} />}
             {copied ? "Synced to Clip" : "Deploy Prompt"}
           </Button>
           
           <Button
             variant="ghost"
             onClick={() => setShowExplainer(true)}
             className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary hover:bg-surface border border-transparent hover:border-primary/20 transition-all gap-2"
           >
              <Info size={14} />
              Analyze Intelligence
           </Button>
           <div className="grid grid-cols-2 gap-2">
             <Button
               variant="outline"
               onClick={handleFork}
               disabled={isForking}
               className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 border-white/10 hover:bg-white/10 gap-2"
             >
               {isForking ? <Loader2 size={12} className="animate-spin" /> : <GitFork size={12} />}
               Fork
             </Button>
             <Button
               variant="outline"
               onClick={handleLike}
               disabled={isLiking}
               className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 border-white/10 hover:bg-white/10 gap-2"
             >
               {isLiking ? <Loader2 size={12} className="animate-spin" /> : <Heart size={12} fill={isLiked ? "currentColor" : "none"} />}
               {likesCount}
             </Button>
           </div>
           {onAddToCollection && (
             <Button
               variant="outline"
               onClick={() => onAddToCollection(prompt.id)}
               className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 border-white/10 hover:bg-white/10"
             >
               Add to Collection
             </Button>
           )}
        </div>
      </div>

      <Dialog open={showExplainer} onOpenChange={setShowExplainer}>
        <DialogContent className="max-w-2xl bg-surface/90 backdrop-blur-3xl border-border/40 rounded-[40px] p-0 overflow-hidden shadow-2xl">
           <div className="h-24 bg-gradient-to-r from-primary/20 via-purple-500/10 to-transparent p-10 flex items-end">
              <DialogTitle className="text-3xl font-black tracking-tighter uppercase text-foreground">Intelligence Analysis</DialogTitle>
           </div>
           
           <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                 {[
                   { icon: User, label: "Role", value: "Expert System Architect" },
                   { icon: Target, label: "Goal", value: prompt.title },
                   { icon: Code2, label: "Tech Stack", value: "React + TS + Tailwind" },
                   { icon: ShieldCheck, label: "Compliance", value: "Production Standard" }
                 ].map(item => (
                    <div key={item.label} className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-3">
                       <div className="flex items-center gap-3 text-primary animate-pulse">
                          <item.icon size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                       </div>
                       <p className="text-sm font-bold text-foreground line-clamp-1">{item.value}</p>
                    </div>
                 ))}
              </div>

              <div className="space-y-4">
                 {!!prompt.changelog?.length && (
                   <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Changelog</p>
                     <ul className="space-y-1">
                       {prompt.changelog.slice(0, 4).map((item, idx) => (
                         <li key={`${prompt.id}_ch_${idx}`} className="text-xs text-text-secondary">- {item}</li>
                       ))}
                     </ul>
                   </div>
                 )}
                 <div className="flex items-center gap-3">
                    <Wand2 size={16} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Direct Prompt Content</span>
                 </div>
                 <div className="p-8 bg-black/60 rounded-[32px] border border-white/5 font-mono text-xs text-text-muted/80 leading-loose max-h-[300px] overflow-y-auto italic">
                    {prompt.content}
                 </div>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PromptCard;

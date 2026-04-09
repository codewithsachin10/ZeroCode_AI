import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Star, Loader2, ArrowLeft, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import PromptCard from "@/components/PromptCard";
import { Button } from "@/components/ui/button";

type Prompt = {
  id: string;
  title: string;
  category: string;
  difficulty: "beginner" | "pro";
  description: string;
  content: string;
  tags: string[];
  usageCount: number;
};

const SavedPrompts = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const favQuery = query(collection(db, "favorites"), where("userId", "==", auth.currentUser.uid));
        const favSnapshot = await getDocs(favQuery);
        const promptIds = favSnapshot.docs.map(d => d.data().promptId);

        if (promptIds.length === 0) {
          setPrompts([]);
          setLoading(false);
          return;
        }

        const promptData: Prompt[] = [];
        for (const pid of promptIds) {
          const docRef = doc(db, "prompts", pid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             promptData.push({ id: docSnap.id, ...docSnap.data() } as Prompt);
          }
        }
        setPrompts(promptData);
      } catch (e) {
        console.error("Failed to fetch favorites:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleFavoriteToggle = (id: string, state: boolean) => {
    if (!state) {
      setPrompts(prev => prev.filter(p => p.id !== id));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted animate-pulse">Scanning Personal Cloud...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding pt-32 min-h-screen relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] -z-10"></div>

        <div className="container-main">
          <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-8">
             <div className="flex flex-col gap-4">
                <Link to="/prompts" className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest group hover:translate-x-[-4px] transition-transform">
                   <ArrowLeft size={16} />
                   <span>Back to Engine</span>
                </Link>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-foreground">
                   Saved <span className="text-gradient">Prompts</span>
                </h1>
                <p className="text-sm text-text-secondary italic">Your personal curated node of elite building logic.</p>
             </div>
             <div className="glass px-10 py-6 rounded-3xl border-border/40 text-center">
                <div className="text-4xl font-black text-primary mb-1">{prompts.length}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Synced Nodes</div>
             </div>
          </div>

          {!auth.currentUser ? (
              <div className="text-center py-40 glass rounded-[60px] border border-border/40 border-dashed max-w-2xl mx-auto">
                 <Bookmark size={48} className="mx-auto text-text-muted mb-6 animate-bounce" />
                 <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Connection Restricted</h2>
                 <p className="text-sm text-text-muted italic mb-10">Accessing the personal cloud node requires an active user signature.</p>
                 <Link to="/login">
                    <Button variant="hero" className="rounded-2xl px-12 h-14 uppercase font-black text-xs">Propel to Auth</Button>
                 </Link>
              </div>
          ) : prompts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {prompts.map((p) => (
                <PromptCard 
                  key={p.id} 
                  prompt={p} 
                  isFavorite={true} 
                  onFavoriteToggle={handleFavoriteToggle} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-40 glass rounded-[60px] border border-border/40 border-dashed max-w-2xl mx-auto">
               <Bookmark size={48} className="mx-auto text-text-muted mb-6 opacity-20" />
               <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Empty Personal Node</h2>
               <p className="text-sm text-text-muted italic mb-10">Navigate to the Prompt Library to start syncing your favorite building nodes.</p>
               <Link to="/prompts">
                  <Button variant="hero" className="rounded-2xl px-12 h-14 uppercase font-black text-xs">Scan Library Node</Button>
               </Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default SavedPrompts;

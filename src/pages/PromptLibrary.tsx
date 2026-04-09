import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { Search, Sparkles, Terminal, ChevronRight, Wand2, Loader2, ArrowUpRight, Flame, Layers, Star as StarIcon, FolderPlus, LibraryBig, Boxes } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import PromptCard from "@/components/PromptCard";
import PromptCustomizer from "@/components/PromptCustomizer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

type PromptCollection = {
  id: string;
  name: string;
  userId: string;
  createdAt?: any;
};

const categories = [
  "All", "Landing Pages", "Dashboards", "Admin Panels", "E-commerce",
  "Authentication", "Database", "Payments", "Email", "UI Redesign",
  "CSS Cleanup"
];

const PromptLibrary = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"library" | "collections" | "rolepacks" | "customizer">("library");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [collectionsData, setCollectionsData] = useState<PromptCollection[]>([]);
  const [collectionItems, setCollectionItems] = useState<Record<string, string[]>>({});
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");

  // 1. Fetch Prompts
  useEffect(() => {
    // For safety, we fetch all by createdAt if usageCount index is still pending in cloud
    const q = query(collection(db, "prompts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));
        setPrompts(data);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Sync Error:", error);
        toast.error("Cloud Node Sync Error. Check connection.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "prompt_collections"), where("userId", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rows = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PromptCollection[];
      setCollectionsData(rows);
      if (!selectedCollectionId && rows.length > 0) {
        setSelectedCollectionId(rows[0].id);
      }
    });
    return () => unsubscribe();
  }, [selectedCollectionId]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "prompt_collection_items"), where("userId", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, string[]> = {};
      snapshot.docs.forEach((d) => {
        const row = d.data() as any;
        if (!row.collectionId || !row.promptId) return;
        if (!map[row.collectionId]) map[row.collectionId] = [];
        map[row.collectionId].push(row.promptId);
      });
      setCollectionItems(map);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Favorites for visual state
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "favorites"), where("userId", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFavorites(snapshot.docs.map(d => d.data().promptId));
    });
    return () => unsubscribe();
  }, []);

  const trendingPrompts = useMemo(() => {
    // Sort manually in memory to ensure trending always works even if Firestore is slow
    return [...prompts].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, 3);
  }, [prompts]);

  const filtered = useMemo(() => {
    return prompts.filter((p) => {
      const matchCategory = activeCategory === "All" || p.category === activeCategory;
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [prompts, search, activeCategory]);

  const rolePackGroups = useMemo(() => {
    const packs = {
      frontend: prompts.filter((p) => (p.rolePack || "general") === "frontend"),
      backend: prompts.filter((p) => (p.rolePack || "general") === "backend"),
      testing: prompts.filter((p) => (p.rolePack || "general") === "testing"),
      uiux: prompts.filter((p) => (p.rolePack || "general") === "uiux"),
      general: prompts.filter((p) => (p.rolePack || "general") === "general")
    };
    return packs;
  }, [prompts]);

  const createCollection = async () => {
    if (!auth.currentUser) return toast.error("Please login first.");
    if (!newCollectionName.trim()) return toast.error("Collection name required.");
    try {
      const ref = await addDoc(collection(db, "prompt_collections"), {
        name: newCollectionName.trim(),
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setSelectedCollectionId(ref.id);
      setNewCollectionName("");
      toast.success("Collection created.");
    } catch {
      toast.error("Failed to create collection.");
    }
  };

  const addPromptToCollection = async (promptId: string) => {
    if (!auth.currentUser) return toast.error("Please login first.");
    if (!selectedCollectionId) return toast.error("Select a collection first.");
    try {
      const exists = await getDocs(
        query(
          collection(db, "prompt_collection_items"),
          where("userId", "==", auth.currentUser.uid),
          where("collectionId", "==", selectedCollectionId),
          where("promptId", "==", promptId)
        )
      );
      if (!exists.empty) return toast.info("Prompt already in collection.");
      await addDoc(collection(db, "prompt_collection_items"), {
        userId: auth.currentUser.uid,
        collectionId: selectedCollectionId,
        promptId,
        createdAt: serverTimestamp()
      });
      toast.success("Added to collection.");
    } catch {
      toast.error("Failed to add prompt.");
    }
  };

  if (loading) {
     return (
        <Layout>
           <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="flex flex-col items-center gap-6">
                 <Loader2 className="w-12 h-12 text-primary animate-spin" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted animate-pulse">Establishing Cloud Signal...</span>
              </div>
           </div>
        </Layout>
     );
  }

  return (
    <Layout>
      <section className="relative pt-24 pb-32 overflow-hidden min-h-screen">
        {/* Cinematic Backdrop - Ensuring z-index is correct */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[180px] -z-20"></div>
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] -z-20"></div>

        <div className="container-main relative z-0">
          {/* Header Node - ANIMATIONS REMOVED FOR VISIBILITY */}
          <div className="max-w-4xl mx-auto text-center mb-16 opacity-100 visible">
             <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass border border-primary/20 mb-8 shadow-lg shadow-primary/5">
                <Sparkles size={14} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Intelligence Repository v4.0</span>
             </div>
             <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tighter leading-[0.8] uppercase text-foreground">
                Prompt <span className="text-gradient">Engine</span>
             </h1>
             <p className="text-lg md:text-2xl text-text-secondary leading-relaxed max-w-2xl mx-auto font-medium italic">
                Master the art of high-level building. From full-stack architectures to atomic UI nodes.
             </p>
          </div>

          {/* Quick Access Tabs */}
          <div className="flex justify-center mb-16">
             <div className="p-1 rounded-2xl glass border border-border/40 flex gap-1 bg-surface backdrop-blur-3xl shadow-2xl">
                {[
                  { id: "library", label: "Intelligence Grid", icon: Layers },
                  { id: "collections", label: "Collections", icon: LibraryBig },
                  { id: "rolepacks", label: "Role Packs", icon: Boxes },
                  { id: "customizer", label: "Dynamic Generator", icon: Wand2 }
                ].map(tab => (
                   <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/20' : 'text-text-muted hover:text-foreground hover:bg-surface'}`}
                   >
                     <tab.icon size={16} />
                     {tab.label}
                   </button>
                ))}
             </div>
          </div>

          {activeTab === "library" ? (
             <div className="visible block">
                {/* Trending Section */}
                {trendingPrompts.length > 0 && (
                   <div className="mb-24">
                      <div className="flex items-center gap-4 mb-10 overflow-hidden">
                         <Flame size={24} className="text-orange-500 animate-pulse" />
                         <h2 className="text-3xl font-black tracking-tighter uppercase">Trending Units</h2>
                         <div className="h-[1px] flex-1 bg-gradient-to-r from-border/60 to-transparent"></div>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                         {trendingPrompts.map((p) => (
                           <div key={`trending-${p.id}`} className="relative">
                              <PromptCard 
                                prompt={p} 
                                isFavorite={favorites.includes(p.id)}  
                              />
                           </div>
                         ))}
                      </div>
                   </div>
                )}

                {/* Main Filter Section */}
                <div className="max-w-4xl mx-auto mb-20 space-y-10 group">
                  <div className="glass p-4 rounded-2xl border-border/40 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderPlus size={14} className="text-primary" />
                      <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">Prompt Collections</span>
                    </div>
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                      <input
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="New collection name"
                        className="h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white"
                      />
                      <button onClick={createCollection} className="h-10 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest">
                        Create
                      </button>
                      <select
                        value={selectedCollectionId}
                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                        className="h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white"
                      >
                        <option value="">Select collection</option>
                        {collectionsData.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                   <div className="relative">
                      <div className="glass p-2 rounded-2xl flex flex-col md:flex-row gap-4 border-border/40 backdrop-blur-3xl shadow-2xl relative">
                        <div className="flex-1 flex items-center px-8 gap-4 bg-surface/50 rounded-xl border border-transparent focus-within:border-primary/40 transition-all">
                           <Search size={22} className="text-text-muted" />
                           <input
                             type="text"
                             placeholder="Search the Engine..."
                             value={search}
                             onChange={(e) => setSearch(e.target.value)}
                             className="bg-transparent py-5 text-base w-full outline-none font-bold text-foreground placeholder:text-text-muted/40"
                           />
                        </div>
                        <div className="flex items-center pr-2 gap-2">
                           <Link to="/favorites">
                              <button className="h-14 px-8 rounded-xl bg-surface border border-border/60 flex items-center gap-3 text-white hover:text-primary transition-all group/fav">
                                 <StarIcon size={18} className="group-hover/fav:rotate-12" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">My Saved</span>
                                 <ChevronRight size={14} className="opacity-0 group-hover/fav:opacity-100 group-hover/fav:translate-x-1 transition-all" />
                              </button>
                           </Link>
                        </div>
                      </div>
                   </div>
                   
                   <div className="flex flex-wrap justify-center gap-2">
                      {categories.map(cat => (
                        <button
                         key={cat}
                         onClick={() => setActiveCategory(cat)}
                         className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === cat ? 'bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/40' : 'bg-surface border-border/40 text-text-muted hover:text-foreground hover:border-primary/40'}`}
                        >
                          {cat}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Grid UI */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                  {filtered.map((p) => (
                    <PromptCard 
                      key={p.id} 
                      prompt={p} 
                      isFavorite={favorites.includes(p.id)}
                      onAddToCollection={addPromptToCollection}
                    />
                  ))}
                </div>

                {filtered.length === 0 && (
                   <div className="text-center py-40 border border-dashed border-border/60 rounded-[60px] opacity-40 grayscale">
                      <Terminal size={64} className="mx-auto mb-6" />
                      <h3 className="text-2xl font-black uppercase italic">Signature Not Found</h3>
                      <p className="text-sm text-text-muted">No prompt records match your search criteria.</p>
                   </div>
                )}
             </div>
          ) : activeTab === "collections" ? (
             <div className="space-y-8">
               {collectionsData.length === 0 ? (
                 <div className="text-center py-28 border border-dashed border-border/60 rounded-[40px] opacity-60">
                   <p className="text-sm text-text-muted">No collections yet. Create one from Intelligence Grid tab.</p>
                 </div>
               ) : collectionsData.map((c) => {
                 const promptIds = collectionItems[c.id] || [];
                 const rows = prompts.filter((p) => promptIds.includes(p.id));
                 return (
                   <div key={c.id} className="glass rounded-2xl p-6 border border-white/10">
                     <div className="flex items-center justify-between mb-5">
                       <h3 className="text-lg font-black uppercase">{c.name}</h3>
                       <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">{rows.length} prompts</span>
                     </div>
                     {rows.length === 0 ? (
                       <p className="text-xs text-text-muted">No prompts in this collection yet.</p>
                     ) : (
                       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {rows.map((p) => (
                           <PromptCard key={`${c.id}_${p.id}`} prompt={p} isFavorite={favorites.includes(p.id)} />
                         ))}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
          ) : activeTab === "rolepacks" ? (
             <div className="space-y-8">
               {([
                 { key: "frontend", label: "Frontend Pack" },
                 { key: "backend", label: "Backend Pack" },
                 { key: "testing", label: "Testing Pack" },
                 { key: "uiux", label: "UI/UX Pack" },
                 { key: "general", label: "General Pack" }
               ] as const).map((pack) => {
                 const rows = rolePackGroups[pack.key];
                 return (
                   <div key={pack.key} className="glass rounded-2xl p-6 border border-white/10">
                     <div className="flex items-center justify-between mb-5">
                       <h3 className="text-lg font-black uppercase">{pack.label}</h3>
                       <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">{rows.length} prompts</span>
                     </div>
                     {rows.length === 0 ? (
                       <p className="text-xs text-text-muted">No prompts in this pack yet.</p>
                     ) : (
                       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {rows.map((p) => (
                           <PromptCard key={`${pack.key}_${p.id}`} prompt={p} isFavorite={favorites.includes(p.id)} />
                         ))}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
          ) : (
             <div className="visible block">
                <PromptCustomizer />
             </div>
          )}

          {/* Core Footer CTA */}
          <div className="mt-40 p-20 rounded-[60px] bg-gradient-to-b from-surface to-transparent border border-border/40 text-center relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
             <h4 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-6">Need a custom <span className="text-primary">Intelligence</span>?</h4>
             <p className="text-text-muted text-lg mb-10 max-w-xl mx-auto italic leading-relaxed">Our elite engineers can architect custom prompt flows for your specific production needs.</p>
             <Link to="/feedback">
                <Button variant="hero" size="lg" className="h-16 px-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20">
                   Request Custom Node <ArrowUpRight size={18} className="ml-2" />
                </Button>
             </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PromptLibrary;

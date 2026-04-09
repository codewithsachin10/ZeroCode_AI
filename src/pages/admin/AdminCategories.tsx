import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

type Category = {
  id: string;
  name: string;
  createdAt?: any;
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCat, setCurrentCat] = useState<Partial<Category>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, "categories"), orderBy("name", "asc"));
      const snap = await getDocs(q);
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    } catch (error) {
      console.error("Error fetching categories", error);
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCat.name) return;
    
    setIsSubmitting(true);
    try {
      if (currentCat.id) {
        await updateDoc(doc(db, "categories", currentCat.id), { name: currentCat.name });
        toast({ title: "Success", description: "Category updated" });
      } else {
        await addDoc(collection(db, "categories"), { 
          name: currentCat.name,
          createdAt: serverTimestamp() 
        });
        toast({ title: "Success", description: "Category created" });
      }
      fetchCategories();
      setIsModalOpen(false);
      setCurrentCat({});
    } catch (error) {
      toast({ title: "Error", description: "Failed to save category", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      setCategories(categories.filter(c => c.id !== id));
      toast({ title: "Success", description: "Category deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Categories</h2>
          <p className="text-text-secondary text-sm">Manage prompt categories.</p>
        </div>
        <button 
          onClick={() => { setCurrentCat({}); setIsModalOpen(true); }}
          className="bg-surface hover:bg-surface-hover border border-border text-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> New Category
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase bg-surface/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Category Name</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={2} className="p-6 text-center text-text-muted">Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={2} className="p-6 text-center text-text-muted">No categories found</td></tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className="border-b border-border/50 hover:bg-surface/30">
                  <td className="px-6 py-4 font-medium">{cat.name}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setCurrentCat(cat); setIsModalOpen(true); }} className="p-1.5 hover:text-primary transition-colors bg-surface rounded">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:text-destructive transition-colors bg-surface rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">{currentCat.id ? "Edit Category" : "New Category"}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={currentCat.name || ""}
                  onChange={(e) => setCurrentCat({...currentCat, name: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary/50 text-foreground"
                  placeholder="e.g. UI/UX, Web Dev"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg font-medium text-text-secondary hover:bg-surface transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

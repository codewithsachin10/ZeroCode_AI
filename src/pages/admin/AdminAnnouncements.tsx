import { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Loader2,
  Info,
  AlertTriangle,
  RefreshCw,
  X,
  Clock,
  Search
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "update";
  isPinned: boolean;
  isActive: boolean;
  createdAt: any;
};

const TYPE_CONFIG = {
  info: { label: "Info", color: "#3b82f6", icon: Info },
  warning: { label: "Warning", color: "#ef4444", icon: AlertTriangle },
  update: { label: "Update", color: "#22c55e", icon: RefreshCw },
};

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "update",
    isPinned: false,
    isActive: true,
  });

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setForm({ title: "", message: "", type: "info", isPinned: false, isActive: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      return toast.error("Title and message are required.");
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, "announcements", editingId), {
          title: form.title,
          message: form.message,
          type: form.type,
          isPinned: form.isPinned,
          isActive: form.isActive,
          updatedAt: serverTimestamp(),
        });
        toast.success("Announcement updated.");
      } else {
        await addDoc(collection(db, "announcements"), {
          title: form.title,
          message: form.message,
          type: form.type,
          isPinned: form.isPinned,
          isActive: form.isActive,
          createdAt: serverTimestamp(),
        });
        toast.success("Announcement published.");
      }
      resetForm();
    } catch (err) {
      toast.error("Operation failed.");
    }
  };

  const handleEdit = (a: Announcement) => {
    setForm({
      title: a.title,
      message: a.message,
      type: a.type,
      isPinned: a.isPinned,
      isActive: a.isActive,
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently remove this announcement?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast.success("Announcement removed.");
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  const togglePin = async (a: Announcement) => {
    try {
      await updateDoc(doc(db, "announcements", a.id), { isPinned: !a.isPinned });
      toast.success(a.isPinned ? "Unpinned." : "Pinned to top.");
    } catch (err) {
      toast.error("Toggle failed.");
    }
  };

  const toggleActive = async (a: Announcement) => {
    try {
      await updateDoc(doc(db, "announcements", a.id), { isActive: !a.isActive });
      toast.success(a.isActive ? "Unpublished." : "Published.");
    } catch (err) {
      toast.error("Toggle failed.");
    }
  };

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
              Broadcast Control
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
            Announcement <span className="text-primary italic">Hub</span>
          </h2>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-40 italic">
            Publish important messages to the entire academy mesh
          </p>
        </div>

        <Button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="h-12 px-8 bg-primary text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-[2px] gap-2 hover:scale-[1.02] transition-all"
        >
          <Plus size={16} /> New Broadcast
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40" size={14} />
        <input
          type="text"
          placeholder="Filter announcements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-[2px] pl-12 pr-4 text-[11px] font-bold text-white focus:border-primary/20 outline-none transition-all placeholder:opacity-20"
        />
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="p-8 bg-[#0B0B0B] border border-primary/20 rounded-[2px] space-y-8 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Megaphone size={16} className="text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-white">
                {editingId ? "Edit Broadcast" : "New Broadcast"}
              </h3>
            </div>
            <button onClick={resetForm} className="p-2 text-text-muted hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Announcement title..."
                className="w-full h-11 bg-black border border-white/5 rounded-[2px] px-4 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all placeholder:opacity-20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="What do you want to tell the academy..."
                rows={4}
                className="w-full bg-black border border-white/5 rounded-[2px] px-4 py-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all placeholder:opacity-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((t) => {
                const cfg = TYPE_CONFIG[t];
                const isSelected = form.type === t;
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    className={`h-11 rounded-[2px] border text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? "border-white/20 text-black"
                        : "border-white/5 text-text-muted hover:border-white/10"
                    }`}
                    style={isSelected ? { backgroundColor: cfg.color } : undefined}
                  >
                    <cfg.icon size={12} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-8">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-[2px] border flex items-center justify-center transition-all ${
                    form.isPinned ? "bg-primary border-primary" : "border-white/10 bg-transparent"
                  }`}
                >
                  {form.isPinned && <Pin size={10} className="text-black" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-white transition-colors">
                  Pin to Top
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-[2px] border flex items-center justify-center transition-all ${
                    form.isActive ? "bg-primary border-primary" : "border-white/10 bg-transparent"
                  }`}
                >
                  {form.isActive && <Eye size={10} className="text-black" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-white transition-colors">
                  Publish
                </span>
              </label>
            </div>

            <Button
              type="submit"
              className="h-12 px-10 bg-primary text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-[2px] hover:scale-[1.02] transition-all"
            >
              {editingId ? "Update Broadcast" : "Publish Broadcast"}
            </Button>
          </form>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
            return (
              <div
                key={a.id}
                className={`p-6 bg-[#0B0B0B] border rounded-[2px] group hover:border-white/10 transition-all relative overflow-hidden ${
                  a.isActive ? "border-white/5" : "border-white/[0.02] opacity-40"
                }`}
              >
                {/* Type accent */}
                <div
                  className="absolute top-0 left-0 bottom-0 w-[3px]"
                  style={{ backgroundColor: cfg.color, opacity: 0.6 }}
                />

                <div className="flex items-start justify-between gap-6 pl-4">
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      {a.isPinned && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-[2px] flex items-center gap-1">
                          <Pin size={8} /> Pinned
                        </span>
                      )}
                      <span
                        className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[2px] border"
                        style={{
                          color: cfg.color,
                          borderColor: `${cfg.color}40`,
                          backgroundColor: `${cfg.color}10`,
                        }}
                      >
                        {cfg.label}
                      </span>
                      {!a.isActive && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-text-muted bg-white/5 border border-white/5 px-2 py-0.5 rounded-[2px]">
                          Draft
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-white uppercase tracking-tight leading-snug">
                      {a.title}
                    </h3>
                    <p className="text-[12px] font-medium text-text-secondary leading-relaxed opacity-60 line-clamp-2">
                      {a.message}
                    </p>

                    <div className="flex items-center gap-2 text-[9px] font-bold text-text-muted opacity-40">
                      <Clock size={10} />
                      {a.createdAt ? format(a.createdAt.toDate(), "MMM dd, yyyy • HH:mm") : "Syncing..."}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => togglePin(a)}
                      className={`p-2 rounded-[2px] border border-white/5 transition-all ${
                        a.isPinned
                          ? "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20"
                          : "text-text-muted hover:text-white hover:bg-white/5"
                      }`}
                      title={a.isPinned ? "Unpin" : "Pin"}
                    >
                      {a.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <button
                      onClick={() => toggleActive(a)}
                      className={`p-2 rounded-[2px] border border-white/5 transition-all ${
                        a.isActive
                          ? "text-green-500 bg-green-500/10 hover:bg-green-500/20"
                          : "text-text-muted hover:text-white hover:bg-white/5"
                      }`}
                      title={a.isActive ? "Unpublish" : "Publish"}
                    >
                      {a.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => handleEdit(a)}
                      className="p-2 rounded-[2px] border border-white/5 text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-2 rounded-[2px] border border-white/5 text-text-muted hover:text-red-500 hover:bg-red-500/5 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-[2px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-20 italic">
                Zero broadcasts in the system
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

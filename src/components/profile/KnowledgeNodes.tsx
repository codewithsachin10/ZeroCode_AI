import { useState, useEffect, useRef, memo, useMemo } from "react";
import { 
  Search, Trash2, FileText, FilePlus, Eye, Columns, Maximize2
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, doc, setDoc, 
  updateDoc, deleteDoc, serverTimestamp, Timestamp 
} from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useUser } from "@/context/UserContext";
import AppLoader from "@/components/ui/AppLoader";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
}

const parseMarkdown = (text: string) => {
  if (!text) return "";
  const html = text
    .replace(/^# (.*$)/gim, '<h1 class="text-5xl font-black mb-8 uppercase tracking-tighter text-white italic">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-black mb-6 uppercase tracking-tight text-primary italic">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-black mb-4 uppercase text-white/90">$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong class="text-primary font-black">$1</strong>')
    .replace(/\*(.*)\*/gim, '<em class="italic opacity-80">$1</em>')
    .replace(/^- (.*$)/gim, '<li class="ml-6 list-disc text-sm font-bold text-text-secondary mb-2">$1</li>')
    .replace(/```([\s\S]*?)```/gim, '<pre class="bg-black/60 border border-white/10 p-8 rounded-3xl my-8 overflow-x-auto shadow-inner"><code class="text-primary font-mono text-xs leading-relaxed">$1</code></pre>')
    .replace(/\n\n/gim, '<br /><br />');
  return html;
};

const safeMarkdownToHtml = (text: string) => DOMPurify.sanitize(parseMarkdown(text));

const KnowledgeNodes = () => {
  const { trackEvent } = useActivityTracker();
  const { notes, loading: userLoading } = useUser();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-select the first note if none selected or if notes list updates
  useEffect(() => {
    if (notes.length > 0 && !selectedNote) {
      setSelectedNote(notes[0]);
    }
  }, [notes, selectedNote]);

  const createNote = async () => {
    if (!auth.currentUser) return;
    const newId = doc(collection(db, "notes")).id;
    const newNote = {
      id: newId,
      userId: auth.currentUser.uid,
      title: "Untitled Node",
      content: "# New Knowledge Node\n\nInitialize your manifest trajectory here...",
      updatedAt: serverTimestamp()
    };
    
    try {
      await setDoc(doc(db, "notes", newId), {
        ...newNote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSelectedNote({ ...newNote, updatedAt: new Date() });
      trackEvent("note_create", { title: newNote.title });
      toast.success("Knowledge node initialized.");
    } catch (e) {
      toast.error("Initialization failure.");
    }
  };

  const handleUpdate = (updates: Partial<Note>) => {
    if (!selectedNote) return;
    const updatedNote = { ...selectedNote, ...updates };
    setSelectedNote(updatedNote);
    
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    
    setSaving(true);
    saveTimeout.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, "notes", selectedNote.id), {
          ...updates,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        toast.error("Cloud synchronization failed.");
      } finally {
        setSaving(false);
      }
    }, 1000);
  };

  const deleteNote = async (id: string) => {
    if (!confirm("De-allocate this knowledge node?")) return;
    try {
      await deleteDoc(doc(db, "notes", id));
      if (selectedNote?.id === id) {
        setSelectedNote(notes.length > 1 ? (notes[0].id === id ? notes[1] : notes[0]) : null);
      }
      toast.success("Node de-allocated.");
    } catch (e) {
      toast.error("De-allocation failed.");
    }
  };

  const filteredNotes = useMemo(() => {
    const term = search.toLowerCase();
    return notes.filter(n => n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term));
  }, [notes, search]);

  if (userLoading) return <div className="min-h-[500px] flex items-center justify-center"><AppLoader label="Loading notes..." /></div>;

  return (
    <div className="flex flex-col lg:flex-row h-[760px] border border-white/10 rounded-2xl overflow-hidden bg-[#0d0d0d]">
      <div className="w-full lg:w-[320px] border-r border-white/10 flex flex-col bg-[#0b0b0b]">
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Notes</h3>
            <button onClick={createNote} className="h-9 px-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2 text-primary hover:bg-primary hover:text-black transition-all">
              <FilePlus size={14} />
              <span className="text-[10px] font-bold uppercase">New</span>
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg h-10 pl-9 pr-3 text-xs font-bold text-white outline-none focus:border-primary/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedNote?.id === note.id ? "bg-primary/10 border-primary/30" : "bg-transparent border-transparent hover:bg-white/[0.03]"
              }`}
            >
              <h4 className="text-xs font-bold truncate text-white">{note.title || "Untitled"}</h4>
              <p className="text-[10px] text-text-muted mt-1 line-clamp-1">{note.content.replace(/[#*`]/g, "").slice(0, 70)}</p>
            </button>
          ))}
          {filteredNotes.length === 0 && (
            <div className="h-full flex items-center justify-center p-6 text-center text-xs text-text-muted">No notes found.</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#0d0d0d]">
         {selectedNote ? (
            <>
               <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0b0b0b]">
                  <div className="flex-1 flex flex-col gap-3">
                     <input 
                       type="text" 
                       value={selectedNote.title}
                       onChange={(e) => handleUpdate({ title: e.target.value })}
                       className="bg-transparent text-base font-bold text-white outline-none border-none placeholder:text-white/30 w-full focus:text-primary transition-colors"
                       placeholder="Note title"
                     />
                     <div className="flex items-center gap-2">
                        <div className="flex bg-black border border-white/10 rounded-lg p-1">
                           <button onClick={() => setViewMode("edit")} className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${viewMode === "edit" ? "bg-primary text-black" : "text-text-muted hover:text-white"}`}>
                              <Maximize2 size={12} />
                              <span className="text-[10px] font-bold uppercase">Edit</span>
                           </button>
                           <button onClick={() => setViewMode("split")} className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${viewMode === "split" ? "bg-primary text-black" : "text-text-muted hover:text-white"}`}>
                              <Columns size={12} />
                              <span className="text-[10px] font-bold uppercase">Split</span>
                           </button>
                           <button onClick={() => setViewMode("preview")} className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${viewMode === "preview" ? "bg-primary text-black" : "text-text-muted hover:text-white"}`}>
                              <Eye size={12} />
                              <span className="text-[10px] font-bold uppercase">Preview</span>
                           </button>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                    <span className="text-[10px] text-text-muted">{saving ? "Saving..." : "Saved"} • {selectedNote.updatedAt?.toDate ? format(selectedNote.updatedAt.toDate(), "HH:mm") : "Now"}</span>
                    <button onClick={() => deleteNote(selectedNote.id)} className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-2">
                      <Trash2 size={14} />
                      <span className="text-[10px] font-bold uppercase">Delete</span>
                    </button>
                  </div>
               </div>

               <div className="flex-1 flex overflow-hidden bg-[#0d0d0d]">
                  {(viewMode === "edit" || viewMode === "split") && (
                     <div className={`h-full border-r border-white/10 bg-[#0d0d0d] flex flex-col ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
                        <textarea 
                          value={selectedNote.content}
                          onChange={(e) => handleUpdate({ content: e.target.value })}
                          spellCheck={false}
                          className="w-full h-full bg-transparent p-4 text-sm font-mono leading-6 text-white/90 outline-none border-none resize-none placeholder:text-white/20"
                          placeholder="Write your notes..."
                        />
                     </div>
                  )}
                  {(viewMode === "preview" || viewMode === "split") && (
                     <div className={`h-full overflow-y-auto p-4 bg-black/30 ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
                        <div className="max-w-3xl mx-auto">
                           <div className="prose prose-invert prose-emerald max-w-none prose-h1:text-5xl prose-h1:font-black prose-p:text-base prose-p:font-bold prose-p:leading-relaxed prose-p:text-text-secondary" dangerouslySetInnerHTML={{ __html: safeMarkdownToHtml(selectedNote.content) }} />
                        </div>
                     </div>
                  )}
               </div>
               <div className="p-3 border-t border-white/10 bg-[#0b0b0b] flex items-center justify-between text-[10px] text-text-muted">
                  <span>Characters: {selectedNote.content.length}</span>
                  <span>Lines: {selectedNote.content.split("\n").length}</span>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0d0d0d] gap-5 text-center">
               <div className="w-16 h-16 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-primary/40">
                  <FileText size={28} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-base font-bold uppercase text-white">Select a note</h3>
                  <p className="text-xs text-text-muted">Create or choose a note to start writing.</p>
               </div>
               <button onClick={createNote} className="h-10 px-4 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold uppercase text-[10px] hover:bg-primary hover:text-black transition-all">Create note</button>
            </div>
         )}
      </div>

    </div>
  );
};

export default memo(KnowledgeNodes);

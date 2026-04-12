import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2,
  X,
  Award,
  PlusCircle,
  MinusCircle,
  BrainCircuit,
  CheckCircle2
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

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    moduleId: "",
    questions: [
      { question: "", options: ["", "", "", ""], correctAnswer: 0 }
    ] as QuizQuestion[]
  });

  useEffect(() => {
    const unsubModules = onSnapshot(collection(db, "modules"), (snap) => {
      setModules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubQuizzes = onSnapshot(query(collection(db, "quizzes"), orderBy("createdAt", "desc")), (snap) => {
      setQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubModules();
      unsubQuizzes();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.moduleId) return toast.error("Module association is required");
    if (formData.questions.some(q => !q.question || q.options.some(o => !o))) {
      return toast.error("All quiz fields must be populated");
    }

    try {
      const payload = { ...formData, updatedAt: serverTimestamp() };
      if (editingId) {
        await updateDoc(doc(db, "quizzes", editingId), payload);
        toast.success("Quiz factory updated");
      } else {
        await addDoc(collection(db, "quizzes"), { ...payload, createdAt: serverTimestamp() });
        toast.success("Quiz protocol deployed");
      }
      resetForm();
    } catch (err) {
      toast.error("Deployment failed");
    }
  };

  const addQuestion = () => setFormData({
    ...formData, 
    questions: [...formData.questions, { question: "", options: ["", "", "", ""], correctAnswer: 0 }]
  });

  const removeQuestion = (idx: number) => setFormData({
    ...formData,
    questions: formData.questions.filter((_, i) => i !== idx)
  });

  const updateQuestion = (idx: number, field: string, value: any) => {
    const newQuestions = [...formData.questions];
    (newQuestions[idx] as any)[field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIdx].options[oIdx] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleEdit = (quiz: any) => {
    setFormData({
      moduleId: quiz.moduleId,
      questions: quiz.questions
    });
    setEditingId(quiz.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Decommission this quiz?")) return;
    try {
      await deleteDoc(doc(db, "quizzes", id));
      toast.success("Quiz offline");
    } catch (err) {
      toast.error("Process failed");
    }
  };

  const resetForm = () => {
    setFormData({ moduleId: "", questions: [{ question: "", options: ["", "", "", ""], correctAnswer: 0 }] });
    setEditingId(null);
    setShowModal(false);
  };

  const filteredQuizzes = quizzes.filter(q => 
    modules.find(m => m.id === q.moduleId)?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase text-white tracking-widest leading-none mb-1">Knowledge Calibration</h2>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Verify student mastery benchmarks</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-[2px]"
        >
          <Plus size={14} className="mr-2" /> Create Quiz
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
        <input 
          placeholder="Filter by module..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map(quiz => (
            <div key={quiz.id} className="p-6 bg-[#0B0B0B] border border-white/5 rounded-[2px] relative group hover:border-primary/10 transition-all shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-[2px] bg-white/5 border border-white/5 flex items-center justify-center text-primary">
                    <BrainCircuit size={16} />
                 </div>
                 <div>
                    <h4 className="text-xs font-black text-white uppercase truncate w-40">
                       {modules.find(m => m.id === quiz.moduleId)?.title || "Detached Node"}
                    </h4>
                    <p className="text-[9px] font-black uppercase text-text-muted tracking-widest">{quiz.questions.length} Protocols</p>
                 </div>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-white/[0.02]">
                 <button onClick={() => handleEdit(quiz)} className="p-2 text-text-muted hover:text-white transition-colors">
                    <Edit2 size={12} />
                 </button>
                 <button onClick={() => handleDelete(quiz.id)} className="p-2 text-text-muted hover:text-red-500 transition-colors">
                    <Trash2 size={12} />
                 </button>
              </div>
            </div>
          ))}
          {filteredQuizzes.length === 0 && (
            <div className="col-span-full py-20 text-center text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">
               Calibration Matrix Empty
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0B0B0B] border border-white/5 rounded-[2px] shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">{editingId ? 'Modify Calibration Matrix' : 'Deploy Calibration Matrix'}</h3>
              <button onClick={resetForm} className="text-text-muted hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Target Module Association</label>
                  <select 
                    value={formData.moduleId}
                    onChange={(e) => setFormData({...formData, moduleId: e.target.value})}
                    className="w-full h-10 bg-white/5 border border-white/5 rounded-[2px] px-3 text-xs font-bold text-white/60 focus:border-primary/20 outline-none transition-all"
                  >
                    <option value="" className="bg-black">Select Module</option>
                    {modules.map(m => <option key={m.id} value={m.id} className="bg-black">{m.title}</option>)}
                  </select>
               </div>

               <div className="space-y-6 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-primary">Inquiry Protocols</span>
                     <button type="button" onClick={addQuestion} className="text-primary hover:opacity-80 transition-all flex items-center gap-1">
                        <PlusCircle size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Add Inquiry</span>
                     </button>
                  </div>

                  {formData.questions.map((q, qIdx) => (
                     <div key={qIdx} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2px] space-y-6 relative group">
                        <button type="button" onClick={() => removeQuestion(qIdx)} className="absolute top-4 right-4 text-red-500/30 hover:text-red-500 transition-colors">
                           <MinusCircle size={16} />
                        </button>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Protocol Inquiry {qIdx + 1}</label>
                           <input 
                             value={q.question}
                             onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                             placeholder="The high-performance technical question..."
                             className="w-full h-10 bg-black/40 border border-white/5 rounded-[2px] px-3 text-xs font-bold text-white focus:border-primary/20 outline-none transition-all"
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="space-y-2 relative">
                                 <input 
                                   value={opt}
                                   onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                   placeholder={`Response Node ${oIdx + 1}`}
                                   className={`w-full h-10 bg-black/40 border border-white/5 rounded-[2px] px-3 text-[10px] font-bold outline-none transition-all ${q.correctAnswer === oIdx ? 'text-primary border-primary/20' : 'text-white/60'}`}
                                 />
                                 <button 
                                   type="button"
                                   onClick={() => updateQuestion(qIdx, 'correctAnswer', oIdx)}
                                   className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border transition-all flex items-center justify-center ${q.correctAnswer === oIdx ? 'bg-primary border-primary shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'border-white/20'}`}
                                 >
                                    {q.correctAnswer === oIdx && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>

               <Button type="submit" className="w-full h-11 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-[2px]">
                {editingId ? 'Execute Update' : 'Initialize Protocol'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

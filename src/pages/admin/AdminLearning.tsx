import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { 
  Plus, 
  Video as VideoIcon, 
  Library, 
  Settings, 
  Trash2, 
  Edit3, 
  Search,
  CheckCircle2,
  XCircle,
  PlusCircle,
  PlayCircle,
  Layers,
  Award,
  Loader2,
  Calendar,
  Filter,
  Lock,
  Unlock,
  Globe2,
  Clock,
  Play,
  Eye,
  X,
  ChevronRight,
  FileText,
  Download,
  Link as LinkIcon,
  HelpCircle,
  PlusSquare,
  MinusCircle,
  BrainCircuit,
  Zap,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { 
  collection, 
  addDoc, 
  getDocs, 
  setDoc,
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAcademy } from "@/context/AcademyContext";
import { useDebounce } from "@/hooks/useDebounce";
import { assertSafeYoutubeEmbed, sanitizeExternalUrl } from "@/lib/security";
import { useSearchParams } from "react-router-dom";

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url?.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Video Card for Admin
const VideoAdminCard = memo(({ vid, categories, onDelete, onEdit, onPreview }: any) => {
  const youtubeId = getYoutubeId(vid.youtubeEmbedUrl);
  const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;

  return (
    <div className="group bg-[#111] border border-white/5 rounded-xl overflow-hidden hover:border-primary/20 transition-all flex flex-col shadow-2xl">
      <div className="relative aspect-video bg-black/40 overflow-hidden">
         {thumbnailUrl ? (
           <img src={thumbnailUrl} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
         ) : (
           <div className="w-full h-full flex items-center justify-center bg-white/5 text-text-muted">
              <Play size={20} />
           </div>
         )}
         <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => onPreview(vid)} className="p-1.5 bg-black/80 text-white rounded-lg border border-white/10 hover:text-primary transition-all shadow-lg" title="Preview Video">
               <Eye size={12} />
            </button>
            <button onClick={() => onEdit(vid)} className="p-1.5 bg-black/80 text-white rounded-lg border border-white/10 hover:text-primary transition-all shadow-lg" title="Edit Video">
               <Edit3 size={12} />
            </button>
            <button onClick={() => onDelete(vid.id)} className="p-1.5 bg-black/80 text-white rounded-lg border border-white/10 hover:text-red-500 transition-all shadow-lg" title="Delete Video">
               <Trash2 size={12} />
            </button>
         </div>
         {vid.quiz && vid.quiz.length > 0 && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary/20 border border-primary/40 rounded-md text-[8px] font-bold uppercase text-primary backdrop-blur-md">
               Quiz Ready ({vid.quiz.length})
            </div>
         )}
      </div>
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
         <div>
            <h4 className="text-xs font-bold uppercase text-white truncate mb-1">{vid.title}</h4>
            <div className="flex items-center gap-3 text-text-muted">
               {vid.isPublished === false ? (
                 <div className="flex items-center gap-1.5 opacity-40">
                    <XCircle size={10} />
                    <span className="text-[8px] font-bold uppercase">Draft</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-1.5 text-primary">
                    <CheckCircle2 size={10} />
                    <span className="text-[8px] font-bold uppercase">Published</span>
                 </div>
               )}
               <div className="w-px h-2 bg-white/10" />
               <div className="text-[8px] font-bold uppercase tracking-widest opacity-60">Lesson #{vid.order}</div>
            </div>
         </div>
      </div>
    </div>
  );
});

const AdminLearning = () => {
  const { categories, videos, loading: academyLoading } = useAcademy();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'categories' | 'videos' | 'files' | 'quiz_studio' | 'program'>('videos');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewVid, setPreviewVid] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Form states
  const [catName, setCatName] = useState("");
  const [vidTitle, setVidTitle] = useState("");
  const [vidDescription, setVidDescription] = useState("");
  const [vidUrl, setVidUrl] = useState("");
  const [vidCatId, setVidCatId] = useState("");
  const [vidOrder, setVidOrder] = useState(1);
  const [vidLocked, setVidLocked] = useState(false);
  const [vidPublished, setVidPublished] = useState(true);
  const [interactiveUnitLabel, setInteractiveUnitLabel] = useState("");
  const [interactiveAnimationTitle, setInteractiveAnimationTitle] = useState("");
  const [interactiveScript, setInteractiveScript] = useState("");
  const [iq1Question, setIq1Question] = useState("");
  const [iq1Options, setIq1Options] = useState("");
  const [iq1CorrectIndex, setIq1CorrectIndex] = useState(0);
  const [iq1Explanation, setIq1Explanation] = useState("");
  const [iq2Question, setIq2Question] = useState("");
  const [iq2Options, setIq2Options] = useState("");
  const [iq2CorrectIndex, setIq2CorrectIndex] = useState(0);
  const [iq2Explanation, setIq2Explanation] = useState("");
  const [miniTaskTitle, setMiniTaskTitle] = useState("");
  const [miniTaskInstruction, setMiniTaskInstruction] = useState("");
  const [miniTaskActionLabel, setMiniTaskActionLabel] = useState("");
  const [miniTaskActionUrl, setMiniTaskActionUrl] = useState("");
  const [miniTaskActionPrompt, setMiniTaskActionPrompt] = useState("");
  const [buildNowLabel, setBuildNowLabel] = useState("");

  // Quiz Studio state
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [studioVideo, setStudioVideo] = useState<any>(null);

  const handleAddQuestion = () => {
     setQuizQuestions([...quizQuestions, { question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  };

  const handleUpdateQuestion = (idx: number, field: string, value: any) => {
     const newQuestions = [...quizQuestions];
     newQuestions[idx][field] = value;
     setQuizQuestions(newQuestions);
  };

  const handleUpdateOption = (qIdx: number, oIdx: number, value: string) => {
     const newQuestions = [...quizQuestions];
     newQuestions[qIdx].options[oIdx] = value;
     setQuizQuestions(newQuestions);
  };

  const handleRemoveQuestion = (idx: number) => {
     setQuizQuestions(quizQuestions.filter((_, i) => i !== idx));
  };

  const saveQuizToVideo = async () => {
     if (!studioVideo) return;
     try {
        await updateDoc(doc(db, "videos", studioVideo.id), {
           quiz: quizQuestions,
           updatedAt: serverTimestamp()
        });
        toast.success("Studio: Quiz Synchronized.");
        setStudioVideo(null);
        setQuizQuestions([]);
     } catch (e) {
        toast.error("Studio Sync Failed.");
     }
  };

  // Files state
  const [files, setFiles] = useState<any[]>([]);
  const [fileTitle, setFileTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileType, setFileType] = useState("PDF");
  const [showFileModal, setShowFileModal] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [learnModules, setLearnModules] = useState<any[]>([]);
  const [learnProjects, setLearnProjects] = useState<any[]>([]);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleKeywords, setModuleKeywords] = useState("");
  const [moduleOrder, setModuleOrder] = useState(1);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectModuleKey, setProjectModuleKey] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDifficulty, setProjectDifficulty] = useState("Medium");
  const [projectPromptTemplate, setProjectPromptTemplate] = useState("");
  const [projectExpectedOutput, setProjectExpectedOutput] = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "videos" || tab === "quiz_studio" || tab === "categories" || tab === "files" || tab === "program") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: 'categories' | 'videos' | 'files' | 'quiz_studio' | 'program') => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  useEffect(() => {
     const unsub = onSnapshot(query(collection(db, "academy_files"), orderBy("createdAt", "desc")), (snap) => {
        setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
     });
     return () => unsub();
  }, []);


  useEffect(() => {
     const unsubModules = onSnapshot(query(collection(db, "learn_modules"), orderBy("order", "asc")), (snap) => {
        setLearnModules(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
     });
     const unsubProjects = onSnapshot(query(collection(db, "learn_projects"), orderBy("order", "asc")), (snap) => {
        setLearnProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
     });
     return () => {
       unsubModules();
       unsubProjects();
     };
  }, []);

  const handleAddVideo = async () => {
    if (!vidTitle || !vidUrl || !vidCatId) return toast.error("Data missing.");
    const safeEmbed = assertSafeYoutubeEmbed(vidUrl);
    if (!safeEmbed) return toast.error("Enter a valid YouTube URL.");
    try {
      const quickQuestions = [
        {
          question: iq1Question.trim(),
          options: iq1Options.split(",").map((s) => s.trim()).filter(Boolean),
          correctIndex: Number(iq1CorrectIndex) || 0,
          explanation: iq1Explanation.trim()
        },
        {
          question: iq2Question.trim(),
          options: iq2Options.split(",").map((s) => s.trim()).filter(Boolean),
          correctIndex: Number(iq2CorrectIndex) || 0,
          explanation: iq2Explanation.trim()
        }
      ].filter((q) => q.question && q.options.length >= 2);

      const scriptLines = interactiveScript
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const interactiveConfig =
        interactiveUnitLabel.trim() ||
        interactiveAnimationTitle.trim() ||
        scriptLines.length > 0 ||
        quickQuestions.length > 0 ||
        miniTaskTitle.trim() ||
        miniTaskInstruction.trim() ||
        miniTaskActionLabel.trim() ||
        miniTaskActionUrl.trim() ||
        miniTaskActionPrompt.trim() ||
        buildNowLabel.trim()
          ? {
              unitLabel: interactiveUnitLabel.trim() || undefined,
              animationTitle: interactiveAnimationTitle.trim() || undefined,
              script: scriptLines.length > 0 ? scriptLines : undefined,
              quickQuestions: quickQuestions.length > 0 ? quickQuestions : undefined,
              miniTask: {
                title: miniTaskTitle.trim() || undefined,
                instruction: miniTaskInstruction.trim() || undefined,
                actionLabel: miniTaskActionLabel.trim() || undefined,
                actionUrl: miniTaskActionUrl.trim() || undefined,
                actionPrompt: miniTaskActionPrompt.trim() || undefined
              },
              buildNowLabel: buildNowLabel.trim() || undefined
            }
          : undefined;

      const vidData = {
        title: vidTitle.trim(),
        description: vidDescription.trim(),
        youtubeEmbedUrl: safeEmbed,
        categoryId: vidCatId,
        order: Number(vidOrder),
        isLocked: vidLocked,
        isPublished: vidPublished,
        quiz: quizQuestions,
        interactiveConfig,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "videos", editingId), vidData);
        toast.success("Lesson updated.");
      } else {
        await addDoc(collection(db, "videos"), { ...vidData, createdAt: serverTimestamp() });
        toast.success("Lesson deployed.");
      }
      resetVideoForm();
    } catch (e) {
       console.error(e);
      toast.error("Upload failed.");
    }
  };

  const handleEditVideo = (vid: any) => {
    setVidTitle(vid.title);
    setVidDescription(vid.description || "");
    setVidUrl(vid.youtubeEmbedUrl);
    setVidCatId(vid.categoryId);
    setVidOrder(vid.order);
    setVidLocked(vid.isLocked || false);
    setVidPublished(vid.isPublished !== false);
    setQuizQuestions(vid.quiz || []);
    setInteractiveUnitLabel(vid.interactiveConfig?.unitLabel || "");
    setInteractiveAnimationTitle(vid.interactiveConfig?.animationTitle || "");
    setInteractiveScript((vid.interactiveConfig?.script || []).join("\n"));
    setIq1Question(vid.interactiveConfig?.quickQuestions?.[0]?.question || "");
    setIq1Options((vid.interactiveConfig?.quickQuestions?.[0]?.options || []).join(", "));
    setIq1CorrectIndex(Number(vid.interactiveConfig?.quickQuestions?.[0]?.correctIndex || 0));
    setIq1Explanation(vid.interactiveConfig?.quickQuestions?.[0]?.explanation || "");
    setIq2Question(vid.interactiveConfig?.quickQuestions?.[1]?.question || "");
    setIq2Options((vid.interactiveConfig?.quickQuestions?.[1]?.options || []).join(", "));
    setIq2CorrectIndex(Number(vid.interactiveConfig?.quickQuestions?.[1]?.correctIndex || 0));
    setIq2Explanation(vid.interactiveConfig?.quickQuestions?.[1]?.explanation || "");
    setMiniTaskTitle(vid.interactiveConfig?.miniTask?.title || "");
    setMiniTaskInstruction(vid.interactiveConfig?.miniTask?.instruction || "");
    setMiniTaskActionLabel(vid.interactiveConfig?.miniTask?.actionLabel || "");
    setMiniTaskActionUrl(vid.interactiveConfig?.miniTask?.actionUrl || "");
    setMiniTaskActionPrompt(vid.interactiveConfig?.miniTask?.actionPrompt || "");
    setBuildNowLabel(vid.interactiveConfig?.buildNowLabel || "");
    setEditingId(vid.id);
    setShowAddModal(true);
  };

  const resetVideoForm = () => {
    setVidTitle("");
    setVidDescription("");
    setVidUrl("");
    setVidCatId("");
    setVidOrder(videos.length + 1);
    setVidLocked(false);
    setVidPublished(true);
    setQuizQuestions([]);
    setInteractiveUnitLabel("");
    setInteractiveAnimationTitle("");
    setInteractiveScript("");
    setIq1Question("");
    setIq1Options("");
    setIq1CorrectIndex(0);
    setIq1Explanation("");
    setIq2Question("");
    setIq2Options("");
    setIq2CorrectIndex(0);
    setIq2Explanation("");
    setMiniTaskTitle("");
    setMiniTaskInstruction("");
    setMiniTaskActionLabel("");
    setMiniTaskActionUrl("");
    setMiniTaskActionPrompt("");
    setBuildNowLabel("");
    setShowAddModal(false);
    setEditingId(null);
  };

  const resetFileForm = () => {
     setFileTitle("");
     setFileUrl("");
     setFileSize("");
     setFileType("PDF");
     setEditingFileId(null);
     setShowFileModal(false);
  };

  const handleDeleteVideo = useCallback(async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await deleteDoc(doc(db, "videos", id));
      toast.success("Deleted.");
    } catch (e) {
      toast.error("Failed.");
    }
  }, []);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredVideos = useMemo(() => 
    videos.filter(v => 
      v.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      categories.find(c => c.id === v.categoryId)?.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || ""
    ),
    [videos, categories, debouncedSearch]
  );

  const handleAddFile = async () => {
     if (!fileTitle || !fileUrl) return toast.error("Data missing.");
     const safeFileUrl = sanitizeExternalUrl(fileUrl);
     if (!safeFileUrl) return toast.error("Enter a valid file URL.");
     try {
        if (editingFileId) {
           await updateDoc(doc(db, "academy_files", editingFileId), {
              name: fileTitle.trim(),
              url: safeFileUrl,
              size: fileSize,
              type: fileType,
              updatedAt: serverTimestamp()
           });
        } else {
           await addDoc(collection(db, "academy_files"), {
              name: fileTitle.trim(),
              url: safeFileUrl,
              size: fileSize,
              type: fileType,
              createdAt: serverTimestamp()
           });
        }
        resetFileForm();
        toast.success("File added.");
     } catch (e) {
        toast.error("Failed.");
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase text-white leading-none mb-1">Academy Studio</h2>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60">Manage your high-performance curriculum.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
             className="px-6 h-10 rounded-lg uppercase font-bold text-[10px] tracking-widest gap-2 bg-primary text-black hover:scale-105 transition-all shadow-xl shadow-primary/20"
             onClick={() => { 
                if (activeTab === 'files') setShowFileModal(true);
                else { resetVideoForm(); setShowAddModal(true); }
             }}
           >
             <PlusCircle size={14} /> Add {activeTab === 'files' ? 'File' : 'Lesson'}
           </Button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 border border-white/10 w-fit rounded-lg shadow-2xl overflow-x-auto no-scrollbar">
         {[
            { id: 'videos', label: 'Videos' },
            { id: 'quiz_studio', label: 'Quiz Studio' },
            { id: 'program', label: 'Program' },
            { id: 'categories', label: 'Categories' },
            { id: 'files', label: 'Files' }
         ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => handleTabChange(tab.id as 'categories' | 'videos' | 'files' | 'quiz_studio' | 'program')}
              className={`px-6 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-black' : 'text-text-muted hover:text-white'}`}
            >
              {tab.label}
            </button>
         ))}
      </div>

      {activeTab === 'videos' ? (
        <div className="space-y-6">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input 
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 bg-[#111] border border-white/5 rounded-lg pl-10 pr-4 text-xs font-medium text-white focus:border-primary/20 outline-none transition-all shadow-xl"
              />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
              {academyLoading ? (
                 <div className="col-span-full py-24 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={32} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Loading Nexus...</p>
                 </div>
              ) : filteredVideos.length > 0 ? filteredVideos.map(vid => (
                <VideoAdminCard 
                  key={vid.id} 
                  vid={vid} 
                  categories={categories} 
                  onDelete={handleDeleteVideo} 
                  onEdit={handleEditVideo}
                  onPreview={setPreviewVid}
                />
              )) : (
                 <div className="col-span-full py-24 border border-dashed border-white/10 rounded-xl text-center opacity-40 font-bold uppercase text-[10px] tracking-widest">No lessons deployed.</div>
              )}
           </div>
        </div>
      ) : activeTab === 'quiz_studio' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="p-8 bg-[#111] border border-white/5 rounded-2xl shadow-2xl relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <BrainCircuit size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold uppercase text-white tracking-tight leading-none mb-1">Quiz Making Studio</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Directly manage and deploy interactive tests.</p>
                 </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                 {/* Video Selector for Quiz */}
                 <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2 px-1">Select Video for Quiz</h4>
                    {videos.map(v => (
                       <button 
                         key={v.id}
                         onClick={() => { setStudioVideo(v); setQuizQuestions(v.quiz || []); }}
                         className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all group ${studioVideo?.id === v.id ? 'bg-primary border-primary text-black shadow-xl shadow-primary/20' : 'bg-black/20 border-white/5 text-text-muted hover:border-primary/20 hover:text-white'}`}
                       >
                          <div className="flex items-center gap-3 overflow-hidden text-left">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${studioVideo?.id === v.id ? 'bg-black text-primary' : 'bg-white/5 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                {v.quiz && v.quiz.length > 0 ? <CheckCircle size={14} /> : <HelpCircle size={14} />}
                             </div>
                             <div className="overflow-hidden">
                                <h5 className="text-[10px] font-bold uppercase truncate">{v.title}</h5>
                                <p className={`text-[8px] font-bold uppercase opacity-60 ${studioVideo?.id === v.id ? 'text-black' : 'text-text-muted'}`}>{v.quiz?.length || 0} Questions</p>
                             </div>
                          </div>
                          <ChevronRight size={14} className={studioVideo?.id === v.id ? 'translate-x-1' : 'opacity-20'} />
                       </button>
                    ))}
                 </div>

                 {/* Studio Editor */}
                 <div className="lg:col-span-2 min-h-[400px]">
                    {studioVideo ? (
                       <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                          <div className="flex justify-between items-center border-b border-white/5 pb-6">
                             <div>
                                <span className="text-[10px] font-bold uppercase text-primary">Editing Quiz For</span>
                                <h4 className="text-lg font-bold uppercase text-white tracking-tight">{studioVideo.title}</h4>
                             </div>
                             <div className="flex gap-3">
                                <Button onClick={handleAddQuestion} variant="ghost" className="h-10 px-6 rounded-lg text-[9px] font-bold uppercase border border-white/5 hover:text-white">
                                   <PlusSquare size={14} className="mr-2" /> Add Question
                                </Button>
                                <Button onClick={saveQuizToVideo} className="h-10 px-8 rounded-lg bg-primary text-black font-bold uppercase text-[9px] shadow-xl shadow-primary/20">
                                   Deploy Quiz
                                </Button>
                             </div>
                          </div>

                          <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 no-scrollbar">
                             {quizQuestions.map((q, qIdx) => (
                                <div key={qIdx} className="p-6 bg-black/40 border border-white/10 rounded-2xl relative group-card shadow-2xl">
                                   <button onClick={() => handleRemoveQuestion(qIdx)} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl">
                                      <Trash2 size={12} />
                                   </button>
                                   <div className="space-y-6">
                                      <div className="space-y-2">
                                         <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20">{qIdx + 1}</span>
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Question Context</label>
                                         </div>
                                         <input value={q.question} onChange={(e) => handleUpdateQuestion(qIdx, 'question', e.target.value)} placeholder="Lesson Verification Inquiry..." className="w-full h-11 bg-black/60 border border-white/5 rounded-lg px-4 text-xs font-bold text-white outline-none focus:border-primary/30 transition-all" />
                                      </div>
                                      <div className="grid grid-cols-2 gap-6">
                                         {q.options.map((opt: string, oIdx: number) => (
                                            <div key={oIdx} className="space-y-2">
                                               <div className="flex items-center justify-between px-1">
                                                  <label className="text-[8px] font-bold uppercase text-text-muted ml-0.5">Response Option {oIdx + 1}</label>
                                                  <button 
                                                    onClick={() => handleUpdateQuestion(qIdx, 'correctIndex', oIdx)}
                                                    className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${q.correctIndex === oIdx ? 'bg-primary border-primary shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'border-white/20'}`}
                                                  >
                                                     {q.correctIndex === oIdx && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                                                  </button>
                                               </div>
                                               <input value={opt} onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)} placeholder="System output..." className={`w-full h-11 bg-black/60 border rounded-lg px-4 text-[10px] font-bold outline-none transition-all ${q.correctIndex === oIdx ? 'border-primary/30 text-primary bg-primary/5' : 'border-white/5 text-white/50 focus:border-white/20'}`} />
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                </div>
                             ))}
                             {quizQuestions.length === 0 && (
                                <div className="py-24 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center space-y-4 opacity-40">
                                   <Zap size={32} />
                                   <p className="text-[10px] font-bold uppercase tracking-widest">No verification protocols active. Add your first question.</p>
                                </div>
                             )}
                          </div>
                       </div>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center space-y-6 border border-dashed border-white/5 rounded-2xl bg-black/10 opacity-30">
                          <Sparkles size={48} />
                          <div className="text-center">
                             <h4 className="text-sm font-bold uppercase text-white mb-2">Studio Interface Idle</h4>
                             <p className="text-[10px] font-bold uppercase tracking-widest">Select a video from the sidebar to start creating.</p>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      ) : activeTab === 'program' ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 bg-[#111] border border-white/10 rounded-xl space-y-4">
            <h3 className="text-sm font-bold uppercase text-white">Manage Learn Modules</h3>
            <input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="Module title" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
            <input value={moduleKeywords} onChange={(e) => setModuleKeywords(e.target.value)} placeholder="Keywords (comma separated)" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
            <input type="number" value={moduleOrder} onChange={(e) => setModuleOrder(Number(e.target.value || 1))} placeholder="Order" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
            <Button
              onClick={async () => {
                if (!moduleTitle.trim()) return toast.error("Module title required.");
                const key = moduleTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
                await setDoc(doc(db, "learn_modules", key), {
                  title: moduleTitle.trim(),
                  keywords: moduleKeywords.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
                  order: moduleOrder,
                  updatedAt: serverTimestamp()
                }, { merge: true });
                setModuleTitle("");
                setModuleKeywords("");
                toast.success("Module saved.");
              }}
              className="h-10 px-5 bg-primary text-black text-[10px] uppercase font-bold"
            >
              Save Module
            </Button>
            <div className="space-y-2">
              {learnModules.map((m) => (
                <div key={m.id} className="p-3 bg-black/30 border border-white/10 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-white">{m.title}</span>
                  <button onClick={async () => { await deleteDoc(doc(db, "learn_modules", m.id)); }} className="text-[10px] text-red-400 uppercase font-bold">Delete</button>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 bg-[#111] border border-white/10 rounded-xl space-y-4">
            <h3 className="text-sm font-bold uppercase text-white">Manage Unlock Projects</h3>
            <input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Project title" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
            <select value={projectModuleKey} onChange={(e) => setProjectModuleKey(e.target.value)} className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white">
              <option value="">Select module key</option>
              {learnModules.map((m) => <option key={m.id} value={m.id} className="bg-[#0B0B0B]">{m.id}</option>)}
            </select>
            <input value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Description" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
            <select value={projectDifficulty} onChange={(e) => setProjectDifficulty(e.target.value)} className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white">
              <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
            </select>
            <textarea value={projectPromptTemplate} onChange={(e) => setProjectPromptTemplate(e.target.value)} placeholder="Prompt template" className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white resize-none" />
            <input value={projectExpectedOutput} onChange={(e) => setProjectExpectedOutput(e.target.value)} placeholder="Expected output" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
            <Button
              onClick={async () => {
                if (!projectTitle.trim() || !projectModuleKey) return toast.error("Title and module required.");
                const key = projectTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
                await setDoc(doc(db, "learn_projects", key), {
                  title: projectTitle.trim(),
                  moduleKey: projectModuleKey,
                  description: projectDescription.trim(),
                  difficulty: projectDifficulty,
                  steps: [],
                  promptTemplate: projectPromptTemplate.trim(),
                  expectedOutput: projectExpectedOutput.trim(),
                  order: Date.now(),
                  updatedAt: serverTimestamp()
                }, { merge: true });
                setProjectTitle("");
                setProjectDescription("");
                setProjectPromptTemplate("");
                setProjectExpectedOutput("");
                toast.success("Project saved.");
              }}
              className="h-10 px-5 bg-primary text-black text-[10px] uppercase font-bold"
            >
              Save Project
            </Button>
            <div className="space-y-2">
              {learnProjects.map((p) => (
                <div key={p.id} className="p-3 bg-black/30 border border-white/10 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-white">{p.title}</span>
                  <button onClick={async () => { await deleteDoc(doc(db, "learn_projects", p.id)); }} className="text-[10px] text-red-400 uppercase font-bold">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'categories' ? (
         <div className="grid lg:grid-cols-2 gap-8 px-1">
             <div className="p-8 bg-[#111] border border-white/5 rounded-2xl h-fit shadow-2xl">
                <h3 className="text-sm font-bold uppercase text-white mb-8 flex items-center gap-2">
                   <Layers size={16} className="text-primary" />
                   {editingCatId ? "Update Category" : "New Category"}
                </h3>
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Category Name</label>
                     <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Fundamental Logic" className="w-full h-12 bg-[#0B0B0B] border border-white/10 rounded-lg px-4 text-xs font-bold text-white focus:border-primary/20 outline-none block transition-all" />
                  </div>
                  <Button onClick={() => {
                     if(!catName) return;
                     if(editingCatId) {
                        updateDoc(doc(db, "video_categories", editingCatId), { name: catName, updatedAt: serverTimestamp() });
                        setEditingCatId(null); toast.success("Renamed.");
                     } else {
                        addDoc(collection(db, "video_categories"), { name: catName, createdAt: serverTimestamp() });
                        toast.success("Created.");
                     }
                     setCatName("");
                  }} className="w-full h-12 bg-primary text-black font-bold uppercase text-[10px] tracking-widest rounded-xl transition-transform active:scale-95 shadow-xl shadow-primary/10">
                     {editingCatId ? "Apply Changes" : "Create Now"}
                  </Button>
               </div>
            </div>
            <div className="space-y-4">
               {categories.map(cat => (
                  <div key={cat.id} className="p-6 bg-[#111] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-all shadow-xl">
                     <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors"><Layers size={18} /></div>
                        <div><h4 className="text-sm font-bold text-white uppercase tracking-tight">{cat.name}</h4><p className="text-[8px] font-bold uppercase text-text-muted tracking-widest">Active Folder</p></div>
                     </div>
                     <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                        <button onClick={() => { setCatName(cat.name); setEditingCatId(cat.id); }} className="p-2 text-text-muted hover:text-white"><Edit3 size={16} /></button>
                        <button onClick={async () => { if(confirm("Delete category?")) { await deleteDoc(doc(db, "video_categories", cat.id)); toast.success("Removed."); } }} className="p-2 text-text-muted hover:text-red-500"><Trash2 size={16} /></button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      ) : (
         <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
               {files.map(file => (
                  <div key={file.id} className="p-6 bg-[#111] border border-white/5 rounded-2xl group hover:border-primary/20 transition-all relative shadow-2xl min-h-[160px] flex flex-col justify-between">
                     <div className="absolute top-4 right-4 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                        <button onClick={() => { setFileTitle(file.name); setFileUrl(file.url); setFileSize(file.size); setFileType(file.type); setEditingFileId(file.id); setShowFileModal(true); }} className="p-1.5 text-text-muted hover:text-white"><Edit3 size={12} /></button>
                        <button onClick={async () => { if(confirm("Remove file?")) { await deleteDoc(doc(db, "academy_files", file.id)); toast.success("Removed."); } }} className="p-1.5 text-text-muted hover:text-red-500"><Trash2 size={12} /></button>
                     </div>
                     <div>
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted mb-4 group-hover:text-primary transition-colors"><FileText size={20} /></div>
                        <h4 className="text-xs font-bold uppercase text-white mb-1 truncate">{file.name}</h4>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">{file.size} • {file.type}</span>
                     </div>
                  </div>
               ))}
               {files.length === 0 && (
                  <div className="col-span-full py-24 border border-dashed border-white/10 rounded-2xl text-center opacity-40 font-bold uppercase text-[10px] tracking-widest">No technical files added.</div>
               )}
            </div>
         </div>
      )}

      {/* Synchronize Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md overflow-y-auto">
           <div className="w-full max-w-2xl bg-[#0B0B0B] border border-white/10 rounded-2xl p-10 relative my-8 shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="absolute top-6 right-6">
                 <button onClick={resetVideoForm} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white transition-all"><X size={20} /></button>
              </div>
              
              <h3 className="text-xl font-bold uppercase text-white mb-8 tracking-tight">Lesson Configuration</h3>
              
              <div className="space-y-8">
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2 col-span-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-0.5">Lesson Title</label>
                       <input value={vidTitle} onChange={(e) => setVidTitle(e.target.value)} placeholder="e.g. Advanced System Architecture" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white focus:border-primary/30 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-0.5">YouTube Link</label>
                       <input value={vidUrl} onChange={(e) => setVidUrl(e.target.value)} placeholder="Video URL" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white focus:border-primary/30 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-0.5">Category</label>
                       <select value={vidCatId} onChange={(e) => setVidCatId(e.target.value)} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white/60 outline-none focus:border-primary/30">
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id} className="bg-[#0B0B0B]">{c.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-5 bg-[#111] border border-white/5 rounded-2xl shadow-xl">
                       <div className="flex items-center gap-2"><Globe2 size={16} className="text-primary" /><span className="text-[10px] font-bold uppercase tracking-widest text-white">Public Lesson</span></div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input type="checkbox" checked={vidPublished} onChange={(e) => setVidPublished(e.target.checked)} className="sr-only peer" />
                         <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full shadow-inner" />
                       </label>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-[#111] border border-white/5 rounded-2xl shadow-xl">
                       <div className="flex items-center gap-2"><Lock size={16} className="text-orange-500" /><span className="text-[10px] font-bold uppercase tracking-widest text-white">Locked Lesson</span></div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input type="checkbox" checked={vidLocked} onChange={(e) => setVidLocked(e.target.checked)} className="sr-only peer" />
                         <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full shadow-inner" />
                       </label>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-0.5">Description & Links</label>
                    <textarea value={vidDescription} onChange={(e) => setVidDescription(e.target.value)} placeholder="Lesson details and technical instructions..." className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-5 text-xs font-medium text-white outline-none resize-none focus:border-primary/30 transition-all shadow-inner" />
                 </div>

                 <div className="space-y-4 border border-white/10 rounded-xl p-4 bg-black/30">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Interactive Learning (Optional Override)</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input value={interactiveUnitLabel} onChange={(e) => setInteractiveUnitLabel(e.target.value)} placeholder="Unit Label" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                      <input value={interactiveAnimationTitle} onChange={(e) => setInteractiveAnimationTitle(e.target.value)} placeholder="Animation Title" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                    </div>
                    <textarea value={interactiveScript} onChange={(e) => setInteractiveScript(e.target.value)} placeholder="Script lines (one line per row)" className="w-full h-20 bg-white/5 border border-white/10 rounded-lg p-3 text-[11px] text-white resize-none" />
                    <div className="grid md:grid-cols-2 gap-4">
                      <input value={iq1Question} onChange={(e) => setIq1Question(e.target.value)} placeholder="Interactive Q1" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                      <input value={iq1Options} onChange={(e) => setIq1Options(e.target.value)} placeholder="Q1 options (comma separated)" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                      <input type="number" min={0} max={3} value={iq1CorrectIndex} onChange={(e) => setIq1CorrectIndex(Number(e.target.value || 0))} placeholder="Q1 correct index" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                      <input value={iq1Explanation} onChange={(e) => setIq1Explanation(e.target.value)} placeholder="Q1 explanation" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input value={iq2Question} onChange={(e) => setIq2Question(e.target.value)} placeholder="Interactive Q2" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                      <input value={iq2Options} onChange={(e) => setIq2Options(e.target.value)} placeholder="Q2 options (comma separated)" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                      <input type="number" min={0} max={3} value={iq2CorrectIndex} onChange={(e) => setIq2CorrectIndex(Number(e.target.value || 0))} placeholder="Q2 correct index" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                      <input value={iq2Explanation} onChange={(e) => setIq2Explanation(e.target.value)} placeholder="Q2 explanation" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input value={miniTaskTitle} onChange={(e) => setMiniTaskTitle(e.target.value)} placeholder="Mini Task Title" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                      <input value={miniTaskInstruction} onChange={(e) => setMiniTaskInstruction(e.target.value)} placeholder="Mini Task Instruction" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                      <input value={miniTaskActionLabel} onChange={(e) => setMiniTaskActionLabel(e.target.value)} placeholder="Mini Task Action Label" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                      <input value={miniTaskActionUrl} onChange={(e) => setMiniTaskActionUrl(e.target.value)} placeholder="Mini Task Action URL" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white" />
                      <input value={miniTaskActionPrompt} onChange={(e) => setMiniTaskActionPrompt(e.target.value)} placeholder="Mini Task AI Prompt" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white md:col-span-2" />
                      <input value={buildNowLabel} onChange={(e) => setBuildNowLabel(e.target.value)} placeholder="Build Now Label" className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white md:col-span-2" />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <Button onClick={handleAddVideo} className="flex-1 h-14 bg-primary text-black font-bold uppercase text-[10px] tracking-[0.2em] rounded-xl transition-all active:scale-95 shadow-xl shadow-primary/20">Save Lesson</Button>
                    <Button onClick={resetVideoForm} variant="ghost" className="h-14 px-8 text-[10px] font-bold uppercase text-text-muted hover:text-white border border-white/5 rounded-xl">Cancel</Button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Preview and File Modals */}
      {previewVid && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/98 backdrop-blur-xl">
           <div className="w-full max-w-5xl bg-[#0B0B0B] border border-white/10 rounded-3xl overflow-hidden relative shadow-[0_0_80px_rgba(0,0,0,0.8)]">
              <button onClick={() => setPreviewVid(null)} className="absolute top-8 right-8 z-10 w-12 h-12 rounded-2xl bg-black/80 border border-white/10 flex items-center justify-center text-white hover:bg-destructive transition-all shadow-2xl"><X size={24} /></button>
              <div className="aspect-video w-full bg-black"><iframe className="w-full h-full" src={`${assertSafeYoutubeEmbed(previewVid.youtubeEmbedUrl) || "about:blank"}?autoplay=1&rel=0&modestbranding=1`} allowFullScreen /></div>
              <div className="p-12 space-y-6">
                 <h3 className="text-2xl font-bold uppercase text-white tracking-tighter">{previewVid.title}</h3>
                 <p className="text-sm text-text-muted leading-relaxed max-w-4xl font-medium">{previewVid.description}</p>
                 <div className="pt-10 flex justify-end gap-4 border-t border-white/5">
                    <Button variant="ghost" onClick={() => setPreviewVid(null)} className="text-[10px] uppercase font-bold text-text-muted rounded-xl px-8 h-12 border border-white/5">Close Preview</Button>
                    <Button onClick={() => { setPreviewVid(null); handleEditVideo(previewVid); }} className="h-12 px-10 bg-primary text-black font-bold text-[10px] uppercase rounded-xl tracking-widest shadow-xl shadow-primary/20">Edit Lesson</Button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showFileModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-lg bg-[#0B0B0B] border border-white/10 rounded-3xl p-10 relative shadow-2xl">
               <button onClick={resetFileForm} className="absolute top-8 right-8 text-text-muted hover:text-white transition-all"><X size={20} /></button>
               <h3 className="text-xl font-bold uppercase text-white mb-10 tracking-tight">Upload Resource</h3>
               <div className="space-y-8">
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-text-muted ml-1">File Name</label><input value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} placeholder="e.g. Technical Whitepaper" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-primary/30" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-text-muted ml-1">Download URL</label><input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="Drop box link, etc." className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-primary/30" /></div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-text-muted ml-1">File Size</label><input value={fileSize} onChange={(e) => setFileSize(e.target.value)} placeholder="Auto" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none" /></div>
                     <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-text-muted ml-1">Extension</label><select value={fileType} onChange={(e) => setFileType(e.target.value)} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white/70 outline-none"><option value="PDF">PDF ARCHIVE</option><option value="ZIP">ZIP PAYLOAD</option><option value="JPG">IMAGE</option><option value="MP4">RAW VIDEO</option></select></div>
                  </div>
                  <Button onClick={handleAddFile} className="w-full h-14 bg-primary text-black font-bold uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-xl shadow-primary/20">Sync Cloud Resource</Button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

export default memo(AdminLearning);

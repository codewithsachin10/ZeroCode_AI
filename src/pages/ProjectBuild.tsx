import { useState, useEffect } from "react";
import { 
  Terminal, 
  ArrowLeft, 
  Zap, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  ImageIcon,
  ShieldCheck,
  Send,
  Info,
  Layers,
  Code,
  Sparkles,
  RefreshCw,
  Clock,
  XCircle,
  Play,
  Share2,
  Plus,
  CheckSquare,
  Square,
  ListTodo
} from "lucide-react";
import { 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc,
  collection, 
  serverTimestamp,
  query,
  where,
  getDocs,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ProjectBuild() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [userProjectStatus, setUserProjectStatus] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  const [formData, setFormData] = useState({
    projectLink: "",
    images: [""]
  });

  useEffect(() => {
    if (!id || !user) return;

    const fetchProjectAndState = async () => {
      try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().isPublished) {
          setProject({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Build target unavailable");
          navigate("/projects");
          return;
        }

        // Real-time tracking of user project state
        const upRef = doc(db, "user_projects", `${user.uid}_${id}`);
        const unsubState = onSnapshot(upRef, (upSnap) => {
          if (upSnap.exists()) {
             setUserProjectStatus({ id: upSnap.id, ...upSnap.data() });
          }
        });

        // Real-time tracking of submission
        const q = query(collection(db, "project_submissions"), where("projectId", "==", id), where("userId", "==", user.uid));
        const unsubSub = onSnapshot(q, (subSnap) => {
          if (!subSnap.empty) {
             const subData = subSnap.docs[0].data();
             setSubmission({ id: subSnap.docs[0].id, ...subData });
             setFormData({
               projectLink: subData.projectLink || "",
               images: subData.images?.length ? subData.images : [""]
             });
          }
        });

        return () => {
          unsubState();
          unsubSub();
        };

      } catch (err) {
        toast.error("Sync failure");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndState();
  }, [id, user, navigate]);

  const handleStartProject = async () => {
    if (!user || starting) return;
    setStarting(true);
    try {
      const upRef = doc(db, "user_projects", `${user.uid}_${id}`);
      await setDoc(upRef, {
        userId: user.uid,
        projectId: id,
        status: "in-progress",
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Build sequence initialized.");
    } catch (err) {
      toast.error("Initialization failed.");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Authentication required");
    if (!formData.projectLink) return toast.error("Production URL required");

    setSubmitting(true);
    try {
      const subPayload = {
        projectId: id,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0],
        projectLink: formData.projectLink,
        images: formData.images.filter(img => img.trim()),
        status: "pending",
        submittedAt: serverTimestamp()
      };

      if (submission) {
        await updateDoc(doc(db, "project_submissions", submission.id), subPayload);
        toast.success("Submission successfully updated.");
      } else {
        await addDoc(collection(db, "project_submissions"), subPayload);
        
        // Update user project status to completed (pending review)
        const upRef = doc(db, "user_projects", `${user.uid}_${id}`);
        await updateDoc(upRef, { 
          status: "submitted", 
          submittedAt: serverTimestamp() 
        });
        
        toast.success("Project staged for audit.");
      }
    } catch (err) {
      toast.error("Deployment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStep = async (stepIdx: number) => {
    if (!user || !userProjectStatus) return;
    
    const currentSteps = userProjectStatus.completedSteps || [];
    let newSteps = [];
    
    if (currentSteps.includes(stepIdx)) {
      newSteps = currentSteps.filter((s: number) => s !== stepIdx);
    } else {
      newSteps = [...currentSteps, stepIdx];
    }
    
    try {
      const upRef = doc(db, "user_projects", `${user.uid}_${id}`);
      await updateDoc(upRef, { 
        completedSteps: newSteps,
        updatedAt: serverTimestamp() 
      });
    } catch (err) {
      toast.error("Progress sync failed");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Build link hashed to clipboard.");
  };

  const addImageField = () => setFormData({ ...formData, images: [...formData.images, ""] });
  const updateImage = (idx: number, val: string) => {
    const newImgs = [...formData.images];
    newImgs[idx] = val;
    setFormData({ ...formData, images: newImgs });
  };

  if (loading) return (
     <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Syncing Build Node...</p>
     </div>
  );

  const statusColors: any = {
    "pending": "text-[#eab308] bg-[#eab308]/10 border-[#eab308]/20",
    "approved": "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20",
    "rejected": "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20"
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-20 pt-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
           <Link to="/projects" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors">
              <ArrowLeft size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Return to Hub</span>
           </Link>
           <button onClick={handleShare} className="text-text-muted hover:text-primary transition-colors flex items-center gap-2">
              <Share2 size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Hash Link</span>
           </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
           {/* Detailed Instructions */}
           <div className="lg:col-span-7 space-y-12">
              <div className="space-y-4">
                 <div className="flex gap-3">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                       project.difficulty === 'Hard' ? 'bg-[#ef4444]/10 border-[#ef4444]/20 text-[#ef4444]' : 
                       project.difficulty === 'Medium' ? 'bg-[#eab308]/10 border-[#eab308]/20 text-[#eab308]' :
                       'bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e]'
                    }`}>
                       <Zap size={10} />
                       <span className="text-[9px] font-black uppercase tracking-widest italic">{project.difficulty} Engineering</span>
                    </div>
                    {userProjectStatus?.status && (
                       <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-white/5 border-white/10 text-white/60">
                          <Clock size={10} />
                          <span className="text-[9px] font-black uppercase tracking-widest italic">{userProjectStatus.status === 'in-progress' ? 'In Progress' : 'Deployed'}</span>
                       </div>
                    )}
                 </div>
                 <h1 className="text-4xl font-black text-white uppercase tracking-tight italic leading-tight">{project.title}</h1>
                 <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] leading-relaxed max-w-lg opacity-40">
                    {project.description}
                 </p>
              </div>

              {!userProjectStatus ? (
                 <div className="p-8 bg-primary/5 border border-primary/10 rounded-[2px] space-y-6">
                    <div className="flex items-center gap-3">
                       <Play size={16} className="text-primary" />
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Initialize Build Sequence</h3>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed font-bold uppercase tracking-tight opacity-60">
                       Ready to start? Initializing this project will mark it as 'In Progress' in your profile tracker.
                    </p>
                    <Button 
                      onClick={handleStartProject}
                      disabled={starting}
                      className="h-12 px-8 bg-primary text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-[2px]"
                    >
                      {starting ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                      Initialize Forge Core
                    </Button>
                 </div>
              ) : (
                 <div className="space-y-12">
                    <div className="space-y-8">
                       <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <div className="flex items-center gap-3">
                             <ListTodo size={16} className="text-primary" />
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Engineering Checkpoints</h3>
                          </div>
                          <div className="text-[9px] font-black uppercase text-text-muted italic opacity-40">
                             {userProjectStatus?.completedSteps?.length || 0} / {project.instructions?.split('\n').filter((s: string) => s.trim()).length || 0} COMPLETED
                          </div>
                       </div>
                       
                       <div className="space-y-4">
                          {project.instructions?.split('\n').filter((l: string) => l.trim()).map((step: string, idx: number) => {
                             const isDone = userProjectStatus?.completedSteps?.includes(idx);
                             return (
                                <button 
                                  key={idx}
                                  onClick={() => handleToggleStep(idx)}
                                  className={`w-full flex items-start gap-4 p-5 rounded-[2px] border transition-all text-left group ${
                                    isDone 
                                    ? 'bg-primary/5 border-primary/20 opacity-60' 
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                  }`}
                                >
                                   <div className={`mt-0.5 shrink-0 transition-colors ${isDone ? 'text-primary' : 'text-text-muted opacity-40 group-hover:opacity-100'}`}>
                                      {isDone ? <CheckSquare size={16} /> : <Square size={16} />}
                                   </div>
                                   <p className={`text-[13px] font-bold leading-relaxed transition-all ${isDone ? 'text-text-muted line-through opacity-60' : 'text-text-secondary'}`}>
                                      {step.replace(/^\d+\.\s*/, '')}
                                   </p>
                                </button>
                             );
                          })}
                          {(!project.instructions || project.instructions.trim().length === 0) && (
                             <p className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-20 italic p-8 text-center border border-dashed border-white/5 rounded-[2px]">Initialize build data for instructions...</p>
                          )}
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                             <Layers size={16} className="text-primary" />
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Verification Stack</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                             {project.techStack?.split(',').map((tech: string) => (
                                <span key={tech} className="px-3 py-1 bg-white/5 border border-white/5 rounded-[2px] text-[10px] font-black uppercase text-text-secondary tracking-widest">
                                   {tech.trim()}
                                </span>
                             ))}
                          </div>
                       </div>
                       
                       {project.exampleOutput && (
                          <div className="space-y-6">
                             <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                <Eye size={16} className="text-primary" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Example Prototype</h3>
                             </div>
                             <a 
                               href={project.exampleOutput} 
                               target="_blank" 
                               className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-[2px] group opacity-60 hover:opacity-100 transition-all"
                             >
                                <span className="text-[9px] font-black uppercase tracking-widest">View Concept Demo</span>
                                <ExternalLink size={14} className="group-hover:text-primary transition-colors" />
                             </a>
                          </div>
                       )}
                    </div>

                    <div className="pt-8 border-t border-white/5">
                       <Button asChild variant="outline" className="h-10 border-white/5 bg-transparent text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-primary gap-2">
                          <a href={`https://chat.zerocode.ai/?prompt=Help me build this project: ${project.title}`} target="_blank">
                             <Sparkles size={14} /> AI Build Assistant
                          </a>
                       </Button>
                    </div>
                 </div>
              )}
           </div>

           {/* Submission Controller */}
           <div className="lg:col-span-5">
              <div className={`p-8 bg-[#0B0B0B] border border-white/5 rounded-[2px] sticky top-10 space-y-8 shadow-2xl overflow-hidden relative ${!userProjectStatus ? 'opacity-20 pointer-events-none' : ''}`}>
                 <div className="absolute inset-0 bg-primary/5 opacity-40 pointer-events-none blur-3xl translate-y-20 -translate-x-10" />
                 
                 <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                       <div className="flex items-center gap-3">
                          <Send size={16} className="text-primary" />
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Final Deployment</h3>
                       </div>
                       {submission && (
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[2px] border ${statusColors[submission.status]}`}>
                             Audit: {submission.status}
                          </span>
                       )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-text-muted italic">Production URL (Vercel/Netlify)</label>
                          <div className="relative">
                             <ExternalLink size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40" />
                             <input 
                               value={formData.projectLink}
                               onChange={(e) => setFormData({...formData, projectLink: e.target.value})}
                               placeholder="https://build-target.vercel.app"
                               className="w-full h-11 bg-black border border-white/5 rounded-[2px] pl-12 pr-4 text-xs font-bold text-white focus:border-primary/20 transition-all outline-none italic placeholder:opacity-20"
                             />
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="flex items-center justify-between">
                             <label className="text-[9px] font-black uppercase tracking-widest text-text-muted italic">Build Evidence (Image URLs)</label>
                             <button type="button" onClick={addImageField} className="text-[9px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-all flex items-center gap-1">
                                <Plus size={12} /> Add More
                             </button>
                          </div>
                          <div className="space-y-2">
                             {formData.images.map((url, i) => (
                                <input 
                                  key={i}
                                  value={url}
                                  onChange={(e) => updateImage(i, e.target.value)}
                                  placeholder="https://screenshot-host.com/..."
                                  className="w-full h-10 bg-black border border-white/5 rounded-[2px] px-4 text-[10px] font-bold text-white focus:border-primary/20 transition-all outline-none italic placeholder:opacity-20"
                                />
                             ))}
                          </div>
                       </div>

                       <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[2px] flex items-start gap-3">
                          <ShieldCheck size={16} className="text-primary shrink-0" />
                          <p className="text-[8px] font-black uppercase tracking-widest text-text-muted leading-relaxed italic opacity-40">
                             Auditors will verify your build link and visuals. Approval grants project badges and showcase status.
                          </p>
                       </div>

                       <Button 
                         type="submit" 
                         disabled={submitting}
                         className="w-full h-14 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-[2px] hover:scale-[1.01] transition-all"
                       >
                         {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send className="mr-2" size={16} />}
                         {submission ? 'Resubmit Build' : 'Finalize Prototype'}
                       </Button>
                    </form>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import Layout from "@/components/Layout";
import { 
  Play, ChevronRight, ChevronLeft, Clock, CheckCircle2, Lock, 
  Sparkles, TrendingUp, ArrowLeft, ShieldCheck, LayoutPanelLeft,
  Loader2, Bookmark, Share2, Award, Zap, ExternalLink, FileText,
  AlertCircle, HelpCircle, Trophy, RefreshCw, Database, Bug, Brush, KeyRound, Server, Globe
} from "lucide-react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { 
  doc, getDoc, setDoc, updateDoc, serverTimestamp, 
  onSnapshot, query, collection, where, getDocs
} from "firebase/firestore";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAcademy } from "@/context/AcademyContext";
import { assertSafeYoutubeEmbed } from "@/lib/security";
import AppLoader from "@/components/ui/AppLoader";
import { getInteractiveLessonPack, mergeInteractiveLessonPack } from "@/lib/interactiveLearning";

// Simplified Player Overlay
const PlayOverlay = memo(({ video, isLocked, onClick }: any) => (
  <div 
    onClick={isLocked ? undefined : onClick}
    className={`absolute inset-0 z-20 flex flex-col items-center justify-center ${isLocked ? 'bg-black/90 cursor-not-allowed' : 'bg-black/40 hover:bg-black/20 cursor-pointer group transition-all duration-500'}`}
  >
     {isLocked ? (
        <div className="flex flex-col items-center text-center space-y-4 px-6 animate-in fade-in zoom-in">
           <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-2xl">
              <Lock size={32} />
           </div>
           <h3 className="text-xl font-bold uppercase text-white tracking-tight">Access Locked</h3>
           <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted max-w-[200px]">Finish previous lessons to open this one.</p>
        </div>
     ) : (
        <>
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center shadow-2xl backdrop-blur-md group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-500">
                    <Play size={36} fill="currentColor" className="ml-1" />
                </div>
            </div>
           <div className="mt-8 text-center">
              <h3 className="text-2xl font-bold uppercase text-white tracking-widest group-hover:tracking-[0.1em] transition-all">{video?.title}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary opacity-60 mt-2">Start Lesson</p>
           </div>
        </>
     )}
  </div>
));

const VideoPlayer = () => {
  const { videoId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, profile } = useUser();
  const { videos, categories } = useAcademy();
  const navigate = useNavigate();

  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dbProgress, setDbProgress] = useState<any>(null);
  const [localProgress, setLocalProgress] = useState(0); // Real-time UI progress
  const [playerReady, setPlayerReady] = useState(false);
  
  // Quiz State
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [wrongQuestionIndexes, setWrongQuestionIndexes] = useState<number[]>([]);
  const [lastQuizScore, setLastQuizScore] = useState<number | null>(null);
  const [learningQIdx, setLearningQIdx] = useState(0);
  const [learningSelected, setLearningSelected] = useState<number | null>(null);
  const [learningFeedback, setLearningFeedback] = useState<null | { ok: boolean; text: string }>(null);

  const playerRef = useRef<any>(null);
  const syncTimer = useRef<any>(null);
  const uiTimer = useRef<any>(null);
  const videoSectionRef = useRef<HTMLDivElement | null>(null);
  const interactiveSectionRef = useRef<HTMLDivElement | null>(null);
  const quizSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
     if (!videoId || !/^[A-Za-z0-9_-]{8,128}$/.test(videoId)) {
        setNotFound(true);
        setLoading(false);
        return;
     }
     const found = videos.find(v => v.id === videoId);
     if (found) {
        setVideo(found);
        setNotFound(false);
        setLoading(false);
     } else {
        getDoc(doc(db, "videos", videoId)).then(d => {
           if (d.exists()) {
             setVideo({ id: d.id, ...d.data() });
             setNotFound(false);
           } else {
             setNotFound(true);
           }
           setLoading(false);
        });
     }
  }, [videoId, videos]);

  useEffect(() => {
    if (!user || !videoId) return;
    const unsub = onSnapshot(doc(db, "user_video_progress", `${user.uid}_${videoId}`), (snap) => {
       if (snap.exists()) {
          const data = snap.data();
          setDbProgress(data);
          // Only update local progress from DB if local is behind (first load or finished)
          if (localProgress === 0) setLocalProgress(Math.round(data.progressPercentage || 0));
       }
    });
    return () => unsub();
  }, [user, videoId, localProgress]);

  // Handle YouTube API
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const onPlayerReady = (event: any) => {
     setPlayerReady(true);
     playerRef.current = event.target;
  };

  const onPlayerStateChange = useCallback((event: any) => {
    if (event.data === (window as any).YT.PlayerState.PLAYING) {
      if (!isPlaying) setIsPlaying(true);
      startTracking();
    } else {
      stopTracking();
      // If paused or ended, sync one last time
      if (playerRef.current && playerRef.current.getCurrentTime) {
         const time = playerRef.current.getCurrentTime();
         const duration = playerRef.current.getDuration();
         if (duration > 0) syncProgress(time, (time / duration) * 100);
      }
    }
  }, [videoId, video, isPlaying]);

  const startTracking = () => {
     // UI Timer - 1 second for smooth bar
     if (uiTimer.current) clearInterval(uiTimer.current);
     uiTimer.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
           const time = playerRef.current.getCurrentTime();
           const duration = playerRef.current.getDuration();
           if (duration > 0) {
              const currentPercent = Math.round((time / duration) * 100);
              setLocalProgress(currentPercent);
           }
        }
     }, 1000);

     // Sync Timer - 10 seconds for DB performance
     if (syncTimer.current) clearInterval(syncTimer.current);
     syncTimer.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
           const time = playerRef.current.getCurrentTime();
           const duration = playerRef.current.getDuration();
           if (duration > 0) syncProgress(time, (time / duration) * 100);
        }
     }, 10000);
  };

  const stopTracking = () => {
     if (uiTimer.current) { clearInterval(uiTimer.current); uiTimer.current = null; }
     if (syncTimer.current) { clearInterval(syncTimer.current); syncTimer.current = null; }
  };

  const syncProgress = async (time: number, percent: number) => {
     if (!user || !videoId || !video) return;

     const isVideoFinished = percent >= 92; // Buffer for ending
     const currentDbCompleted = dbProgress?.isCompleted || false;
     const isfullyCompleted = currentDbCompleted || (isVideoFinished && (!video.quiz || video.quiz.length === 0));

     try {
        const progressRef = doc(db, "user_video_progress", `${user.uid}_${videoId}`);
        await setDoc(progressRef, {
           userId: user.uid,
           videoId,
           categoryId: video.categoryId,
           isCompleted: isfullyCompleted,
           progressPercentage: Math.max(percent, dbProgress?.progressPercentage || 0),
           lastWatchedTime: time,
           updatedAt: serverTimestamp()
        }, { merge: true });

        if (isfullyCompleted && !currentDbCompleted) {
           toast.success("Progress Synchronized.");
           checkCategoryCompletion(video.categoryId);
        }
     } catch (e) {
        console.error("Sync Pulse Error:", e);
     }
  };

  const checkCategoryCompletion = async (catId: string) => {
     if (!user || !catId || !profile) return;
     try {
        const catVideosSnap = await getDocs(query(collection(db, "videos"), where("categoryId", "==", catId)));
        const catVideoIds = catVideosSnap.docs.map(d => d.id);
        
        const userProgressSnap = await getDocs(query(
           collection(db, "user_video_progress"), 
           where("userId", "==", user.uid),
           where("categoryId", "==", catId),
           where("isCompleted", "==", true)
        ));
        
        const completedIds = userProgressSnap.docs.map(d => d.data().videoId);
        const allCompleted = catVideoIds.every(id => completedIds.includes(id));
        const meetsProgramRequirement = catVideoIds.length >= 6;

        if (allCompleted && meetsProgramRequirement) {
           const certId = `${user.uid}_${catId}`;
           const certRef = doc(db, "certificates", certId);
           const certSnap = await getDoc(certRef);
           
           if (!certSnap.exists()) {
              const catObj = categories.find(c => c.id === catId);
              await setDoc(certRef, {
                 userId: user.uid,
                 userName: profile.name,
                 categoryId: catId,
                 categoryName: catObj?.name || "Member Pathway",
                 issuedAt: serverTimestamp(),
                 certificateUrl: `/learn/certificate/${catId}`
              });
              toast.success("Certificate Issued.");
           }
        }
     } catch (e) {
        console.error("Cert Check Error:", e);
     }
  };

  const pathwayVideos = useMemo(() => 
    videos.filter(v => v.categoryId === video?.categoryId && v.isPublished !== false),
    [videos, video]
  );

  const currentVideoIndex = pathwayVideos.findIndex(v => v.id === videoId);
  const nextVideo = pathwayVideos[currentVideoIndex + 1];

  const userProgressRecords = useMemo(() => {
    // This part would ideally be in a context if we want all progress at once
    // But for current view, we can rely on a simplified 'locked' check
    return videos.map(v => v.id); // placeholder
  }, [videos]);

  // Simplified lock check for current video
  const [allUserProgress, setAllUserProgress] = useState<Record<string, any>>({});
  useEffect(() => {
     if (!user) return;
     const unsub = onSnapshot(query(collection(db, "user_video_progress"), where("userId", "==", user.uid)), (snap) => {
        const prog: Record<string, any> = {};
        snap.docs.forEach(d => { prog[d.data().videoId] = d.data(); });
        setAllUserProgress(prog);
     });
     return () => unsub();
  }, [user]);

  const isLocked = useMemo(() => {
     if (currentVideoIndex === 0) return false;
     const prevVidId = pathwayVideos[currentVideoIndex - 1]?.id;
     return !allUserProgress[prevVidId]?.isCompleted && video?.isLocked;
  }, [currentVideoIndex, pathwayVideos, allUserProgress, video]);
  const safeEmbedUrl = useMemo(() => assertSafeYoutubeEmbed(video?.youtubeEmbedUrl || ""), [video?.youtubeEmbedUrl]);
  const interactivePack = useMemo(() => {
    const categoryName = categories.find((c) => c.id === video?.categoryId)?.name || "General";
    const base = getInteractiveLessonPack(video?.title || "Lesson", categoryName);
    return mergeInteractiveLessonPack(base, video?.interactiveConfig);
  }, [video?.title, video?.categoryId, video?.interactiveConfig, categories]);
  const effectiveQuiz = useMemo(() => {
    if (video?.quiz && video.quiz.length > 0) return video.quiz;
    return interactivePack.fullQuiz;
  }, [video?.quiz, interactivePack.fullQuiz]);
  const animationTheme = useMemo(() => {
    const unit = interactivePack.unitLabel.toLowerCase();
    if (unit.includes("authentication")) {
      return {
        accent: "text-emerald-300",
        chip: "bg-emerald-500/15 border-emerald-400/30 text-emerald-300",
        panel: "from-emerald-500/10 to-cyan-500/10",
        step: "border-emerald-400/30 bg-emerald-500/10"
      };
    }
    if (unit.includes("database")) {
      return {
        accent: "text-violet-300",
        chip: "bg-violet-500/15 border-violet-400/30 text-violet-300",
        panel: "from-violet-500/10 to-fuchsia-500/10",
        step: "border-violet-400/30 bg-violet-500/10"
      };
    }
    if (unit.includes("backend")) {
      return {
        accent: "text-orange-300",
        chip: "bg-orange-500/15 border-orange-400/30 text-orange-300",
        panel: "from-orange-500/10 to-amber-500/10",
        step: "border-orange-400/30 bg-orange-500/10"
      };
    }
    if (unit.includes("testing")) {
      return {
        accent: "text-rose-300",
        chip: "bg-rose-500/15 border-rose-400/30 text-rose-300",
        panel: "from-rose-500/10 to-red-500/10",
        step: "border-rose-400/30 bg-rose-500/10"
      };
    }
    if (unit.includes("ui/ux")) {
      return {
        accent: "text-pink-300",
        chip: "bg-pink-500/15 border-pink-400/30 text-pink-300",
        panel: "from-pink-500/10 to-indigo-500/10",
        step: "border-pink-400/30 bg-pink-500/10"
      };
    }
    return {
      accent: "text-cyan-300",
      chip: "bg-cyan-500/15 border-cyan-400/30 text-cyan-300",
      panel: "from-cyan-500/10 to-blue-500/10",
      step: "border-cyan-400/30 bg-cyan-500/10"
    };
  }, [interactivePack.unitLabel]);
  const moduleVisual = useMemo(() => {
    const unit = interactivePack.unitLabel.toLowerCase();
    if (unit.includes("authentication")) return { Icon: KeyRound, label: "Auth Flow" };
    if (unit.includes("database")) return { Icon: Database, label: "Data Flow" };
    if (unit.includes("backend")) return { Icon: Server, label: "Backend Flow" };
    if (unit.includes("testing")) return { Icon: Bug, label: "Debug Flow" };
    if (unit.includes("ui/ux")) return { Icon: Brush, label: "Design Flow" };
    return { Icon: Globe, label: "Web Flow" };
  }, [interactivePack.unitLabel]);

  // Initializing YT Player when iframe is ready
  useEffect(() => {
     if (isPlaying && (window as any).YT && !playerRef.current) {
        new (window as any).YT.Player(`yt-player-${videoId}`, {
           events: {
              onReady: onPlayerReady,
              onStateChange: onPlayerStateChange
           }
        });
     }
  }, [isPlaying, videoId, onPlayerReady, onPlayerStateChange]);

  // Quiz Submit Logic
  const handleAnswerSubmit = () => {
     if (selectedOpt === null || effectiveQuiz.length === 0) return;
     const correct = selectedOpt === effectiveQuiz[currentQIdx].correctIndex;
     if (correct) setQuizScore(prev => prev + 1);
     const nextWrongIndexes = !correct ? [...wrongQuestionIndexes, currentQIdx] : wrongQuestionIndexes;
     if (!correct) setWrongQuestionIndexes(nextWrongIndexes);

     if (currentQIdx < effectiveQuiz.length - 1) {
        setCurrentQIdx(prev => prev + 1);
        setSelectedOpt(null);
     } else {
        setShowResults(true);
        const finalScore = ((quizScore + (correct ? 1 : 0)) / effectiveQuiz.length) * 100;
        const roundedScore = Math.round(finalScore);
        setLastQuizScore(roundedScore);
        if (finalScore >= 70) {
          finalizeQuizSync(roundedScore);
        } else {
          saveRemediationPlan(roundedScore, nextWrongIndexes);
        }
     }
  };

  const saveRemediationPlan = async (score: number, remediationIndexes: number[]) => {
    if (!user || !videoId || effectiveQuiz.length === 0) return;
    const topics = remediationIndexes.map((idx) => effectiveQuiz[idx]?.question).filter(Boolean);
    const progressRef = doc(db, "user_video_progress", `${user.uid}_${videoId}`);
    await setDoc(progressRef, {
      userId: user.uid,
      videoId,
      categoryId: video.categoryId,
      isCompleted: false,
      needsRemediation: true,
      lastQuizScore: score,
      remediationTopics: topics,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    toast.error("Score below 70%. Review remediation topics and retry.");
  };

  const finalizeQuizSync = async (score?: number) => {
     if (!user || !videoId || !video) return;
     const progressRef = doc(db, "user_video_progress", `${user.uid}_${videoId}`);
     await setDoc(progressRef, {
        userId: user.uid,
        videoId,
        categoryId: video.categoryId,
        isCompleted: true,
        progressPercentage: 100,
        lastQuizScore: typeof score === "number" ? score : 100,
        updatedAt: serverTimestamp()
     }, { merge: true });
     setLocalProgress(100);
     await checkCategoryCompletion(video.categoryId);
     toast.success("Progress Saved.");
  };

  const submitLearningQuestion = () => {
    if (learningSelected === null) return;
    const q = interactivePack.quickQuestions[learningQIdx];
    const ok = learningSelected === q.correctIndex;
    setLearningFeedback({
      ok,
      text: ok ? "Correct. Great progress." : q.explanation
    });
  };

  const nextLearningQuestion = () => {
    if (learningQIdx < interactivePack.quickQuestions.length - 1) {
      setLearningQIdx((prev) => prev + 1);
      setLearningSelected(null);
      setLearningFeedback(null);
    } else {
      setLearningFeedback({ ok: true, text: "Interactive checks completed. Move to mini task." });
    }
  };

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (!focus || loading) return;
    const scrollAfterPaint = () => {
      if (focus === "video") {
        videoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (focus === "interactive") {
        interactiveSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (focus === "quiz") {
        quizSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    const timer = setTimeout(scrollAfterPaint, 120);
    return () => clearTimeout(timer);
  }, [searchParams, loading, videoId]);

  if (notFound) {
    return (
      <Layout minimalNavbar={true}>
        <div className="section-padding flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="text-primary" size={28} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Lesson not found.</p>
          <Button onClick={() => navigate("/learn")} className="h-10 px-6 bg-primary text-black font-bold uppercase text-[10px]">
            Back to Learn
          </Button>
        </div>
      </Layout>
    );
  }

  if (loading || !video) return (
     <Layout minimalNavbar={true}>
        <div className="section-padding flex flex-col items-center justify-center min-h-[400px]">
           <AppLoader label="Loading academy..." />
        </div>
     </Layout>
  );

  return (
    <Layout hideFooter={true} minimalNavbar={true}>
      <div className="pt-16 min-h-screen bg-[#0B0B0B]">
        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
           
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
               <Link to="/learn" className="flex items-center gap-4 text-text-muted hover:text-white transition-all group">
                  <div className="w-11 h-11 rounded-xl bg-[#111] border border-white/5 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/5 transition-all shadow-xl">
                     <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  </div>
                  <div>
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Back to Hub</span>
                     <p className="text-[9px] font-bold uppercase text-text-muted mt-0.5">Full Lesson Grid</p>
                  </div>
               </Link>
               
               <div className="flex items-center gap-8 bg-[#111] border border-white/5 px-8 py-5 rounded-2xl min-w-[360px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex-1 space-y-3">
                     <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Progress Bar</span>
                        <span className="text-sm font-bold text-white transition-all duration-300 tabular-nums">{localProgress}%</span>
                     </div>
                     <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_15px_rgba(34,211,238,0.6)]" 
                          style={{ width: `${localProgress}%` }} 
                        />
                     </div>
                  </div>
                  <Button onClick={() => navigate(`/learn/certificate/${video.categoryId}`)} className="h-11 px-6 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:bg-primary hover:text-black transition-all">
                     <Award size={16} className="mr-2" />
                     Certificate
                  </Button>
              </div>
            </div>

           <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              
              <div className="lg:col-span-9 space-y-12">
                  <div className="relative aspect-video bg-black border border-white/5 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.7)] group-video">
                     <div className="w-full h-full">
                        {!isPlaying && <PlayOverlay video={video} isLocked={isLocked || !safeEmbedUrl} onClick={() => setIsPlaying(true)} />}
                        {isPlaying && !isLocked && safeEmbedUrl && (
                           <iframe 
                             id={`yt-player-${videoId}`}
                             className="w-full h-full"
                             src={`${safeEmbedUrl}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1&controls=1`}
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                             allowFullScreen
                           />
                        )}
                     </div>
                  </div>

                 <div ref={videoSectionRef} className="p-10 bg-[#111] border border-white/10 rounded-3xl shadow-2xl relative">
                    <div className="space-y-6">
                       <h1 className="text-3xl font-bold uppercase text-white tracking-widest leading-none">{video.title}</h1>
                       <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                             <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Video lesson</span>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                             <Clock size={12} className="text-text-muted" />
                             <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Auto-Saving</span>
                          </div>
                       </div>
                    </div>
                    <div className="mt-10 pt-10 border-t border-white/5">
                       <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-text-muted mb-4 opacity-70">Lesson Description</h2>
                       <p className="text-sm text-text-muted leading-relaxed max-w-4xl font-medium">{video.description}</p>
                    </div>
                 </div>

                 <div ref={interactiveSectionRef} className="p-8 bg-[#0B0B0B] border border-white/10 rounded-3xl shadow-2xl space-y-8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{interactivePack.unitLabel}</p>
                        <h2 className="text-xl font-bold uppercase text-white mt-1">{interactivePack.animationTitle}</h2>
                      </div>
                      <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold uppercase tracking-widest">
                        Animation first
                      </div>
                    </div>

                    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${animationTheme.panel} p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]`}>
                      <div className="absolute inset-0 opacity-40">
                        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
                        <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-primary/20 blur-3xl animate-pulse" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] uppercase text-text-muted font-bold tracking-widest mb-4">
                        <span className="inline-flex items-center gap-2">
                          <moduleVisual.Icon size={12} className={`${animationTheme.accent} animate-pulse`} />
                          {moduleVisual.label}
                        </span>
                        <span>{interactivePack.animationFlow.length} Steps</span>
                      </div>
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-white/10 hidden md:block" />
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] hidden md:block overflow-hidden">
                        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[pulse_1.8s_ease-in-out_infinite]" />
                      </div>
                      <div className="grid md:grid-cols-4 gap-3 items-stretch relative">
                        {interactivePack.animationFlow.map((step, idx) => (
                          <div key={`${step}_${idx}`} className={`relative p-4 rounded-xl border ${animationTheme.step} backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,255,255,0.16)]`}>
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 hidden md:flex w-5 h-5 rounded-full bg-black/40 border border-white/20 items-center justify-center">
                              <moduleVisual.Icon size={10} className={`${animationTheme.accent} ${idx % 2 === 0 ? "animate-pulse" : ""}`} />
                            </div>
                            <p className={`text-[9px] font-bold uppercase mb-2 ${animationTheme.accent}`}>Step {idx + 1}</p>
                            <p className="text-[11px] text-white leading-relaxed">{step}</p>
                            {idx < interactivePack.animationFlow.length - 1 && (
                              <ChevronRight size={12} className={`absolute -right-2 top-1/2 -translate-y-1/2 hidden md:block ${animationTheme.accent}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {interactivePack.script.map((line) => (
                        <p key={line} className="text-sm text-text-muted leading-relaxed">{line}</p>
                      ))}
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-[#111]">
                      <h3 className="text-sm font-bold uppercase text-white mb-3">How this module works</h3>
                      <ul className="space-y-2">
                        {interactivePack.howItWorks.map((line) => (
                          <li key={line} className="text-[11px] text-text-muted">- {line}</li>
                        ))}
                      </ul>
                      <div className={`mt-4 inline-flex items-center rounded-full border px-3 py-1 text-[9px] uppercase font-bold tracking-widest ${animationTheme.chip}`}>
                        Module-specific flow active
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-[#111] space-y-5">
                      <h3 className="text-sm font-bold uppercase text-white">Interactive Question</h3>
                      <p className="text-sm font-bold text-white">{interactivePack.quickQuestions[learningQIdx].question}</p>
                      <div className="grid md:grid-cols-3 gap-3">
                        {interactivePack.quickQuestions[learningQIdx].options.map((opt, idx) => (
                          <button
                            key={`${opt}_${idx}`}
                            onClick={() => setLearningSelected(idx)}
                            className={`h-11 px-4 rounded-xl border text-[11px] font-bold transition-all ${
                              learningSelected === idx
                                ? "bg-primary text-black border-primary"
                                : "bg-black/30 text-text-muted border-white/10 hover:border-primary/40 hover:text-white"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={submitLearningQuestion}
                          disabled={learningSelected === null}
                          className="h-10 px-5 bg-primary text-black text-[10px] uppercase font-bold tracking-widest disabled:opacity-40"
                        >
                          Check Answer
                        </Button>
                        <Button
                          onClick={nextLearningQuestion}
                          className="h-10 px-5 bg-white/5 border border-white/10 text-white hover:bg-white/10 text-[10px] uppercase font-bold tracking-widest"
                        >
                          Next
                        </Button>
                      </div>
                      {learningFeedback && (
                        <div className={`text-[11px] font-bold ${learningFeedback.ok ? "text-green-400" : "text-amber-400"}`}>
                          {learningFeedback.text}
                        </div>
                      )}
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-[#111]">
                      <h3 className="text-sm font-bold uppercase text-white">Mini Task</h3>
                      <p className="text-sm text-text-muted mt-2">{interactivePack.miniTask.instruction}</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {interactivePack.miniTask.actionUrl && (
                          <a
                            href={interactivePack.miniTask.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 px-5 inline-flex items-center rounded-xl bg-primary text-black text-[10px] uppercase font-bold tracking-widest"
                          >
                            {interactivePack.miniTask.actionLabel}
                          </a>
                        )}
                        {interactivePack.miniTask.actionPrompt && (
                          <button
                            onClick={() => navigator.clipboard?.writeText(interactivePack.miniTask.actionPrompt)}
                            className="h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 text-[10px] uppercase font-bold tracking-widest"
                          >
                            Copy AI Prompt
                          </button>
                        )}
                        <Button
                          onClick={() => navigate("/guided-build")}
                          className="h-10 px-5 bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 text-[10px] uppercase font-bold tracking-widest"
                        >
                          Build Now: {interactivePack.buildNowLabel}
                        </Button>
                      </div>
                    </div>
                 </div>

                 {effectiveQuiz.length > 0 && (
                    <div ref={quizSectionRef} className="p-10 bg-[#0B0B0B] border border-white/10 rounded-3xl shadow-2xl space-y-10 relative overflow-hidden">
                       <div className="flex items-center gap-5 relative">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
                             <HelpCircle size={28} />
                          </div>
                          <div>
                             <h2 className="text-2xl font-bold uppercase text-white tracking-widest leading-none mb-1">Knowledge Test</h2>
                             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Answer these to complete the lesson.</p>
                          </div>
                       </div>

                       {!quizStarted ? (
                          <div className="py-16 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/5 space-y-8 relative">
                             <div className="text-center space-y-3">
                                <h3 className="text-lg font-bold uppercase text-white tracking-widest">Ready to Test?</h3>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted opacity-60">{effectiveQuiz.length} Questions total.</p>
                             </div>
                             <Button onClick={() => setQuizStarted(true)} className="h-14 px-12 bg-primary text-black font-bold uppercase text-[11px] tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-primary/30">
                                Start Quiz now
                             </Button>
                          </div>
                       ) : showResults ? (
                          <div className="py-16 flex flex-col items-center justify-center space-y-10 animate-in zoom-in duration-700">
                             <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                                <div className="relative w-28 h-28 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl">
                                   <Trophy size={56} />
                                </div>
                             </div>
                             <div className="text-center space-y-3">
                                <h3 className="text-3xl font-bold uppercase text-white tracking-widest">{((lastQuizScore ?? Math.round((quizScore / effectiveQuiz.length) * 100)) >= 70) ? 'Test Passed' : 'Test Failed'}</h3>
                                <p className="text-base font-bold text-text-muted">Final Accuracy: <span className="text-primary">{lastQuizScore ?? Math.round((quizScore / effectiveQuiz.length) * 100)}%</span></p>
                             </div>
                             {(lastQuizScore ?? 0) < 70 && wrongQuestionIndexes.length > 0 && (
                               <div className="w-full max-w-2xl p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10">
                                 <h4 className="text-sm font-bold uppercase text-amber-400 mb-3">Weak-topic remediation lessons</h4>
                                 <ul className="space-y-2">
                                   {wrongQuestionIndexes.map((idx) => (
                                     <li key={`remediation_${idx}`} className="text-xs text-white/85">
                                      - Review: {effectiveQuiz[idx]?.question}
                                     </li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                             <div className="flex gap-5">
                                <Button 
                                  onClick={() => { setShowResults(false); setCurrentQIdx(0); setQuizScore(0); setSelectedOpt(null); setWrongQuestionIndexes([]); setLastQuizScore(null); }}
                                  variant="ghost" 
                                  className="h-12 px-10 rounded-2xl text-[10px] font-bold uppercase text-text-muted border border-white/5 hover:text-white"
                                >
                                   <RefreshCw size={16} className="mr-3" /> Retry Test
                                </Button>
                                {(lastQuizScore ?? Math.round((quizScore / effectiveQuiz.length) * 100)) >= 70 && nextVideo && (
                                   <Button onClick={() => navigate(`/learn/${nextVideo.id}`)} className="h-12 px-12 bg-white text-black font-bold uppercase text-[10px] rounded-2xl hover:bg-primary transition-all shadow-2xl">
                                      Next Lesson
                                   </Button>
                                )}
                             </div>
                          </div>
                       ) : (
                          <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                             <div className="flex justify-between items-end border-b border-white/5 pb-8">
                                <div className="space-y-2">
                                   <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Question {currentQIdx + 1}</span>
                                   <h3 className="text-xl font-bold text-white leading-tight max-w-2xl tracking-tight">{effectiveQuiz[currentQIdx].question}</h3>
                                </div>
                                <span className="text-[12px] font-bold uppercase text-text-muted tabular-nums opacity-60 font-mono">{currentQIdx + 1}/{effectiveQuiz.length}</span>
                             </div>

                             <div className="grid md:grid-cols-2 gap-5">
                                {effectiveQuiz[currentQIdx].options.map((opt: string, idx: number) => (
                                   <button 
                                     key={idx}
                                     onClick={() => setSelectedOpt(idx)}
                                     className={`group p-7 rounded-3xl border transition-all text-left relative overflow-hidden shadow-xl ${selectedOpt === idx ? 'bg-primary border-primary text-black' : 'bg-[#111] border-white/5 text-text-muted hover:border-primary/40 hover:bg-primary/5'}`}
                                   >
                                      <div className="flex items-center gap-5 relative z-10">
                                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base transition-all shadow-2xl ${selectedOpt === idx ? 'bg-black text-primary shadow-black/40' : 'bg-black/60 border border-white/5 group-hover:text-primary group-hover:border-primary/20'}`}>
                                            {String.fromCharCode(65 + idx)}
                                         </div>
                                         <span className="text-xs font-bold uppercase tracking-wider transition-colors">{opt}</span>
                                      </div>
                                   </button>
                                ))}
                             </div>

                             <div className="flex justify-end pt-6">
                                <Button 
                                  onClick={handleAnswerSubmit}
                                  disabled={selectedOpt === null}
                                  className={`h-14 px-12 font-bold uppercase text-[11px] tracking-[0.2em] rounded-2xl transition-all shadow-2xl ${selectedOpt === null ? 'bg-white/5 text-text-muted opacity-40' : 'bg-primary text-black hover:scale-105 shadow-primary/20'}`}
                                >
                                   Submit Answer <ChevronRight size={16} className="ml-2" />
                                </Button>
                             </div>
                          </div>
                       )}
                    </div>
                 )}
              </div>

              <div className="lg:col-span-3 space-y-8">
                 <div className="p-8 bg-[#0B0B0B] border border-white/10 rounded-3xl sticky top-28 space-y-8 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                    <div className="flex items-center gap-3">
                        <LayoutPanelLeft size={20} className="text-primary" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-white">Next Videos</span>
                    </div>

                    <div className="space-y-4 overflow-y-auto pr-1 no-scrollbar max-h-[420px]">
                       {pathwayVideos.map((pvid, idx) => {
                          const isCurrent = pvid.id === videoId;
                          const progress = allUserProgress[pvid.id];
                          const isCompleted = progress?.isCompleted;
                          const pPrevCompleted = idx === 0 ? true : allUserProgress[pathwayVideos[idx-1]?.id]?.isCompleted;
                          const pIsLocked = !pPrevCompleted && pvid.isLocked;

                          return (
                             <Link 
                               key={pvid.id}
                               to={pIsLocked ? "#" : `/learn/${pvid.id}`}
                               className={`group p-6 rounded-2xl flex items-center gap-5 transition-all border ${isCurrent ? 'bg-primary border-primary text-black shadow-[0_10px_30px_rgba(34,211,238,0.3)]' : pIsLocked ? 'opacity-30 pointer-events-none' : 'bg-[#111] border-white/5 text-foreground hover:border-primary/40 shadow-xl'}`}
                             >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-2xl ${isCurrent ? 'bg-black text-primary' : isCompleted ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-black/60 text-text-muted border border-white/5'}`}>
                                   {pIsLocked ? <Lock size={16} /> : isCompleted ? <CheckCircle2 size={16} /> : <Play size={16} fill={isCurrent ? "currentColor" : "none"} />}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                   <h4 className="text-[10px] font-bold uppercase truncate tracking-tight">{pvid.title}</h4>
                                   <p className={`text-[8px] font-bold uppercase tracking-[0.25em] ${isCurrent ? "text-black/60" : "text-text-muted"}`}>
                                      {isCompleted ? "Completed" : progress?.progressPercentage > 0 ? `${Math.round(progress.progressPercentage)}% Syncing` : "Ready"}
                                   </p>
                                </div>
                             </Link>
                          );
                       })}
                    </div>
                    
                    {nextVideo && (
                      <Button 
                        onClick={() => navigate(`/learn/${nextVideo.id}`)}
                        className="w-full h-14 bg-white text-black font-bold uppercase text-[11px] tracking-[0.2em] rounded-2xl transition-all hover:bg-primary shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
                      >
                         Next Lesson <ChevronRight size={18} className="ml-2" />
                      </Button>
                    )}
                 </div>
              </div>

           </div>
        </div>
      </div>
    </Layout>
  );
};

export default memo(VideoPlayer);

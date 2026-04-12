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
const PlayOverlay = memo(({ video, isLocked, hasVideo, onClick }: any) => {
  const showLock = isLocked;
  const showMissing = !isLocked && !hasVideo;
  
  return (
    <div 
      onClick={isLocked ? undefined : onClick}
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center ${isLocked ? 'bg-black/90 cursor-not-allowed' : 'bg-black/40 hover:bg-black/20 cursor-pointer group transition-all duration-500'}`}
    >
       {showLock ? (
          <div className="flex flex-col items-center text-center space-y-4 px-6 animate-in fade-in zoom-in">
             <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-2xl">
                <Lock size={32} />
             </div>
             <h3 className="text-xl font-bold uppercase text-white tracking-tight">Access Locked</h3>
             <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted max-w-[200px]">Finish previous lessons to open this one.</p>
          </div>
       ) : showMissing ? (
          <div className="flex flex-col items-center text-center space-y-4 px-6 animate-in fade-in zoom-in">
             <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl animate-pulse">
                <RefreshCw size={32} />
             </div>
             <h3 className="text-xl font-bold uppercase text-white tracking-tight">Content Syncing</h3>
             <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted max-w-[200px]">The video for this unit is being processed. Move to Step 2.</p>
             <Button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="h-8 bg-primary/20 text-primary border border-primary/20 text-[9px] font-bold uppercase">Skip to Animation</Button>
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
  );
});

const VideoPlayer = () => {
  const { videoId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, profile } = useUser();
  const { videos, categories, loading: academyLoading } = useAcademy();
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
     if (academyLoading) return; // Wait for context to load master curriculum
     
     if (!videoId || !/^[A-Za-z0-9_-]{3,128}$/.test(videoId)) {
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
        // Fallback to fetch from Firebase if it's an "extra" video not in Master Curriculum
        getDoc(doc(db, "videos", videoId)).then(d => {
           if (d.exists()) {
             setVideo({ id: d.id, ...d.data() });
             setNotFound(false);
           } else {
             setNotFound(true);
           }
           setLoading(false);
        }).catch(() => {
           setNotFound(true);
           setLoading(false);
        });
     }
  }, [videoId, videos, academyLoading]);

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
    videos
      .filter(v => v.categoryId === video?.categoryId && v.isPublished !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
    [videos, video]
  );

  const currentVideoIndex = pathwayVideos.findIndex(v => v.id === videoId);
  const nextVideo = pathwayVideos[currentVideoIndex + 1];

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
     if (currentVideoIndex <= 0) return false;
     const prevVidId = pathwayVideos[currentVideoIndex - 1]?.id;
     if (!prevVidId) return video?.isLocked || false;
     return !allUserProgress[prevVidId]?.isCompleted && (video?.isLocked ?? true);
  }, [currentVideoIndex, pathwayVideos, allUserProgress, video]);
  const safeEmbedUrl = useMemo(() => assertSafeYoutubeEmbed(video?.youtubeEmbedUrl || ""), [video?.youtubeEmbedUrl]);
  
  const categoryName = useMemo(() => categories.find((c) => c.id === video?.categoryId)?.name || "General", [categories, video?.categoryId]);

  const interactivePack = useMemo(() => {
    const base = getInteractiveLessonPack(video?.title || "Lesson", categoryName);
    
    // Merge Master Curriculum fields if they exist on the video object
    return {
      unitLabel: categoryName,
      animationTitle: video?.animation?.title || base.animationTitle,
      animationFlow: video?.animation?.flow && video.animation.flow.length > 0 ? video.animation.flow : base.animationFlow,
      howItWorks: video?.keyPoints && video.keyPoints.length > 0 ? video.keyPoints : base.howItWorks,
      script: video?.shortNote && video.shortNote.length > 0 ? video.shortNote : base.script,
      quickQuestions: video?.qa && video.qa.length > 0 
        ? video.qa.map((q: any) => ({ question: q.question, options: ["Yes", "No", "Maybe"], correctIndex: 0, explanation: q.answer }))
        : base.quickQuestions,
      miniTask: {
        title: "Lesson Task",
        instruction: video?.miniTask?.instruction || base.miniTask.instruction,
        actionLabel: video?.miniTask?.actionLabel || base.miniTask.actionLabel,
        actionUrl: video?.miniTask?.actionUrl || base.miniTask.actionUrl,
        actionPrompt: video?.miniTask?.actionPrompt || base.miniTask.actionPrompt
      },
      buildNowLabel: video?.project?.title || "Build Project",
      fullQuiz: video?.quiz && video.quiz.length > 0 ? video.quiz : base.fullQuiz
    };
  }, [video, categoryName]);

  const effectiveQuiz = useMemo(() => interactivePack.fullQuiz, [interactivePack.fullQuiz]);

  const animationTheme = useMemo(() => {
    const unit = categoryName.toLowerCase();
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
    if (unit.includes("design") || unit.includes("ui/ux") || unit.includes("interface")) {
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
  }, [categoryName]);

  const moduleVisual = useMemo(() => {
    const unit = categoryName.toLowerCase();
    if (unit.includes("authentication")) return { Icon: KeyRound, label: "Auth Flow" };
    if (unit.includes("database")) return { Icon: Database, label: "Data Flow" };
    if (unit.includes("backend")) return { Icon: Server, label: "Backend Flow" };
    if (unit.includes("testing")) return { Icon: Bug, label: "Debug Flow" };
    if (unit.includes("design") || unit.includes("ui/ux")) return { Icon: Brush, label: "Design Flow" };
    return { Icon: Globe, label: "Web Flow" };
  }, [categoryName]);

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
               
               <div className="lg:col-span-12 space-y-16">
                  {/* Step 1: Video */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <span className="text-xs font-bold">1</span>
                      </div>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-white">Step 1: Watch Video</h2>
                    </div>

                    <div className="relative aspect-video bg-black border border-white/5 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.7)] group-video">
                       <div className="w-full h-full">
                          {!isPlaying && (
                            <PlayOverlay 
                              video={video} 
                              isLocked={isLocked} 
                              hasVideo={!!safeEmbedUrl}
                              onClick={() => setIsPlaying(true)} 
                            />
                          )}
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
                  </div>

                  {/* Step 2: Animation */}
                  <div ref={interactiveSectionRef} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <span className="text-xs font-bold">2</span>
                      </div>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-white">Step 2: See it in Motion</h2>
                    </div>
                    <div className="p-8 bg-[#111] border border-white/10 rounded-3xl shadow-2xl space-y-8">
                       <div className="flex items-center justify-between gap-4">
                         <div>
                           <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{interactivePack.unitLabel}</p>
                           <h2 className="text-xl font-bold uppercase text-white mt-1">{interactivePack.animationTitle}</h2>
                         </div>
                       </div>

                       <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${animationTheme.panel} p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]`}>
                         <div className="flex items-center justify-between text-[10px] uppercase text-text-muted font-bold tracking-widest mb-4">
                           <span className="inline-flex items-center gap-2">
                             <moduleVisual.Icon size={12} className={`${animationTheme.accent} animate-pulse`} />
                             {moduleVisual.label}
                           </span>
                           <span>{interactivePack.animationFlow.length} Steps</span>
                         </div>
                         <div className="grid md:grid-cols-4 gap-3 items-stretch relative">
                           {interactivePack.animationFlow.map((step, idx) => (
                             <div key={`${step}_${idx}`} className={`relative p-4 rounded-xl border ${animationTheme.step} backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
                               <p className={`text-[9px] font-bold uppercase mb-2 ${animationTheme.accent}`}>Step {idx + 1}</p>
                               <p className="text-[11px] text-white leading-relaxed">{step}</p>
                             </div>
                           ))}
                         </div>
                       </div>
                    </div>
                  </div>

                  {/* Step 3: Short Note */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <span className="text-xs font-bold">3</span>
                      </div>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-white">Step 3: Quick Lesson</h2>
                    </div>
                    <div className="p-8 bg-[#111] border border-white/10 rounded-3xl shadow-2xl">
                       <div className="space-y-4">
                         {interactivePack.script.map((line) => (
                           <p key={line} className="text-sm text-text-muted leading-relaxed font-medium">{line}</p>
                         ))}
                       </div>
                    </div>
                  </div>

                  {/* Step 4: Key Points */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <span className="text-xs font-bold">4</span>
                      </div>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-white">Step 4: Key Points</h2>
                    </div>
                    <div className="p-8 bg-[#111] border border-white/10 rounded-3xl shadow-2xl">
                       <ul className="space-y-3">
                         {interactivePack.howItWorks.map((line) => (
                           <li key={line} className="flex items-start gap-3">
                             <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                             <span className="text-sm text-text-muted font-medium">{line}</span>
                           </li>
                         ))}
                       </ul>
                    </div>
                  </div>

                  {/* Step 5: Q&A */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <span className="text-xs font-bold">5</span>
                      </div>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-white">Step 5: Quick Q&A</h2>
                    </div>
                    <div className="p-8 bg-[#111] border border-white/10 rounded-3xl shadow-2xl space-y-6">
                       <div className="space-y-2">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Interactive Check</p>
                         <p className="text-base font-bold text-white">{interactivePack.quickQuestions[learningQIdx].question}</p>
                       </div>
                       <div className="grid md:grid-cols-3 gap-3">
                         {interactivePack.quickQuestions[learningQIdx].options.map((opt, idx) => (
                           <button
                             key={`${opt}_${idx}`}
                             onClick={() => setLearningSelected(idx)}
                             className={`h-12 px-5 rounded-2xl border text-[11px] font-bold transition-all shadow-xl ${
                               learningSelected === idx
                                 ? "bg-primary text-black border-primary"
                                 : "bg-black/40 text-text-muted border-white/5 hover:border-primary/40 hover:text-white"
                             }`}
                           >
                             {opt}
                           </button>
                         ))}
                       </div>
                       <div className="flex items-center gap-4">
                         <Button
                           onClick={submitLearningQuestion}
                           disabled={learningSelected === null}
                           className="h-11 px-8 bg-primary text-black text-[10px] uppercase font-bold tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-primary/20 disabled:opacity-40"
                         >
                           Check Answer
                         </Button>
                         <Button
                           onClick={nextLearningQuestion}
                           variant="outline"
                           className="h-11 px-8 bg-white/5 border border-white/10 text-white hover:bg-white/10 text-[10px] uppercase font-bold tracking-widest rounded-xl"
                         >
                           Next Question
                         </Button>
                       </div>
                       {learningFeedback && (
                         <div className={`p-4 rounded-xl border ${learningFeedback.ok ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"} text-xs font-bold animate-in slide-in-from-top-2`}>
                           {learningFeedback.text}
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Step 6: Mini Task */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <span className="text-xs font-bold">6</span>
                      </div>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-white">Step 6: Mini Task</h2>
                    </div>
                    <div className="p-8 bg-[#111] border border-white/10 rounded-3xl shadow-2xl space-y-6">
                       <p className="text-sm text-text-muted leading-relaxed font-medium">{interactivePack.miniTask.instruction}</p>
                       <div className="flex flex-wrap gap-4 pt-2">
                         {interactivePack.miniTask.actionPrompt && (
                           <button
                             onClick={() => {
                               navigator.clipboard?.writeText(interactivePack.miniTask.actionPrompt || "");
                               toast.success("AI Prompt Copied.");
                             }}
                             className="h-11 px-6 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black text-[10px] uppercase font-bold tracking-widest transition-all shadow-xl"
                           >
                             Copy AI Prompt
                           </button>
                         )}
                         <Button
                           onClick={() => navigate("/guided-build")}
                           className="h-11 px-8 bg-white text-black text-[10px] uppercase font-bold tracking-widest rounded-xl hover:bg-primary transition-all shadow-2xl"
                         >
                           Build Now: {interactivePack.buildNowLabel}
                         </Button>
                       </div>
                    </div>
                  </div>

                  {/* Step 7: Quiz */}
                  {effectiveQuiz.length > 0 && (
                    <div ref={quizSectionRef} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <span className="text-xs font-bold">7</span>
                        </div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Step 7: Final Quiz</h2>
                      </div>
                      <div className="p-10 bg-[#111] border border-white/10 rounded-3xl shadow-2xl space-y-10 relative overflow-hidden">
                        {!quizStarted ? (
                           <div className="py-12 flex flex-col items-center justify-center space-y-8 text-center">
                              <div className="w-20 h-20 rounded-3xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
                                 <HelpCircle size={40} />
                              </div>
                              <div className="space-y-2">
                                 <h3 className="text-xl font-bold uppercase text-white tracking-widest">Test Your Vibe</h3>
                                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted opacity-60">Complete this {effectiveQuiz.length}-question test to master the unit.</p>
                              </div>
                              <Button onClick={() => setQuizStarted(true)} className="h-14 px-12 bg-primary text-black font-bold uppercase text-[11px] tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-primary/30">
                                 Start Test Now
                              </Button>
                           </div>
                        ) : showResults ? (
                           <div className="py-12 flex flex-col items-center justify-center space-y-10 animate-in zoom-in duration-700 text-center">
                              <div className="relative">
                                 <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                                 <div className="relative w-28 h-28 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl">
                                    <Trophy size={56} />
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <h3 className="text-3xl font-bold uppercase text-white tracking-widest">{((lastQuizScore ?? 0) >= 70) ? 'Unit Mastered' : 'Keep Practice'}</h3>
                                 <p className="text-base font-bold text-text-muted">Final Accuracy: <span className="text-primary">{lastQuizScore}%</span></p>
                              </div>
                              <div className="flex gap-5">
                                 <Button 
                                   onClick={() => { setShowResults(false); setCurrentQIdx(0); setQuizScore(0); setSelectedOpt(null); setWrongQuestionIndexes([]); setLastQuizScore(null); }}
                                   variant="ghost" 
                                   className="h-12 px-10 rounded-2xl text-[10px] font-bold uppercase text-text-muted border border-white/5 hover:text-white"
                                 >
                                    <RefreshCw size={16} className="mr-3" /> Try Again
                                 </Button>
                                 {((lastQuizScore ?? 0) >= 70) && nextVideo && (
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
                                    <h3 className="text-xl font-bold text-white tracking-tight">{effectiveQuiz[currentQIdx].question}</h3>
                                 </div>
                                 <span className="text-xs font-bold text-text-muted font-mono">{currentQIdx + 1}/{effectiveQuiz.length}</span>
                              </div>

                              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                                 {effectiveQuiz[currentQIdx].options.map((opt: string, idx: number) => (
                                    <button 
                                      key={idx}
                                      onClick={() => setSelectedOpt(idx)}
                                      className={`p-6 rounded-2xl border transition-all text-left group shadow-xl ${selectedOpt === idx ? 'bg-primary border-primary text-black' : 'bg-black/30 border-white/5 text-text-muted hover:border-primary/40 hover:bg-primary/5'}`}
                                    >
                                       <div className="flex items-center gap-4">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${selectedOpt === idx ? 'bg-black text-primary' : 'bg-black/40 border border-white/10 group-hover:text-primary'}`}>
                                             {String.fromCharCode(65 + idx)}
                                          </div>
                                          <span className="text-[13px] font-bold">{opt}</span>
                                       </div>
                                    </button>
                                 ))}
                              </div>

                              <div className="flex justify-end pt-4">
                                 <Button 
                                   onClick={handleAnswerSubmit}
                                   disabled={selectedOpt === null}
                                   className="h-14 px-12 bg-primary text-black font-bold uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-40"
                                 >
                                    Submit Answer
                                 </Button>
                              </div>
                           </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 8: Project Link */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <span className="text-xs font-bold">8</span>
                      </div>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-white">Step 8: Final Project</h2>
                    </div>
                    <div className="p-8 bg-[#111] border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                       <div className="space-y-2 text-center md:text-left">
                          <h3 className="text-lg font-bold uppercase text-white tracking-widest">Apply Your Knowledge</h3>
                          <p className="text-[11px] text-text-muted font-medium">Use everything you learned in this unit to build a real product.</p>
                       </div>
                       <Button 
                        onClick={() => {
                          const url = interactivePack.miniTask.actionUrl || "https://github.com";
                          window.open(url, "_blank");
                        }}
                        className="h-12 px-10 bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black text-[10px] uppercase font-bold tracking-[0.2em] rounded-2xl transition-all shadow-xl"
                       >
                         <ExternalLink size={16} className="mr-3" /> Open Project Hub
                       </Button>
                    </div>
                  </div>

                  {/* Step 9: Mark Complete */}
                  <div className="space-y-6 pt-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <span className="text-xs font-bold">9</span>
                      </div>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-white">Step 9: Finish Lesson</h2>
                    </div>
                    <div className="p-10 bg-gradient-to-br from-primary/20 to-cyan-500/10 border border-primary/40 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-center space-y-8">
                       <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_50px_rgba(34,211,238,0.3)]">
                          <CheckCircle2 size={44} className="animate-pulse" />
                       </div>
                       <div className="space-y-3">
                          <h3 className="text-2xl font-bold uppercase text-white tracking-widest">Congratulations!</h3>
                          <p className="text-[12px] font-bold uppercase tracking-widest text-text-muted max-w-lg">You have completed all 9 steps of this unit. Click below to save your progress and unlock the next badge.</p>
                       </div>
                       <Button 
                         onClick={() => finalizeQuizSync(100)}
                         className="h-16 px-16 bg-primary text-black font-bold uppercase text-[12px] tracking-[0.3em] rounded-2xl hover:scale-105 transition-all shadow-[0_20px_60px_rgba(34,211,238,0.4)]"
                       >
                         Mark Unit Complete
                       </Button>
                    </div>
                  </div>
               </div>
            </div>

            {/* Rebuilt Mastery Journey: High-Fidelity Roadmap */}
            <div className="mt-40 pt-32 border-t border-white/5 pb-40 overflow-visible relative">
               {/* Background Decorative Element */}
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
               
               <div className="flex flex-col md:flex-row items-end justify-between gap-12 mb-20 px-2">
                  <div className="space-y-4 max-w-2xl">
                     <h3 className="text-4xl md:text-5xl font-black uppercase text-white tracking-widest leading-[0.9] flex items-center gap-6">
                        INSTRUCTIONAL ROADMAP
                        <div className="h-px w-20 bg-primary/30 hidden md:block" />
                     </h3>
                     <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/70">Strategic Unit Progression synchronization</p>
                  </div>
                  {nextVideo && (
                     <Button 
                       onClick={() => navigate(`/learn/${nextVideo.id}`)}
                       className="h-14 px-10 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-[2px] transition-all hover:bg-primary shadow-2xl hover:scale-105 active:scale-95"
                     >
                        NEXT LESSON <ChevronRight size={18} className="ml-3" />
                     </Button>
                  )}
               </div>

               <div className="relative">
                  <div className="flex flex-col gap-4 px-2">
                     {pathwayVideos.map((pvid, idx) => {
                        const isCurrent = pvid.id === videoId;
                        const progress = allUserProgress[pvid.id];
                        const isCompleted = progress?.isCompleted;
                        const pPrevCompleted = idx === 0 ? true : allUserProgress[pathwayVideos[idx-1]?.id]?.isCompleted;
                        const pIsLocked = !pPrevCompleted && pvid.isLocked;
                        const progressPercent = progress?.progressPercentage || 0;

                        return (
                          <Link 
                            key={pvid.id}
                            to={pIsLocked ? "#" : `/learn/${pvid.id}`}
                            className={`group/card relative p-8 rounded-[2px] transition-all flex flex-col md:flex-row items-center justify-between gap-8 border ${isCurrent ? 'bg-primary/95 border-primary text-black' : pIsLocked ? 'opacity-20 grayscale pointer-events-none bg-black/40 border-white/5' : 'bg-[#111] border-white/5 text-foreground hover:border-primary/40 hover:bg-[#151515]'}`}
                          >
                             {/* Left: Unit ID and Title */}
                             <div className="flex items-center gap-8 flex-1">
                                <div className={`w-14 h-14 rounded-[2px] flex items-center justify-center font-black text-sm border ${isCurrent ? 'bg-black text-primary border-black' : 'bg-black/60 border-white/5 text-text-muted'}`}>
                                   0{idx + 1}
                                </div>
                                <div className="space-y-1">
                                   <div className="flex items-center gap-3">
                                      {isCurrent && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-black text-primary rounded-[2px]">Active Unit</span>}
                                      {!isCurrent && isCompleted && <span className="text-[9px] font-black uppercase tracking-widest text-primary">Unit Captured</span>}
                                   </div>
                                   <h4 className="text-xl font-black uppercase tracking-tight">{pvid.title}</h4>
                                </div>
                             </div>

                             {/* Right: Technical Stats and Long Progress Bar */}
                             <div className="flex flex-col md:items-end gap-3 min-w-[340px] w-full md:w-auto">
                                <div className="flex items-center gap-8 mb-1">
                                   <div className="text-right">
                                      <p className={`text-[8px] font-black uppercase tracking-widest opacity-60 ${isCurrent ? 'text-black' : 'text-text-muted'}`}>Inquiry</p>
                                      <p className="text-[12px] font-black tabular-nums">01</p>
                                   </div>
                                   <div className="text-right">
                                      <p className={`text-[8px] font-black uppercase tracking-widest opacity-60 ${isCurrent ? 'text-black' : 'text-text-muted'}`}>Briefs</p>
                                      <p className="text-[12px] font-black tabular-nums">03</p>
                                   </div>
                                </div>

                                <div className="w-full space-y-2">
                                   <div className="flex justify-between items-end">
                                      <p className={`text-[8px] font-black uppercase tracking-widest opacity-60 ${isCurrent ? 'text-black' : 'text-text-muted'}`}>Sync Completion</p>
                                      <p className={`text-[12px] font-black tabular-nums ${isCurrent ? 'text-black' : 'text-primary'}`}>{isCompleted ? "100%" : `${Math.round(progressPercent)}%`}</p>
                                   </div>
                                   {/* Lengthy Progress Bar */}
                                   <div className={`h-2.5 w-full md:w-72 rounded-full overflow-hidden ${isCurrent ? 'bg-black/10' : 'bg-white/5'}`}>
                                      <div 
                                         className={`h-full transition-all duration-1000 ease-out ${isCurrent ? 'bg-black' : 'bg-primary shadow-[0_0_15px_rgba(34,211,238,0.5)]'}`}
                                         style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
                                      />
                                   </div>
                                </div>
                             </div>

                             {isCurrent && (
                                <div className="absolute top-4 right-4 animate-ping">
                                   <div className="w-2 h-2 rounded-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.3)]" />
                                </div>
                             )}
                          </Link>
                        );
                     })}
                  </div>
               </div>
            </div>
         </div>
      </div>
   </Layout>
  );
};

export default memo(VideoPlayer);

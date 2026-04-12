import { useState, useEffect, useMemo, memo } from "react";
import Layout from "@/components/Layout";
import { 
  Clock, 
  CheckCircle2, 
  Lock, 
  Play, 
  Video,
  FileText,
  Download,
  ListChecks,
  ChevronRight,
  Zap,
  ArrowLeft,
  CalendarCheck,
  ExternalLink,
  Phone,
  Presentation
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { useAcademy } from "@/context/AcademyContext";
import { sanitizeExternalUrl } from "@/lib/security";
import AppLoader from "@/components/ui/AppLoader";
import { Button } from "@/components/ui/button";
import PresentationViewer from "@/components/presentation/PresentationViewer";

interface UserProgress {
  videoId: string;
  isCompleted: boolean;
  progressPercentage: number;
  lastQuizScore?: number;
}

type ProjectBlueprint = {
  id: string;
  moduleKey: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  steps: string[];
  promptTemplate: string;
  expectedOutput: string;
};

const DEFAULT_PROJECT_BLUEPRINTS: ProjectBlueprint[] = [
  {
    id: "project_api_explorer",
    moduleKey: "web-api-basics",
    title: "API Explorer App",
    description: "Fetch API data and show it in a clean UI.",
    difficulty: "Easy",
    steps: ["Call public API", "Parse JSON", "Show cards"],
    promptTemplate: "Create an API explorer app using React. Add fetch, loading, and error UI.",
    expectedOutput: "Working page that shows live API data."
  },
  {
    id: "project_login_system",
    moduleKey: "authentication",
    title: "Login System",
    description: "Build login with JWT auth flow.",
    difficulty: "Medium",
    steps: ["Create login route", "Issue JWT token", "Protect a private route"],
    promptTemplate: "Create login API with JWT and protected route middleware.",
    expectedOutput: "User can login and access protected data."
  },
  {
    id: "project_user_database",
    moduleKey: "database",
    title: "User Database App",
    description: "Store users and perform CRUD operations.",
    difficulty: "Medium",
    steps: ["Create users table", "Add CRUD APIs", "Show users list"],
    promptTemplate: "Create users CRUD app with database storage and validation.",
    expectedOutput: "Users can be added, edited, listed, and deleted."
  },
  {
    id: "project_task_manager_api",
    moduleKey: "backend-apis",
    title: "Task Manager API",
    description: "Build backend task APIs end-to-end.",
    difficulty: "Hard",
    steps: ["Create task routes", "Add controller logic", "Connect database"],
    promptTemplate: "Build REST Task Manager API using Node, Express, and DB CRUD.",
    expectedOutput: "Stable REST API with create/read/update/delete."
  },
  {
    id: "project_debug_fix_app",
    moduleKey: "testing-debugging",
    title: "Debug & Fix App",
    description: "Find and fix bugs using DevTools.",
    difficulty: "Medium",
    steps: ["Break one flow", "Trace logs and network", "Fix and retest"],
    promptTemplate: "Give a bug-fix checklist for a broken login flow.",
    expectedOutput: "Bug fixed and behavior verified."
  },
  {
    id: "project_ui_dashboard",
    moduleKey: "ui-ux-design",
    title: "Full UI Dashboard",
    description: "Design in Figma and build UI in code.",
    difficulty: "Hard",
    steps: ["Design layout in Figma", "Build components", "Make responsive"],
    promptTemplate: "Design and build a clean dashboard with cards, charts, and responsive layout.",
    expectedOutput: "Responsive dashboard with polished UX."
  }
];

type ModuleConfig = {
  key: string;
  title: string;
  keywords: string[];
};

const DEFAULT_LEARN_MODULES: ModuleConfig[] = [
  {
    key: "web-api-basics",
    title: "Learning Module 1 (Web & API Basics)",
    keywords: ["web", "api basics", "request", "response", "json"],
  },
  {
    key: "authentication",
    title: "Learning Module 2 (Authentication)",
    keywords: ["auth", "authentication", "jwt", "token", "oauth"],
  },
  {
    key: "database",
    title: "Learning Module 3 (Database)",
    keywords: ["database", "sql", "mongo", "query", "table"],
  },
  {
    key: "backend-apis",
    title: "Learning Module 4 (Backend APIs)",
    keywords: ["backend", "express", "node", "controller", "route"],
  },
  {
    key: "testing-debugging",
    title: "Learning Module 5 (Testing & Debugging)",
    keywords: ["test", "testing", "debug", "qa", "bug"],
  },
  {
    key: "ui-ux-design",
    title: "Learning Module 6 (UI/UX Design)",
    keywords: ["ui", "ux", "frontend", "design", "experience"],
  },
];

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url?.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const LearningHub = () => {
  const { moduleKey } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { videos, categories, loading: academyLoading } = useAcademy();
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const [userProjects, setUserProjects] = useState<Record<string, any>>({});
  const [projectSubmission, setProjectSubmission] = useState<Record<string, { github: string; live: string }>>({});
  const [isPPTViewerOpen, setIsPPTViewerOpen] = useState(false);
  const [learnModules, setLearnModules] = useState<ModuleConfig[]>([]);
  const [learnProjects, setLearnProjects] = useState<ProjectBlueprint[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubProgress = onSnapshot(
       query(collection(db, "user_video_progress"), where("userId", "==", user.uid)),
       (snap) => {
          const progress: Record<string, UserProgress> = {};
          snap.docs.forEach(d => {
             const data = d.data() as UserProgress;
             progress[data.videoId] = data;
          });
          setUserProgress(progress);
          setLoading(false);
       }
    );

    const unsubFiles = onSnapshot(
       query(collection(db, "academy_files"), orderBy("createdAt", "desc")),
       (snap) => {
          setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
       }
    );

    const unsubUserProjects = onSnapshot(
      query(collection(db, "user_projects"), where("userId", "==", user.uid)),
      (snap) => {
        const mapped: Record<string, any> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          mapped[data.projectId] = { id: d.id, ...data };
        });
        setUserProjects(mapped);
      }
    );
    const unsubLearnModules = onSnapshot(
      query(collection(db, "learn_modules"), orderBy("order", "asc")),
      (snap) => {
        setLearnModules(snap.docs.map((d) => ({ key: d.id, ...(d.data() as any) })));
      }
    );
    const unsubLearnProjects = onSnapshot(
      query(collection(db, "learn_projects"), orderBy("order", "asc")),
      (snap) => {
        setLearnProjects(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      }
    );

    return () => {
       unsubProgress();
       unsubFiles();
       unsubUserProjects();
       unsubLearnModules();
       unsubLearnProjects();
    };
  }, [user]);

  const activeModules = useMemo(
    () => (learnModules.length > 0 ? learnModules : DEFAULT_LEARN_MODULES),
    [learnModules]
  );
  const activeProjects = useMemo(
    () => (learnProjects.length > 0 ? learnProjects : DEFAULT_PROJECT_BLUEPRINTS),
    [learnProjects]
  );

  const publishedVideos = useMemo(() => 
    videos.filter(v => v.isPublished !== false),
    [videos]
  );

  const trackSections = useMemo(() => (
    categories
      .map((category) => ({
        category,
        lessons: publishedVideos
          .filter((video) => video.categoryId === category.id)
          .sort((a, b) => a.order - b.order),
      }))
      .filter((section) => section.lessons.length > 0)
  ), [categories, publishedVideos]);

  const moduleMap = useMemo(() => {
    const normalized = (val: string) => val.toLowerCase();
    const modules: Record<string, { title: string; sections: typeof trackSections }> = {};
    activeModules.forEach((module) => {
      modules[module.key] = { title: module.title, sections: [] };
    });

    const unmatched: typeof trackSections = [];
    trackSections.forEach((section) => {
      const categoryName = normalized(section.category.name || "");
      const matched = activeModules.find((module) =>
        module.keywords.some((kw) => categoryName.includes(kw))
      );
      if (matched) {
        modules[matched.key].sections.push(section);
      } else {
        unmatched.push(section);
      }
    });

    unmatched.forEach((section, idx) => {
      const fallback = activeModules[idx % activeModules.length];
      modules[fallback.key].sections.push(section);
    });

    return modules;
  }, [trackSections, activeModules]);

  const selectedModule = useMemo(
    () => activeModules.find((module) => module.key === moduleKey) || null,
    [moduleKey, activeModules]
  );

  const selectedSections = useMemo(
    () => (selectedModule ? moduleMap[selectedModule.key]?.sections || [] : []),
    [selectedModule, moduleMap]
  );

  const selectedLessons = useMemo(
    () => selectedSections.flatMap((s) => s.lessons).sort((a, b) => a.order - b.order),
    [selectedSections]
  );

  const moduleProgressMap = useMemo(() => {
    const result: Record<string, { completed: boolean; quizScore: number }> = {};
    activeModules.forEach((module) => {
      const sections = moduleMap[module.key]?.sections || [];
      const lessons = sections.flatMap((s) => s.lessons);
      if (lessons.length === 0) {
        result[module.key] = { completed: false, quizScore: 0 };
        return;
      }
      const completed = lessons.every((lesson) => !!userProgress[lesson.id]?.isCompleted);
      const scores = lessons
        .map((lesson) => Number(userProgress[lesson.id]?.lastQuizScore ?? (userProgress[lesson.id]?.isCompleted ? 100 : 0)))
        .filter((score) => !Number.isNaN(score));
      const quizScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      result[module.key] = { completed, quizScore };
    });
    return result;
  }, [moduleMap, userProgress, activeModules]);

  useEffect(() => {
    if (!user) return;
    const unlockProjects = async () => {
      for (const blueprint of activeProjects) {
        const modState = moduleProgressMap[blueprint.moduleKey];
        const shouldUnlock = !!modState?.completed && (modState?.quizScore ?? 0) >= 60;
        if (!shouldUnlock) continue;
        const ref = doc(db, "user_projects", `${user.uid}_${blueprint.id}`);
        await setDoc(
          ref,
          {
            userId: user.uid,
            projectId: blueprint.id,
            moduleKey: blueprint.moduleKey,
            unlocked: true,
            status: userProjects[blueprint.id]?.status || "not_started",
            githubUrl: userProjects[blueprint.id]?.githubUrl || "",
            liveUrl: userProjects[blueprint.id]?.liveUrl || "",
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      }
    };
    unlockProjects();
  }, [user, moduleProgressMap, userProjects, activeProjects]);

  const moduleFirstLesson = useMemo(() => {
    if (!selectedLessons.length) return null;
    return selectedLessons.find((lesson, idx) => {
      if (idx === 0) return true;
      return !!userProgress[selectedLessons[idx - 1].id]?.isCompleted || !lesson.isLocked;
    }) || selectedLessons[0];
  }, [selectedLessons, userProgress]);

  const moduleQuizCount = useMemo(
    () => selectedLessons.reduce((sum, lesson) => sum + (lesson.quiz?.length || 0), 0),
    [selectedLessons]
  );

  const moduleNotes = useMemo(() => {
    const notes: string[] = [];
    selectedLessons.forEach((lesson) => {
      if (lesson.description) notes.push(`${lesson.title}: ${lesson.description}`);
      if (lesson.weeklyChecklist?.length) {
        lesson.weeklyChecklist.forEach((item) => notes.push(`${lesson.title}: ${item}`));
      }
    });
    return notes.slice(0, 12);
  }, [selectedLessons]);

  const moduleFiles = useMemo(() => {
    const categoryIds = new Set(selectedSections.map((s) => s.category.id));
    const filtered = files.filter((file: any) => {
      const fileCategoryId = String(file.categoryId || "");
      if (fileCategoryId && categoryIds.size > 0) return categoryIds.has(fileCategoryId);
      const fileName = String(file.name || "").toLowerCase();
      return selectedModule
        ? activeModules.find((m) => m.key === selectedModule.key)?.keywords.some((kw) => fileName.includes(kw))
        : true;
    });
    return filtered;
  }, [files, selectedSections, selectedModule, activeModules]);

  const selectedModuleProjects = useMemo(() => {
    if (!selectedModule) return [];
    return activeProjects.filter((p) => p.moduleKey === selectedModule.key);
  }, [selectedModule, activeProjects]);

  const upsertProjectState = async (projectId: string, payload: Record<string, any>) => {
    if (!user || !selectedModule) return;
    const ref = doc(db, "user_projects", `${user.uid}_${projectId}`);
    await setDoc(
      ref,
      {
        userId: user.uid,
        projectId,
        moduleKey: selectedModule.key,
        unlocked: !!userProjects[projectId]?.unlocked,
        status: userProjects[projectId]?.status || "not_started",
        githubUrl: userProjects[projectId]?.githubUrl || "",
        liveUrl: userProjects[projectId]?.liveUrl || "",
        updatedAt: serverTimestamp(),
        ...payload
      },
      { merge: true }
    );
  };

  if (loading || academyLoading) return (
     <Layout>
        <div className="section-padding flex flex-col items-center justify-center min-h-[400px]">
           <AppLoader label="Loading videos..." />
        </div>
     </Layout>
  );

  return (
    <Layout>
      <div className="section-padding min-h-screen">
        <div className="container-main space-y-8 animate-in fade-in duration-700">
            {searchParams.get("course") !== "fullbuild-ai" && (
              <div className="space-y-4">
                 <h1 className="text-xl font-bold uppercase text-white tracking-widest leading-none">Learning Center</h1>
              </div>
            )}

            {/* Live Event / Meeting Card — hide when inside fullbuild-ai course (it has its own) */}
            {searchParams.get("course") !== "fullbuild-ai" && (
            <div className="relative p-6 bg-[#0B0B0B] border border-primary/30 rounded-[2px] shadow-2xl overflow-hidden group">
               <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-primary" />
               <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />
               
               <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                     <div className="w-14 h-14 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-lg shadow-primary/10">
                        <CalendarCheck size={24} />
                     </div>
                     <div className="space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                           <h3 className="text-base font-black uppercase text-white tracking-tight">Live Session — Event / Meeting</h3>
                           <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/20 border border-primary/30 rounded-full">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-primary">Today</span>
                           </span>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                           <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary" /> 3:00 PM — 5:00 PM</span>
                           <span className="flex items-center gap-1.5"><CalendarCheck size={12} className="text-primary" /> April 12, 2026</span>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed max-w-2xl font-medium">
                           All important notes, prompts, and videos will be uploaded here. Join the live session to learn and collaborate with the academy.
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-[9px] font-bold text-text-muted uppercase tracking-widest">
                           <Phone size={10} className="text-primary" />
                           <span>Dial: +1 916-900-6407 &nbsp;|&nbsp; PIN: 924 274 970#</span>
                        </div>
                     </div>
                  </div>
                  <a
                     href="https://meet.google.com/ffj-qagz-egr"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="h-12 px-8 bg-primary text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-[2px] flex items-center gap-2 hover:scale-[1.03] transition-all shadow-xl shadow-primary/20 whitespace-nowrap shrink-0"
                  >
                     <ExternalLink size={14} />
                     Join Meeting
                  </a>
               </div>
            </div>
            )}

            {!selectedModule ? (
              <div className="space-y-12 animate-in fade-in duration-500">
                {!searchParams.get("course") ? (
                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <div>
                           <h2 className="text-2xl font-black uppercase text-white tracking-tight leading-none">Catalog</h2>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-2">Browse our flagship mastery courses</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* VibeCoding Mastery Card */}
                        <div className="group relative p-6 bg-[#111] border border-white/5 rounded-xl hover:border-primary/40 hover:bg-[#151515] transition-all flex flex-col justify-between min-h-[280px] shadow-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />
                           
                           <div className="space-y-4">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
                                 <Zap size={24} />
                              </div>
                              <div className="space-y-2">
                                 <h3 className="text-xl font-bold uppercase text-white tracking-tight leading-none group-hover:text-primary transition-colors">VibeCoding Mastery</h3>
                                 <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">Learn to build apps quickly using AI. From web basics to advanced tools.</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-text-muted">
                                 <span className="flex items-center gap-1.5"><Video size={12} className="text-primary" /> 70 Lessons</span>
                                 <span className="flex items-center gap-1.5"><ListChecks size={12} className="text-primary" /> 7 Projects</span>
                              </div>
                              <Button 
                                onClick={() => setSearchParams({ course: "vibecoding-mastery" })}
                                className="h-10 w-full bg-white/5 border border-white/10 text-white font-bold uppercase text-[9px] tracking-widest rounded-lg group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all"
                              >
                                 Open Course
                              </Button>
                           </div>
                        </div>

                        {/* Full Build Apps Using AI Card */}
                        <div className="group relative p-6 bg-[#111] border border-white/5 rounded-xl hover:border-primary/40 hover:bg-[#151515] transition-all flex flex-col justify-between min-h-[280px] shadow-2xl overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none" />
                           
                           <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                 <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-2xl shadow-blue-500/10">
                                    <Zap size={24} />
                                 </div>
                                 <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                    <span className="text-[7px] font-black uppercase tracking-widest text-primary">New · Today</span>
                                 </span>
                              </div>
                              <div className="space-y-2">
                                 <h3 className="text-xl font-bold uppercase text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors">Full Build Apps Using AI</h3>
                                 <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">Learn to build complete, production-ready applications from scratch using AI tools. End-to-end app development powered by AI.</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-text-muted">
                                 <span className="flex items-center gap-1.5"><Video size={12} className="text-blue-400" /> Live Sessions</span>
                                 <span className="flex items-center gap-1.5"><CalendarCheck size={12} className="text-blue-400" /> April 12, 2026</span>
                              </div>
                              <Button 
                                onClick={() => setSearchParams({ course: "fullbuild-ai" })}
                                className="h-10 w-full bg-white/5 border border-white/10 text-white font-bold uppercase text-[9px] tracking-widest rounded-lg group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all"
                              >
                                 Open Course
                              </Button>
                           </div>
                        </div>

                        {/* Future Course Placeholder */}
                        <div className="p-6 border border-white/[0.03] bg-white/[0.01] rounded-xl flex flex-col items-center justify-center text-center space-y-3 opacity-40 grayscale">
                           <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-muted">
                              <Lock size={16} />
                           </div>
                           <div>
                              <p className="text-[9px] font-bold uppercase text-text-muted">New Course</p>
                              <p className="text-[10px] text-text-muted italic">Coming Soon</p>
                           </div>
                        </div>
                     </div>
                  </div>
                ) : searchParams.get("course") === "fullbuild-ai" ? (
                  <div className="space-y-8 animate-in fade-in duration-500">
                     <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <div className="flex items-center gap-4">
                           <Button 
                             variant="ghost" 
                             onClick={() => setSearchParams({})}
                             className="w-10 h-10 p-0 rounded-lg bg-white/5 border border-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all"
                           >
                              <ArrowLeft size={16} />
                           </Button>
                           <div>
                              <h2 className="text-lg font-bold uppercase text-white tracking-tight">Full Build Apps Using AI</h2>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400">Live Course · April 12, 2026</p>
                           </div>
                        </div>
                     </div>

                     {/* Meeting Card */}
                     <div className="relative p-8 bg-[#0B0B0B] border border-primary/30 rounded-[2px] shadow-2xl overflow-hidden group">
                        <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-primary" />
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />
                        
                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                           <div className="flex items-start gap-5">
                              <div className="w-14 h-14 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-lg shadow-primary/10">
                                 <CalendarCheck size={24} />
                              </div>
                              <div className="space-y-3">
                                 <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="text-base font-black uppercase text-white tracking-tight">Live Session — Event / Meeting</h3>
                                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/20 border border-primary/30 rounded-full">
                                       <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                       <span className="text-[8px] font-black uppercase tracking-widest text-primary">Today</span>
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary" /> 3:00 PM — 5:00 PM</span>
                                    <span className="flex items-center gap-1.5"><CalendarCheck size={12} className="text-primary" /> April 12, 2026</span>
                                 </div>
                                 <p className="text-[11px] text-text-secondary leading-relaxed max-w-2xl font-medium">
                                    All important notes, prompts, and videos will be uploaded here. Join the live session to learn and collaborate with the academy.
                                 </p>
                                 <div className="flex items-center gap-2 pt-1 text-[9px] font-bold text-text-muted uppercase tracking-widest">
                                    <Phone size={10} className="text-primary" />
                                    <span>Dial: +1 916-900-6407 &nbsp;|&nbsp; PIN: 924 274 970#</span>
                                 </div>
                              </div>
                           </div>
                           <a
                              href="https://meet.google.com/ffj-qagz-egr"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-12 px-8 bg-primary text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-[2px] flex items-center gap-2 hover:scale-[1.03] transition-all shadow-xl shadow-primary/20 whitespace-nowrap shrink-0"
                           >
                              <ExternalLink size={14} />
                              Join Meeting
                           </a>
                        </div>
                     </div>

                     {/* PPT and Materials Grid */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                        {/* PPT Card - 4:3 Aspect Ratio */}
                        <div className="relative bg-[#0B0B0B] border border-white/10 rounded-[2px] shadow-xl overflow-hidden group aspect-[4/3] flex flex-col p-6 hover:border-primary/40 transition-all">
                           <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                              <div className="w-16 h-16 rounded-[2px] bg-white/5 border border-white/10 flex items-center justify-center text-text-muted shrink-0 shadow-lg group-hover:scale-110 group-hover:border-primary/40 group-hover:text-primary transition-all duration-500">
                                 <Presentation size={32} />
                              </div>
                              <div className="space-y-2">
                                 <h3 className="text-sm font-black uppercase text-white tracking-tight leading-tight">Full Build Apps Using AI PPT</h3>
                                 <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-text-muted mx-auto">Course Presentation</p>
                              </div>
                           </div>
                           
                           <div className="mt-auto pt-6 border-t border-white/5">
                              <a
                                 href="#"
                                 onClick={(e) => {
                                    e.preventDefault();
                                    setIsPPTViewerOpen(true);
                                 }}
                                 className="h-10 w-full bg-white/5 border border-white/10 text-white font-black uppercase text-[9px] tracking-[0.2em] rounded-[2px] flex items-center justify-center gap-2 hover:bg-primary hover:border-primary hover:text-black transition-all shadow-xl whitespace-nowrap"
                              >
                                 <ExternalLink size={12} />
                                 Open PPT
                              </a>
                           </div>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                       <div className="flex items-center gap-4">
                          <Button 
                            variant="ghost" 
                            onClick={() => setSearchParams({})}
                            className="w-10 h-10 p-0 rounded-lg bg-white/5 border border-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all"
                          >
                             <ArrowLeft size={16} />
                          </Button>
                          <div>
                             <h2 className="text-lg font-bold uppercase text-white tracking-tight">VibeCoding Mastery</h2>
                             <p className="text-[9px] font-bold uppercase tracking-widest text-primary">7 Modules to Master</p>
                          </div>
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {activeModules.map((module, idx) => {
                        const moduleSections = moduleMap[module.key]?.sections || [];
                        const totalLessons = moduleSections.reduce((sum, sec) => sum + sec.lessons.length, 0);
                        const completed = moduleSections.reduce(
                          (sum, sec) => sum + sec.lessons.filter((lesson) => userProgress[lesson.id]?.isCompleted).length,
                          0
                        );
                        // Extract simple name from title like "Learning Module 1 (Web & API Basics)" -> "Web & API Basics"
                        const cleanName = module.title.includes('(') 
                           ? module.title.split('(')[1].replace(')', '') 
                           : module.title.replace('Learning Module', 'Module');

                        return (
                          <Link
                            key={module.key}
                            to={`/learn/module/${module.key}`}
                            className="p-6 bg-[#111] border border-white/5 rounded-xl hover:border-primary/40 hover:bg-[#151515] transition-all group flex flex-col justify-between min-h-[180px] shadow-xl"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                 <p className="text-[9px] font-bold uppercase tracking-widest text-primary opacity-60">Module {idx + 1}</p>
                                 <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                                    <ChevronRight size={14} />
                                 </div>
                              </div>
                              <h3 className="text-base font-bold uppercase text-white group-hover:text-primary transition-colors leading-tight tracking-tight">{cleanName}</h3>
                            </div>
                            <div className="mt-6 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-text-muted border-t border-white/5 pt-4">
                              <span className="flex items-center gap-1.5">
                                 <div className="w-1 h-1 rounded-full bg-primary" />
                                 {completed}/{totalLessons || 0} Lessons
                              </span>
                              <span className="text-primary">{Math.round((completed / (totalLessons || 1)) * 100)}%</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-12 animate-in fade-in duration-700">
                {/* Lengthy Horizontal Stage Navigation */}
                <div className="relative group">
                   <div className="absolute inset-0 bg-primary/5 blur-[80px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 relative z-10 px-1">
                      {activeModules.map((mod, idx) => {
                         const isActive = mod.key === moduleKey;
                         const isDone = moduleProgressMap[mod.key]?.completed;
                         const cleanTitle = mod.title.includes('(') ? mod.title.split('(')[1].replace(')', '') : mod.title.replace('Learning Module', 'Module');
                         
                         return (
                            <Link
                               key={`nav_${mod.key}`}
                               to={`/learn/module/${mod.key}`}
                               className={`min-w-[280px] p-5 rounded-[2px] border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${isActive ? 'bg-primary/95 border-primary text-black' : 'bg-[#111] border-white/5 text-foreground hover:border-primary/40'}`}
                            >
                               <div className="flex items-center justify-between">
                                  <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${isActive ? 'text-black/60' : 'text-primary'}`}>Stage 0{idx + 1}</span>
                                  {isDone && <CheckCircle2 size={12} className={isActive ? 'text-black/60' : 'text-primary'} />}
                                </div>
                                <h4 className={`text-[13px] font-black uppercase tracking-tight leading-none truncate ${isActive ? 'text-black' : 'text-white'}`}>{cleanTitle}</h4>
                                <div className={`h-1 w-full rounded-full ${isActive ? 'bg-black/20' : 'bg-primary/10'}`}>
                                   <div 
                                      className={`h-full rounded-full ${isActive ? 'bg-black' : 'bg-primary'}`} 
                                      style={{ width: `${isDone ? 100 : (moduleProgressMap[mod.key]?.quizScore || 0)}%` }} 
                                   />
                                </div>
                            </Link>
                         );
                      })}
                   </div>
                </div>

                <div className="flex items-center justify-between gap-3 bg-[#111] border border-white/5 p-5 rounded-[2px] shadow-xl">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => navigate("/learn?course=vibecoding-mastery")}
                      variant="ghost"
                      className="w-10 h-10 p-0 rounded-[2px] bg-white/5 border border-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft size={16} />
                    </Button>
                    <div>
                      <h2 className="text-lg font-black uppercase text-white tracking-tight">{selectedModule.title.split('(')[1]?.replace(')', '') || selectedModule.title}</h2>
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary">Topic Roadmap</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-5 bg-[#111] border border-white/5 rounded-[2px] shadow-lg">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Videos</p>
                    <p className="text-xl font-black text-white">0{selectedLessons.length}</p>
                  </div>
                  <div className="p-5 bg-[#111] border border-white/5 rounded-[2px] shadow-lg">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Questions</p>
                    <p className="text-xl font-black text-white">0{moduleQuizCount}</p>
                  </div>
                  <div className="p-5 bg-[#111] border border-white/5 rounded-[2px] shadow-lg">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Briefs</p>
                    <p className="text-xl font-black text-white">0{moduleNotes.length}</p>
                  </div>
                  <div className="p-5 bg-[#111] border border-white/5 rounded-[2px] shadow-lg">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Assets</p>
                    <p className="text-xl font-black text-white">0{moduleFiles.length}</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-6">
                    <div className="p-10 bg-[#0D0D0D] border border-white/5 rounded-[2px] shadow-3xl relative overflow-hidden group">
                       {/* Abstract Background Glow */}
                       <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-1000" />
                       
                      <div className="relative z-10 flex items-center justify-between mb-10">
                        <div>
                           <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white">Instructional Roadmap</h3>
                           <p className="text-[10px] font-bold text-primary mt-1 tracking-widest">{selectedLessons.length} UNITS REMAINING</p>
                        </div>
                        <div className="flex -space-x-3">
                           {[1, 2, 3, 4].map(i => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0D0D0D] bg-white/5 flex items-center justify-center">
                                 <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                              </div>
                           ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        {selectedLessons.map((lesson, idx) => {
                           const isDone = !!userProgress[lesson.id]?.isCompleted;
                           const currentProgress = userProgress[lesson.id]?.progressPercentage || (isDone ? 100 : 0);
                           
                           return (
                             <div 
                               key={`plan_${lesson.id}`} 
                               onClick={() => navigate(`/learn/${lesson.id}`)}
                               className={`group/unit p-8 rounded-[2px] border transition-all cursor-pointer relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 ${isDone ? 'bg-primary/[0.02] border-primary/20 hover:border-primary/40' : 'bg-[#111] border-white/5 hover:border-primary/30'}`}
                             >
                                {/* Neon Hover Trail */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover/unit:opacity-100 transition-opacity" />
                                
                               <div className="relative z-10 flex items-center gap-8 flex-1">
                                  <div className={`w-14 h-14 rounded-[2px] flex items-center justify-center font-black text-sm border transition-all ${isDone ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-white/5 text-text-muted border-white/10 group-hover/unit:border-primary group-hover/unit:text-primary'}`}>
                                     0{idx + 1}
                                  </div>
                                  <div className="space-y-1">
                                     <div className="flex items-center gap-3">
                                        <span className={`text-[8px] font-black uppercase tracking-[0.3em] px-2.5 py-1 rounded-[2px] border ${isDone ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-text-muted opacity-40'}`}>
                                           {isDone ? 'CALIBRATED' : 'ACTIVE UNIT'}
                                        </span>
                                        {currentProgress > 0 && currentProgress < 100 && (
                                           <span className="text-[8px] font-black text-primary animate-pulse tracking-widest">SYNCING...</span>
                                        )}
                                     </div>
                                     <p className="text-xl font-black text-white uppercase tracking-tight group-hover/unit:text-primary transition-colors">{lesson.title}</p>
                                  </div>
                               </div>

                               <div className="flex flex-col md:items-end gap-3 min-w-[340px] w-full md:w-auto relative z-10">
                                  <div className="flex items-center gap-8 mb-1">
                                     <div className="text-right">
                                        <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">Inquiry</p>
                                        <p className="text-[12px] font-black tabular-nums text-white">0{lesson.quiz?.length || 5}</p>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">Briefs</p>
                                        <p className="text-[12px] font-black tabular-nums text-white">0{idx + 2}</p>
                                     </div>
                                  </div>
                                  
                                  <div className="w-full space-y-2">
                                     <div className="flex justify-between items-end px-1">
                                        <span className="text-[8px] font-black text-text-muted uppercase tracking-widest opacity-60">Sync Completion</span>
                                        <span className={`text-[12px] font-black tabular-nums ${isDone ? 'text-primary' : 'text-white'}`}>{currentProgress}%</span>
                                     </div>
                                     {/* Lengthy & Sharp Progress Bar */}
                                     <div className="h-3 w-full md:w-72 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div 
                                           className={`h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(34,211,238,0.6)] ${isDone ? 'bg-primary' : 'bg-primary/50'}`} 
                                           style={{ width: `${currentProgress}%` }} 
                                        />
                                     </div>
                                  </div>
                               </div>

                               {isDone && (
                                  <div className="absolute top-4 right-4 animate-ping">
                                     <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                  </div>
                               )}
                             </div>
                           );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <div className="p-6 bg-gradient-to-br from-[#111] to-[#0A0A0A] border border-primary/20 rounded-[2px] shadow-2xl space-y-5 text-center">
                       <div className="w-12 h-12 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-2xl">
                          <Zap size={24} />
                       </div>
                       <div className="space-y-4">
                          <h3 className="text-base font-black uppercase text-white tracking-widest">Rapid Sync</h3>
                          <p className="text-[10px] text-text-muted leading-relaxed uppercase tracking-widest font-bold">Synchronize Phase Assets</p>
                       </div>
                       <Button
                         onClick={() => moduleFirstLesson && navigate(`/learn/${moduleFirstLesson.id}`)}
                         disabled={!moduleFirstLesson}
                         className="h-14 w-full bg-primary text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-[2px] transition-all hover:scale-[1.02] shadow-2xl shadow-primary/20 disabled:opacity-40"
                       >
                         Start Lessons
                       </Button>
                    </div>

                    <div className="p-6 bg-[#111] border border-white/5 rounded-[2px] shadow-xl">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 border-b border-white/5 pb-3 mb-3 font-black"><FileText size={14} className="text-primary" /> Key Info</h3>
                      <ul className="space-y-3 max-h-56 overflow-auto scrollbar-hide">
                        {moduleNotes.length ? moduleNotes.map((note, idx) => (
                          <li key={`${idx}_${note}`} className="text-[10px] text-text-muted leading-relaxed flex gap-2">
                             <span className="text-primary font-black">»</span>
                             {note}
                          </li>
                        )) : <li className="text-[10px] text-text-muted">No notes yet.</li>}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-[#111] border border-white/5 rounded-[2px] shadow-2xl">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                         <h3 className="text-base font-black uppercase tracking-[0.2em] text-white">Project Work</h3>
                         <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mt-1">Strategic Builder Protocol</p>
                      </div>
                   </div>
                   <div className="grid lg:grid-cols-1 gap-5">
                     {selectedModuleProjects.map((project) => {
                        const modState = moduleProgressMap[selectedModule.key];
                        const unlocked = !!userProjects[project.id]?.unlocked;
                        const status = userProjects[project.id]?.status || "not_started";
                        const draft = projectSubmission[project.id] || {
                          github: userProjects[project.id]?.githubUrl || "",
                          live: userProjects[project.id]?.liveUrl || ""
                        };
                        return (
                          <div key={project.id} className="p-8 rounded-[2px] border border-white/5 bg-black/40 space-y-6 relative overflow-hidden group">
                            {!unlocked && <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-[2px] flex items-center justify-center">
                               <div className="text-center space-y-3 p-4">
                                  <Lock size={20} className="text-primary mx-auto mb-1 animate-pulse" />
                                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Project Encrypted</p>
                                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-text-muted opacity-60">Reach 60% Sync to access</p>
                               </div>
                            </div>}
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                               <div className="space-y-1">
                                  <h4 className="text-xl font-black uppercase text-white tracking-tight">{project.title}</h4>
                                  <p className="text-[11px] text-text-muted leading-relaxed max-w-xl font-medium">{project.description}</p>
                               </div>
                               <div className="px-4 py-1.5 rounded-[2px] bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-text-muted">
                                  {project.difficulty}
                               </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-8 relative z-10">
                               <div className="space-y-4">
                                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Core Objectives</p>
                                  <ul className="space-y-3">
                                    {project.steps.map((step, sIdx) => (
                                      <li key={`${project.id}_${step}`} className="text-[10px] text-text-muted flex gap-3 font-medium">
                                         <span className="text-primary font-black">0{sIdx+1}</span>
                                         {step}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="space-y-4">
                                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Technical Prompt</p>
                                  <div className="p-5 rounded-[2px] border border-white/5 bg-[#0A0A0A] font-mono text-[10px] text-white/70 leading-relaxed italic border-l-2 border-l-primary/40">
                                    {project.promptTemplate}
                                  </div>
                                </div>
                            </div>

                            {unlocked && (
                              <div className="pt-6 border-t border-white/5 space-y-5 relative z-10">
                                <div className="flex flex-wrap items-center gap-4">
                                  <Button onClick={() => upsertProjectState(project.id, { started: true, status: "in_progress" })} className="h-10 px-8 bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black text-[9px] font-black uppercase tracking-[0.3em] rounded-[2px] transition-all">Init Build</Button>
                                  <Button onClick={() => upsertProjectState(project.id, { status: "completed", completed: true })} className="h-10 px-8 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-black text-[9px] font-black uppercase tracking-[0.3em] rounded-[2px] transition-all">Submit Sync</Button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                  <input
                                    value={draft.github}
                                    onChange={(e) =>
                                      setProjectSubmission((prev) => ({
                                        ...prev,
                                        [project.id]: { ...draft, github: e.target.value }
                                      }))
                                    }
                                    placeholder="GitHub Repository URL"
                                    className="h-12 bg-[#0A0A0A] border border-white/10 rounded-[2px] px-5 text-[10px] text-white focus:border-primary/60 transition-all outline-none font-black tracking-widest placeholder:opacity-30"
                                  />
                                  <input
                                    value={draft.live}
                                    onChange={(e) =>
                                      setProjectSubmission((prev) => ({
                                        ...prev,
                                        [project.id]: { ...draft, live: e.target.value }
                                      }))
                                    }
                                    placeholder="Live Deployment URL"
                                    className="h-12 bg-[#0A0A0A] border border-white/10 rounded-[2px] px-5 text-[10px] text-white focus:border-primary/60 transition-all outline-none font-black tracking-widest placeholder:opacity-30"
                                  />
                                </div>
                                <Button
                                  onClick={() =>
                                    upsertProjectState(project.id, {
                                      githubUrl: draft.github.trim(),
                                      liveUrl: draft.live.trim(),
                                      submitted: true
                                    })
                                  }
                                  className="h-12 w-full bg-white/5 border border-white/10 text-white hover:bg-white/20 text-[9px] font-black uppercase tracking-[0.2em] rounded-[2px] transition-all"
                                >
                                  Finalize Sync State
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                     })}
                   </div>
                </div>

              </div>
            )}

        </div>
      </div>
      
      {/* PPT Viewer Overlay */}
      <PresentationViewer 
        isOpen={isPPTViewerOpen} 
        onClose={() => setIsPPTViewerOpen(false)} 
      />
    </Layout>
  );
};

export default memo(LearningHub);

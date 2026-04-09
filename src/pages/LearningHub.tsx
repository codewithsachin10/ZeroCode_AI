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
  ChevronRight
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { useAcademy } from "@/context/AcademyContext";
import { sanitizeExternalUrl } from "@/lib/security";
import AppLoader from "@/components/ui/AppLoader";
import { Button } from "@/components/ui/button";

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

const VideoCard = memo(({ video, isLocked, progress, isCompleted }: any) => {
  const youtubeId = getYoutubeId(video.youtubeEmbedUrl);
  const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;

  return (
    <Link 
      to={isLocked ? "#" : `/learn/${video.id}`}
      className={`group flex flex-col bg-[#111] border border-white/5 rounded-xl overflow-hidden transition-all hover:border-primary/20 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer animate-in fade-in zoom-in duration-300'}`}
    >
      <div className="relative aspect-video bg-black/40 overflow-hidden">
         {thumbnailUrl ? (
           <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
         ) : (
           <div className="w-full h-full flex items-center justify-center bg-white/5">
              <Play size={24} className="text-text-muted" />
           </div>
         )}
         
         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-primary backdrop-blur-sm group-hover:scale-110 transition-all duration-300">
               {isLocked ? <Lock size={16} /> : <Play size={16} fill="currentColor" />}
            </div>
         </div>

         {isCompleted && (
            <div className="absolute top-2 right-2 p-1.5 bg-primary/20 border border-primary/40 rounded-lg text-primary backdrop-blur-md animate-pulse">
               <CheckCircle2 size={12} />
            </div>
         )}
      </div>

      <div className="p-4 space-y-3">
         <h4 className={`text-xs font-bold uppercase truncate transition-colors ${!isLocked && 'group-hover:text-primary'}`}>{video.title}</h4>
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Clock size={10} className="text-text-muted transition-colors group-hover:text-primary" />
               <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider group-hover:text-white transition-colors">Lesson</span>
            </div>
            {progress > 0 && !isCompleted && (
               <span className="text-[8px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{progress}%</span>
            )}
         </div>
         {progress > 0 && !isCompleted && (
            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
         )}
      </div>
    </Link>
  );
});

const LearningHub = () => {
  const { moduleKey } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { videos, categories, loading: academyLoading } = useAcademy();
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const [userProjects, setUserProjects] = useState<Record<string, any>>({});
  const [projectSubmission, setProjectSubmission] = useState<Record<string, { github: string; live: string }>>({});
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

    // deterministic fallback distribution for unmatched categories
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
            <div className="space-y-2">
               <h1 className="text-xl font-bold uppercase text-white">Learn</h1>
               <p className="text-sm text-text-muted max-w-lg">
                 Choose a module and access combined notes, videos, quizzes, files, and roadmap.
               </p>
            </div>
            {!selectedModule ? (
              <div className="grid md:grid-cols-2 gap-5">
                {activeModules.map((module, idx) => {
                  const moduleSections = moduleMap[module.key]?.sections || [];
                  const totalLessons = moduleSections.reduce((sum, sec) => sum + sec.lessons.length, 0);
                  const completed = moduleSections.reduce(
                    (sum, sec) => sum + sec.lessons.filter((lesson) => userProgress[lesson.id]?.isCompleted).length,
                    0
                  );
                  return (
                    <Link
                      key={module.key}
                      to={`/learn/module/${module.key}`}
                      className="p-6 bg-[#111] border border-white/10 rounded-xl hover:border-primary/30 transition-all group"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Module {idx + 1}</p>
                      <h3 className="text-sm font-bold uppercase text-white">{module.title.replace("Learning ", "")}</h3>
                      <div className="mt-5 flex items-center justify-between text-[10px] uppercase text-text-muted">
                        <span>{completed}/{totalLessons || 0} complete</span>
                        <span className="inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                          Open <ChevronRight size={12} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold uppercase text-white">{selectedModule.title}</h2>
                    <p className="text-[11px] text-text-muted">Combined notes, videos, quizzes, files and roadmap.</p>
                  </div>
                  <Button
                    onClick={() => navigate("/learn")}
                    className="h-10 px-5 bg-white/5 border border-white/10 text-white hover:bg-white/10 text-[10px] uppercase font-bold tracking-widest"
                  >
                    All Modules
                  </Button>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#111] border border-white/10 rounded-xl">
                    <p className="text-[10px] uppercase text-text-muted">Videos</p>
                    <p className="text-lg font-bold text-white">{selectedLessons.length}</p>
                  </div>
                  <div className="p-4 bg-[#111] border border-white/10 rounded-xl">
                    <p className="text-[10px] uppercase text-text-muted">Quiz Questions</p>
                    <p className="text-lg font-bold text-white">{moduleQuizCount}</p>
                  </div>
                  <div className="p-4 bg-[#111] border border-white/10 rounded-xl">
                    <p className="text-[10px] uppercase text-text-muted">Notes</p>
                    <p className="text-lg font-bold text-white">{moduleNotes.length}</p>
                  </div>
                  <div className="p-4 bg-[#111] border border-white/10 rounded-xl">
                    <p className="text-[10px] uppercase text-text-muted">Files</p>
                    <p className="text-lg font-bold text-white">{moduleFiles.length}</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-8 space-y-5">
                    <div className="p-6 bg-[#111] border border-white/10 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase text-white">Detailed Plan</h3>
                        <span className="text-[10px] uppercase text-text-muted">{selectedLessons.length} units</span>
                      </div>
                      <div className="space-y-3">
                        {selectedLessons.map((lesson, idx) => (
                          <div key={`plan_${lesson.id}`} className="p-4 rounded-lg border border-white/10 bg-black/30">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-bold text-white">Unit {idx + 1}: {lesson.title}</p>
                              <span className={`text-[10px] uppercase font-bold ${userProgress[lesson.id]?.isCompleted ? "text-primary" : "text-text-muted"}`}>
                                {userProgress[lesson.id]?.isCompleted ? "Done" : "Pending"}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button onClick={() => navigate(`/learn/${lesson.id}?focus=video`)} className="h-8 px-3 bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black text-[9px] uppercase font-bold">Video</Button>
                              <Button onClick={() => navigate(`/learn/${lesson.id}?focus=interactive`)} className="h-8 px-3 bg-white/5 border border-white/15 text-white hover:bg-white/10 text-[9px] uppercase font-bold">Animation</Button>
                              <Button onClick={() => navigate(`/learn/${lesson.id}?focus=interactive`)} className="h-8 px-3 bg-white/5 border border-white/15 text-white hover:bg-white/10 text-[9px] uppercase font-bold">Q&A</Button>
                              <Button onClick={() => navigate(`/learn/${lesson.id}?focus=quiz`)} className="h-8 px-3 bg-white/5 border border-white/15 text-white hover:bg-white/10 text-[9px] uppercase font-bold">Quiz</Button>
                            </div>
                          </div>
                        ))}
                        {selectedLessons.length === 0 && <p className="text-[11px] text-text-muted">No units available for this module yet.</p>}
                      </div>
                    </div>

                    <div className="p-6 bg-[#111] border border-white/10 rounded-xl">
                      <h3 className="text-sm font-bold uppercase text-white mb-4">Roadmap</h3>
                      <div className="space-y-3">
                        {selectedSections.map(({ category, lessons }) => {
                          const completedCount = lessons.filter((lesson) => userProgress[lesson.id]?.isCompleted).length;
                          return (
                            <div key={category.id} className="p-4 rounded-lg border border-white/10 bg-black/30">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-white">{category.name}</p>
                                <span className="text-[10px] font-bold uppercase text-primary">{completedCount}/{lessons.length}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-5">
                    <div className="p-6 bg-[#111] border border-white/10 rounded-xl space-y-4">
                      <h3 className="text-sm font-bold uppercase text-white">Quick Start</h3>
                      <p className="text-[11px] text-text-muted">Finish all units and keep module quiz score at 60%+ to unlock project.</p>
                      <Button
                        onClick={() => moduleFirstLesson && navigate(`/learn/${moduleFirstLesson.id}`)}
                        disabled={!moduleFirstLesson}
                        className="h-9 w-full bg-primary text-black text-[10px] uppercase font-bold tracking-widest disabled:opacity-40"
                      >
                        Start Module
                      </Button>
                      <div className="text-[10px] uppercase text-text-muted">Module score: <span className="text-white font-bold">{moduleProgressMap[selectedModule.key]?.quizScore ?? 0}%</span></div>
                    </div>

                    <div className="p-6 bg-[#111] border border-white/10 rounded-xl">
                      <h3 className="text-sm font-bold uppercase text-white flex items-center gap-2"><FileText size={14} /> Notes</h3>
                      <ul className="mt-4 space-y-2 max-h-56 overflow-auto pr-1">
                        {moduleNotes.length ? moduleNotes.map((note, idx) => (
                          <li key={`${idx}_${note}`} className="text-[11px] text-text-muted">- {note}</li>
                        )) : <li className="text-[11px] text-text-muted">No notes yet.</li>}
                      </ul>
                    </div>

                    <div className="p-6 bg-[#111] border border-white/10 rounded-xl">
                      <h3 className="text-sm font-bold uppercase text-white mb-4">Files</h3>
                      <div className="space-y-2">
                        {moduleFiles.length > 0 ? moduleFiles.slice(0, 6).map((file: any) => {
                          const safeUrl = sanitizeExternalUrl(String(file.url || ""));
                          return (
                            <a
                              key={file.id}
                              href={safeUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full p-3 bg-black/30 border border-white/10 rounded-lg flex items-center justify-between hover:border-primary/30 transition-all"
                            >
                              <span className="text-[10px] font-bold text-white truncate pr-3">{file.name}</span>
                              <Download size={12} className="text-text-muted" />
                            </a>
                          );
                        }) : <p className="text-[11px] text-text-muted">No files mapped for this module yet.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#111] border border-white/10 rounded-xl">
                  <h3 className="text-sm font-bold uppercase text-white mb-4">Project Unlock</h3>
                  <div className="space-y-4">
                    {selectedModuleProjects.map((project) => {
                      const modState = moduleProgressMap[selectedModule.key];
                      const unlocked = !!userProjects[project.id]?.unlocked;
                      const lockReason = !modState?.completed
                        ? "Complete module to unlock"
                        : (modState?.quizScore ?? 0) < 60
                        ? "Pass quiz with 60% to unlock"
                        : "Locked";
                      const status = userProjects[project.id]?.status || "not_started";
                      const draft = projectSubmission[project.id] || {
                        github: userProjects[project.id]?.githubUrl || "",
                        live: userProjects[project.id]?.liveUrl || ""
                      };
                      return (
                        <div key={project.id} className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white">{project.title}</h4>
                            <span className={`text-[10px] uppercase font-bold ${unlocked ? "text-primary" : "text-text-muted"}`}>
                              {unlocked ? "Unlocked" : "Locked"}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted">{project.description}</p>
                          <p className="text-[10px] text-text-muted">Difficulty: {project.difficulty}</p>
                          <ul className="space-y-1">
                            {project.steps.map((step) => (
                              <li key={`${project.id}_${step}`} className="text-[10px] text-text-muted">- {step}</li>
                            ))}
                          </ul>
                          <div className="p-3 rounded-lg border border-white/10 bg-[#111]">
                            <p className="text-[10px] uppercase text-text-muted mb-1">Prompt template</p>
                            <p className="text-[11px] text-white">{project.promptTemplate}</p>
                          </div>
                          <p className="text-[10px] text-text-muted">Expected output: {project.expectedOutput}</p>
                          {!unlocked ? (
                            <p className="text-[10px] text-amber-400">{lockReason}</p>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <Button onClick={() => upsertProjectState(project.id, { started: true, status: "in_progress" })} className="h-8 px-3 bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black text-[9px] uppercase font-bold">Start</Button>
                                <Button onClick={() => upsertProjectState(project.id, { status: "completed", completed: true })} className="h-8 px-3 bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 text-[9px] uppercase font-bold">Mark Complete</Button>
                                <span className="text-[10px] text-text-muted uppercase self-center">Status: {status.replace("_", " ")}</span>
                              </div>
                              <div className="grid md:grid-cols-2 gap-2">
                                <input
                                  value={draft.github}
                                  onChange={(e) =>
                                    setProjectSubmission((prev) => ({
                                      ...prev,
                                      [project.id]: { ...draft, github: e.target.value }
                                    }))
                                  }
                                  placeholder="GitHub URL"
                                  className="h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white"
                                />
                                <input
                                  value={draft.live}
                                  onChange={(e) =>
                                    setProjectSubmission((prev) => ({
                                      ...prev,
                                      [project.id]: { ...draft, live: e.target.value }
                                    }))
                                  }
                                  placeholder="Live URL"
                                  className="h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-[11px] text-white"
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
                                className="h-8 px-3 bg-white/5 border border-white/15 text-white hover:bg-white/10 text-[9px] uppercase font-bold"
                              >
                                Submit Links
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
    </Layout>
  );
};

export default memo(LearningHub);

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, Zap, Globe, Code, 
  Database, Shield, Wrench, Rocket, CheckCircle2, 
  AlertTriangle, MonitorPlay, MessageSquare, Presentation, ArrowRight,
  Volume2, VolumeX, Play, Pause, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

interface PresentationViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOTAL_SLIDES = 19;
const AUTO_SLIDE_DURATION = 8000;

// --- Web Audio API Mini-Synth for lightweight sounds ---
let audioCtx: AudioContext | null = null;
const initAudio = () => { if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); };

const playSound = (type: 'whoosh' | 'tap' | 'success', enabled: boolean) => {
  if (!enabled) return;
  initAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === 'tap') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'whoosh') {
    // White noise approximation for whoosh
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } else if (type === 'success') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }
};

export default function PresentationViewer({ isOpen, onClose }: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  const nextSlide = useCallback(() => {
    if (currentSlide < TOTAL_SLIDES) {
      playSound('whoosh', isSoundOn);
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
      setProgress(0);
    }
  }, [currentSlide, isSoundOn]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 1) {
      playSound('whoosh', isSoundOn);
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
      setProgress(0);
    }
  }, [currentSlide, isSoundOn]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onClose();
      // Any key press resets progress
      setProgress(0);
    };
    
    // Disable body scroll when open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      initAudio(); // Prepare audio context on user interaction to bypass autoplay limits
    } else {
      document.body.style.overflow = 'auto';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, nextSlide, prevSlide, onClose]);

  // Auto Slide Timer
  useEffect(() => {
    if (!isOpen || !isAutoMode || isHovered || currentSlide === TOTAL_SLIDES) return;

    const interval = 50; // update progress frequently
    const step = (interval / AUTO_SLIDE_DURATION) * 100;
    
    const timer = setInterval(() => {
       setProgress((prev) => {
          if (prev >= 100) {
             nextSlide();
             return 0;
          }
          return prev + step;
       });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, isAutoMode, isHovered, currentSlide, nextSlide]);

  if (!isOpen) return null;

  // Slide Variants for Framer Motion
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    })
  };

  const currentOverallProgress = (currentSlide / TOTAL_SLIDES) * 100;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#050505] text-white flex flex-col font-sans overflow-hidden select-none"
      onMouseMove={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => { playSound('tap', isSoundOn); setProgress(0); }}
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
         <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen opacity-40" />
         <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.1),rgba(0,0,0,0.8))]" />
      </div>

      {/* Top Header & Controls */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex flex-col pointer-events-none">
        
        {/* Top Progress Bar for Auto Slide */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden absolute top-0 left-0">
           <motion.div 
             className="h-full bg-primary/50 shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
             style={{ width: `${progress}%` }}
             transition={{ duration: 0 }}
           />
        </div>

        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary backdrop-blur-md">
                <Presentation size={20} />
            </div>
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Vibe Coding Masterclass</h2>
                <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Live Interactive Session</p>
            </div>
            </div>

            <div className="flex items-center gap-3 pointer-events-auto">
               <button 
                  onClick={(e) => { e.stopPropagation(); setIsSoundOn(!isSoundOn); playSound('tap', !isSoundOn); }}
                  className="h-10 px-4 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all backdrop-blur-md text-xs font-bold tracking-widest uppercase"
               >
                  {isSoundOn ? <Volume2 size={14} className="text-primary" /> : <VolumeX size={14} className="text-text-muted" />}
                  <span className="hidden sm:inline">{isSoundOn ? 'Sound On' : 'Muted'}</span>
               </button>
               
               <button 
                  onClick={(e) => { e.stopPropagation(); setIsAutoMode(!isAutoMode); playSound('tap', isSoundOn); }}
                  className={cn("h-10 px-4 rounded-full border flex items-center gap-2 transition-all backdrop-blur-md text-xs font-bold tracking-widest uppercase", isAutoMode ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-text-muted hover:bg-white/10")}
               >
                  {isAutoMode ? <Play size={14} /> : <Pause size={14} />}
                  <span className="hidden sm:inline">Auto Move</span>
               </button>

               <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); playSound('tap', isSoundOn); }}
                  className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all backdrop-blur-md"
               >
                  <X size={16} />
               </button>
            </div>
        </div>
      </div>

      {/* Main Slide Area */}
      <div className="flex-1 relative z-10 flex items-center justify-center overflow-y-auto">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center p-8 md:p-24"
          >
            {renderSlide(currentSlide, nextSlide, isSoundOn)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 p-6 pb-8 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between pointer-events-auto">
          <Button 
            variant="ghost" 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            disabled={currentSlide === 1}
            className="h-14 px-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-black uppercase tracking-[0.2em] transition-all disabled:opacity-20 backdrop-blur-md"
          >
            <ChevronLeft size={16} className="mr-2" /> Previous
          </Button>
          
          <div className="flex flex-col items-center flex-1 mx-8 max-w-sm hidden sm:flex">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted mb-3">
               Slide {currentSlide} of {TOTAL_SLIDES}
             </span>
             <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                <motion.div 
                   className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                   initial={{ width: 0 }}
                   animate={{ width: `${currentOverallProgress}%` }}
                   transition={{ duration: 0.3 }}
                />
             </div>
          </div>

          <Button 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            disabled={currentSlide === TOTAL_SLIDES}
            className="h-14 px-8 rounded-full bg-primary text-black hover:bg-primary/90 hover:scale-105 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 disabled:opacity-20 disabled:hover:scale-100"
          >
            Next <ChevronRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------------
// INTERACTIVE SLIDE (Slide 18) - FIREBASE CONNECTED
// ----------------------------------------------------------------------------------------
function InteractiveSlide({ isSoundOn }: { isSoundOn: boolean }) {
   const [idea, setIdea] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [liveIdeas, setLiveIdeas] = useState<any[]>([]);
   const [error, setError] = useState(false);

   useEffect(() => {
      // Connect to Firestore to get live ideas
      try {
         const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"), limit(5));
         const unsubscribe = onSnapshot(q, (snapshot) => {
            const ideasData: any[] = [];
            snapshot.forEach((doc) => ideasData.push({ id: doc.id, ...doc.data() }));
            setLiveIdeas(ideasData);
            setError(false);
         }, (err) => {
            console.error("Firebase ideas listener error:", err);
            setError(true);
         });

         return () => unsubscribe();
      } catch (err) {
         console.error("Firebase init failed, showing static state", err);
         setError(true);
      }
   }, []);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!idea.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
         await addDoc(collection(db, "ideas"), {
            text: idea,
            createdAt: serverTimestamp()
         });
         playSound('success', isSoundOn);
         setIdea("");
      } catch (err) {
         console.error("Failed to submit idea:", err);
         setError(true);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="w-full max-w-4xl text-center space-y-12">
         <h2 className="text-5xl font-black uppercase tracking-tighter text-white">What app do YOU want to build?</h2>
         
         <form onSubmit={handleSubmit} className="relative z-20">
            <div className="p-2 sm:p-4 rounded-full bg-white/5 border border-white/20 flex items-center shadow-xl backdrop-blur-xl group hover:border-primary/50 transition-all focus-within:border-primary focus-within:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
               <MessageSquare className="text-primary ml-4 mr-4 shrink-0 transition-transform group-focus-within:scale-110" />
               <input 
                 type="text" 
                 value={idea}
                 onChange={(e) => setIdea(e.target.value)}
                 disabled={isSubmitting}
                 placeholder="Type your app idea here..." 
                 className="flex-1 bg-transparent border-none outline-none text-lg sm:text-xl font-bold text-white placeholder:text-white/30 placeholder:font-normal caret-primary"
               />
               <Button 
                  type="submit" 
                  disabled={!idea.trim() || isSubmitting}
                  className="rounded-full h-12 px-6 sm:px-8 bg-primary text-black font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
               >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Send to AI'}
               </Button>
            </div>
         </form>

         <div className="pt-8 text-left space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Live Responses
            </h3>
            
            {error && (
               <div className="text-xs text-text-muted font-mono italic">Operating in offline resilience mode. Ideas are not syncing.</div>
            )}

            <div className="space-y-3 min-h-[250px]">
               <AnimatePresence>
                  {liveIdeas.length === 0 && !error && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-muted italic py-8 text-center text-sm">
                        Waiting for brilliant ideas...
                     </motion.div>
                  )}
                  {liveIdeas.map((item, idx) => (
                     <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, delay: idx * 0.1 }}
                        className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-primary/40 hover:bg-white/10 transition-all font-medium text-lg leading-relaxed group shadow-lg"
                     >
                        <span className="text-primary font-bold mr-3 opacity-0 group-hover:opacity-100 transition-opacity">»</span>
                        {item.text}
                     </motion.div>
                  ))}
               </AnimatePresence>
            </div>
         </div>
      </div>
   );
}


// ----------------------------------------------------------------------------------------
// SLIDE RENDERER
// ----------------------------------------------------------------------------------------

function renderSlide(id: number, nextSlide: () => void, isSoundOn: boolean) {
  switch (id) {
    case 1:
      return (
        <div className="text-center space-y-8 max-w-4xl relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase text-[10px] font-black tracking-[0.3em]"
          >
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Live Session by Sachin
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]"
          >
            Build Your First <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">App Using AI</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-xl md:text-3xl font-medium text-text-secondary tracking-tight"
          >
            No coding → Real app in 60 minutes
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="pt-8">
             <Button onClick={(e) => { e.stopPropagation(); playSound('tap', isSoundOn); nextSlide(); }} className="h-16 px-12 text-sm text-black font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 hover:scale-[1.05] shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-all rounded-full z-20 relative">
                Begin Masterclass
             </Button>
          </motion.div>
        </div>
      );

    case 2:
      return (
        <div className="text-center">
           <motion.h2 
             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
             className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-8"
           >
             You don't need <span className="text-red-400 line-through decoration-8 opacity-70">coding</span> anymore.
           </motion.h2>
           <motion.h3 
             initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
             className="text-4xl md:text-6xl font-black uppercase tracking-tight text-primary drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]"
           >
             AI can build full apps.
           </motion.h3>
        </div>
      );

    case 3:
      return (
        <div className="w-full max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase tracking-widest text-primary mb-4 select-none">What is a Website?</h2>
            <p className="text-xl text-text-muted select-none">A collection of static pages linked together.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard icon={<Globe />} title="Home" desc="The landing page showcasing the brand." delay={0.1} />
            <GlassCard icon={<Code />} title="About" desc="Static informational content." delay={0.3} />
            <GlassCard icon={<Shield />} title="Login" desc="The gateway to applications." delay={0.5} />
          </div>
        </div>
      );

    case 4:
      return (
        <div className="w-full max-w-6xl">
           <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="p-12 bg-white/5 border border-white/10 rounded-3xl text-center space-y-6 hover:bg-white/10 transition-all">
                 <Globe size={64} className="mx-auto text-text-muted" />
                 <h2 className="text-3xl font-black uppercase tracking-widest text-white">Website</h2>
                 <p className="text-xl text-text-muted">Information based. Static content. Read-only.</p>
              </div>
              <div className="p-12 relative bg-primary/5 border border-primary/30 rounded-3xl text-center space-y-6 shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
                 <Zap size={64} className="mx-auto text-primary animate-pulse filter drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
                 <h2 className="text-3xl font-black uppercase tracking-widest text-primary">Web App</h2>
                 <p className="text-xl text-text-muted">Interactive. Dynamic data. Read & Write.</p>
              </div>
           </div>
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center mt-16 mt-16">
              <span className="text-5xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-primary drop-shadow-xl">Website shows. Web app works.</span>
           </motion.div>
        </div>
      );

    case 5:
      return (
        <div className="text-center w-full max-w-5xl">
           <h2 className="text-4xl font-black uppercase tracking-widest mb-16 text-primary">The Internet Flow</h2>
           <div className="flex flex-col md:flex-row items-center justify-between gap-8 mt-12 relative">
              <FlowCard icon={<MonitorPlay />} title="Client" desc="User Browser" />
              <div className="flex-1 text-center font-bold text-primary animate-pulse hidden md:block text-xl tracking-[0.5em] uppercase">
                 <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5, repeat: Infinity, duration: 2 }}>→</motion.div> Request <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5, repeat: Infinity, duration: 2 }}>→</motion.div><br/>
                 <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1, repeat: Infinity, duration: 2 }}>←</motion.div> Response <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1, repeat: Infinity, duration: 2 }}>←</motion.div>
              </div>
              <FlowCard icon={<Database />} title="Server" desc="Backend Logic" />
           </div>
        </div>
      );

    case 6:
      return (
         <div className="text-center w-full max-w-5xl">
           <h2 className="text-4xl font-black uppercase tracking-widest mb-16 text-primary">API (Application Programming Interface)</h2>
           <div className="flex flex-col items-center justify-center gap-12 mt-12 bg-white/5 border border-white/10 p-16 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-xl hover:border-primary/30 transition-colors">
               <div className="absolute inset-0 bg-primary/10 blur-[80px]" />
               <div className="flex items-center gap-12 relative z-10 w-full justify-center">
                  <div className="w-32 h-32 rounded-2xl bg-black/50 border border-white/20 flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform shadow-2xl">
                     <MonitorPlay size={32} className="text-blue-400" />
                     <span className="text-xs font-black uppercase tracking-widest">Frontend</span>
                  </div>
                  <div className="flex-1 max-w-[200px] h-3 bg-black/50 rounded-full relative overflow-hidden ring-1 ring-white/10">
                     <motion.div 
                        initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
                     />
                  </div>
                  <div className="w-32 h-32 rounded-2xl bg-black/50 border border-white/20 flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform shadow-2xl">
                     <Database size={32} className="text-purple-400" />
                     <span className="text-xs font-black uppercase tracking-widest">Backend</span>
                  </div>
               </div>
               <p className="text-2xl text-white font-medium mt-8 relative z-10">APIs are the messengers that carry the request and return the response.</p>
           </div>
        </div>
      );

    case 7:
      return (
        <div className="w-full max-w-5xl text-center space-y-12">
           <h2 className="text-4xl font-black uppercase tracking-widest text-primary">Database</h2>
           <p className="text-xl text-text-muted">Where the app memory lives.</p>
           
           <div className="bg-[#0B0B0B] border border-white/10 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">
              <div className="grid grid-cols-4 bg-white/5 p-6 border-b border-white/10 font-black uppercase tracking-[0.2em] text-xs text-text-muted">
                 <div>ID</div><div>Name</div><div>Role</div><div>Status</div>
              </div>
              {[1, 2, 3].map((i) => (
                 <motion.div 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    key={i} className="grid grid-cols-4 p-6 border-b border-white/5 text-base hover:bg-white/5 transition-colors cursor-default"
                 >
                    <div className="font-mono text-primary/70">usr_00{i}</div>
                    <div className="font-bold">User {i}</div>
                    <div className="text-purple-400 font-medium">Member</div>
                    <div className="text-green-400 font-medium tracking-widest uppercase text-xs flex items-center justify-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                    </div>
                 </motion.div>
              ))}
           </div>
        </div>
      );

    case 8:
      return (
         <div className="w-full max-w-5xl text-center">
            <h2 className="text-4xl font-black uppercase tracking-widest text-primary mb-24">Auth Flow</h2>
            <div className="flex items-center justify-center gap-6 flex-wrap">
               <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}><FlowStep num="1" title="Login" /></motion.div>
               <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}><ChevronRight className="text-primary opacity-50 w-8 h-8" /></motion.div>
               <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }}><FlowStep num="2" title="Verify" /></motion.div>
               <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.7 }}><ChevronRight className="text-primary opacity-50 w-8 h-8" /></motion.div>
               <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.9 }}><FlowStep num="3" title="Token" /></motion.div>
               <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.1 }}><ChevronRight className="text-primary opacity-50 w-8 h-8" /></motion.div>
               <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.3 }}><FlowStep num="4" title="Dashboard" highlight /></motion.div>
            </div>
         </div>
      );

    case 9:
      return (
         <div className="w-full max-w-6xl">
            <h2 className="text-4xl font-black text-center uppercase tracking-widest text-primary mb-16">Tools of the Trade</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                 <ToolCard name="Antigravity" desc="AI Coding Agent" icon={<Zap className="text-yellow-400 w-10 h-10 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />} />
               </motion.div>
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                 <ToolCard name="Supabase" desc="Database & Auth" icon={<Database className="text-green-400 w-10 h-10 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />} />
               </motion.div>
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                 <ToolCard name="Lovable" desc="UI Generation" icon={<MonitorPlay className="text-purple-400 w-10 h-10 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]" />} />
               </motion.div>
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                 <ToolCard name="VS Code" desc="Code Editor" icon={<Code className="text-blue-400 w-10 h-10 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />} />
               </motion.div>
            </div>
         </div>
      );

    case 10:
      return (
         <div className="w-full max-w-5xl text-center space-y-16">
            <h2 className="text-5xl font-black uppercase tracking-tight text-white mb-8">What we are building</h2>
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-16 text-left shadow-2xl backdrop-blur-3xl hover:border-primary/30 transition-colors">
               <ul className="space-y-10">
                  {['User Authentication (Signup/Login)', 'Protected Dashboard', 'Data Storage & Retrieval', 'Modern Glass UI Design'].map((item, i) => (
                     <motion.li 
                       key={i} 
                       initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 + 0.2 }}
                       className="flex items-center gap-6 text-3xl font-bold text-white group"
                     >
                        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-black transition-all">
                           <CheckCircle2 className="w-6 h-6 text-primary group-hover:text-black transition-colors" />
                        </div>
                        <span className="tracking-tight">{item}</span>
                     </motion.li>
                  ))}
               </ul>
            </div>
         </div>
      );

    case 11:
      return (
         <div className="text-center space-y-8 select-none">
            <motion.div 
               animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0px #22d3ee", "0 0 100px #22d3ee", "0 0 0px #22d3ee"] }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
               className="p-20 rounded-[3rem] border border-primary/50 bg-primary/10 backdrop-blur-xl"
            >
               <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter text-white !leading-tight">
                  Now We Build<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">LIVE</span>
               </h1>
            </motion.div>
         </div>
      );

    case 12:
      return (
         <div className="w-full max-w-7xl space-y-12">
            <h2 className="text-5xl font-black text-center uppercase tracking-widest text-primary mb-12">Prompting: Bad vs Good</h2>
            <div className="grid md:grid-cols-2 gap-10">
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="p-12 rounded-[2rem] bg-red-500/5 border border-red-500/20 hover:border-red-500/50 transition-all">
                  <h3 className="text-2xl font-black uppercase tracking-widest text-red-400 mb-8 flex items-center gap-3"><AlertTriangle size={24}/> Bad Prompt</h3>
                  <p className="text-3xl font-medium leading-relaxed font-mono opacity-80 decoration-red-500/30 underline decoration-wavy underline-offset-8">"Build me a login page."</p>
               </motion.div>
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="p-12 rounded-[2rem] bg-green-500/5 border border-green-500/30 hover:border-green-500/60 hover:shadow-[0_0_40px_rgba(34,197,94,0.1)] transition-all">
                  <h3 className="text-2xl font-black uppercase tracking-widest text-green-400 mb-8 flex items-center gap-3"><CheckCircle2 size={24}/> Good Prompt</h3>
                  <p className="text-2xl font-medium leading-relaxed italic opacity-100 text-white selection:bg-green-500/30">"Create a modern login page using React and Tailwind. Dark theme. Add email/password inputs with a glowing green submit button. Implement functional validation."</p>
               </motion.div>
            </div>
         </div>
      );

    case 13:
      return (
         <div className="w-full max-w-7xl text-center">
            <h2 className="text-4xl font-black uppercase tracking-widest text-primary mb-24">The Demo Flow</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
               {['Signup', 'Login', 'Dashboard', 'Save Data'].map((step, i) => (
                  <React.Fragment key={step}>
                     <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.2 }} className="w-56 h-56 rounded-full border border-white/10 flex flex-col items-center justify-center gap-6 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all hover:-translate-y-2 shadow-xl hover:shadow-primary/20 backdrop-blur-xl group cursor-default">
                        <span className="text-primary font-black text-5xl group-hover:scale-110 transition-transform">0{i+1}</span>
                        <span className="font-bold uppercase tracking-widest text-base group-hover:text-primary transition-colors">{step}</span>
                     </motion.div>
                     {i < 3 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 + 0.1 }}><ChevronRight size={48} className="text-primary/30 hidden md:block" /></motion.div>}
                  </React.Fragment>
               ))}
            </div>
         </div>
      );

    case 14:
      return (
         <div className="w-full max-w-5xl text-center">
             <h2 className="text-4xl font-black uppercase tracking-widest text-primary mb-16">Deployment</h2>
             <div className="p-20 py-24 rounded-[3rem] border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-8 shadow-2xl backdrop-blur-xl">
                 <div className="flex flex-col md:flex-row items-center gap-12 text-3xl font-bold w-full justify-between">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center gap-4">
                       <MonitorPlay size={40} className="text-text-muted" />
                       <span className="tracking-widest uppercase text-base">Localhost</span>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="animate-pulse"><ArrowRight className="text-primary" size={40} /></motion.div>
                    
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                       <span className="px-10 py-6 bg-white text-black rounded-2xl font-black tracking-tight flex items-center gap-4 hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                          ▲ Vercel
                       </span>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="animate-pulse"><ArrowRight className="text-primary" size={40} /></motion.div>
                    
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }} className="flex flex-col items-center gap-4">
                       <Globe size={40} className="text-primary drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                       <span className="tracking-widest uppercase text-base text-primary">The World</span>
                    </motion.div>
                 </div>
             </div>
         </div>
      );

    case 15:
      return (
         <div className="text-center space-y-12 select-none relative z-10 w-full flex flex-col items-center justify-center">
            
            {/* Visual Confetti FX CSS Only Approximation or just nice glowing sphere */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-visible">
               <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute w-96 h-96 bg-primary/20 blur-[100px] rounded-full" />
            </div>

            <motion.div initial={{ scale: 0.5, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5, duration: 1.2 }}>
               <div className="w-48 h-48 rounded-full bg-primary/10 border-2 border-primary mx-auto flex items-center justify-center mb-12 shadow-[0_0_60px_rgba(34,211,238,0.4)]">
                 <Rocket size={80} className="text-primary" />
               </div>
            </motion.div>
            <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter text-white">Your app is <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-brand-teal drop-shadow-xl">LIVE</span></h1>
         </div>
      );

    case 16:
      return (
         <div className="w-full max-w-7xl text-center">
            <h2 className="text-4xl font-black uppercase tracking-widest text-primary mb-20">Errors happen. It's fine.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-12 rounded-[2rem] border border-white/10 bg-white/5 hover:rotate-3 transition-all hover:bg-white/10 cursor-pointer">
                  <h3 className="text-3xl font-black tracking-tight mb-6 flex flex-col items-center justify-center gap-6">
                     <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center"><AlertTriangle className="text-yellow-400 w-8 h-8" /></div>
                     Login Fail 
                  </h3>
                  <p className="opacity-60 text-lg font-medium italic">"Wrong password again."</p>
               </motion.div>
               <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-12 rounded-[2rem] border border-white/10 bg-white/5 hover:-rotate-3 transition-all hover:bg-white/10 cursor-pointer">
                  <h3 className="text-3xl font-black tracking-tight mb-6 flex flex-col items-center justify-center gap-6">
                     <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center"><MonitorPlay className="text-blue-400 w-8 h-8"/></div>
                     Dead Button 
                  </h3>
                  <p className="opacity-60 text-lg font-medium italic">"Click... nothing happens."</p>
               </motion.div>
               <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-12 rounded-[2rem] border border-white/10 bg-white/5 hover:rotate-3 transition-all hover:bg-white/10 cursor-pointer">
                  <h3 className="text-3xl font-black tracking-tight mb-6 flex flex-col items-center justify-center gap-6">
                     <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center"><Database className="text-red-400 w-8 h-8"/></div>
                     API Error 
                  </h3>
                  <p className="opacity-60 text-lg font-medium italic">"CORS has entered the chat."</p>
               </motion.div>
            </div>
         </div>
      );

    case 17:
      return (
         <div className="text-center max-w-5xl">
             <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter text-white leading-[1.1]">
                Start Building.<br/>
                <motion.span 
                   initial={{ opacity: 0, filter: "blur(10px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ delay: 0.8, duration: 1 }}
                   className="text-primary drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">Don't Wait.</motion.span>
             </h1>
         </div>
      );

    case 18:
      return <InteractiveSlide isSoundOn={isSoundOn} />;

    case 19:
      return (
         <div className="text-center space-y-12 select-none">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="w-32 h-32 rounded-[2rem] bg-primary/10 mx-auto flex items-center justify-center mb-12 shadow-[0_0_60px_rgba(34,211,238,0.2)] border border-primary/30">
               <Zap size={64} className="text-primary drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            </motion.div>
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white">Built by Sachin</h2>
            <p className="text-2xl text-primary font-black tracking-[0.3em] uppercase opacity-80">Thank you for joining</p>
            <div className="flex items-center justify-center gap-6 pt-12">
               <a href="#" className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center opacity-60 hover:opacity-100 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all cursor-pointer font-black tracking-widest text-sm">X</a>
               <a href="#" className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center opacity-60 hover:opacity-100 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all cursor-pointer font-black tracking-widest text-sm">LI</a>
               <a href="#" className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center opacity-60 hover:opacity-100 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all cursor-pointer font-black tracking-widest text-sm">GH</a>
            </div>
         </div>
      );

    default:
      return <div>Slide {id}</div>;
  }
}

// ----------------------------------------------------------------------------------------
// HELPER COMPONENTS
// ----------------------------------------------------------------------------------------

function GlassCard({ icon, title, desc, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="p-12 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:-translate-y-2 hover:border-primary/30 transition-all text-center space-y-6 shadow-2xl backdrop-blur-xl group"
    >
      <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { size: 32 })}
      </div>
      <h3 className="text-2xl font-black uppercase tracking-widest">{title}</h3>
      <p className="text-lg text-text-muted">{desc}</p>
    </motion.div>
  );
}

function FlowCard({ icon, title, desc }: any) {
   return (
      <div className="w-64 p-12 bg-white/5 border border-white/10 rounded-[2rem] text-center space-y-6 hover:border-primary/50 transition-all shadow-2xl backdrop-blur-xl group">
         <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center text-white mx-auto border-2 border-white/10 group-hover:border-primary group-hover:text-primary transition-colors shadow-inner">
            {React.cloneElement(icon, { size: 32 })}
         </div>
         <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">{title}</h3>
            <p className="text-sm font-bold text-primary uppercase tracking-widest mt-2">{desc}</p>
         </div>
      </div>
   );
}

function FlowStep({ num, title, highlight }: any) {
   return (
      <div className={cn(
         "px-10 py-8 rounded-3xl border-2 flex items-center gap-6 text-2xl font-black tracking-tight transition-all shadow-2xl truncate",
         highlight ? "bg-primary text-black border-primary shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:bg-white hover:border-white cursor-default" : "bg-black border-white/10 text-white hover:border-white/30 cursor-default"
      )}>
         <span className={cn("w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0", highlight ? "bg-black text-primary" : "bg-white/10")}>{num}</span>
         {title}
      </div>
   );
}

function ToolCard({ name, desc, icon }: any) {
   return (
      <div className="p-10 bg-black/40 border border-white/10 rounded-[2rem] text-center hover:bg-white/5 hover:scale-105 hover:border-primary/30 transition-all cursor-default shadow-xl backdrop-blur-md group">
         <div className="w-24 h-24 rounded-[1.5rem] bg-[#050505] border border-white/10 mx-auto flex items-center justify-center mb-8 shadow-inner group-hover:border-primary/50 transition-colors">
            {icon}
         </div>
         <h3 className="text-2xl font-black uppercase tracking-tight">{name}</h3>
         <p className="text-base font-bold text-text-muted mt-2 tracking-widest uppercase">{desc}</p>
      </div>
   );
}

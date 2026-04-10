import { useState, useEffect, useCallback } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  LayoutGrid,
  Loader2,
  CheckCircle2,
  CalendarDays,
  Target,
  Trophy,
  Filter,
  Zap,
  ArrowUpRight,
  Search,
  PlusCircle
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: "task" | "project";
  isCompleted?: boolean;
};

const ProductionCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "task" | "project">("all");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");

  const fetchEvents = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const [tasksSnap, projectsSnap] = await Promise.all([
        getDocs(query(collection(db, "tasks"), where("userId", "==", auth.currentUser.uid))),
        getDocs(query(collection(db, "projects"), where("userId", "==", auth.currentUser.uid)))
      ]);

      const taskEvents = tasksSnap.docs.map(doc => {
         const data = doc.data();
         return {
            id: doc.id,
            title: data.title,
            date: data.dueDate?.toDate() || data.createdAt?.toDate() || new Date(),
            type: "task",
            isCompleted: data.isCompleted
         } as CalendarEvent;
      });

      const projectEvents = projectsSnap.docs.map(doc => {
         const data = doc.data();
         return {
            id: doc.id,
            title: data.title,
            date: data.createdAt?.toDate() || new Date(),
            type: "project"
         } as CalendarEvent;
      });

      setEvents([...taskEvents, ...projectEvents]);
    } catch (e) {
      console.error("Calendar Sync Error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle || !auth.currentUser) return;

    try {
      const newTask = {
        userId: auth.currentUser.uid,
        title: quickTitle,
        description: `Chronological task spawned from calendar on ${format(selectedDate, "MMM dd")}`,
        isCompleted: false,
        dueDate: Timestamp.fromDate(selectedDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "tasks"), newTask);
      setEvents([...events, { id: docRef.id, title: quickTitle, date: selectedDate, type: "task", isCompleted: false }]);
      setQuickTitle("");
      setShowQuickAdd(false);
      toast.success("Production handshake initialized for this date.");
    } catch (e) {
      toast.error("Handshake initialization failure.");
    }
  };

  const filteredEvents = events.filter(e => filterType === "all" || e.type === filterType);
  const selectedDateEvents = filteredEvents.filter(e => isSameDay(e.date, selectedDate));
  
  // Performance Metrics
  const monthEvents = events.filter(e => isSameMonth(e.date, currentMonth));
  const completedThisMonth = monthEvents.filter(e => e.isCompleted).length;
  const projectsThisMonth = monthEvents.filter(e => e.type === "project").length;

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 px-4">
      <div className="space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-4">
          {format(currentMonth, "MMMM yyyy")}
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">{monthEvents.length} Tasks Matched</span>
        </h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted italic opacity-60">Synchronize your temporal production nodes.</p>
      </div>
      
      <div className="flex items-center gap-4">
         <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mr-4">
            {["all", "task", "project"].map((type) => (
               <button 
                 key={type}
                 onClick={() => setFilterType(type as any)}
                 className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                   filterType === type ? 'bg-white/10 text-primary shadow-lg' : 'text-text-muted hover:text-white'
                 }`}
               >
                 {type}
               </button>
            ))}
         </div>
         <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all shadow-xl"><ChevronLeft size={18} /></button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all shadow-xl"><ChevronRight size={18} /></button>
         </div>
      </div>
    </div>
  );

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
       <div className="grid grid-cols-7 border border-white/5 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          {allDays.map((d, i) => {
             const dayEvents = filteredEvents.filter(e => isSameDay(e.date, d));
             const isSelected = isSameDay(d, selectedDate);
             const isCurrentMonth = isSameMonth(d, monthStart);
             const isTodayNode = isSameDay(d, new Date());

             return (
                <div 
                   key={i}
                   onClick={() => setSelectedDate(d)}
                   className={`h-36 p-5 border-r border-b border-white/5 transition-all cursor-pointer relative group ${
                      !isCurrentMonth ? 'bg-black/60 opacity-[0.05]' : 'bg-[#0d0d0d] hover:bg-primary/[0.03]'
                   } ${isSelected ? 'bg-primary/[0.05]' : ''}`}
                >
                   {isSelected && <div className="absolute inset-x-0 top-0 h-1 bg-primary z-20 shadow-[0_0_20px_rgba(34,197,94,0.5)]" />}
                   
                   <div className="flex justify-between items-start mb-2 relative z-10">
                      <span className={`text-[11px] font-black ${isTodayNode ? 'text-primary' : (isCurrentMonth ? 'text-white/40' : 'text-white/5')}`}>
                         {format(d, "d")}
                      </span>
                      {isCurrentMonth && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); setSelectedDate(d); setShowQuickAdd(true); }}
                           className="opacity-0 group-hover:opacity-100 p-1.5 bg-primary rounded-lg text-black transition-all hover:scale-110 shadow-lg shadow-primary/40"
                         >
                            <Plus size={10} />
                         </button>
                      )}
                   </div>
                   
                   <div className="mt-1 space-y-1 relative z-10 max-h-[70px] overflow-hidden">
                      {dayEvents.map(event => (
                         <div key={event.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[8px] font-black uppercase truncate border leading-none ${
                            event.type === 'task' 
                             ? (event.isCompleted ? 'bg-green-500/5 border-green-500/10 text-green-500/40 line-through' : 'bg-primary/10 border-primary/20 text-primary') 
                             : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                         }`}>
                            <div className={`w-1 h-1 rounded-full ${event.type === 'task' ? (event.isCompleted ? 'bg-green-500/40' : 'bg-primary') : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'}`} />
                            {event.title}
                         </div>
                      ))}
                   </div>
                </div>
             );
          })}
       </div>
    );
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row gap-8">
         <div className="flex-1">
            {renderHeader()}
            <div className="grid grid-cols-7 mb-6 px-5 italic">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-text-muted opacity-30">{day}</div>
              ))}
            </div>
            {renderCells()}
         </div>

         {/* Enhanced Agenda Hub */}
         <div className="w-full lg:w-96 space-y-8">
            {/* Monthly Performance Node */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-[#111] border border-white/5 rounded-[32px] text-center space-y-2 group hover:border-primary/20 transition-all">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2"><CheckCircle2 className="text-primary" size={18} /></div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-text-muted">Month Sync</h4>
                  <p className="text-2xl font-black text-white tracking-widest">{completedThisMonth}</p>
               </div>
               <div className="p-6 bg-[#111] border border-white/5 rounded-[32px] text-center space-y-2 group hover:border-orange-500/20 transition-all">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-2"><Target className="text-orange-500" size={18} /></div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-text-muted">Build Spawns</h4>
                  <p className="text-2xl font-black text-white tracking-widest">{projectsThisMonth}</p>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Build Spawns</h4>
                  <p className="text-3xl font-black text-white tracking-widest">{projectsThisMonth}</p>
               </div>
            </div>

            <div className="p-10 bg-[#111] border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden group min-h-[500px] flex flex-col">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none blur-[100px]" />
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                       <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2">Chronos Hub</h3>
                       <h4 className="text-3xl font-black uppercase tracking-tighter text-white">{format(selectedDate, "MMM dd, yyyy")}</h4>
                       <p className="text-xs text-text-muted italic font-medium">Protocol sync for this interval.</p>
                    </div>
                    <Trophy className="text-primary opacity-20" size={32} />
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                     {showQuickAdd ? (
                        <form onSubmit={handleQuickAdd} className="p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Quick Production Handshake</h4>
                           <input 
                             autoFocus
                             type="text" 
                             value={quickTitle}
                             onChange={(e) => setQuickTitle(e.target.value)}
                             placeholder="Task Objective..."
                             className="w-full bg-black/60 border border-white/10 rounded-xl h-12 px-6 text-sm font-bold text-white outline-none focus:border-primary transition-all shadow-inner"
                           />
                           <div className="flex gap-2">
                              <Button type="submit" className="flex-1 h-10 bg-primary text-black font-black uppercase text-[9px] tracking-widest rounded-lg transition-transform hover:scale-105">Sync</Button>
                              <Button type="button" onClick={() => setShowQuickAdd(false)} className="flex-1 h-10 bg-white/5 border border-white/10 text-white font-black uppercase text-[9px] tracking-widest rounded-lg">Abort</Button>
                           </div>
                        </form>
                     ) : (
                        <Button 
                           onClick={() => setShowQuickAdd(true)}
                           className="w-full h-14 bg-surface border-2 border-dashed border-primary/20 hover:border-primary/50 text-primary text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-primary/5 gap-3"
                        >
                           <PlusCircle size={16} /> Spawn Task Node
                        </Button>
                     )}

                     {selectedDateEvents.length > 0 ? (
                        selectedDateEvents.map(event => (
                           <div key={event.id} className="p-5 bg-black/40 border border-white/5 rounded-[24px] flex items-center justify-between group/item hover:border-primary/30 transition-all shadow-lg">
                              <div className="flex items-center gap-4">
                                 <div className={`w-2.5 h-2.5 rounded-full ${event.type === 'task' ? (event.isCompleted ? 'bg-green-500/40' : 'bg-primary') : 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]'}`} />
                                 <div className="space-y-1">
                                    <span className={`text-[11px] font-black group-hover/item:text-primary transition-colors ${event.isCompleted ? 'text-text-muted line-through' : 'text-white'}`}>{event.title}</span>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-40 italic">{event.type} Handshake</p>
                                 </div>
                              </div>
                              <ArrowUpRight size={14} className="text-primary opacity-0 group-hover/item:opacity-100 transition-all translate-y-1 group-hover/item:translate-y-0" />
                           </div>
                        ))
                     ) : !showQuickAdd && (
                        <div className="py-20 text-center flex flex-col items-center justify-center opacity-20">
                           <LayoutGrid size={40} className="mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero Node Activity</p>
                        </div>
                     )}
                  </div>

                  <div className="pt-8 border-t border-white/5 mt-auto flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Zap size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Velocity Stable</span>
                     </div>
                     <span className="text-[10px] font-black text-primary uppercase italic opacity-60 px-3 py-1 bg-primary/5 rounded-md border border-primary/20">Synced</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProductionCalendar;

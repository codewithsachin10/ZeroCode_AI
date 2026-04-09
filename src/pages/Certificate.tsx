import { useState, useEffect, memo } from "react";
import { 
  Award, Download, ShieldCheck, Zap, ArrowLeft, Loader2,
  Bookmark, Calendar, User, CheckCircle2, Share2, Lock,
  Globe, Terminal
} from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Layout from "@/components/Layout";
import { toast } from "sonner";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Certificate = () => {
  const { catId } = useParams();
  const { user, profile } = useUser();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!catId || !user) return;

    const unsub = onSnapshot(doc(db, "video_categories", catId), (cDoc) => {
       if (cDoc.exists()) setCategory(cDoc.data());
    });

    const verifyAchievement = async () => {
       try {
          const vSnap = await getDocs(query(collection(db, "videos"), where("categoryId", "==", catId)));
          const totalVids = vSnap.size;

          const pSnap = await getDocs(query(
             collection(db, "user_video_progress"), 
             where("userId", "==", user.uid),
             where("categoryId", "==", catId),
             where("isCompleted", "==", true)
          ));
          
          if (pSnap.size >= totalVids && totalVids > 0) {
             setVerified(true);
          }
       } catch (e) {
          console.error("Verification Mesh failure:", e);
       } finally {
          setLoading(false);
       }
    };

    verifyAchievement();
    return () => unsub();
  }, [catId, user]);

  const handleDownload = async () => {
     const element = document.getElementById("certificate-node");
     if (!element || !profile || !category) return;
     
     setDownloading(true);
     try {
        const canvas = await html2canvas(element, {
           scale: 3, // High resolution
           backgroundColor: "#0B0B0B",
           useCORS: true,
           logging: false,
        });
        
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
           orientation: "landscape",
           unit: "px",
           format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`VibeCode_Certificate_${profile.name.replace(/\s+/g, '_')}_${category.name.replace(/\s+/g, '_')}.pdf`);
        toast.success("Identity vector exported successfully.");
     } catch (error) {
        console.error("PDF Export Failure:", error);
        toast.error("Vector export failed. Retrying fallback...");
        window.print();
     } finally {
        setDownloading(false);
     }
  };

  if (loading) return (
     <Layout minimalNavbar={true}>
        <div className="flex flex-col items-center justify-center min-h-[700px] gap-10">
           <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-glow" />
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">Verifying Identity Achievement...</p>
        </div>
     </Layout>
  );

  return (
    <Layout hideFooter={true} minimalNavbar={true}>
      <div className="pt-28 pb-40 max-w-[1400px] mx-auto px-10 space-y-20">
         
         {/* Verification Controls */}
         <div className="flex items-center justify-between print:hidden">
            <Link to="/learn" className="group flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center text-text-muted group-hover:bg-primary/20 group-hover:text-primary transition-all">
                  <ArrowLeft size={22} />
               </div>
               <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic">Academy Hub</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-muted italic opacity-40">Retract Pulse</span>
               </div>
            </Link>
            <div className="flex gap-6">
               <Button variant="outline" className="h-16 px-10 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic gap-5 hover:bg-white/5 transition-all"><Share2 size={18} /> Share Identity</Button>
               <Button 
                 onClick={handleDownload} 
                 disabled={downloading}
                 className="h-16 px-12 bg-primary text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic gap-5 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
               >
                  {downloading ? <Loader2 className="animate-spin" /> : <Download size={20} strokeWidth={3} />}
                  {downloading ? "Generating Matrix..." : "Export Vector"}
               </Button>
            </div>
         </div>

         {/* High-Fidelity Certificate Grid */}
         <div className="relative group max-w-5xl mx-auto">
            {/* Ambient Background Pulse */}
            <div className="absolute -inset-20 bg-primary/5 blur-[120px] rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
            
            <div id="certificate-node" className="bg-[#0B0B0B] border-[12px] border-[#111] rounded-[64px] p-20 md:p-32 shadow-2xl relative overflow-hidden flex flex-col items-center text-center print:border-8 print:p-20">
               {/* Pattern Mesh */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-center -rotate-12 scale-150">
                  <Award size={800} />
               </div>

               {/* Verification Node Badge */}
               <div className="mb-20 relative">
                  <div className="absolute inset-0 bg-primary/30 blur-[60px] animate-pulse rounded-full" />
                  <div className="relative w-40 h-40 rounded-full border-8 border-primary bg-black flex items-center justify-center text-primary shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                     <Award size={80} strokeWidth={2.5} className="animate-in zoom-in spin-in-12 duration-1000 delay-300" />
                  </div>
               </div>

               <div className="space-y-16 relative z-10 w-full">
                  <div className="space-y-6">
                     <div className="inline-flex items-center gap-4 px-6 py-2 bg-primary/10 border border-primary/20 rounded-full">
                        <Globe size={12} className="text-primary animate-spin-slow" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Global VibeCode Intelligence Mesh</span>
                     </div>
                     <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white leading-none italic decoration-primary decoration-8 underline-offset-[20px]">Certificate <span className="text-primary italic">Concluded</span></h1>
                  </div>

                  <div className="h-px bg-white/10 w-40 mx-auto" />

                  <div className="space-y-10">
                     <p className="text-[11px] font-black uppercase tracking-[0.5em] text-text-muted italic opacity-60">This identity protocol verifies that</p>
                     <h2 className="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">{profile?.name || "Initializing..."}</h2>
                     <p className="text-lg md:text-xl text-text-secondary font-black italic max-w-2xl mx-auto leading-relaxed uppercase tracking-tight">
                        Has successfully synchronized with the <span className="text-primary">{category?.name}</span> pathway node. 
                        All production logic has been cognitive-mapped and validated within the VibeCode Academy engine.
                     </p>
                  </div>

                  <div className="pt-24 grid grid-cols-2 gap-32 border-t border-white/5">
                     <div className="space-y-4 text-left">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white italic">Sync Log Date</p>
                        <p className="text-xl font-black text-text-muted italic tracking-tighter">{format(new Date(), 'MMMM dd, yyyy')}</p>
                     </div>
                     <div className="space-y-4 text-right">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white italic">Protocol Vector</p>
                        <p className="text-xl font-black text-text-muted italic tracking-tighter font-mono">VC-{(Math.random() * 9000 + 1000).toFixed(0)}-{catId?.slice(0, 4).toUpperCase()}</p>
                     </div>
                  </div>
               </div>

               {/* Secure Matrix Footer */}
               <div className="mt-32 flex items-center justify-between w-full opacity-40">
                  <div className="flex items-center gap-5">
                     <ShieldCheck size={28} className="text-primary" />
                     <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Synchronized</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-text-muted italic">VibeCode_Core v2.4.1</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-5">
                     <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Verified Node</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-text-muted italic">Sector: Learning_Cluster_Alpha</span>
                     </div>
                     <Terminal size={28} className="text-primary" />
                  </div>
               </div>
            </div>
            
            {/* Lockdown Overlay (Locked Mode) */}
            {!verified && (
               <div className="absolute inset-x-0 inset-y-10 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-[64px] z-20 border-2 border-dashed border-primary/20">
                  <div className="p-16 bg-[#111] border border-orange-500/20 rounded-[48px] text-center shadow-2xl space-y-10 group/lock">
                     <div className="relative">
                        <div className="absolute inset-0 bg-orange-500/20 blur-3xl animate-pulse rounded-full" />
                        <Lock className="text-orange-500 mx-auto transition-transform group-hover/lock:rotate-12" size={64} strokeWidth={3} />
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-3xl font-black uppercase tracking-tighter text-white italic">Protocol Locked</h4>
                        <p className="text-[11px] text-text-muted font-black uppercase tracking-[0.3em] italic max-w-xs mx-auto leading-relaxed group-hover/lock:text-white transition-colors">Complete all 100% of the pathway modules to authorize this certificate issuance.</p>
                     </div>
                     <Button onClick={() => navigate("/learn")} className="h-14 px-10 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Resume Pathway</Button>
                  </div>
               </div>
            )}
         </div>
      </div>
    </Layout>
  );
};

export default memo(Certificate);

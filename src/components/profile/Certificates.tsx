import { useUser } from "@/context/UserContext";
import { 
  Award, ShieldCheck, Zap, ArrowUpRight, Loader2,
  Bookmark, Calendar, User, CheckCircle2, Share2, Lock,
  Globe, Terminal, Download, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { memo } from "react";
import { sanitizeInternalPath } from "@/lib/security";

const Certificates = () => {
  const { certificates, loading } = useUser();
  const navigate = useNavigate();

  if (loading) return (
     <div className="flex flex-col items-center justify-center p-32 min-h-[400px] gap-8">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-glow" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse italic">Scanning Credential Mesh...</h2>
     </div>
  );

  return (
    <div className="space-y-16 animate-in fade-in duration-700 font-outfit">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-8 border-b border-white/5">
         <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-primary" />
               <span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-primary">Credential Registry</span>
            </div>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tight uppercase text-white">My <span className="text-primary">Certificates</span></h1>
            <p className="text-text-muted font-medium text-sm opacity-60">Verified proof of your high-velocity technical mastery.</p>
         </div>
         <div className="flex items-center gap-6 px-10 py-5 bg-[#111] border border-white/10 rounded-[32px] shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <Award className="text-primary opacity-60 group-hover:rotate-12 transition-transform" size={24} />
            <div className="flex flex-col relative z-10">
               <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted opacity-60 mb-1">Total Achievements</span>
               <span className="text-3xl font-black text-white tracking-tighter">{certificates.length} <span className="text-[10px] text-primary uppercase ml-1">Nodes</span></span>
            </div>
         </div>
      </div>

      {certificates.length > 0 ? (
         <div className="grid lg:grid-cols-2 gap-10">
            {certificates.map(cert => (
               <div key={cert.id} className="p-10 bg-[#111] border border-white/10 rounded-[56px] hover:border-primary/40 transition-all duration-700 group relative overflow-hidden shadow-2xl">
                  {/* Backdrop Glow */}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col h-full gap-8">
                     <div className="flex justify-between items-start">
                        <div className="p-5 bg-black border border-white/10 rounded-2xl group-hover:scale-110 group-hover:bg-primary shadow-2xl transition-all group-hover:rotate-6">
                           <Award size={32} className="text-primary group-hover:text-black transition-colors" />
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-[9px] font-black uppercase tracking-widest text-text-muted italic opacity-40">Issued Synchronization</span>
                           <span className="text-xs font-black text-white italic mt-1">{cert.issuedAt?.toDate ? format(cert.issuedAt.toDate(), "MMM dd, yyyy") : "Alpha Sync"}</span>
                        </div>
                     </div>
                     
                     <div className="space-y-3">
                        <h3 className="text-3xl font-black uppercase tracking-tighter text-white group-hover:text-primary transition-colors italic leading-none">{cert.categoryName}</h3>
                        <div className="flex items-center gap-4">
                           <ShieldCheck size={14} className="text-primary opacity-60" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Verified_Production_Achievement</span>
                        </div>
                     </div>

                     <div className="pt-8 border-t border-white/5 mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="px-5 py-2 bg-black border border-primary/20 rounded-xl">
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest italic animate-pulse">Sync ID: #{cert.id.slice(0, 8)}</span>
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            const safePath = sanitizeInternalPath(cert.certificateUrl, ["/learn/certificate/", "/academy/certificate/"]);
                            if (!safePath) return;
                            navigate(safePath);
                          }}
                          className="flex items-center gap-4 px-8 h-14 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-black transition-all italic shadow-2xl active:scale-95"
                        >
                           Examine Node <ArrowUpRight size={18} />
                        </button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      ) : (
         <div className="py-48 text-center bg-[#111]/30 border-4 border-dashed border-white/5 rounded-[64px] flex flex-col items-center justify-center space-y-10 animate-pulse grayscale opacity-40">
            <div className="w-28 h-28 rounded-[48px] bg-white/5 border border-white/10 flex items-center justify-center text-primary/20 shadow-2xl relative">
               <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-20" />
               <Award size={64} strokeWidth={1} />
            </div>
            <div className="space-y-4 px-10">
               <h3 className="text-4xl font-black uppercase tracking-tighter text-white/40 italic">Zero Achievements Intercepted</h3>
               <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.4em] italic leading-relaxed max-w-sm mx-auto">Synchronize with Academy pathways to harvest digital credentials for your ID mesh.</p>
            </div>
            <button onClick={() => navigate("/learn")} className="h-16 px-12 bg-primary/10 border border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-primary hover:text-black transition-all">Engage Pathway</button>
         </div>
      )}

      {/* Global Security Footer */}
      <div className="p-10 bg-primary/[0.03] border border-primary/10 rounded-[48px] flex items-center gap-8 group mt-20">
         <div className="w-16 h-16 bg-primary text-black rounded-[24px] flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform">
            <ShieldCheck size={28} strokeWidth={3} />
         </div>
         <div className="space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tighter text-white italic">Identity Encryption Protocol</h3>
            <p className="text-[11px] text-text-muted font-black uppercase tracking-widest italic opacity-60 leading-relaxed max-w-2xl">All digital credentials are synchronized via the VibeCode Academy high-velocity data mesh. Credentials are verifiable and cryptographically tied to your developer node.</p>
         </div>
      </div>
    </div>
  );
};

export default memo(Certificates);

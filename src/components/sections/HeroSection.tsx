import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, PlayCircle, ShieldCheck, Zap, Terminal, Code2, Layers } from "lucide-react";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { motion } from "motion/react";

const HeroSection = () => {
  const { settings } = useAdminSettings();

  const fusions = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.2
      } 
    }
  };

  const atomic = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-32 pb-24 overflow-hidden">
      {/* Neural Background Layers */}
      <div className="absolute inset-0 bg-[#030303]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[100%] bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[30%] bg-gradient-to-t from-[#030303] to-transparent z-10" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150 pointer-events-none" />
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      <motion.div 
        variants={fusions}
        initial="hidden"
        animate="visible"
        className="container-main relative z-20"
      >
        <div className="max-w-7xl mx-auto text-center space-y-16">
          
          {/* Terminal Status Badge */}
          <motion.div variants={atomic} className="flex justify-center">
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-surface/40 border border-white/5 backdrop-blur-3xl shadow-2xl group cursor-pointer hover:border-primary/40 transition-all duration-500">
               <div className="flex items-center gap-3 border-r border-white/10 pr-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                  <span className="text-[12px] font-black uppercase tracking-[0.2em] text-text-muted group-hover:text-primary transition-colors">System.Active</span>
               </div>
               <div className="flex items-center gap-3 pl-1">
                  <Terminal size={14} className="text-primary" />
                  <span className="text-[12px] font-black uppercase tracking-[0.2em] text-primary/80">
                     {settings.siteName || "ZeroCode AI"} // V4.2_ENGINE
                  </span>
               </div>
            </div>
          </motion.div>

          {/* Precision Title */}
          <motion.div variants={atomic} className="w-full space-y-4">
            <h1 className="text-5xl md:text-[14rem] font-black tracking-[-0.06em] leading-[0.75] text-white">
               The Future is Built <br /> 
               <span className="text-primary italic [text-shadow:0_0_80px_rgba(34,197,94,0.5)]">with Intent.</span>
            </h1>
          </motion.div>

          {/* Abstract Description */}
          <motion.div variants={atomic} className="max-w-3xl mx-auto">
             <p className="text-xl md:text-3xl text-text-secondary leading-relaxed font-medium">
                {settings.siteTagline || "Architect autonomous systems and production-grade software at terminal velocity. No boilerplate. Just high-frequency intelligence."}
             </p>
          </motion.div>

          {/* Tactical Action Hub */}
          <motion.div variants={atomic} className="flex flex-col sm:flex-row items-center gap-8 w-full justify-center pt-8">
             <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-16 h-20 rounded-[24px] bg-primary text-primary-foreground font-black uppercase text-sm tracking-[0.3em] shadow-[0_30px_60px_rgba(34,197,94,0.2)] hover:scale-105 active:scale-95 transition-all group">
                   Initialize Build <ArrowRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
             </Link>
             <Link to="/prompts" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-16 h-20 rounded-[24px] glass border-white/5 font-black uppercase text-sm tracking-[0.3em] hover:bg-white/5 active:scale-95 transition-all">
                   System Library
                </Button>
             </Link>
          </motion.div>

          {/* Intelligence Nodes */}
          <motion.div 
             variants={atomic} 
             className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl pt-20"
          >
             {[
                { icon: Code2, label: "Agentic Engineering", desc: "Automate the complex, deploy the impossible." },
                { icon: Layers, label: "Pattern Recognition", desc: "Pre-hardened neural architectures for production." },
                { icon: ShieldCheck, label: "Hardened Core", desc: "Security-first deployment scripts." }
             ].map((node, i) => (
                <div key={i} className="group p-8 rounded-[32px] bg-white/[0.02] border border-white/5 text-left space-y-4 hover:bg-white/[0.04] hover:border-primary/20 transition-all duration-500">
                   <div className="w-12 h-12 rounded-2xl bg-surface border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                      <node.icon size={20} />
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors">{node.label}</h4>
                      <p className="text-xs text-text-muted leading-relaxed italic">{node.desc}</p>
                   </div>
                </div>
             ))}
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

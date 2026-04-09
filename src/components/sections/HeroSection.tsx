import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, PlayCircle, ShieldCheck, Zap } from "lucide-react";
import { useAdminSettings } from "@/hooks/useAdminSettings";

const HeroSection = () => {
  const { settings } = useAdminSettings();

  return (
    <section className="section-padding relative overflow-hidden min-h-[82vh] flex items-center">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.16),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(34,197,94,0.08),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.1),transparent_35%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_30%,rgba(255,255,255,0.02))] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute -top-10 right-10 w-40 h-40 border border-primary/20 rounded-[28px] rotate-12 opacity-40 animate-[float_7s_ease-in-out_infinite]" />
      <div className="absolute bottom-20 left-6 w-24 h-24 border border-white/10 rounded-full opacity-50 animate-[float_9s_ease-in-out_infinite]" />
      <div className="absolute inset-0 [background-size:32px_32px] [background-image:linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] opacity-20 pointer-events-none" />

      <div className="container-main relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-xs font-bold uppercase tracking-widest text-primary mb-8 border border-primary/20 shadow-xl animate-in fade-in duration-700">
            <Sparkles size={12} />
            <span>{settings.siteName || "VibeCode Academy"} is Active</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 uppercase text-white animate-in slide-in-from-bottom-5 duration-700">
            Build products faster.
            <br />
            <span className="hero-highlight-text text-primary [text-shadow:0_0_24px_rgba(34,197,94,0.35)]">Ship with AI confidence.</span>
          </h1>

          <p className="text-lg md:text-xl text-text-muted max-w-3xl mx-auto mb-10 font-medium animate-in slide-in-from-bottom-4 duration-700">
            {settings.siteTagline || "Master the transition from prompt to production with our AI development curriculum."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full animate-in slide-in-from-bottom-3 duration-700">
            <Link to="/signup" className="flex-1 sm:flex-none">
              <Button size="lg" className="gap-2 w-full sm:w-auto px-10 h-14 rounded-lg font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:translate-y-[-2px] transition-all">
                Get Started <ArrowRight size={14} />
              </Button>
            </Link>
            {settings.enablePromptGenerator && (
              <Link to="/prompts" className="flex-1 sm:flex-none">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-10 h-14 rounded-lg font-bold uppercase tracking-widest text-xs bg-white/5 border-white/10 hover:bg-white/10">
                  View Library
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-in fade-in duration-1000">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-text-muted animate-[float_6s_ease-in-out_infinite]">
              <PlayCircle size={12} className="text-primary" />
              Guided lessons
            </div>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-text-muted animate-[float_7.5s_ease-in-out_infinite]">
              <ShieldCheck size={12} className="text-primary" />
              Production-ready patterns
            </div>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-text-muted animate-[float_8.5s_ease-in-out_infinite]">
              <Zap size={12} className="text-primary" />
              Fast implementation
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-8 border-t border-white/5 pt-12 animate-in fade-in duration-1000">
            {[
              { value: "10x", label: "Speed" },
              { value: "50+", label: "Prompts" },
              { value: "Cloud", label: "Infrastructure" },
              { value: "V4", label: "Stable Engine" },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all hover:-translate-y-1">
                <div className="text-3xl font-bold text-white mb-1">{item.value}</div>
                <div className="text-xs text-text-muted font-bold uppercase tracking-widest">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

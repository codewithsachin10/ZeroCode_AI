import { useState } from "react";
import { Sparkles, Terminal, Copy, Check, Wand2, ArrowRight, RotateCcw, Layers, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const quickModes = [
  {
    id: "mvp",
    label: "MVP Builder",
    appType: "SaaS MVP",
    features: "Authentication, Team workspace, Billing, Usage dashboard",
    stack: "React, Tailwind, Supabase",
    constraints: "No dummy data, Clean folder structure, Mobile responsive",
  },
  {
    id: "scale",
    label: "Scale-Ready",
    appType: "Production Web App",
    features: "Auth, Role-based access, Audit logs, Advanced analytics",
    stack: "React, TypeScript, Firebase",
    constraints: "Secure defaults, Optimized queries, Reusable components",
  },
  {
    id: "ui",
    label: "UI/UX Focus",
    appType: "Interactive Dashboard",
    features: "Dynamic widgets, Theme switch, Search/filter, Empty states",
    stack: "React, Tailwind, Framer Motion",
    constraints: "Pixel clean UI, Smooth transitions, Accessibility first",
  },
];

const PromptCustomizer = () => {
  const [appType, setAppType] = useState("SaaS Startup");
  const [features, setFeatures] = useState("Authentication, User Profiles, Dashboard");
  const [stack, setStack] = useState("React, Tailwind, Supabase");
  const [constraints, setConstraints] = useState("No dummy code, Clean architecture, Mobile responsive");
  const [audience, setAudience] = useState("Startup users");
  const [deliveryFormat, setDeliveryFormat] = useState("Code + architecture notes");
  const [activeMode, setActiveMode] = useState("mvp");
  const [architectureStyle, setArchitectureStyle] = useState("Modular monolith");
  const [projectScale, setProjectScale] = useState("Medium");
  const [timelineTarget, setTimelineTarget] = useState("2 weeks");
  const [apiStyle, setApiStyle] = useState("REST");
  const [outputDepth, setOutputDepth] = useState<"standard" | "deep">("standard");
  const [includeTesting, setIncludeTesting] = useState(true);
  const [includeSecurity, setIncludeSecurity] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generatedVariants, setGeneratedVariants] = useState<string[]>([]);
  const [activeVariant, setActiveVariant] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const applyMode = (modeId: string) => {
    const mode = quickModes.find((m) => m.id === modeId);
    if (!mode) return;
    setActiveMode(mode.id);
    setAppType(mode.appType);
    setFeatures(mode.features);
    setStack(mode.stack);
    setConstraints(mode.constraints);
    toast.success(`${mode.label} preset loaded.`);
  };

  const resetAll = () => {
    applyMode("mvp");
    setAudience("Startup users");
    setDeliveryFormat("Code + architecture notes");
    setArchitectureStyle("Modular monolith");
    setProjectScale("Medium");
    setTimelineTarget("2 weeks");
    setApiStyle("REST");
    setOutputDepth("standard");
    setIncludeTesting(true);
    setIncludeSecurity(true);
    setGeneratedPrompt("");
    setGeneratedVariants([]);
    setActiveVariant(0);
  };

  const appendFeature = (feature: string) => {
    const current = features.split(",").map((f) => f.trim()).filter(Boolean);
    if (current.some((f) => f.toLowerCase() === feature.toLowerCase())) return;
    setFeatures([...current, feature].join(", "));
  };

  const buildPrompt = (variantType: "balanced" | "speed" | "quality") => {
    const variantDirective =
      variantType === "speed"
        ? "Prioritize fastest implementation with safe defaults and minimal complexity."
        : variantType === "quality"
        ? "Prioritize maintainability, testability, and architecture quality over speed."
        : "Balance speed, quality, and maintainability.";

    const featureList = features
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const phaseLines = featureList
      .slice(0, 8)
      .map((item, index) => `Phase ${index + 1}: Implement ${item}`)
      .join("\n");

    return `You are a world-class senior full-stack engineer.

Project Goal:
Build a high-performance ${appType} for ${audience}.

Core Features Required:
${features}

Technical Stack:
${stack}

Architecture Style:
${architectureStyle}

Project Scale:
${projectScale}

Timeline Target:
${timelineTarget}

API Style:
${apiStyle}

Quality Constraints:
${constraints}

Delivery Format:
${deliveryFormat}

Optimization Strategy:
${variantDirective}

Output Depth:
${outputDepth === "deep" ? "Deep detail (with implementation checklist and edge cases)." : "Standard detail (concise and implementation-ready)."}

Output Requirements:
1) Architecture plan (folder structure + responsibilities)
2) Full implementation-ready code (frontend + backend if needed)
3) DX checklist (setup steps + env vars)
${includeSecurity ? "4) Security checks (auth, validation, rate limits, role guards)" : ""}
${includeTesting ? "5) Testing plan (unit + integration + manual edge-case checklist)" : ""}
6) Feature implementation roadmap:
${phaseLines || "Phase 1: Implement core authentication and dashboard"}
7) Deployment plan with rollback strategy
8) Performance plan (bundle size, query optimization, caching strategy)

Code Rules:
- No dummy placeholders
- Use reusable components and clean naming
- Include loading, empty, and error states
- Keep responsive behavior production-safe
- Include migration-safe schema updates where needed`;
  };

  const generate = () => {
    if (!appType.trim() || !features.trim() || !stack.trim() || !constraints.trim()) {
      toast.error("Please fill all required fields.");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const variants = [
        buildPrompt("balanced"),
        buildPrompt("speed"),
        buildPrompt("quality")
      ];
      setGeneratedVariants(variants);
      setActiveVariant(0);
      setGeneratedPrompt(variants[0]);
      setIsGenerating(false);
      toast.success("Generated 3 prompt variants.");
    }, 800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast.success("Custom prompt synced to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
      {/* Configuration Node */}
      <div className="glass rounded-[40px] p-10 border-border/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] -z-10 animate-pulse"></div>
        
        <div className="flex items-center gap-4 mb-10">
           <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Wand2 size={24} className="animate-pulse" />
           </div>
           <div>
              <h3 className="text-2xl font-black tracking-tighter uppercase">Prompt Customizer</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Dynamic Engine v4.0</p>
           </div>
        </div>

        <div className="mb-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 block">Quick Mode</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {quickModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => applyMode(mode.id)}
                className={`h-10 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeMode === mode.id
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-white/5 border-white/10 text-text-muted hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
           {[
             { label: "Target Application Type", value: appType, setter: setAppType, placeholder: "e.g. Fintech App, E-commerce, AI Portfolio" },
             { label: "Core Feature Set", value: features, setter: setFeatures, placeholder: "e.g. Auth, Stripe, Database, Analytics" },
             { label: "Engineering Stack", value: stack, setter: setStack, placeholder: "e.g. Next.js, Framer Motion, Prisma" },
             { label: "Quality Constraints", value: constraints, setter: setConstraints, placeholder: "e.g. WCAG 2.1, 99 Lighthouse Score" }
           ].map(input => (
              <div key={input.label} className="p-4 rounded-xl bg-black/40 border border-border/60 focus-within:border-primary/50 transition-all">
                 <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">{input.label}</label>
                 <input 
                   type="text" 
                   value={input.value} 
                   onChange={(e) => input.setter(e.target.value)}
                   placeholder={input.placeholder}
                   className="bg-transparent border-none outline-none text-sm font-bold text-foreground w-full placeholder:text-text-muted/30"
                 />
              </div>
           ))}
        </div>
        <div className="mt-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Quick Add Features</p>
          <div className="flex flex-wrap gap-2">
            {["Role-based access", "Audit logs", "Payments", "Notifications", "Search & Filters", "Team invites"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => appendFeature(chip)}
                className="h-8 px-3 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-white hover:bg-white/10 transition-all"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-border/60 focus-within:border-primary/50 transition-all">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Target Audience</label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Founders, Students, Internal team"
              className="bg-transparent border-none outline-none text-sm font-bold text-foreground w-full placeholder:text-text-muted/30"
            />
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-border/60 focus-within:border-primary/50 transition-all">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Expected Output</label>
            <input
              type="text"
              value={deliveryFormat}
              onChange={(e) => setDeliveryFormat(e.target.value)}
              placeholder="e.g. Code + docs + deploy checklist"
              className="bg-transparent border-none outline-none text-sm font-bold text-foreground w-full placeholder:text-text-muted/30"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="mt-4 h-10 w-full rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white hover:bg-white/10 transition-all"
        >
          {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
        </button>

        {showAdvanced && (
          <div className="space-y-3 mt-3 animate-in fade-in duration-300">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-black/40 border border-border/60 transition-all">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Architecture Style</label>
                <select
                  value={architectureStyle}
                  onChange={(e) => setArchitectureStyle(e.target.value)}
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white outline-none focus:border-primary/40"
                >
                  <option value="Modular monolith" className="bg-[#0B0B0B]">Modular monolith</option>
                  <option value="Feature-first modules" className="bg-[#0B0B0B]">Feature-first modules</option>
                  <option value="Service-oriented" className="bg-[#0B0B0B]">Service-oriented</option>
                </select>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-border/60 transition-all">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Output Depth</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["standard", "deep"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setOutputDepth(mode)}
                      className={`h-10 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                        outputDepth === mode ? "bg-primary/10 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-text-muted"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-black/40 border border-border/60 transition-all">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Project Scale</label>
                <select
                  value={projectScale}
                  onChange={(e) => setProjectScale(e.target.value)}
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white outline-none focus:border-primary/40"
                >
                  <option value="Small" className="bg-[#0B0B0B]">Small</option>
                  <option value="Medium" className="bg-[#0B0B0B]">Medium</option>
                  <option value="Large" className="bg-[#0B0B0B]">Large</option>
                </select>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-border/60 transition-all">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Timeline</label>
                <select
                  value={timelineTarget}
                  onChange={(e) => setTimelineTarget(e.target.value)}
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white outline-none focus:border-primary/40"
                >
                  <option value="48 hours" className="bg-[#0B0B0B]">48 hours</option>
                  <option value="1 week" className="bg-[#0B0B0B]">1 week</option>
                  <option value="2 weeks" className="bg-[#0B0B0B]">2 weeks</option>
                  <option value="1 month" className="bg-[#0B0B0B]">1 month</option>
                </select>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-border/60 transition-all">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">API Style</label>
                <select
                  value={apiStyle}
                  onChange={(e) => setApiStyle(e.target.value)}
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white outline-none focus:border-primary/40"
                >
                  <option value="REST" className="bg-[#0B0B0B]">REST</option>
                  <option value="GraphQL" className="bg-[#0B0B0B]">GraphQL</option>
                  <option value="Hybrid REST + Webhooks" className="bg-[#0B0B0B]">Hybrid REST + Webhooks</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIncludeTesting((v) => !v)}
                className={`h-10 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                  includeTesting ? "bg-primary/10 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-text-muted"
                }`}
              >
                {includeTesting ? "Testing Included" : "Testing Off"}
              </button>
              <button
                type="button"
                onClick={() => setIncludeSecurity((v) => !v)}
                className={`h-10 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                  includeSecurity ? "bg-primary/10 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-text-muted"
                }`}
              >
                {includeSecurity ? "Security Included" : "Security Off"}
              </button>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 mt-10">
          <button
            onClick={generate}
            disabled={isGenerating}
            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all group disabled:opacity-50 disabled:scale-100"
          >
            {isGenerating ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Sparkles size={18} />}
            {isGenerating ? "Synthesizing..." : "Generate Prompt"}
            {!isGenerating && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Output Node */}
      <div className="flex flex-col">
        {generatedPrompt ? (
          <div className="flex-1 glass rounded-[40px] p-10 border-border/40 relative overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-10">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <Terminal size={18} className="text-primary animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Generated Prompt Signature</span>
                </div>
                <button 
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-surface text-text-muted hover:text-primary active:scale-95'}`}
                >
                   {copied ? <Check size={14} /> : <Copy size={14} />}
                   {copied ? "Synced" : "Copy Prompt"}
                </button>
             </div>
             <div className="mb-4 grid grid-cols-2 gap-2">
               <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                 <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-widest text-text-muted">
                   <Layers size={11} className="text-primary" />
                   Mode
                 </div>
                 <p className="text-xs font-bold mt-1 text-white">{quickModes.find((m) => m.id === activeMode)?.label || "Custom"}</p>
               </div>
               <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                 <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-widest text-text-muted">
                   <ShieldCheck size={11} className="text-primary" />
                   Constraints
                 </div>
                 <p className="text-xs font-bold mt-1 text-white line-clamp-1">{constraints}</p>
               </div>
             </div>
             {generatedVariants.length > 0 && (
               <div className="mb-4 flex flex-wrap gap-2">
                 {["Balanced", "Speed", "Quality"].map((label, idx) => (
                   <button
                     key={label}
                     type="button"
                     onClick={() => {
                       setActiveVariant(idx);
                       setGeneratedPrompt(generatedVariants[idx]);
                     }}
                     className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                       activeVariant === idx
                         ? "bg-primary/10 border-primary/40 text-primary"
                         : "bg-white/5 border-white/10 text-text-muted hover:text-white"
                     }`}
                   >
                     {label} v{idx + 1}
                   </button>
                 ))}
               </div>
             )}
             <div className="flex-1 bg-black/60 rounded-[32px] p-10 font-mono text-sm leading-loose text-text-muted/80 overflow-y-auto italic border border-white/5 shadow-inner">
                {generatedPrompt}
             </div>
          </div>
        ) : (
          <div className="flex-1 bg-surface/30 rounded-[40px] border border-border/40 border-dashed flex flex-col items-center justify-center text-center p-20 grayscale opacity-40">
             <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
                <Wand2 size={24} />
             </div>
             <h4 className="text-xl font-bold uppercase tracking-tighter mb-2 italic">Waiting for Configuration</h4>
             <p className="text-xs text-text-muted leading-relaxed">Configure the parameters on the left to vibe your custom engineering prompt.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptCustomizer;

import { HelpCircle, ChevronRight, Zap, Target, Layers, ShieldCheck, Cpu, Code2, Globe, Rocket, MessageSquare, Database, Terminal, Smartphone, Palette, Share2, MousePointer2, Settings, History, Activity, Lock, Users, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";

type FAQ = {
  question: string;
  answer: string;
  category: "General" | "Technical" | "AI & Models" | "Business";
  icon: any;
};

const faqs: FAQ[] = [
  { category: "General", icon: Zap, question: "What is Vibecoding?", answer: "Vibecoding is building software through high-level intent and natural language instead of manual syntax." },
  { category: "General", icon: Layers, question: "Vibecoding vs. Traditional Coding?", answer: "Vibecoding focuses on 'what' to build, while traditional coding focuses on 'how' to write the syntax." },
  { category: "Business", icon: Target, question: "Can I build production apps?", answer: "Yes, modern tools like Lovable and Cursor generate production-ready React/Next.js code with standard backends." },
  { category: "Technical", icon: ShieldCheck, question: "Do I need to know React?", answer: "Basic concepts help you communicate better with the AI, but you don't need to be a master to build apps." },
  { category: "AI & Models", icon: Cpu, question: "Which AI models are best?", answer: "GPT-4o, Claude 3.5 Sonnet, and Gemini 1.5 Pro are the current leaders for code generation." },
  { category: "Technical", icon: Code2, question: "How do I handle bugs?", answer: "Describe the error to the AI or provide the error log; the AI will 'vibe' a fix based on the surrounding context." },
  { category: "Technical", icon: Globe, question: "Is deployment automatic?", answer: "Most vibecoding platforms like Vercel and Netlify offer one-click deployment for your generated code." },
  { category: "Business", icon: Rocket, question: "How fast can I build an MVP?", answer: "Full-stack MVPs can often be built in hours rather than weeks using vibecoding workflows." },
  { category: "General", icon: MessageSquare, question: "What is a 'Prompt' in vibecoding?", answer: "It's your instruction set that defines the logic, UI, and functionality you want to implement." },
  { category: "Technical", icon: Database, question: "How to handle databases?", answer: "Tools like Supabase or Firebase allow you to define your data models using simple natural language prompts." },
  { category: "Technical", icon: Terminal, question: "Do I still use a terminal?", answer: "For simple builds, no. For professional development, you might use it to manage dependencies and git." },
  { category: "Technical", icon: Smartphone, question: "Are the apps mobile-responsive?", answer: "Yes, by default most AI builders use Tailwind CSS which makes responsiveness a core feature." },
  { category: "General", icon: Palette, question: "Can I customize the design?", answer: "Absolutely. You can describe specific colors, spacing, and styles or even provide a reference screenshot." },
  { category: "General", icon: Share2, question: "How do I share my project?", answer: "Most builders provide a public URL or allow you to export the code to a GitHub repository." },
  { category: "AI & Models", icon: MousePointer2, question: "What is 'Agentic Coding'?", answer: "It's when AI 'agents' autonomous execute multiple steps like writing tests, fixing bugs, and deploying." },
  { category: "Technical", icon: Settings, question: "Can I integrate 3rd party APIs?", answer: "Yes. Just provide the API documentation to the AI and ask it to write the integration logic." },
  { category: "Technical", icon: History, question: "Is there version control?", answer: "Yes, connecting to GitHub allows you to track every change and 'roll back' if a vibe goes wrong." },
  { category: "Business", icon: Activity, question: "How is performance?", answer: "The generated code is standard React, so it performs as well as manually written high-quality code." },
  { category: "Business", icon: Lock, question: "Is my data secure?", answer: "Security depends on the tools you choose (Supabase, Firebase, etc.), not the fact that it's vibecoded." },
  { category: "General", icon: Users, question: "Can teams vibecode together?", answer: "Yes, through shared GitHub repos and collaborative AI tools like Cursor Teams." },
  { category: "General", icon: HelpCircle, question: "Where can I learn more?", answer: "ZeroCode AI is the best place to start—check out our Learn section for guided paths." },
  { category: "General", icon: Zap, question: "What is a 'Vibe Shift'?", answer: "A vibe shift is a major refactor or design change initiated by a single, powerful prompt." },
  { category: "AI & Models", icon: Code2, question: "Can AI write complex logic?", answer: "Yes, it can handle data calculations, filtering, and complex algorithms if you break them down." },
  { category: "Technical", icon: Database, question: "What about SQL?", answer: "AI can write perfect SQL queries for PostgreSQL or MySQL based on your schema descriptions." },
  { category: "Technical", icon: Smartphone, question: "Native Mobile Apps?", answer: "Vibecoding primarily focused on Web/PWA, but tools like React Native can be built with Cursor." }
];

const categories = ["All", "General", "Technical", "AI & Models", "Business"];

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <section className="py-12 relative w-full">
      <div className="px-6 md:px-12">
        {/* Advanced Filter Bar */}
        <div className="max-w-4xl mx-auto mb-16 space-y-8">
           <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
              <div className="relative flex flex-col md:flex-row gap-4 p-2 rounded-2xl bg-surface/50 border border-border/60 backdrop-blur-3xl">
                 <div className="flex-1 flex items-center gap-4 px-4 bg-surface/30 rounded-xl border border-transparent focus-within:border-primary/30 transition-all">
                    <Search size={20} className="text-text-muted" />
                    <input 
                      type="text" 
                      placeholder="Search the Intelligence Cloud..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none py-4 text-sm w-full font-medium text-foreground placeholder:text-text-muted/50"
                    />
                 </div>
                 <div className="flex flex-wrap items-center gap-2 p-1">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === cat ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-surface/50 border-border/40 text-text-muted hover:text-foreground hover:border-primary/30'}`}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>        {filteredFaqs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mx-auto">
            {filteredFaqs.map((faq) => (
              <div key={faq.question} className="faq-container noselect">
                <div className="faq-card">
                  <div className="faq-question">
                     {faq.question}
                  </div>
                  <div className="faq-answer">
                     {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface/20 rounded-[40px] border border-dashed border-border/60">
             <div className="w-16 h-16 rounded-3xl bg-surface border border-border flex items-center justify-center mx-auto mb-6 text-text-muted">
                <Search size={32} />
             </div>
             <h4 className="text-xl font-bold mb-2">No results found in the cloud</h4>
             <p className="text-sm text-text-muted">Try a different vibe or search term.</p>
          </div>
        )}

        <div className="mt-16 p-10 rounded-[40px] bg-gradient-to-tr from-primary/10 via-surface/80 to-primary/5 border border-primary/10 text-center max-w-2xl mx-auto group backdrop-blur-[100px] relative overflow-hidden">
           {/* Decorative elements */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] -z-10 group-hover:bg-primary/20 transition-all duration-700"></div>
           
           <h4 className="text-2xl font-black tracking-tighter mb-2 group-hover:text-primary transition-colors">Emergency Protocol?</h4>
           <p className="text-sm text-text-muted mb-8 italic">If you're stuck in a vibe-loop, our elite engineers are ready in the Discord node.</p>
           <button className="relative px-12 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all overflow-hidden border border-white/10">
              <span className="relative z-10">Initialize Discord Bridge</span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
           </button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

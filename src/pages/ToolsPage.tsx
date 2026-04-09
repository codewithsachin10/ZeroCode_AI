import Layout from "@/components/Layout";
import { ExternalLink, Sparkles, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

type Tool = {
  name: string;
  category: string;
  description: string;
  bestFor: string;
  beginnerUse: string;
  avoidWhen: string;
  url: string;
  domain: string;
};

const tools: Tool[] = [
  { name: "Lovable", category: "Full-Stack AI Builder", description: "Build complete web apps from prompts with integrated backend, auth, and deployment.", bestFor: "Rapid prototyping and full product builds", beginnerUse: "Your first choice for building complete apps from scratch", avoidWhen: "You need native mobile apps or complex custom backends", url: "https://lovable.dev", domain: "lovable.dev" },
  { name: "Cursor", category: "AI Code Editor", description: "VS Code fork with deep AI integration for code generation, editing, and chat.", bestFor: "Professional development with AI assistance", beginnerUse: "Great if you already know some coding basics", avoidWhen: "You're a complete beginner with no coding knowledge", url: "https://cursor.com", domain: "cursor.com" },
  { name: "v0 by Vercel", category: "UI Generation", description: "Generate React UI components from text descriptions and screenshots.", bestFor: "Quick UI component generation", beginnerUse: "Generate individual components to learn from", avoidWhen: "You need full application architecture", url: "https://v0.dev", domain: "v0.dev" },
  { name: "Bolt.new", category: "Full-Stack AI Builder", description: "Build and deploy full-stack web applications from prompts in the browser.", bestFor: "Quick full-stack prototypes", beginnerUse: "Similar to Lovable — great for rapid builds", avoidWhen: "You need deep customization of backend logic", url: "https://bolt.new", domain: "bolt.new" },
  { name: "Supabase", category: "Backend / Database", description: "Open-source Firebase alternative with PostgreSQL, auth, storage, and edge functions.", bestFor: "Complete backend for web apps", beginnerUse: "Start with auth and a simple database table", avoidWhen: "You need a NoSQL document database", url: "https://supabase.com", domain: "supabase.com" },
  { name: "Firebase", category: "Backend / Database", description: "Google's platform for auth, Firestore NoSQL database, hosting, and cloud functions.", bestFor: "Real-time apps and NoSQL data models", beginnerUse: "Easy auth setup and simple data storage", avoidWhen: "You need complex SQL queries or relations", url: "https://firebase.google.com", domain: "firebase.google.com" },
  { name: "Stripe", category: "Payments", description: "Payment processing platform for subscriptions, one-time payments, and invoicing.", bestFor: "Any app that needs to accept payments", beginnerUse: "Start with Stripe Checkout for simple payments", avoidWhen: "You only need peer-to-peer payments in specific regions", url: "https://stripe.com", domain: "stripe.com" },
  { name: "Resend", category: "Email", description: "Modern email API for transactional emails with React email templates.", bestFor: "Transactional emails (welcome, reset, notifications)", beginnerUse: "Send your first email with 3 lines of code", avoidWhen: "You need bulk marketing email campaigns", url: "https://resend.com", domain: "resend.com" },
  { name: "GitHub", category: "Version Control", description: "Code hosting platform for version control, collaboration, and CI/CD.", bestFor: "Every software project", beginnerUse: "Learn basic git: commit, push, pull", avoidWhen: "Never — always use version control", url: "https://github.com", domain: "github.com" },
  { name: "Vercel", category: "Deployment", description: "Deploy frontend applications with zero configuration, automatic SSL, and global CDN.", bestFor: "React/Next.js app deployment", beginnerUse: "Connect GitHub repo and deploy in one click", avoidWhen: "You need custom server infrastructure", url: "https://vercel.com", domain: "vercel.com" },
  { name: "Netlify", category: "Deployment", description: "Web hosting with continuous deployment, serverless functions, and form handling.", bestFor: "Static sites and Jamstack apps", beginnerUse: "Drag and drop your build folder to deploy", avoidWhen: "You need complex server-side rendering", url: "https://netlify.com", domain: "netlify.com" },
  { name: "GitHub Copilot", category: "AI Code Assistant", description: "AI pair programmer integrated into VS Code for inline code suggestions.", bestFor: "Speeding up coding in any language", beginnerUse: "Write comments describing what you want, let Copilot complete", avoidWhen: "You want full app generation (use a builder instead)", url: "https://github.com/features/copilot", domain: "github.com" },
];

const categoryStyles: Record<string, string> = {
  "Full-Stack AI Builder": "bg-primary/10 text-primary border-primary/20",
  "AI Code Editor": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "UI Generation": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Backend / Database": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Payments": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Email": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Version Control": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Deployment": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "AI Code Assistant": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

const ToolsPage = () => {
  return (
    <Layout>
      <section className="relative overflow-hidden pt-12 pb-20">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] -z-10"></div>

        <div className="container-main">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border mb-6">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Production Infrastructure</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              The <span className="text-gradient">Modern Stack</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
              We've curated the most powerful tools in the AI ecosystem. From prompt-driven builders to enterprise backends, this is your blueprint for rapid ship.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <div 
                key={tool.name} 
                className="glass rounded-[32px] p-8 border-border/40 hover:border-primary/40 transition-all duration-500 group flex flex-col relative overflow-hidden h-full hover:-translate-y-4 hover:shadow-[0_20px_50px_rgba(34,197,94,0.1)]"
              >
                {/* Floating shine effect */}
                <div className="absolute -inset-x-20 top-[-100%] h-[200%] w-[300px] bg-white opacity-[0.03] blur-3xl group-hover:top-[100%] transition-all duration-1000 rotate-45 pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white p-3 flex items-center justify-center shadow-2xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 overflow-hidden border border-border">
                      <img 
                        src={`https://www.google.com/s2/favicons?sz=128&domain=${tool.domain}`} 
                        alt={`${tool.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-2xl tracking-tighter group-hover:text-primary transition-colors">{tool.name}</h3>
                      <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-lg border ${categoryStyles[tool.category] || "bg-surface text-text-muted"}`}>
                        {tool.category}
                      </span>
                    </div>
                  </div>
                  <a 
                    href={tool.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/40 transition-all shrink-0 group-hover:rotate-45"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed mb-10 flex-1 group-hover:text-foreground transition-colors font-medium">
                  {tool.description}
                </p>

                <div className="space-y-5 pt-8 border-t border-border/40">
                  <div className="flex gap-4 group/item hover:translate-x-2 transition-transform">
                    <div className="mt-1 text-primary shrink-0 transition-transform group-hover/item:scale-125"><CheckCircle2 size={18} /></div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Elite For</span>
                      <p className="text-[11px] text-foreground/80 font-bold leading-tight">{tool.bestFor}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 group/item hover:translate-x-2 transition-transform duration-300">
                    <div className="mt-1 text-text-secondary shrink-0 transition-transform group-hover/item:scale-125"><Lightbulb size={18} /></div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Vibe Tip</span>
                      <p className="text-[11px] text-text-secondary font-medium italic leading-tight">{tool.beginnerUse}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 group/item hover:translate-x-2 transition-transform duration-500">
                    <div className="mt-1 text-destructive/50 shrink-0 transition-transform group-hover/item:scale-125"><AlertTriangle size={18} /></div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">The Pivot</span>
                      <p className="text-[11px] text-text-secondary font-medium leading-tight">{tool.avoidWhen}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ToolsPage;

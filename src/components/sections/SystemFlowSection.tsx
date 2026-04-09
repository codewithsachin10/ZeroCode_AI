import { useState } from "react";
import { Lightbulb, FileText, MessageSquare, Wrench, Monitor, Server, Database, Shield, Plug, TestTube, GitBranch, Rocket, RefreshCw } from "lucide-react";

const steps = [
  { icon: Lightbulb, title: "Idea", desc: "Define your product concept and target audience.", tools: "Notion, Whimsical", mistake: "Starting without a clear problem to solve" },
  { icon: FileText, title: "Planning", desc: "Break down features, define MVP scope, and prioritize.", tools: "Notion, ChatGPT", mistake: "Over-scoping the first version" },
  { icon: MessageSquare, title: "Prompting", desc: "Write structured prompts with role, goal, stack, and constraints.", tools: "Any AI assistant", mistake: "Vague, unstructured prompts" },
  { icon: Wrench, title: "Tool Selection", desc: "Pick the right AI builder and stack for your project.", tools: "Lovable, Cursor, Bolt", mistake: "Using wrong tool for the job" },
  { icon: Monitor, title: "UI Generation", desc: "Generate polished frontend from detailed prompts.", tools: "Lovable, v0", mistake: "Accepting first output without iteration" },
  { icon: Server, title: "Backend Setup", desc: "Set up API routes, server logic, and business rules.", tools: "Supabase, Firebase", mistake: "Skipping proper data modeling" },
  { icon: Database, title: "Database", desc: "Design schemas, relations, and data flow.", tools: "Supabase, Firestore", mistake: "No RLS or security rules" },
  { icon: Shield, title: "Authentication", desc: "Add user signup, login, and route protection.", tools: "Supabase Auth, Firebase Auth", mistake: "Storing roles insecurely" },
  { icon: Plug, title: "Integrations", desc: "Connect payments, email, and third-party services.", tools: "Stripe, Resend", mistake: "Hardcoding API keys in frontend" },
  { icon: TestTube, title: "Testing", desc: "Verify flows, fix edge cases, test responsiveness.", tools: "Browser DevTools", mistake: "Skipping mobile testing" },
  { icon: GitBranch, title: "GitHub", desc: "Push code, manage versions, collaborate.", tools: "GitHub, Git", mistake: "No meaningful commit messages" },
  { icon: Rocket, title: "Deployment", desc: "Deploy to production and share with the world.", tools: "Vercel, Netlify", mistake: "No environment variable setup" },
  { icon: RefreshCw, title: "Iteration", desc: "Gather feedback, fix issues, add features.", tools: "All of the above", mistake: "Not listening to user feedback" },
];

const SystemFlowSection = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="flow" className="section-padding">
      <div className="container-main">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The Complete <span className="text-gradient">Build Flow</span>
          </h2>
          <p className="text-text-secondary leading-relaxed">
            From idea to deployed product — understand every stage of the vibecoding workflow.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <button
              key={step.title}
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeStep === i
                  ? "bg-primary text-primary-foreground"
                  : "glass text-text-secondary hover:text-foreground"
              }`}
            >
              <step.icon size={12} />
              {step.title}
            </button>
          ))}
        </div>

        {/* Active step detail */}
        <div className="max-w-2xl mx-auto glass rounded-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            {(() => {
              const Icon = steps[activeStep].icon;
              return (
                <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center">
                  <Icon size={18} className="text-primary" />
                </div>
              );
            })()}
            <div>
              <span className="text-xs text-text-muted">Step {activeStep + 1} of {steps.length}</span>
              <h3 className="font-bold text-lg">{steps[activeStep].title}</h3>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">{steps[activeStep].desc}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-surface rounded-lg p-4">
              <span className="text-xs text-text-muted block mb-1">Recommended Tools</span>
              <span className="text-sm font-medium">{steps[activeStep].tools}</span>
            </div>
            <div className="bg-surface rounded-lg p-4">
              <span className="text-xs text-destructive block mb-1">Common Mistake</span>
              <span className="text-sm text-text-secondary">{steps[activeStep].mistake}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SystemFlowSection;

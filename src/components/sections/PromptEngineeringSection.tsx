import { Check, X, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const framework = [
  { label: "Role", desc: "Define what the AI should act as", example: "You are an expert full-stack developer..." },
  { label: "Goal", desc: "State the clear objective", example: "Build a complete task management dashboard..." },
  { label: "Features", desc: "List specific functionality", example: "User auth, CRUD tasks, filters, analytics..." },
  { label: "Stack", desc: "Specify technologies", example: "React, TypeScript, Tailwind, Supabase..." },
  { label: "Constraints", desc: "Set quality boundaries", example: "No dummy data, production-ready, responsive..." },
  { label: "Output", desc: "Define expected format", example: "Complete working code with proper types..." },
];

const badPrompt = `Make me a dashboard`;

const goodPrompt = `You are an expert frontend developer. Build a modern analytics dashboard using React, TypeScript, and Tailwind CSS.

Features:
- Sidebar navigation with active states
- Overview cards showing key metrics (users, revenue, growth)
- Line chart for revenue over time using Recharts
- Recent activity table with pagination
- Responsive layout that works on mobile

Constraints:
- Use a dark theme with clean glassmorphism
- No placeholder or dummy data — use realistic demo data
- All components must be properly typed
- Follow consistent spacing and typography hierarchy
- Production-quality code only`;

const PromptEngineeringSection = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(goodPrompt);
    setCopied(true);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="prompting" className="section-padding">
      <div className="container-main">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Master <span className="text-gradient">Prompt Engineering</span>
          </h2>
          <p className="text-text-secondary leading-relaxed">
            The quality of your prompts directly determines the quality of your output.
            Learn the framework that gets results every time.
          </p>
        </div>

        {/* Framework */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto mb-16">
          {framework.map((item) => (
            <div key={item.label} className="glass rounded-xl p-5 card-hover">
              <h4 className="font-semibold text-sm text-primary mb-1">{item.label}</h4>
              <p className="text-xs text-text-secondary mb-3">{item.desc}</p>
              <div className="bg-surface rounded-md px-3 py-2">
                <code className="text-xs text-text-muted">{item.example}</code>
              </div>
            </div>
          ))}
        </div>

        {/* Bad vs Good */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-6 border-destructive/20">
            <div className="flex items-center gap-2 mb-4">
              <X size={16} className="text-destructive" />
              <h4 className="font-semibold text-sm text-destructive">Bad Prompt</h4>
            </div>
            <div className="bg-surface rounded-lg p-4">
              <code className="text-sm text-text-muted whitespace-pre-wrap">{badPrompt}</code>
            </div>
            <p className="text-xs text-text-muted mt-3">Too vague. No context, no stack, no constraints.</p>
          </div>

          <div className="glass rounded-xl p-6 border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Check size={16} className="text-primary" />
              <h4 className="font-semibold text-sm text-primary">Good Prompt</h4>
            </div>
            <div className="bg-surface rounded-lg p-4 relative group">
              <code className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed block max-h-48 overflow-y-auto">{goodPrompt}</code>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-surface-hover opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy size={12} className="text-text-muted" />
              </button>
            </div>
            <p className="text-xs text-primary/70 mt-3">Clear role, goals, features, stack, and constraints.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromptEngineeringSection;

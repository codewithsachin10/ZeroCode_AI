import { useState } from "react";
import Layout from "@/components/Layout";
import { Check, Circle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Choose Your Project Idea",
    description: "Pick a focused project idea that solves a real problem. Start small — a tool, a dashboard, a landing page.",
    tips: ["Pick something you'd actually use", "Limit to 3-5 core features for v1", "Write a one-sentence description of what it does"],
    example: "Example: A personal bookmark manager that lets you save, tag, and search links.",
  },
  {
    title: "Define Your Features",
    description: "Break your idea into specific, buildable features. Prioritize what's essential for launch.",
    tips: ["List every feature you can think of", "Mark each as Must-Have, Nice-to-Have, or Future", "Your MVP is only the Must-Haves"],
    example: "Must-Have: Add bookmark, tag system, search. Nice-to-Have: Import from browser, share collections.",
  },
  {
    title: "Write Your Master Prompt",
    description: "Combine your project idea, features, stack, and constraints into one comprehensive prompt.",
    tips: ["Use the Role → Goal → Features → Stack → Constraints framework", "Be specific about design direction", "Include 'no dummy data, production-ready' as a constraint"],
    example: "See the Prompt Library for full examples of master prompts.",
  },
  {
    title: "Generate Initial UI",
    description: "Use your master prompt to generate the first version of your application UI.",
    tips: ["Don't expect perfection on the first try", "Review the output carefully before iterating", "Focus on structure first, then polish"],
    example: "Paste your master prompt into Lovable, Bolt, or v0 and review the generated output.",
  },
  {
    title: "Clean Up Design",
    description: "Fix alignment, spacing, colors, and typography to match your design vision.",
    tips: ["Check mobile responsiveness", "Ensure consistent spacing scale", "Verify color contrast and readability"],
    example: "Use the CSS Cleanup prompt from the Prompt Library to fix common issues.",
  },
  {
    title: "Add Authentication",
    description: "Set up user signup, login, and route protection using your backend service.",
    tips: ["Start with email/password auth", "Always create a user profile on signup", "Protect routes that need authentication"],
    example: "Use Supabase Auth or Firebase Auth for managed authentication.",
  },
  {
    title: "Set Up Database",
    description: "Design your database schema, create tables, and set up security rules.",
    tips: ["Plan your tables before creating them", "Set up Row Level Security (RLS) policies", "Use proper foreign key relationships"],
    example: "Users table → Projects table → Tasks table with proper relations.",
  },
  {
    title: "Build Core Features",
    description: "Implement the main functionality of your app with real data flow.",
    tips: ["Build one feature at a time", "Test each feature before moving to the next", "Keep components small and focused"],
    example: "CRUD operations for your main data type, connected to the database.",
  },
  {
    title: "Add Integrations",
    description: "Connect third-party services like payments, email, or analytics as needed.",
    tips: ["Only add integrations you actually need for launch", "Store API keys securely (never in frontend code)", "Test integrations thoroughly"],
    example: "Add Stripe for payments, Resend for emails, or analytics tracking.",
  },
  {
    title: "Push to GitHub",
    description: "Set up version control and push your code to a repository.",
    tips: ["Write meaningful commit messages", "Use .gitignore for sensitive files", "Create a clear README"],
    example: "git init → git add . → git commit -m 'Initial commit' → git push",
  },
  {
    title: "Deploy to Production",
    description: "Deploy your app to the web and make it accessible to users.",
    tips: ["Set up environment variables in your hosting platform", "Test the deployed version thoroughly", "Set up a custom domain if needed"],
    example: "Deploy to Vercel or Netlify — connect your GitHub repo for auto-deploys.",
  },
  {
    title: "Iterate and Improve",
    description: "Gather feedback, fix bugs, and add features based on real user needs.",
    tips: ["Share with 5 people and collect feedback", "Fix critical bugs before adding new features", "Track what users actually use vs. what you expected"],
    example: "Create a simple feedback form and review responses weekly.",
  },
];

const GuidedBuild = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleComplete = (index: number) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-main">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Guided Build</span>
            </h1>
            <p className="text-text-secondary leading-relaxed">
              Follow this step-by-step journey to build your first product from idea to deployment.
            </p>
            <div className="mt-4 text-sm text-text-muted">
              {completedSteps.length} of {steps.length} steps completed
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1 bg-surface rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-[280px_1fr] gap-8">
            {/* Step list */}
            <div className="space-y-1">
              {steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                    currentStep === i
                      ? "bg-surface text-foreground"
                      : "text-text-secondary hover:text-foreground hover:bg-surface/50"
                  }`}
                >
                  {completedSteps.includes(i) ? (
                    <Check size={14} className="text-primary shrink-0" />
                  ) : (
                    <Circle size={14} className="text-text-muted shrink-0" />
                  )}
                  <span className="truncate">{step.title}</span>
                </button>
              ))}
            </div>

            {/* Step detail */}
            <div className="glass rounded-xl p-8">
              <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                Step {currentStep + 1} of {steps.length}
              </div>
              <h2 className="text-xl font-bold mb-4">{steps[currentStep].title}</h2>
              <p className="text-text-secondary leading-relaxed mb-6">{steps[currentStep].description}</p>

              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-semibold">Tips</h4>
                {steps[currentStep].tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <ChevronRight size={14} className="text-primary mt-0.5 shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>

              <div className="bg-surface rounded-lg p-4 mb-6">
                <span className="text-xs text-text-muted block mb-1">Example</span>
                <p className="text-sm text-text-secondary">{steps[currentStep].example}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant={completedSteps.includes(currentStep) ? "secondary" : "hero"}
                  size="sm"
                  onClick={() => toggleComplete(currentStep)}
                >
                  {completedSteps.includes(currentStep) ? "Mark Incomplete" : "Mark Complete"}
                </Button>
                {currentStep < steps.length - 1 && (
                  <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep + 1)}>
                    Next Step
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default GuidedBuild;

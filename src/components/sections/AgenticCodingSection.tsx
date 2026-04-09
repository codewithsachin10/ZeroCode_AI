import { Bot, Code, Database, Mail, Rocket, Bug } from "lucide-react";

const capabilities = [
  { icon: Code, title: "Frontend Generation", desc: "AI builds complete UI components from descriptions" },
  { icon: Database, title: "Backend Setup", desc: "Database schemas, APIs, and data models generated automatically" },
  { icon: Bug, title: "Smart Debugging", desc: "AI identifies and fixes bugs from error descriptions" },
  { icon: Mail, title: "Integration Wiring", desc: "Email, payments, auth — connected through prompts" },
  { icon: Bot, title: "Planning & Architecture", desc: "AI helps structure projects before writing code" },
  { icon: Rocket, title: "Deploy & Ship", desc: "From code to production with guided deployment" },
];

const AgenticCodingSection = () => {
  return (
    <section id="agentic" className="section-padding">
      <div className="container-main">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What is <span className="text-gradient">Agentic Coding</span>?
          </h2>
          <p className="text-text-secondary leading-relaxed">
            Agentic coding takes vibecoding further. AI agents don't just generate code — they plan,
            reason, execute multi-step tasks, debug, connect systems, and iterate autonomously.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {capabilities.map((item) => (
            <div key={item.title} className="glass rounded-xl p-6 card-hover group">
              <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center mb-4 group-hover:glow-sm transition-shadow">
                <item.icon size={18} className="text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgenticCodingSection;

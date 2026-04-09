import { Code, Zap, ArrowRight } from "lucide-react";

const comparison = [
  {
    traditional: "Write every line manually",
    vibe: "Describe what you want in natural language",
  },
  {
    traditional: "Spend hours debugging CSS",
    vibe: "Get polished UI generated instantly",
  },
  {
    traditional: "Set up auth from scratch",
    vibe: "Prompt for auth and get it wired",
  },
  {
    traditional: "Weeks to launch an MVP",
    vibe: "Ship a working product in hours",
  },
];

const VibeCodingSection = () => {
  return (
    <section id="vibecoding" className="section-padding">
      <div className="container-main">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What is <span className="text-gradient">Vibecoding</span>?
          </h2>
          <p className="text-text-secondary leading-relaxed">
            Vibecoding is the practice of building software by describing what you want to an AI assistant,
            rather than writing every line of code manually. It's about flow, speed, and turning ideas into reality.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Traditional */}
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <Code size={18} className="text-text-muted" />
              <h3 className="font-semibold text-text-secondary">Traditional Coding</h3>
            </div>
            {comparison.map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-text-muted">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-text-muted shrink-0" />
                {item.traditional}
              </div>
            ))}
          </div>

          {/* Vibecoding */}
          <div className="glass rounded-xl p-6 space-y-4 border-primary/20">
            <div className="flex items-center gap-2 mb-6">
              <Zap size={18} className="text-primary" />
              <h3 className="font-semibold text-primary">Vibecoding</h3>
            </div>
            {comparison.map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {item.vibe}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { title: "For Beginners", desc: "No coding experience needed. Start with natural language prompts." },
            { title: "For Builders", desc: "Ship faster by focusing on product logic instead of boilerplate." },
            { title: "For Teams", desc: "Collaborate on products using shared prompts and guided workflows." },
          ].map((item) => (
            <div key={item.title} className="glass rounded-xl p-5 card-hover">
              <h4 className="font-semibold text-sm mb-2">{item.title}</h4>
              <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VibeCodingSection;

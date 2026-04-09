import { Link } from "react-router-dom";

const footerLinks = {
  Learn: [
    { label: "What is ZeroCode", href: "/#vibecoding" },
    { label: "Agentic Engineering", href: "/#agentic" },
    { label: "System Flow", href: "/#flow" },
    { label: "Prompt Engineering", href: "/#prompting" },
  ],
  Resources: [
    { label: "Prompt Library", href: "/prompts" },
    { label: "Tools & Stack", href: "/tools" },
    { label: "Guided Build", href: "/guided-build" },
    { label: "Hackathon Mode", href: "/hackathon" },
  ],
  Platform: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Sign Up", href: "/signup" },
    { label: "Log In", href: "/login" },
    { label: "Feedback", href: "/feedback" },
  ],
};

const Footer = () => {
  return (
    <footer className="border-t border-border section-padding">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <span className="text-primary">⚡</span>
              <span>ZeroCode AI</span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed">
              The modern platform for learning vibecoding and agentic coding. Turn ideas into real products with AI.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-text-secondary hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} ZeroCode AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-text-muted hover:text-text-secondary cursor-pointer transition-colors">Privacy</span>
            <span className="text-xs text-text-muted hover:text-text-secondary cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

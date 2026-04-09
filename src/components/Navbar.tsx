import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap, LogOut, User, LayoutDashboard, Settings } from "lucide-react";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

const Navbar = ({ minimal = false }: { minimal?: boolean }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings } = useAdminSettings();
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Learn", href: "/learn", show: true },
    { label: "Prompts", href: "/prompts", show: settings.enablePromptGenerator },
    { label: "Tools", href: "/tools", show: true },
    { label: "FAQ", href: "/faq", show: true },
    { label: "Hackathon", href: "/hackathon", show: settings.enableHackathonMode },
  ].filter(l => l.show);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Security session ended.");
      navigate("/");
    } catch (e) {
      toast.error("Logout failed.");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40 backdrop-blur-3xl">
      <div className="container-main flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 font-bold text-xl group transition-all">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <Zap size={18} className="animate-pulse" />
          </div>
          <span className="tracking-tight text-gradient">ZeroCode AI</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all rounded-xl ${
                location.pathname === link.href 
                  ? "text-primary bg-primary/10 border border-primary/20" 
                  : "text-text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {loading ? (
             <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          ) : user ? (
             <div className="flex items-center gap-2">
                {isAdmin && (
                   <Link to="/admin">
                      <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest px-4 h-10 border border-primary/20 text-primary hover:bg-primary/5 transition-all rounded-xl gap-2">
                         <LayoutDashboard size={14} />
                         Admin
                      </Button>
                   </Link>
                )}
                <Link to="/account">
                   <Button variant="hero" size="sm" className="text-[10px] font-black uppercase tracking-widest px-6 h-10 shadow-xl shadow-primary/20 rounded-xl gap-2">
                      <Settings size={14} />
                      Dashboard
                   </Button>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-xl border border-border/40 flex items-center justify-center text-text-muted hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                   <LogOut size={16} />
                </button>
             </div>
          ) : (
             <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest px-6 h-10 border border-border/40 hover:border-primary/40 transition-all rounded-xl">Log in</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="hero" size="sm" className="text-xs font-bold uppercase tracking-widest px-8 shadow-xl shadow-primary/20 h-10 rounded-xl">Get Started</Button>
                </Link>
             </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-foreground bg-surface border border-border rounded-xl"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-border animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="container-main py-6 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-5 py-4 text-sm font-bold tracking-wide text-text-secondary hover:text-primary hover:bg-primary/10 transition-all rounded-2xl border border-transparent hover:border-primary/20"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-border/40">
              {user ? (
                 <>
                    <Link to="/account" onClick={() => setMobileOpen(false)}>
                       <Button variant="hero" className="w-full py-6 rounded-2xl text-xs font-bold uppercase tracking-widest">Dashboard</Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      onClick={handleLogout}
                      className="w-full py-6 rounded-2xl text-xs font-bold uppercase tracking-widest border border-border/40 text-destructive"
                    >
                       Log Out
                    </Button>
                 </>
              ) : (
                 <>
                    <Link to="/login" className="w-full" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full py-6 rounded-2xl text-xs font-bold uppercase tracking-widest border border-border/40">Log in</Button>
                    </Link>
                    <Link to="/signup" className="w-full" onClick={() => setMobileOpen(false)}>
                      <Button variant="hero" className="w-full py-6 rounded-2xl text-xs font-bold uppercase tracking-widest">Get Started</Button>
                    </Link>
                 </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

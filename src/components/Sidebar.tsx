import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  FolderRoot, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Trophy, 
  FileText, 
  Award, 
  Star, 
  Link2, 
  User, 
  ShieldCheck, 
  LogOut, 
  ChevronLeft, 
  Search,
  Zap
} from "lucide-react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, isAdmin } = useUser();
  const location = useLocation();

  const menuItems = [
    { label: "Overview", icon: BarChart3, href: "/dashboard", group: "Main" },
    { label: "Projects", icon: FolderRoot, href: "/prompts", group: "Main" },
    { label: "Tasks", icon: CheckSquare, href: "/learn", group: "Main" },
    { label: "Calendar", icon: CalendarIcon, href: "/calendar", group: "Main" },
    { label: "Leaderboard", icon: Trophy, href: "/leaderboard", group: "Social" },
    { label: "Notes", icon: FileText, href: "/notes", group: "Social" },
    { label: "Certificates", icon: Award, href: "/certificates", group: "Social" },
    { label: "Saved", icon: Star, href: "/favorites", group: "Personal" },
    { label: "Links", icon: Link2, href: "/links", group: "Personal" },
    { label: "Profile", icon: User, href: "/account", group: "Personal" },
    { label: "Security", icon: ShieldCheck, href: "/security", group: "Personal" },
    { label: "Admin", icon: ShieldCheck, href: "/admin", show: isAdmin, group: "System" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Identity session terminated.");
  };

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen glass border-r border-border/40 transition-all duration-500 z-[100] flex flex-col ${collapsed ? 'w-[100px]' : 'w-72'}`}
    >
      {/* Brand Signature */}
      <div className="h-20 flex items-center px-8 border-b border-white/5 relative bg-gradient-to-r from-primary/10 to-transparent">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:rotate-12 transition-transform duration-500">
            <Zap size={20} fill="currentColor" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-700">
               <span className="text-xl font-black uppercase tracking-tighter text-foreground leading-none">ZeroCode.AI</span>
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary mt-1 italic">Dashboard v4.2</span>
            </div>
          )}
        </Link>
      </div>

      {/* Global Search */}
      {!collapsed && (
        <div className="p-6">
           <div className="glass bg-black/40 border border-white/5 rounded-2xl flex items-center px-4 py-3 gap-3 group focus-within:border-primary/40 transition-all">
              <Search size={14} className="text-text-muted group-focus-within:text-primary" />
              <input 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest text-foreground placeholder:text-text-muted/30 w-full"
              />
           </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pt-4 px-4 space-y-8 scrollbar-hide">
         {["Main", "Social", "Personal", "System"].map(group => {
            const items = menuItems.filter(item => item.group === group && (item.show !== false));
            if (items.length === 0) return null;

            return (
              <div key={group} className="space-y-2">
                 {!collapsed && (
                   <span className="text-[8px] font-black uppercase tracking-[0.3em] text-text-muted/40 px-4 mb-4 block">
                      {group}
                   </span>
                 )}
                 {items.map(item => {
                    const active = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 relative group overflow-hidden ${active ? 'bg-primary/20 border border-primary/20 text-primary shadow-lg shadow-primary/5' : 'text-text-muted hover:text-foreground hover:bg-surface'}`}
                      >
                         {active && <div className="absolute left-0 top-0 w-1 h-full bg-primary" />}
                         <div className={`transition-all duration-500 ${active ? 'scale-110' : 'group-hover:scale-110 group-hover:text-primary'}`}>
                            <item.icon size={18} />
                         </div>
                         {!collapsed && (
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-4 duration-500">
                               {item.label}
                            </span>
                         )}
                         {active && !collapsed && (
                            <Sparkles size={10} className="ml-auto text-primary animate-pulse" />
                         )}
                      </Link>
                    );
                 })}
              </div>
            );
         })}
      </nav>

      {/* Footer Profile Node */}
      <div className="p-6 border-t border-white/5 bg-black/20">
         <div className={`flex items-center gap-4 ${collapsed ? 'justify-center' : ''}`}>
            <div className={`w-10 h-10 rounded-xl bg-surface border border-border/40 flex items-center justify-center font-bold text-primary transition-all duration-500 ${collapsed ? 'hover:scale-110 active:scale-95 cursor-pointer' : ''}`}>
               {profile?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            {!collapsed && (
               <div className="flex-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  <h4 className="text-[10px] font-black uppercase tracking-tight text-foreground truncate">{profile?.name || "Developing User"}</h4>
                  <p className="text-[8px] font-black uppercase tracking-widest text-text-muted truncate">{profile?.email}</p>
               </div>
            )}
            {!collapsed && (
              <button 
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
              >
                <LogOut size={16} />
              </button>
            )}
         </div>
      </div>

      {/* Collapse Trigger Toggle */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-4 w-8 h-8 rounded-full glass border border-primary/20 flex items-center justify-center text-primary shadow-2xl hover:scale-110 active:scale-90 transition-all z-10"
      >
        <ChevronLeft size={16} className={`transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </aside>
  );
};

export default Sidebar;

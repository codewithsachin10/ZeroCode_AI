import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Library, 
  Tags, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Settings,
  LogOut,
  Menu,
  Video,
  Trophy
} from "lucide-react";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import AppLoader from "@/components/ui/AppLoader";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Library, label: "Prompts", href: "/admin/prompts" },
  { icon: Tags, label: "Categories", href: "/admin/categories" },
  { icon: Video, label: "Learn Course", href: "/admin/learning" },
  { icon: Trophy, label: "Hackathons", href: "/admin/hackathons" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: MessageSquare, label: "Feedback", href: "/admin/feedback" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, isAdmin } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  }

  // To allow design viewing even without correct firebase config/auth during setup
  // We can comment out the loading block temporarily if needed, but per requirements we need real auth.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AppLoader label="Loading admin..." />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex overflow-hidden font-sans">
      {/* Sidebar Integration */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B0B0B] border-r border-white/5 transition-transform transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static flex flex-col`}>
        <div className="h-16 flex items-center px-8 border-b border-white/5 relative bg-[#0B0B0B]">
          <Link to="/admin" className="text-base font-bold uppercase tracking-widest text-primary">VibeCode<span className="text-white"> Academy</span></Link>
          <button 
            className="md:hidden absolute right-4 p-2 text-text-muted hover:text-white transition-all"
            onClick={() => setMobileMenuOpen(false)}
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pt-6 pb-6 px-4 flex flex-col gap-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4 px-4">Menu</div>
          {navItems.map((item) => {
            const isActive = item.href.includes("?")
              ? `${location.pathname}${location.search}` === item.href
              : location.pathname === item.href;
            return (
              <Link 
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all group ${
                  isActive 
                    ? "bg-primary text-black" 
                    : "text-text-muted hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={14} className={isActive ? "text-black" : "text-text-muted group-hover:text-primary transition-colors"} />
                <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-white/5 bg-[#0B0B0B]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-left rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/5 transition-all group"
          >
            <LogOut size={14} />
            <span className="font-bold text-[10px] uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-white/5 bg-[#0B0B0B] flex items-center justify-between px-8 z-[60] relative">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-text-muted hover:text-white transition-all"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Admin</p>
              <h1 className="text-base font-bold uppercase text-white">{navItems.find(i => i.href === location.pathname)?.label || 'Overview'}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Online</span>
             </div>
             <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
               A
             </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div className="max-w-[1200px] mx-auto pb-40">
            <Outlet />
          </div>
        </div>

        {/* Status Footer */}
        <div className="fixed bottom-4 right-6 z-[100] hidden lg:block">
           <div className="bg-[#0B0B0B] border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-4 shadow-xl">
              <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">System Stable</span>
              <div className="w-px h-2 bg-white/10" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-primary">v1.4.2</span>
           </div>
        </div>
      </main>
      
      {/* Mobile background overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

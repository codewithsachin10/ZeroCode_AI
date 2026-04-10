import { Outlet } from "react-router-dom";
import AppLoader from "./ui/AppLoader";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AppLoader label="Loading..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-20 text-center bg-background">
        <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center mb-8 shadow-2xl">
           <Lock size={32} className="text-destructive animate-pulse" />
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-foreground">Access Denied</h2>
        <p className="text-sm text-text-muted italic mb-10 max-w-sm">Please login to access your dashboard.</p>
        <Button variant="hero" className="rounded-[40px] px-16 h-16 uppercase font-black text-xs tracking-widest shadow-2xl shadow-primary/20" onClick={() => window.location.href = '/login'}>
           Login
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pl-72 group-has-[aside.w-[100px]]:pl-[100px] transition-all duration-500">
         <header className="h-20 flex items-center px-12 border-b border-white/5 bg-background/50 backdrop-blur-md relative z-10 shrink-0">
            <div className="flex items-center gap-4">
               <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted">System Active</span>
            </div>
         </header>

         {/* Content Viewport */}
         <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
            <div className="w-full pb-40">
               <Outlet />
            </div>
         </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

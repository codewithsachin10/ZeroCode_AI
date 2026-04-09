import Navbar from "./Navbar";
import Footer from "./Footer";
import { MorphingSquare } from "./ui/morphing-square";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { AlertTriangle, Info, Zap, X } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { useActivityTracker } from "@/hooks/useActivityTracker";

const FloatingChatSystem = lazy(() => import("./chat/FloatingChatSystem"));

const Layout = ({ children, hideFooter = false, minimalNavbar = false }: { children: React.ReactNode, hideFooter?: boolean, minimalNavbar?: boolean }) => {
  const { settings, loading } = useAdminSettings();
  const { trackEvent } = useActivityTracker();
  const [showBanner, setShowBanner] = useState(false);

  // Handle persistence of banner dismissal
  useEffect(() => {
    if (!loading && settings.systemNotification) {
      const isDismissed = localStorage.getItem(`banner_dismissed_${settings.systemNotification}`);
      if (!isDismissed) {
        setShowBanner(true);
      }
    }
  }, [loading, settings.systemNotification]);

  const handleDismiss = () => {
    setShowBanner(false);
    if (settings.systemNotification) {
      // Store dismissal for this specific message
      localStorage.setItem(`banner_dismissed_${settings.systemNotification}`, "true");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <MorphingSquare message="Initializing Platform..." />
      </div>
    );
  }

  if (settings.maintenanceMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[150px] -z-10 animate-pulse"></div>
        <div className="glass p-12 rounded-[40px] border-border/40 shadow-2xl max-w-xl animate-in fade-in zoom-in duration-700">
           <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl border border-destructive/20 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-destructive/10">
              <AlertTriangle size={40} className="animate-bounce" />
           </div>
           <h1 className="text-4xl font-black mb-6 tracking-tighter text-foreground uppercase">Protocol Freeze</h1>
           <p className="text-lg text-text-secondary leading-relaxed mb-10 italic">
             {settings.siteName || "ZeroCode AI"} is currently undergoing essential core upgrades. External access is temporarily restricted to ensure data integrity.
           </p>
           <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-surface border border-border text-xs font-bold text-text-muted uppercase tracking-widest">
                 System Version: Cloud-Core-Vibration-3.0
              </div>
              <p className="text-[10px] text-text-muted font-bold opacity-40">ADMIN_OVERRIDE_ENABLED_FOR_AUTHORIZED_IPS</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Dynamic Notification Banner with Persistence */}
      {settings.systemNotification && showBanner && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground py-3 text-center px-8 border-b border-white/10 shadow-2xl flex items-center justify-center gap-6 animate-in slide-in-from-top duration-500">
           <div className="flex items-center gap-3">
             <Zap size={16} className="animate-pulse" />
             <span className="text-xs font-black uppercase tracking-widest italic">{settings.systemNotification}</span>
           </div>
           <button onClick={handleDismiss} className="hover:scale-125 transition-all p-1 bg-white/20 rounded-full">
              <X size={12} />
           </button>
        </div>
      )}

      <Navbar minimal={minimalNavbar} />
      <main className={`flex-1 ${settings.systemNotification && showBanner ? 'pt-28' : 'pt-16'} transition-all duration-500`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
      <Suspense fallback={null}>
        <FloatingChatSystem />
      </Suspense>
    </div>
  );
};

export default Layout;

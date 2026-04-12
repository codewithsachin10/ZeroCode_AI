import { useState, useEffect } from "react";
import {
  Info,
  AlertTriangle,
  RefreshCw,
  X,
  Pin,
  ChevronDown,
  ChevronUp,
  Megaphone
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "update";
  isPinned: boolean;
  isActive: boolean;
  createdAt: any;
};

const TYPE_CONFIG = {
  info: {
    icon: Info,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.06)",
    border: "rgba(59,130,246,0.15)",
    label: "Info",
  },
  warning: {
    icon: AlertTriangle,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.15)",
    label: "Warning",
  },
  update: {
    icon: RefreshCw,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.06)",
    border: "rgba(34,197,94,0.15)",
    label: "Update",
  },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Load dismissed IDs from session
    const stored = sessionStorage.getItem("dismissed_announcements");
    if (stored) {
      try { setDismissed(new Set(JSON.parse(stored))); } catch {}
    }

    // Fetch ALL announcements, filter in memory to avoid index requirement
    const unsub = onSnapshot(collection(db, "announcements"), (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Announcement))
        .filter((a) => a.isActive)
        .sort((a, b) => {
          // Pinned first
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          // Then newest first
          const dateA = a.createdAt?.toDate?.() || 0;
          const dateB = b.createdAt?.toDate?.() || 0;
          return (dateB as any) - (dateA as any);
        });
      setAnnouncements(all);
    });

    return () => unsub();
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    sessionStorage.setItem("dismissed_announcements", JSON.stringify([...next]));
  };

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  const displayCount = expanded ? visible.length : Math.min(visible.length, 3);
  const displayItems = visible.slice(0, displayCount);

  if (visible.length === 0) return null;

  return (
    <div className="w-full space-y-3 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Section label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone size={14} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
            Important Updates
          </span>
          {visible.length > 0 && (
            <span className="text-[9px] font-black bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full">
              {visible.length}
            </span>
          )}
        </div>
        {visible.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors"
          >
            {expanded ? "Show Less" : `View All (${visible.length})`}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Announcement Cards */}
      <div className="space-y-3">
        {displayItems.map((a) => {
          const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
          const TypeIcon = cfg.icon;

          return (
            <div
              key={a.id}
              className="relative flex items-start gap-4 p-5 rounded-[2px] border transition-all group"
              style={{
                backgroundColor: cfg.bg,
                borderColor: cfg.border,
              }}
            >
              {/* Left accent */}
              <div
                className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-[2px]"
                style={{ backgroundColor: cfg.color, opacity: 0.6 }}
              />

              {/* Icon */}
              <div
                className="p-2 rounded-[2px] shrink-0 mt-0.5"
                style={{ backgroundColor: `${cfg.color}15`, border: `1px solid ${cfg.color}20` }}
              >
                <TypeIcon size={14} style={{ color: cfg.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  {a.isPinned && (
                    <Pin size={10} className="text-orange-500 shrink-0" />
                  )}
                  <h4 className="text-[12px] font-black text-white uppercase tracking-tight leading-snug">
                    {a.title}
                  </h4>
                </div>
                <p className="text-[11px] font-medium text-text-secondary leading-relaxed opacity-70">
                  {a.message}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <span
                    className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-[2px]"
                    style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-[8px] font-bold text-text-muted opacity-40">
                    {a.createdAt ? new Date(a.createdAt.toDate()).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                  </span>
                </div>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(a.id)}
                className="p-1.5 text-text-muted hover:text-white rounded-[2px] hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

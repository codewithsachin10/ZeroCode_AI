import { useEffect, useRef, useCallback } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  updateDoc, 
  increment,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export type ActivityAction = 
  | "login"
  | "prompt_copy"
  | "prompt_save"
  | "note_create"
  | "task_complete"
  | "project_create"
  | "system_heartbeat";

export const useActivityTracker = () => {
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  const trackEvent = useCallback(async (action: ActivityAction, metadata: any = {}) => {
    const user = auth.currentUser;
    if (!user) return;

    const todayId = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const statsDocRef = doc(db, "daily_stats", `${user.uid}_${todayId}`);

    try {
      // 1. Log Raw Event
      await addDoc(collection(db, "user_activity"), {
        userId: user.uid,
        action,
        metadata,
        timestamp: serverTimestamp()
      });

      // 2. Atomic Aggregation for Performance (Daily Stats)
      const updateData: any = {
        userId: user.uid,
        date: todayId,
        updatedAt: serverTimestamp()
      };

      if (action === "prompt_copy" || action === "prompt_save") updateData.promptsUsed = increment(1);
      if (action === "task_complete") updateData.tasksCompleted = increment(1);
      if (action === "note_create") updateData.notesCreated = increment(1);
      if (action === "project_create") updateData.projectsActive = increment(1);

      await setDoc(statsDocRef, updateData, { merge: true });

      // 3. Log into Recent Prompts Registry
      if (action === "prompt_copy" || action === "prompt_save") {
        const recentRef = doc(db, "recent_prompts", `${user.uid}_${metadata.promptId || 'legacy'}`);
        await setDoc(recentRef, {
          userId: user.uid,
          promptId: metadata.promptId || 'legacy',
          title: metadata.title || 'Unknown Prompt',
          lastUsedAt: serverTimestamp()
        }, { merge: true });
      }

      // 4. User Level Global Aggregation
      const userRef = doc(db, "users", user.uid);
      if (action === "task_complete") {
        await updateDoc(userRef, { tasksCompleted: increment(1) });
      }

    } catch (e) {
      console.error("Activity Tracker: Propagation Error:", e);
    }
  }, []);

  const updateHeartbeat = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    const todayId = new Date().toISOString().split('T')[0];
    const statsDocRef = doc(db, "daily_stats", `${user.uid}_${todayId}`);
    const userRef = doc(db, "users", user.uid);

    try {
      // Increment time spent (0.5 minutes every 30 seconds)
      await Promise.all([
        setDoc(statsDocRef, { 
          userId: user.uid, 
          date: todayId, 
          timeSpentMinutes: increment(0.5), 
          updatedAt: serverTimestamp() 
        }, { merge: true }),
        updateDoc(userRef, { 
          totalTimeSpent: increment(0.5) 
        })
      ]);
    } catch (e) {
      // Silent fail for heartbeat
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Start Heartbeat
        if (!heartbeatInterval.current) {
          heartbeatInterval.current = setInterval(updateHeartbeat, 30000);
          trackEvent("login", { system: "VibeCode Mesh" });
        }
      } else {
        // Stop Heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }
      }
    });

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
      unsubscribe();
    };
  }, [trackEvent, updateHeartbeat]);

  return { trackEvent };
};

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  increment,
  limit
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export type ActivityEvent = {
  id: string;
  action: string;
  metadata?: any;
  timestamp?: Timestamp;
};

export type DailyStats = {
  promptsUsed: number;
  savedPrompts: number;
  notesCreated: number;
  projectsActive: number;
  tasksCompleted: number;
  streakCount: number;
  longestStreak: number;
  timeSpentMinutes: number;
};

let cachedStats: DailyStats | null = null;
let cachedActivity: ActivityEvent[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000;

export const useUserStats = () => {
  const [stats, setStats] = useState<DailyStats>(cachedStats || {
    promptsUsed: 0,
    savedPrompts: 0,
    notesCreated: 0,
    projectsActive: 0,
    tasksCompleted: 0,
    streakCount: 0,
    longestStreak: 0,
    timeSpentMinutes: 0
  });
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>(cachedActivity || []);
  const [loading, setLoading] = useState(!cachedStats);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async (userId: string) => {
      if (cachedStats && cachedActivity && (Date.now() - lastFetchTime < CACHE_DURATION)) {
        setLoading(false);
        return;
      }

      try {
        if (!cachedStats) setLoading(true);

        const [userDoc, streakDoc, activitiesSnap, savedSnap, notesSnap, projectsSnap, tasksSnap] = await Promise.all([
          getDoc(doc(db, "users", userId)),
          getDoc(doc(db, "streaks", userId)),
          getDocs(query(collection(db, "user_activity"), where("userId", "==", userId), limit(50))),
          getDocs(query(collection(db, "saved_prompts"), where("userId", "==", userId))),
          getDocs(query(collection(db, "notes"), where("userId", "==", userId))),
          getDocs(query(collection(db, "projects"), where("userId", "==", userId))),
          getDocs(query(collection(db, "tasks"), where("userId", "==", userId), where("isCompleted", "==", true)))
        ]);

        if (!isMounted) return;

        const userData = userDoc.data() || {};
        const streakData = streakDoc.data() || { currentStreak: 0, longestStreak: 0 };
        const activities = activitiesSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as ActivityEvent))
          .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
        
        const promptsUsedCount = activities.filter(a => a.action === "prompt_use" || a.action === "prompt_copy").length;

        const newStats: DailyStats = {
          promptsUsed: promptsUsedCount,
          savedPrompts: savedSnap.size,
          notesCreated: notesSnap.size,
          projectsActive: projectsSnap.size,
          tasksCompleted: tasksSnap.size || userData.tasksCompleted || 0,
          streakCount: streakData.currentStreak || 0,
          longestStreak: streakData.longestStreak || 0,
          timeSpentMinutes: userData.totalTimeSpent || 0
        };

        cachedStats = newStats;
        cachedActivity = activities.slice(0, 10);
        lastFetchTime = Date.now();

        setStats(newStats);
        setRecentActivity(activities.slice(0, 10));

        // Background: Validate Streak (Simple logic)
        validateStreak(userId, streakData);

      } catch (e) {
        console.error("Performance: Critical Sync Error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const validateStreak = async (userId: string, currentStreakData: any) => {
      const now = new Date();
      const lastActive = currentStreakData.lastActiveDate?.toDate() || new Date(0);
      
      const diffInMs = now.getTime() - lastActive.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) return; // Already active today

      let newStreak = currentStreakData.currentStreak;
      if (diffInDays === 1) {
        newStreak += 1;
      } else if (diffInDays > 1) {
        newStreak = 1; // Streak broken
      }

      await setDoc(doc(db, "streaks", userId), {
        userId,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, currentStreakData.longestStreak || 0),
        lastActiveDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchAllData(user.uid);
      } else {
        cachedStats = null;
        cachedActivity = null;
        setLoading(false);
      }
    });

    return () => { isMounted = false; unsubscribe(); };
  }, []);

  return { stats, recentActivity, loading };
};

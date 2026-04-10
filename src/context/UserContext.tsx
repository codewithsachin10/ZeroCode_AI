import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { handlePlatformError } from '@/lib/error-handler';
import { collection, query, where, onSnapshot, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: string;
  username: string;
  secretCode?: string;
  isPublic?: boolean;
  totalTimeSpent?: number;
  tasksCompleted?: number;
  profilePhoto?: string;
  bio?: string;
  streakCount?: number;
}

interface Project { id: string; title: string; category: string; description?: string; progressPercent?: number; status: 'active' | 'completed' | 'on-hold'; createdAt: any; updatedAt: any; stages?: any[]; }
interface Task { id: string; title: string; isCompleted: boolean; deadline?: any; projectId?: string; }
interface Note { id: string; title: string; content: string; updatedAt: any; }
interface Activity { id: string; action: string; metadata: any; timestamp: any; }
interface Certificate { id: string; categoryId: string; categoryName: string; issuedAt: any; certificateUrl: string; }

interface UserContextType {
  user: User | null;
  profile: UserData | null;
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  activity: Activity[];
  certificates: Certificate[];
  dailyStats: any | null;
  isAdmin: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [dailyStats, setDailyStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setProjects([]);
        setTasks([]);
        setNotes([]);
        setActivity([]);
        setCertificates([]);
        setDailyStats(null);
        setLoading(false);
        setError(null);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const userId = user.uid;
    const today = new Date().toISOString().split('T')[0];

    // Real-Time Listeners Mesh
    const unsubs: any[] = [];

    // 1. Profile Listener
    unsubs.push(onSnapshot(doc(db, "users", userId), async (d) => {
       if (d.exists()) {
         const data = d.data() as UserData;
         if (!data.secretCode) {
           const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
           await updateDoc(doc(db, "users", userId), { secretCode: newCode });
         }
         setProfile({ uid: d.id, ...data } as UserData);
       }
    }, (e) => {
       const msg = handlePlatformError(e, "Profile Mesh");
       setError(msg);
    }));

    // 2. Projects Listener
    unsubs.push(onSnapshot(query(collection(db, "projects"), where("userId", "==", userId)), (snap) => {
       setProjects(snap.docs
         .map(d => ({ id: d.id, ...d.data() } as Project))
         .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0))
       );
    }, (e) => {
       const msg = handlePlatformError(e, "Project Matrix");
       setError(msg);
    }));

    // 3. Tasks Listener
    unsubs.push(onSnapshot(query(collection(db, "tasks"), where("userId", "==", userId)), (snap) => {
       setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    }, (e) => {
       const msg = handlePlatformError(e, "Task Operations");
       setError(msg);
    }));

    // 4. Notes Listener
    unsubs.push(onSnapshot(query(collection(db, "notes"), where("userId", "==", userId)), (snap) => {
       setNotes(snap.docs
         .map(d => ({ id: d.id, ...d.data() } as Note))
         .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0))
       );
    }, (e) => console.error("Knowledge Node Sync Error:", e)));

    // 5. Activity Listener (Client-Side Limiting to avoid Index Requirements)
    unsubs.push(onSnapshot(query(collection(db, "user_activity"), where("userId", "==", userId)), (snap) => {
       setActivity(snap.docs
         .map(d => ({ id: d.id, ...d.data() } as Activity))
         .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))
         .slice(0, 20)
       );
    }, (e) => {
       const msg = handlePlatformError(e, "Activity Matrix");
       setError(msg);
    }));

    // 6. Certificates Listener
    unsubs.push(onSnapshot(query(collection(db, "certificates"), where("userId", "==", userId)), (snap) => {
       setCertificates(snap.docs
         .map(d => ({ id: d.id, ...d.data() } as Certificate))
         .sort((a, b) => (b.issuedAt?.toMillis?.() || 0) - (a.issuedAt?.toMillis?.() || 0))
       );
    }, (e) => console.error("Credential Sync Error:", e)));

    // 7. Daily Stats Listener
    unsubs.push(onSnapshot(doc(db, "daily_stats", `${userId}_${today}`), (d) => {
       if (d.exists()) setDailyStats(d.data());
    }, (e) => console.error("Daily Stat Sync Error:", e)));

    // Data Load Completion Check
    setLoading(false);

    return () => unsubs.forEach(unsub => unsub());
  }, [user]);

  const isAdmin = profile?.role === "admin";

  return (
    <UserContext.Provider value={{
      user,
      profile,
      projects,
      tasks,
      notes,
      activity,
      certificates,
      dailyStats,
      loading,
      isAdmin,
      error
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

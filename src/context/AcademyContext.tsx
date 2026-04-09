import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';

interface VideoCategory {
  id: string;
  name: string;
  learningPath: 'beginner' | 'intermediate' | 'advanced';
  isCertificationEnabled: boolean;
}

interface Video {
  id: string;
  title: string;
  description: string;
  youtubeEmbedUrl: string;
  categoryId: string;
  order: number;
  isLocked: boolean;
  isPublished?: boolean;
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
  weeklyChecklist?: string[];
  interactiveConfig?: {
    unitLabel?: string;
    animationTitle?: string;
    script?: string[];
    quickQuestions?: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
    miniTask?: {
      title?: string;
      instruction?: string;
      actionLabel?: string;
      actionUrl?: string;
      actionPrompt?: string;
    };
    buildNowLabel?: string;
  };
}

interface AcademyContextType {
  categories: VideoCategory[];
  videos: Video[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [catsSnap, vidsSnap] = await Promise.all([
        getDocs(query(collection(db, "video_categories"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "videos"), orderBy("order", "asc")))
      ]);

      const cats = catsSnap.docs.map(d => ({ id: d.id, ...d.data() } as VideoCategory));
      const vids = vidsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Video));

      setCategories(cats);
      setVideos(vids);
    } catch (error) {
      console.error("Academy Context Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Set up real-time sub for responsiveness on updates
    const unsubCats = onSnapshot(collection(db, "video_categories"), (snap) => {
       const cats = snap.docs.map(d => ({ id: d.id, ...d.data() } as VideoCategory));
       setCategories(cats);
    });

    const unsubVids = onSnapshot(collection(db, "videos"), (snap) => {
       const vids = snap.docs.map(d => ({ id: d.id, ...d.data() } as Video));
       setVideos(vids.sort((a, b) => a.order - b.order));
    });

    return () => {
       unsubCats();
       unsubVids();
    };
  }, [fetchData]);

  return (
    <AcademyContext.Provider value={{ categories, videos, loading, refreshData: fetchData }}>
      {children}
    </AcademyContext.Provider>
  );
};

export const useAcademy = () => {
  const context = useContext(AcademyContext);
  if (context === undefined) {
    throw new Error('useAcademy must be used within an AcademyProvider');
  }
  return context;
};

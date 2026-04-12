import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { VIBECODING_CURRICULUM } from '@/lib/curriculum-data';

export interface VideoCategory {
  id: string;
  name: string;
  learningPath: 'beginner' | 'intermediate' | 'advanced';
  isCertificationEnabled: boolean;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeEmbedUrl: string;
  categoryId: string;
  order: number;
  isLocked: boolean;
  isPublished?: boolean;
  shortNote?: string[];
  keyPoints?: string[];
  animation?: { title: string; flow: string[] };
  qa?: { question: string; answer: string }[];
  miniTask?: { instruction: string; actionUrl?: string; actionPrompt?: string };
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
  project?: { title: string; link: string };
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
      // Initialize with our Master Curriculum
      const masterCats = VIBECODING_CURRICULUM.map(m => ({
        id: m.id,
        name: m.name,
        learningPath: 'beginner' as const,
        isCertificationEnabled: true
      }));

      const masterVids = VIBECODING_CURRICULUM.flatMap((m, mIdx) => 
        m.units.map((u, uIdx) => ({
          id: u.id,
          title: u.title,
          description: u.description,
          youtubeEmbedUrl: u.videoUrl,
          categoryId: m.id,
          order: (mIdx * 100) + uIdx,
          isLocked: mIdx > 0 && uIdx > 0, // Unlock first module
          isPublished: true,
          ...u
        }))
      );

      setCategories(masterCats);
      setVideos(masterVids);
      
      // Optionally fetch from DB to append extras
      const [catsSnap, vidsSnap] = await Promise.all([
        getDocs(query(collection(db, "video_categories"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "videos"), orderBy("order", "asc")))
      ]);

      if (!catsSnap.empty) {
        const extraCats = catsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as VideoCategory))
          .filter(c => !VIBECODING_CURRICULUM.find(m => m.id === c.id));
        setCategories(prev => [...prev, ...extraCats]);
      }

      if (!vidsSnap.empty) {
        const extraVids = vidsSnap.docs
           .map(d => ({ id: d.id, ...d.data() } as Video))
           .filter(v => !masterVids.find(mv => mv.id === v.id));
        setVideos(prev => [...prev, ...extraVids]);
      }

    } catch (error) {
      console.error("Academy Context Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Real-time subs temporarily disabled to prioritize Master Curriculum stability
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

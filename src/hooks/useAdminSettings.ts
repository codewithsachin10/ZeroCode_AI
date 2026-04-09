import { useState, useEffect } from 'react';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type AdminSettings = {
  siteName: string;
  siteTagline: string;
  contactEmail: string;
  maintenanceMode: boolean;
  systemNotification: string;
  enablePromptGenerator: boolean;
  enableWaitlist: boolean;
  enableHackathonMode: boolean;
  metaTitle: string;
  metaDescription: string;
  themeVariant: string;
  googleLoginEnabled: boolean;
  githubLoginEnabled: boolean;
  [key: string]: any;
};

const DEFAULT_SETTINGS: AdminSettings = {
  siteName: "ZeroCode AI",
  siteTagline: "Master the transition from prompt to production with our elite AI development stack.",
  contactEmail: "admin@zerocodeai.io",
  maintenanceMode: false,
  systemNotification: "",
  enablePromptGenerator: true,
  enableWaitlist: true,
  enableHackathonMode: true,
  discordUrl: "https://discord.gg/zerocode",
  githubUrl: "https://github.com/zerocode",
  twitterUrl: "https://twitter.com/zerocode",
  metaTitle: "ZeroCode AI | Master the AI Stack",
  metaDescription: "The elite training ground for the next generation of AI-native developers.",
  themeVariant: "classic",
  googleLoginEnabled: true,
  githubLoginEnabled: true,
};

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(() => {
    // Optimistic initialization from localStorage for instant reloads
    const cached = localStorage.getItem('admin_settings_cache');
    if (cached) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });
  
  // Set loading to true initially ONLY if we don't have a cache or if we want to force a fresh check
  // But to satisfy the user request of speed, we'll start with loading as true and use a race condition
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timer: If Firebase doesn't respond in 3 seconds, proceed with what we have
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    // Real-time listener for settings collection
    const unsubscribe = onSnapshot(collection(db, "admin_settings"), (snapshot) => {
      const loadedSettings: any = { ...DEFAULT_SETTINGS };
      snapshot.forEach((doc) => {
        loadedSettings[doc.id] = doc.data().value;
      });
      
      setSettings(loadedSettings);
      setLoading(false);
      clearTimeout(timer);
      
      // Update cache
      localStorage.setItem('admin_settings_cache', JSON.stringify(loadedSettings));
      
      // Update document title if metaTitle exists
      if (loadedSettings.metaTitle) {
        document.title = loadedSettings.metaTitle;
      }
    }, (error) => {
      console.error("Settings Sync Error:", error);
      setLoading(false);
      clearTimeout(timer);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return { settings, loading };
}

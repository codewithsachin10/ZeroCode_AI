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
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for settings collection
    const unsubscribe = onSnapshot(collection(db, "admin_settings"), (snapshot) => {
      const loadedSettings: any = { ...DEFAULT_SETTINGS };
      snapshot.forEach((doc) => {
        loadedSettings[doc.id] = doc.data().value;
      });
      setSettings(loadedSettings);
      setLoading(false);
      
      // Update document title if metaTitle exists
      if (loadedSettings.metaTitle) {
        document.title = loadedSettings.metaTitle;
      }
    });

    return () => unsubscribe();
  }, []);

  return { settings, loading };
}

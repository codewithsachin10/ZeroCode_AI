import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Direct initialization for script context
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeAcademy() {
  console.log("🚀 Initializing VibeCode Academy Production Nodes...");

  try {
    // 1. Categories
    const cat1 = await addDoc(collection(db, "video_categories"), {
      name: "Cloud Architecture Initiation",
      learningPath: "beginner",
      isCertificationEnabled: true,
      createdAt: serverTimestamp()
    });

    const cat2 = await addDoc(collection(db, "video_categories"), {
      name: "Elite Production Mesh",
      learningPath: "intermediate",
      isCertificationEnabled: true,
      createdAt: serverTimestamp()
    });

    console.log("✅ Categories Deployed.");

    // 2. Videos for Cat 1
    const vidData = [
      {
        title: "Synchronizing the Developer Mindset",
        description: "Master the high-velocity frequency required for elite SaaS development. Understanding the mesh architecture.",
        youtubeEmbedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        categoryId: cat1.id,
        order: 1,
        isLocked: false,
        createdAt: serverTimestamp()
      },
      {
        title: "Navigating the Cloud Command Center",
        description: "Deep dive into the VibeCode administrative and user interfaces. Leveling up your workflow speed.",
        youtubeEmbedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        categoryId: cat1.id,
        order: 2,
        isLocked: true,
        createdAt: serverTimestamp()
      },
      {
        title: "Deploying Your First Production Node",
        description: "Step-by-step assembly of a high-performance cloud gateway. Real-world implementation.",
        youtubeEmbedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        categoryId: cat1.id,
        order: 3,
        isLocked: true,
        createdAt: serverTimestamp()
      }
    ];

    for (const v of vidData) {
      await addDoc(collection(db, "videos"), v);
    }

    console.log("✅ Video Clusters Synchronized.");
    console.log("⚡ VibeCode Academy is Online.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Initialization Failure:", error);
    process.exit(1);
  }
}

initializeAcademy();

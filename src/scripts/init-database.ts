import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";
import path from "path";

// 1. Hard-load ENV 
const envPath = path.resolve(process.cwd(), ".env.local");
const env: any = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").replace(/"/g, "").trim();
      env[key.trim()] = value;
    }
  });
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedPrompts = [
  {
    title: "Project Zero: Modern Landing",
    category: "Landing Pages",
    difficulty: "beginner",
    description: "Launch a high-conversion landing page in minutes.",
    content: "Build a modern landing page for [App Name] focused on [Vibe].",
    tags: ["react", "tailwind"],
    usageCount: 100,
    createdAt: serverTimestamp(),
  }
];

async function run() {
  console.log("🚀 Forced Database Sync Started for:", firebaseConfig.projectId);
  try {
    for (const p of seedPrompts) {
      const ref = doc(collection(db, "prompts"));
      await setDoc(ref, { ...p, id: ref.id });
      console.log(`✅ Synced: ${p.title}`);
    }
    
    // Create users collection root admin
    const adminRef = doc(db, "users", "admin-root");
    await setDoc(adminRef, {
      uid: "admin-root",
      name: "Root Controller",
      email: "admin@vibecode.academy",
      role: "admin",
      createdAt: serverTimestamp()
    });
    console.log("✅ Root admin established in users collection.");

    // Initialize default chat room
    const chatRoomRef = doc(collection(db, "chatRooms"));
    await setDoc(chatRoomRef, {
      id: chatRoomRef.id,
      name: "General",
      description: "General discussion room for VibeCode Academy",
      createdAt: serverTimestamp(),
      createdBy: "system",
      isPublic: true,
      memberCount: 0,
      lastMessage: null,
      lastMessageTime: null
    });
    console.log("✅ Default chat room created.");

    // Add welcome message
    const welcomeMessageRef = doc(collection(db, "chatRooms", chatRoomRef.id, "messages"));
    await setDoc(welcomeMessageRef, {
      id: welcomeMessageRef.id,
      content: "Welcome to the General chat room! 🎉 This is where you can discuss anything related to VibeCode Academy, share your projects, ask questions, and connect with other developers.",
      senderId: "system",
      senderName: "VibeCode Bot",
      senderAvatar: null,
      timestamp: serverTimestamp(),
      type: "system"
    });
    console.log("✅ Welcome message added to chat room.");

    console.log("💎 Sync Complete.");
    process.exit(0);
  } catch (e) {
    console.error("❌ Sync Failed:", e);
    process.exit(1);
  }
}

run();

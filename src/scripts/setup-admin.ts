import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = process.env.ADMIN_SETUP_EMAIL;
const password = process.env.ADMIN_SETUP_PASSWORD;

async function setupAdmin() {
  console.log("Setting up admin user...");
  if (!email || !password) {
    throw new Error("ADMIN_SETUP_EMAIL and ADMIN_SETUP_PASSWORD must be set in .env.local");
  }
  try {
    let user;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      console.log("User created successfully!");
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        console.log("User already exists, logged in instead.");
      } else {
        throw error;
      }
    }

    if (user) {
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        name: "Sachin (Admin)",
        role: "admin",
        createdAt: serverTimestamp()
      }, { merge: true });
      console.log("Admin role assigned in Firestore!");
      console.log("SUCCESS: Run 'npm run dev' and login with these credentials at /login");
    }
  } catch (error) {
    console.error("Setup failed:", error);
  }
}

setupAdmin();

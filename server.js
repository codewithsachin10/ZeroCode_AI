import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp as initializeAdminApp, cert, getApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
// Failover for local dev if .env is named .env.local
dotenv.config({ path: '.env.local' });

const {
  OPENROUTER_API_KEY,
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID,
  CORS_ALLOWED_ORIGINS,
  FIREBASE_ADMIN_PROJECT_ID,
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY,
} = process.env;

if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY must be set in the environment');
}

if (!VITE_FIREBASE_PROJECT_ID) {
  throw new Error('Firebase environment variables are required for the backend');
}

if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  throw new Error('Firebase admin credentials are required for token verification');
}

const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID,
};

const app = express();
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

if (!getApps().length) {
  initializeAdminApp({
    credential: cert({
      projectId: FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const allowedOrigins = (CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const localDevOrigin = 'http://localhost:8080';
    if ((allowedOrigins.length === 0 && origin === localDevOrigin) || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin blocked'));
  },
}));
app.use(express.json({ limit: '20kb' }));

// AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message exceeds 2000 character limit' });
  }

  let userId;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  const today = new Date().toISOString().split('T')[0];
  const usageRef = doc(db, 'chat_usage', `${userId}_${today}`);

  try {
    const usageSnap = await getDoc(usageRef);
    const currentCount = usageSnap.exists() ? usageSnap.data().count || 0 : 0;

    if (currentCount >= 10) {
      return res.status(429).json({ error: 'Daily limit exceeded. Try again tomorrow.' });
    }

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a vibecoding assistant. Use simple words. Keep answers short. Help users build apps. Do not use complex terms.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    if (!openRouterResponse.ok) {
      console.error('OpenRouter error status:', openRouterResponse.status);
      throw new Error('OpenRouter request failed');
    }

    const responseData = await openRouterResponse.json();
    const reply = responseData?.choices?.[0]?.message?.content?.trim() || 'Something went wrong. Try again.';

    await setDoc(usageRef, {
      userId,
      count: currentCount + 1,
      lastUsedDate: today,
    }, { merge: true });

    await setDoc(doc(db, 'chat_messages', `${userId}_${Date.now()}`), {
      userId,
      message,
      reply,
      timestamp: serverTimestamp(),
    });

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat backend error:', error);
    return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
});

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - return index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || process.env.CHAT_SERVER_PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

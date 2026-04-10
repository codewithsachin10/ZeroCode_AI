import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp as initializeAdminApp, cert, getApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Admin SDK
if (!getApps().length) {
  initializeAdminApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    OPENROUTER_API_KEY,
    VITE_FIREBASE_API_KEY,
  } = process.env;

  if (!OPENROUTER_API_KEY || !VITE_FIREBASE_API_KEY) {
    console.error('Core configuration failure: Missing API Keys');
    return res.status(500).json({ error: 'Server error. Please try later.' });
  }

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
    return res.status(400).json({ error: 'Message exceeds 20 character limit' });
  }

  let userId;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    userId = decoded.uid;
  } catch (error) {
    console.error('Token verification error:', error);
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
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter error:', errorText);
      throw new Error('OpenRouter request failed');
    }

    const responseData = await openRouterResponse.json();
    const reply = responseData?.choices?.[0]?.message?.content?.trim() || 'Something went wrong. Try again.';

    // Update usage and save message
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
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}

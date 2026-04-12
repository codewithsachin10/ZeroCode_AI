import { db, storage } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
  DocumentData,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { sanitizeExternalUrl, sanitizeFilename, validateUpload } from '@/lib/security';

export const CHAT_ROOMS = 'chat_rooms';
export const MESSAGES = 'messages';
export const USER_STATUS = 'user_status';
export const TYPING_STATUS = 'typing_status';
export const UNREAD_COUNTS = 'unread_counts';

export const chatRoomsCollection = collection(db, CHAT_ROOMS);
export const messagesCollection = collection(db, MESSAGES);
export const userStatusCollection = collection(db, USER_STATUS);
export const typingStatusCollection = collection(db, TYPING_STATUS);
export const unreadCountsCollection = collection(db, UNREAD_COUNTS);

// --- INVITE LOGIC ---

export const findUserByInviteCode = async (code: string) => {
  const q = query(collection(db, 'users'), where('secretCode', '==', code), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// --- ROOMS ---

export const ensureGlobalRoom = async () => {
  const q = query(chatRoomsCollection, where('type', '==', 'global'), limit(1));
  const result = await getDocs(q);

  if (!result.empty) {
    return { id: result.docs[0].id, ...result.docs[0].data() };
  }

  const newRoomRef = await addDoc(chatRoomsCollection, {
    name: 'VibeCode Global',
    type: 'global',
    members: [],
    createdAt: serverTimestamp(),
    lastMessage: 'Welcome to VibeCode Global chat',
    lastMessageAt: serverTimestamp(),
  });

  return { id: newRoomRef.id, name: 'VibeCode Global', type: 'global' };
};

export const getOrCreatePrivateRoom = async (user1Id: string, user2Id: string) => {
  const members = [user1Id, user2Id].sort();
  const q = query(
    chatRoomsCollection,
    where('type', '==', 'private'),
    where('members', '==', members),
    limit(1)
  );

  const result = await getDocs(q);
  if (!result.empty) {
    return { id: result.docs[0].id, ...result.docs[0].data() };
  }

  const newRoomRef = await addDoc(chatRoomsCollection, {
    name: 'Private Chat',
    type: 'private',
    members,
    createdAt: serverTimestamp(),
    lastMessage: null,
    lastMessageAt: serverTimestamp(),
  });

  return { id: newRoomRef.id, type: 'private', members };
};

export const createGroupRoom = async (name: string, members: string[]) => {
  const newRoomRef = await addDoc(chatRoomsCollection, {
    name,
    type: 'group',
    members,
    createdAt: serverTimestamp(),
    lastMessage: `Group "${name}" created`,
    lastMessageAt: serverTimestamp(),
  });
  return { id: newRoomRef.id, name, type: 'group', members };
};

// --- MESSAGES ---

export const sendChatMessage = async ({
  roomId,
  userId,
  userName,
  userPhoto,
  message,
  type,
  fileUrl,
  fileName,
  replyTo,
}: {
  roomId: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  message: string;
  type: 'text' | 'image' | 'file' | 'code' | 'voice';
  fileUrl?: string | null;
  fileName?: string | null;
  replyTo?: any | null;
}) => {
  if (!roomId || !userId) {
    throw new Error('Missing room or user');
  }
  const roomSnap = await getDoc(doc(db, CHAT_ROOMS, roomId));
  if (!roomSnap.exists()) {
    throw new Error('Room not found');
  }
  const room = roomSnap.data();
  const isMember = room.type === 'global' || (Array.isArray(room.members) && room.members.includes(userId));
  if (!isMember) {
    throw new Error('Unauthorized room access');
  }
  const messageData = {
    roomId,
    userId,
    userName,
    userPhoto: userPhoto || null,
    message: String(message || '').trim().slice(0, 4000),
    type,
    fileUrl: sanitizeExternalUrl(String(fileUrl || '')) || null,
    fileName: fileName || null,
    replyTo: replyTo || null,
    createdAt: serverTimestamp(),
    editedAt: null,
  };

  const messageRef = await addDoc(messagesCollection, messageData);

  // Update room last message
  const roomRef = doc(db, CHAT_ROOMS, roomId);
  await updateDoc(roomRef, {
    lastMessage: type === 'text' ? message : `Sent a ${type}`,
    lastMessageAt: serverTimestamp(),
    lastSenderId: userId,
  });

  return messageRef.id;
};

export const updateChatMessage = async (messageId: string, message: string) => {
  await updateDoc(doc(db, MESSAGES, messageId), {
    message,
    editedAt: serverTimestamp(),
  });
};

export const deleteChatMessage = async (messageId: string) => {
  await deleteDoc(doc(db, MESSAGES, messageId));
};

export const pinMessage = async (roomId: string, messageData: any) => {
  const roomRef = doc(db, CHAT_ROOMS, roomId);
  await updateDoc(roomRef, {
    pinnedMessage: messageData,
  });
};

// --- STATUS & TYPING ---

export const setUserStatus = async (userId: string, isOnline: boolean) => {
  const statusRef = doc(db, USER_STATUS, userId);
  await setDoc(statusRef, {
    userId,
    isOnline,
    lastSeen: serverTimestamp(),
  }, { merge: true });
};

export const updateTypingStatus = async (roomId: string, userId: string, isTyping: boolean) => {
  const typingRef = doc(db, TYPING_STATUS, `${roomId}_${userId}`);
  await setDoc(typingRef, {
    roomId,
    userId,
    isTyping,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// --- UNREAD COUNTS ---

export const incrementUnreadCounts = async (roomId: string, senderId: string, memberIds: string[]) => {
  const batch = writeBatch(db);
  
  if (memberIds.length > 0) {
    memberIds.forEach(mId => {
      if (mId !== senderId) {
        const unreadRef = doc(db, UNREAD_COUNTS, `${mId}_${roomId}`);
        batch.set(unreadRef, {
          userId: mId,
          roomId,
          count: increment(1),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    });
    await batch.commit();
  }
};

export const resetUnreadCount = async (userId: string, roomId: string) => {
  const unreadRef = doc(db, UNREAD_COUNTS, `${userId}_${roomId}`);
  await setDoc(unreadRef, {
    userId,
    roomId,
    count: 0,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

// --- STORAGE ---

export const uploadChatFile = async (roomId: string, file: Blob | File, fileName?: string) => {
  const check = validateUpload(file, {
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'text/plain',
      'audio/webm',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
    ],
  });
  if (!check.ok) throw new Error(check.reason || 'Invalid upload');
  const actualName = sanitizeFilename(fileName || (file instanceof File ? file.name : `voice_${Date.now()}.webm`));
  const path = `chat_uploads/${roomId}/${Date.now()}_${actualName}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise<{ url: string; name: string }>((resolve, reject) => {
    task.on(
      'state_changed',
      null,
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, name: actualName });
      }
    );
  });
};

// --- REAL-TIME LISTENERS (index-free: filter/sort in memory) ---

export const listenToRooms = (userId: string, callback: (rooms: any[]) => void) => {
  // Listen to ALL rooms, filter in memory to avoid composite index requirements
  const unsub = onSnapshot(chatRoomsCollection, (snap) => {
    const allRooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Filter: include global rooms + rooms where user is a member
    const filtered = allRooms.filter((room: any) => 
      room.type === 'global' || (Array.isArray(room.members) && room.members.includes(userId))
    );
    
    // Sort: newest activity first
    filtered.sort((a: any, b: any) => {
      const aTime = a.lastMessageAt?.toMillis?.() || 0;
      const bTime = b.lastMessageAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    
    callback(filtered);
  });
  
  return unsub;
};

export const listenToMessages = (roomId: string, callback: (msgs: any[]) => void, limitCount = 100) => {
  // Fetch all messages, filter by roomId in memory to avoid composite index
  const unsub = onSnapshot(messagesCollection, (snap) => {
    const allMsgs = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((m: any) => m.roomId === roomId)
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return aTime - bTime; // oldest first (newest at bottom)
      })
      .slice(-limitCount); // keep only latest N
    callback(allMsgs);
  });

  return unsub;
};

export const listenToTyping = (roomId: string, callback: (typingUsers: any[]) => void) => {
  // Fetch all typing statuses, filter in memory
  const unsub = onSnapshot(typingStatusCollection, (snap) => {
    const typing = snap.docs
      .map(doc => doc.data())
      .filter((t: any) => t.roomId === roomId && t.isTyping === true);
    callback(typing);
  });

  return unsub;
};

export const listenToUserStatus = (callback: (statusMap: Record<string, any>) => void) => {
  return onSnapshot(userStatusCollection, (snap) => {
    const map: Record<string, any> = {};
    snap.docs.forEach(doc => {
      map[doc.id] = doc.data();
    });
    callback(map);
  });
};

export const listenToUnreadCounts = (userId: string, callback: (counts: Record<string, number>) => void) => {
  // Fetch all unread counts, filter by userId in memory
  const unsub = onSnapshot(unreadCountsCollection, (snap) => {
    const counts: Record<string, number> = {};
    snap.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId === userId) {
        counts[data.roomId] = data.count || 0;
      }
    });
    callback(counts);
  });

  return unsub;
};

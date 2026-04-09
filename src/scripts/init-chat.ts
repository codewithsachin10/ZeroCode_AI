import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const initializeDefaultChatRoom = async () => {
  try {
    // Check if default room already exists
    const roomsRef = collection(db, 'chatRooms');
    const defaultRoomRef = await addDoc(roomsRef, {
      name: 'General',
      description: 'General discussion room',
      createdAt: serverTimestamp(),
      createdBy: 'system',
      isPublic: true,
      memberCount: 0,
      lastMessage: null,
      lastMessageTime: null
    });

    console.log('Default chat room created with ID:', defaultRoomRef.id);
    return defaultRoomRef.id;
  } catch (error) {
    console.error('Error creating default chat room:', error);
    throw error;
  }
};

// Add a welcome message to the default room
export const addWelcomeMessage = async (roomId: string) => {
  try {
    const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
    await addDoc(messagesRef, {
      content: 'Welcome to the General chat room! This is where you can discuss anything related to VibeCode Academy.',
      senderId: 'system',
      senderName: 'VibeCode Bot',
      senderAvatar: null,
      timestamp: serverTimestamp(),
      type: 'system'
    });

    console.log('Welcome message added to room:', roomId);
  } catch (error) {
    console.error('Error adding welcome message:', error);
    throw error;
  }
};
import React, { useEffect, useState } from 'react';
import ChatLayout from '@/components/chat/ChatLayout';
import SEO from '@/components/SEO';
import { useUser } from '@/context/UserContext';
import { useSearchParams } from 'react-router-dom';
import { findUserByInviteCode, getOrCreatePrivateRoom } from '@/services/chatService';

const ChatPage: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const inviteCode = searchParams.get('invite');
    if (inviteCode && user) {
      const handleInvite = async () => {
        const otherUser = await findUserByInviteCode(inviteCode);
        if (otherUser && otherUser.id !== user.uid) {
           const room = await getOrCreatePrivateRoom(user.uid, otherUser.id);
           setSelectedRoom(room);
           // Clear param after handling
           setSearchParams({});
        }
      };
      handleInvite();
    }
  }, [searchParams, user]);

  return (
    <>
      <SEO 
        title="Chat | VibeCode Academy" 
        description="Connect with other creators and collaborators in real-time."
      />
      <div className="h-screen w-full flex flex-col overflow-hidden">
        <ChatLayout selectedRoom={selectedRoom} />
      </div>
    </>
  );
};

export default ChatPage;

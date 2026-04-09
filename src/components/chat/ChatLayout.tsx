import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '@/context/UserContext';
import { 
  listenToRooms, 
  ensureGlobalRoom, 
  listenToUserStatus, 
  listenToUnreadCounts,
  setUserStatus 
} from '@/services/chatService';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatLayoutProps {
  selectedRoom?: any;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ selectedRoom: initialRoom }) => {
  const { user, profile } = useUser();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  
  useEffect(() => {
    if (initialRoom) setSelectedRoom(initialRoom);
  }, [initialRoom]);

  const [statusMap, setStatusMap] = useState<Record<string, any>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Set user online
    setUserStatus(user.uid, true);
    
    // Ensure global room exists
    ensureGlobalRoom();

    const unsubRooms = listenToRooms(user.uid, (data) => {
      setRooms(data);
      setLoading(false);
      
      // Select global room by default if nothing selected
      if (!selectedRoom && data.length > 0) {
        const global = data.find(r => r.type === 'global');
        if (global) setSelectedRoom(global);
      }
    });

    const unsubStatus = listenToUserStatus((map) => {
      setStatusMap(map);
    });

    const unsubUnread = listenToUnreadCounts(user.uid, (counts) => {
      setUnreadCounts(counts);
    });

    const handleTabClose = () => setUserStatus(user.uid, false);
    window.addEventListener('beforeunload', handleTabClose);

    return () => {
      unsubRooms();
      unsubStatus();
      unsubUnread();
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-[#050505] text-foreground overflow-hidden relative font-sans antialiased">
      {/* Dynamic Mesh Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="flex flex-1 w-full max-w-[1600px] mx-auto relative z-10 glass border-x border-white/5 shadow-2xl overflow-hidden rounded-none md:rounded-2xl md:my-6">
        {/* Sidebar */}
        <aside className="w-80 border-r border-white/5 bg-black/40 backdrop-blur-3xl hidden md:flex flex-col">
          <ChatSidebar 
            rooms={rooms} 
            selectedRoomId={selectedRoom?.id} 
            setSelectedRoom={setSelectedRoom}
            statusMap={statusMap}
            unreadCounts={unreadCounts}
            loading={loading}
          />
        </aside>

        {/* Chat Window */}
        <main className="flex-1 flex flex-col bg-white/[0.01] relative overflow-hidden h-full min-w-0">
          {selectedRoom ? (
            <ChatWindow 
              room={selectedRoom} 
              userId={user.uid} 
              userName={profile?.name || 'Anonymous'}
              userPhoto={profile?.profilePhoto}
              statusMap={statusMap}
            />
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-b from-transparent to-primary/5 h-full">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-8 animate-float shadow-[0_0_50px_rgba(34,197,94,0.1)] border border-primary/20"
                >
                   <MessageCircle size={64} />
                </motion.div>
                <h2 className="text-2xl font-black uppercase tracking-[0.4em] text-white mb-4">Academy Hub</h2>
                <p className="text-[12px] text-text-muted max-w-sm font-bold tracking-widest uppercase opacity-60 leading-relaxed">
                   Neural network established. Select a coordination point from the grid to begin data exchange.
                </p>
                <div className="mt-12 flex gap-4">
                   <div className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-[0.2em] shadow-lg shadow-black/20">LAYER_03_SECURE</div>
                   <div className="px-6 py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-[10px] uppercase font-black tracking-[0.2em] text-primary shadow-lg shadow-primary/5">ENCRYPTED_SYNC</div>
                </div>
             </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ChatLayout;

import React, { useState, useEffect } from 'react';
import { Search, Plus, Globe, User, Users, Hash, UserPlus, Share2, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/context/UserContext';
import { getOrCreatePrivateRoom, createGroupRoom, findUserByInviteCode } from '@/services/chatService';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface ChatSidebarProps {
  rooms: any[];
  selectedRoomId: string;
  setSelectedRoom: (room: any) => void;
  statusMap: Record<string, any>;
  unreadCounts: Record<string, number>;
  loading: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  rooms, 
  selectedRoomId, 
  setSelectedRoom, 
  statusMap,
  unreadCounts,
  loading 
}) => {
  const { user, profile } = useUser();
  const [search, setSearch] = useState('');
  const [matchingUsers, setMatchingUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  useEffect(() => {
    if (search.length > 2) {
      const searchUsers = async () => {
        setSearching(true);
        try {
          if (search.length === 8 && /^[A-Z0-9]+$/.test(search)) {
            const inviteUser = await findUserByInviteCode(search);
            if (inviteUser && inviteUser.id !== user?.uid) {
              setMatchingUsers([inviteUser]);
              return;
            }
          }

          const q = query(
            collection(db, 'users'),
            where('name', '>=', search),
            where('name', '<=', search + '\uf8ff'),
            limit(5)
          );
          const snap = await getDocs(q);
          setMatchingUsers(snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(u => u.id !== user?.uid)
          );
        } finally {
          setSearching(false);
        }
      };
      const timeout = setTimeout(searchUsers, 500);
      return () => clearTimeout(timeout);
    } else {
      setMatchingUsers([]);
    }
  }, [search, user?.uid]);

  const filteredRooms = rooms.filter(room => {
    const roomName = getRoomName(room);
    return roomName?.toLowerCase().includes(search.toLowerCase());
  });

  const handleStartPrivateChat = async (otherUser: any) => {
    if (!user) return;
    const room = await getOrCreatePrivateRoom(user.uid, otherUser.id);
    setSelectedRoom(room);
    setSearch('');
  };

  const handleCreateGroup = async () => {
    const name = prompt('Enter group name:');
    if (name && user) {
      await createGroupRoom(name, [user.uid]);
    }
  };

  const copyInviteLink = () => {
    if (profile?.secretCode) {
      const link = `${window.location.origin}/chat?invite=${profile.secretCode}`;
      navigator.clipboard.writeText(link);
      toast.success('Frequency Synchronized: Invite link copied.');
    }
  };

  function getRoomName(room: any) {
    if (room.type === 'private' && room.members && user) {
      const otherId = room.members.find((id: string) => id !== user.uid);
      return statusMap[otherId]?.userName || room.name || 'Private Node';
    }
    return room.name;
  }

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'global': return <Globe size={14} />;
      case 'group': return <Users size={14} />;
      default: return <User size={14} />;
    }
  };

  const getOnlineStatus = (userId: string) => {
    return statusMap[userId]?.isOnline;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black/20">
      <div className="p-6 border-b border-white/5 bg-background/20 backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">Sync Nodes</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white/5 hover:bg-primary hover:text-black transition-all shadow-xl shadow-black/20" onClick={copyInviteLink} title="Sync Link">
              <Share2 size={13} strokeWidth={2.5} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white/5 hover:bg-primary hover:text-black transition-all shadow-xl shadow-black/20" onClick={handleCreateGroup}>
              <Plus size={13} strokeWidth={2.5} />
            </Button>
          </div>
        </div>
        
        <div className="relative group overflow-hidden rounded-xl border border-white/5 focus-within:border-primary/30 transition-all duration-500">
          <div className="absolute inset-0 bg-primary/2 duration-500 group-focus-within:bg-primary/5 pointer-events-none" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary/60 transition-colors z-10" />
          <Input
            placeholder="SCAN COORDINATES..."
            className="pl-12 h-12 text-[10px] font-black uppercase tracking-[0.2em] bg-transparent border-none focus-visible:ring-0 rounded-none relative z-0 placeholder:text-white/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin z-10" />
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {profile?.secretCode && !search && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 mb-8 rounded-3xl bg-gradient-to-br from-primary/10 via-black/40 to-black/60 border border-primary/20 flex flex-col gap-5 shadow-2xl shadow-primary/5 overflow-hidden group/sync relative"
            >
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover/sync:bg-primary/10 transition-colors duration-700" />
               <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-inner">
                      <Hash size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-1.5 opacity-80">Grid Identity</p>
                      <p className="text-[14px] font-mono font-black text-white tracking-[0.2em]">{profile.secretCode}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-white/5 hover:bg-primary hover:text-black transition-all shadow-xl shadow-black/20" onClick={copyInviteLink}>
                     <Copy size={14} />
                  </Button>
               </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {matchingUsers.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-4 space-y-2"
              >
                 <span className="text-[8px] font-black uppercase tracking-[0.3em] text-text-muted px-3 mb-2 block opacity-40">Identified Entities</span>
                 {matchingUsers.map(u => (
                   <button
                     key={u.id}
                     onClick={() => handleStartPrivateChat(u)}
                     className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 text-left transition-all group border border-transparent hover:border-primary/20"
                   >
                     <Avatar className="h-10 w-10 border border-white/5">
                       <AvatarFallback className="text-[10px] font-bold bg-surface">{u.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                     </Avatar>
                     <div className="flex-1 overflow-hidden">
                        <p className="text-[11px] font-black uppercase tracking-wider text-white truncate">{u.name}</p>
                        <p className="text-[9px] text-text-muted font-bold tracking-widest uppercase">Tap to Interconnect</p>
                     </div>
                     <UserPlus size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                 ))}
                 <div className="h-px bg-white/5 my-4 mx-3" />
              </motion.div>
            )}

            {loading ? (
               <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-muted">
                  <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em]">Decoding Flux...</span>
               </div>
            ) : filteredRooms.length === 0 ? (
               <div className="py-20 text-center space-y-2">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">No Nodes Found</p>
                 <p className="text-[8px] font-medium italic text-text-muted/40 px-8">Expand your neural network by searching for collaborators.</p>
               </div>
            ) : (
              filteredRooms.map((room, index) => {
                const isActive = selectedRoomId === room.id;
                const unread = unreadCounts[room.id] || 0;
                const roomName = getRoomName(room);
                const otherId = room.type === 'private' && Array.isArray(room.members) ? room.members.find((id: string) => id !== user?.uid) : null;
                const isOnline = otherId ? getOnlineStatus(otherId) : false;

                return (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left relative overflow-hidden mb-1 group border border-transparent",
                      isActive 
                        ? "bg-primary/20 border-primary/30 text-primary shadow-lg shadow-primary/10" 
                        : "hover:bg-white/[0.03] hover:border-white/10"
                    )}
                  >
                    {isActive && (
                       <motion.div 
                         layoutId="active-indicator"
                         className="absolute left-0 top-0 w-1 h-full bg-primary" 
                       />
                    )}
                    
                    <div className="relative flex-shrink-0">
                      <Avatar className={cn(
                        "h-12 w-12 border transition-all duration-500",
                        isActive ? "border-primary/40 scale-105" : "border-white/5"
                      )}>
                        <AvatarFallback className="bg-surface text-[12px] font-black uppercase">
                          {roomName?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-4 border-[#0B0B0B] bg-primary shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em] truncate flex items-center gap-1.5",
                          isActive ? "text-primary" : "text-white/90 group-hover:text-primary transition-colors"
                        )}>
                          {getRoomIcon(room.type)}
                          <span className="truncate">{roomName}</span>
                        </span>
                        {room.lastMessageAt?.toDate && (
                          <span className={cn(
                            "text-[7px] font-black uppercase tracking-[0.1em] whitespace-nowrap opacity-40 shrink-0",
                            isActive ? "text-primary" : "text-white"
                          )}>
                            {formatDistanceToNow(room.lastMessageAt.toDate(), { addSuffix: false }).replace('about ', '')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between gap-3">
                        <p className={cn(
                          "text-[9px] font-bold truncate flex-1 tracking-widest uppercase opacity-30 mt-0.5 group-hover:opacity-60 transition-opacity",
                          isActive ? "text-primary/70 opacity-80" : "text-white"
                        )}>
                          {room.lastMessage || 'Channel Standby'}
                        </p>
                        {unread > 0 && (
                          <div className="h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[8px] font-black bg-primary text-black border-none shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                            {unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;

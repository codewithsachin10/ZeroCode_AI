import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, MoreVertical, Phone, Video, Info, Send, Smile, Paperclip, 
  Mic, Image as ImageIcon, Code, Command, ChevronDown, CheckCheck, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { listenToMessages, updateTypingStatus, listenToTyping, resetUnreadCount } from '@/services/chatService';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface ChatWindowProps {
  room: any;
  userId: string;
  userName: string;
  userPhoto?: string;
  statusMap: Record<string, any>;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ room, userId, userName, userPhoto, statusMap }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room.id) return;
    
    // Reset unread counts
    resetUnreadCount(userId, room.id);

    const unsub = listenToMessages(room.id, (msgs) => setMessages(msgs));
    const unsubTyping = listenToTyping(room.id, (users) => {
      setTypingUsers(users.filter((u: any) => u.userId !== userId).map((u: any) => u.userId));
    });
    return () => {
      unsub();
      unsubTyping();
    };
  }, [room.id, userId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getOtherUserStatus = () => {
    if (room.type === 'private' && room.members) {
      const otherId = room.members.find((id: string) => id !== userId);
      return statusMap[otherId];
    }
    return null;
  };

  const otherUserStatus = getOtherUserStatus();
  const roomName = room.type === 'private' && otherUserStatus ? otherUserStatus.userName : room.name;

  const filteredMessages = messages.filter(m => 
    m.message?.toLowerCase().includes(localSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Premium Header */}
      <header className="flex-shrink-0 min-h-[80px] h-20 border-b border-white/10 bg-black/60 backdrop-blur-3xl px-8 flex items-center justify-between z-30 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <Avatar className="h-12 w-12 border border-primary/20 ring-2 ring-primary/10 ring-offset-2 ring-offset-black transition-all relative z-10">
               {otherUserStatus?.userPhoto && <AvatarImage src={otherUserStatus.userPhoto} />}
               <AvatarFallback className="bg-surface text-primary font-black uppercase text-base">{roomName?.substring(0, 2)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col">
            <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-white leading-none mb-2">{roomName}</h3>
            <div className="flex items-center gap-2.5">
              {otherUserStatus?.isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] opacity-80">Sync Established</span>
                </>
              ) : (
                <div className="flex items-center gap-2 opacity-40">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-[9px] text-white font-black uppercase tracking-[0.3em]">
                     {otherUserStatus?.lastSeen?.toDate 
                        ? `Offline: ${format(otherUserStatus.lastSeen.toDate(), 'HH:mm')}`
                        : 'Standby Mode'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSearchOpen ? (
             <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} className="relative mr-2">
                <Input 
                   autoFocus
                   placeholder="Scan Messages..." 
                   className="h-10 bg-black/60 border-white/10 text-[10px] uppercase font-bold pr-10 rounded-xl focus:border-primary/40"
                   value={localSearch}
                   onChange={(e) => setLocalSearch(e.target.value)}
                   onBlur={() => !localSearch && setIsSearchOpen(false)}
                />
                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10 text-text-muted hover:text-white" onClick={() => {setLocalSearch(''); setIsSearchOpen(false);}}>
                   <X size={14} />
                </Button>
             </motion.div>
          ) : (
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 hover:text-primary transition-all" onClick={() => setIsSearchOpen(true)}>
               <Search size={18} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 hover:text-primary transition-all hidden sm:flex">
             <Phone size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 hover:text-primary transition-all hidden sm:flex">
             <Video size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5">
             <MoreVertical size={18} />
          </Button>
        </div>
      </header>

      {/* Message Area */}
      <div className="flex-1 overflow-hidden relative group">
        <ScrollArea className="h-full px-6" ref={scrollRef}>
          <div className="py-8 space-y-8">
            <MessageList 
              messages={filteredMessages} 
              currentUserId={userId} 
              onReply={setReplyingTo}
              onEdit={setEditingMessage}
            />
            
            {/* Typing Indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, x: -10 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3 ml-2"
                >
                  <div className="flex gap-1.5 p-3 rounded-2xl bg-primary/5 border border-primary/10 shadow-lg shadow-primary/5">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-60">Entity is transmissioning...</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Premium Input */}
      <div className="p-6 bg-transparent">
        <ChatInput 
          roomId={room.id} 
          userId={userId} 
          userName={userName} 
          userPhoto={userPhoto}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          editingMessage={editingMessage}
          setEditingMessage={setEditingMessage}
          onTypingChange={(isTyping) => updateTypingStatus(room.id, userId, isTyping)}
        />
      </div>
    </div>
  );
};

export default ChatWindow;

import React, { useState } from 'react';
import { 
  MoreVertical, Reply, Edit2, Trash2, Pin, 
  Download, Play, Pause, FileText, Code as CodeIcon,
  CheckCheck, Mic
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { deleteChatMessage, pinMessage } from '@/services/chatService';
import { toast } from 'sonner';
import { sanitizeExternalUrl } from '@/lib/security';

interface MessageListProps {
  messages: any[];
  currentUserId: string;
  onReply?: (msg: any) => void;
  onEdit?: (msg: any) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, onReply, onEdit }) => {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlayVoice = (url: string) => {
    if (playingVoice === url) {
      audioRef.current?.pause();
      setPlayingVoice(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audio.play().catch(e => console.error("Audio Playback Error:", e));
      audio.onended = () => setPlayingVoice(null);
      audioRef.current = audio;
      setPlayingVoice(url);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (confirm('Erase this data packet from the grid?')) {
      await deleteChatMessage(msgId);
      toast.success('Packet Purged');
    }
  };

  const handlePin = async (msg: any) => {
    await pinMessage(msg.roomId, msg);
    toast.success('Packet Pinned to Top');
  };

  return (
    <div className="space-y-8">
      <AnimatePresence mode="popLayout">
        {messages.map((msg, index) => {
          const isOwn = msg.userId === currentUserId;
          const showAvatar = index === 0 || messages[index - 1]?.userId !== msg.userId;
          const safeFileUrl = sanitizeExternalUrl(String(msg.fileUrl || ""));

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={cn(
                "flex items-end gap-4 group relative mb-6",
                isOwn ? "flex-row-reverse pl-12" : "flex-row pr-12"
              )}
            >
              {!isOwn && (
                <div className="w-10 flex-shrink-0 mb-1">
                  {showAvatar && (
                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                      <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-white/5 shadow-2xl transition-transform hover:scale-110">
                        {msg.userPhoto && <AvatarImage src={msg.userPhoto} />}
                        <AvatarFallback className="text-[10px] bg-surface font-black uppercase text-text-muted">
                          {msg.userName?.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  )}
                </div>
              )}

              <div className={cn(
                "flex-1 flex flex-col space-y-2",
                isOwn ? "items-end" : "items-start"
              )}>
                {showAvatar && !isOwn && (
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary opacity-50 ml-1 mb-1">
                      {msg.userName}
                   </span>
                )}

                <div className="relative group/bubble max-w-[90%]">
                  <div className={cn(
                    "px-5 py-3.5 rounded-3xl text-[13px] leading-relaxed shadow-2xl transition-all duration-300",
                    isOwn 
                      ? "bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-black font-bold rounded-br-none shadow-primary/20 hover:shadow-primary/30" 
                      : "bg-[#111111] border border-white/5 text-white rounded-bl-none shadow-black/60 hover:border-white/20"
                  )}>
                    {/* Render Content Types */}
                    {msg.type === 'text' && <p className="whitespace-pre-wrap tracking-tight">{msg.message}</p>}
                    
                    {msg.type === 'image' && (
                      <div className="rounded-xl overflow-hidden border border-black/20">
                         {safeFileUrl ? <img src={safeFileUrl} alt="Visual" className="max-w-full h-auto cursor-zoom-in hover:scale-105 transition-transform duration-500" /> : <p className="text-[10px]">Invalid image link.</p>}
                      </div>
                    )}

                    {msg.type === 'file' && (
                       <a href={safeFileUrl || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 bg-black/20 rounded-xl hover:bg-black/40 transition-all border border-white/5">
                          <div className="p-2 rounded-lg bg-white/10 text-white"><FileText size={20} /></div>
                          <div className="flex-1 overflow-hidden">
                             <p className="text-[10px] font-bold truncate uppercase">{msg.fileName || 'Archive.data'}</p>
                             <p className="text-[8px] opacity-60">Binary Transmission</p>
                          </div>
                          <Download size={14} className="opacity-60" />
                       </a>
                    )}

                    {msg.type === 'code' && (
                       <div className="bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-[11px] overflow-x-auto my-1">
                          <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2 text-[8px] font-black uppercase text-primary/60 tracking-widest">
                             <CodeIcon size={12} /> Source Script Node
                          </div>
                          <pre className="text-primary/90">{msg.message}</pre>
                       </div>
                    )}

                    {msg.type === 'voice' && (
                       <div className="flex items-center gap-4 min-w-[200px]">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 flex-shrink-0"
                            onClick={() => safeFileUrl && handlePlayVoice(safeFileUrl)}
                          >
                             {playingVoice === msg.fileUrl ? <Pause size={16} /> : <Play size={16} />}
                          </Button>
                          <div className="flex-1 h-8 flex items-center gap-0.5">
                             {[...Array(20)].map((_, i) => (
                               <div 
                                 key={i} 
                                 className={cn(
                                   "w-1 rounded-full transition-all bg-white/20",
                                   playingVoice === msg.fileUrl ? "animate-voice" : ""
                                 )} 
                                 style={{ 
                                   height: `${Math.random() * 80 + 20}%`,
                                   animationDelay: `${i * 0.05}s`
                                 }} 
                               />
                             ))}
                          </div>
                          <Mic size={14} className="opacity-40" />
                       </div>
                    )}
                  </div>

                  {/* Bubble Actions Popover (Hover) */}
                  <div className={cn(
                    "absolute top-0 opacity-0 group-hover/bubble:opacity-100 transition-all duration-300 flex items-center gap-1",
                    isOwn ? "left-[-85px] pr-2" : "right-[-85px] pl-2"
                  )}>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/5 hover:text-primary" onClick={() => onReply?.(msg)}>
                        <Reply size={14} />
                     </Button>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/5">
                              <MoreVertical size={14} />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="bg-black/90 border-white/10 backdrop-blur-xl">
                           {isOwn && <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest" onClick={() => onEdit?.(msg)}>
                             <Edit2 size={12} className="mr-2" /> Modify Content
                           </DropdownMenuItem>}
                           <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest" onClick={() => handlePin(msg)}>
                             <Pin size={12} className="mr-2" /> Pin to Hub
                           </DropdownMenuItem>
                           {isOwn && <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest text-destructive hover:text-destructive" onClick={() => handleDelete(msg.id)}>
                             <Trash2 size={12} className="mr-2" /> Erase Data
                           </DropdownMenuItem>}
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
                </div>

                <div className={cn(
                  "flex items-center gap-2 px-1 opacity-40 group-hover:opacity-100 transition-opacity",
                  isOwn ? "flex-row-reverse" : "flex-row"
                )}>
                   <span className="text-[8px] font-black uppercase tracking-widest">
                       {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : 'Syncing...'}
                   </span>
                   {isOwn && (
                     <CheckCheck size={10} className="text-primary" />
                   )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <style>{`
        @keyframes voice {
          0%, 100% { transform: scaleY(0.4); opacity: 0.3; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .animate-voice {
          animation: voice 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MessageList;

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Image as ImageIcon, 
  Mic, 
  Code,
  X,
  Square,
  Sparkles,
  Command,
  FileText,
  Edit2,
  Reply
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { 
  sendChatMessage, 
  updateChatMessage, 
  updateTypingStatus, 
  uploadChatFile,
  incrementUnreadCounts
} from '@/services/chatService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInputProps {
  roomId: string; // Changed from room object to roomId for simplicity
  userId: string;
  userName: string;
  userPhoto?: string | null;
  replyingTo: any;
  setReplyingTo: (msg: any) => void;
  editingMessage: any;
  setEditingMessage: (msg: any) => void;
  onTypingChange?: (isTyping: boolean) => void;
}

const EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '🙌', '🎉', '🚀', '💻', '💡', '❤️', '✅', '✨', '⭐'];

const ChatInput: React.FC<ChatInputProps> = ({ 
  roomId, 
  userId,
  userName,
  userPhoto,
  replyingTo, 
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  onTypingChange
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.message);
    } else {
      setText('');
    }
  }, [editingMessage]);

  const handleSend = async () => {
    if ((!text.trim() && !editingMessage) || !userId) return;

    try {
      if (editingMessage) {
        await updateChatMessage(editingMessage.id, text);
        setEditingMessage(null);
        toast.success('Packet Updated');
      } else {
        const msgType = text.startsWith('```') ? 'code' : 'text';
        const cleanedText = msgType === 'code' ? text.replace(/```/g, '').trim() : text;

        await sendChatMessage({
          roomId,
          userId,
          userName: userName || 'User',
          userPhoto: userPhoto || null,
          message: cleanedText,
          type: msgType,
          replyTo: replyingTo ? { id: replyingTo.id, message: replyingTo.message, userName: replyingTo.userName } : null
        });

        // Trigger typing off
        onTypingChange?.(false);
        setReplyingTo(null);
      }
      setText('');
    } catch (err) {
      toast.error('Transmission Failed');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      const { url, name } = await uploadChatFile(roomId, file);
      await sendChatMessage({
        roomId,
        userId,
        userName: userName || 'User',
        userPhoto: userPhoto || null,
        message: type === 'image' ? 'Visual Data Inbound' : `File Exchange: ${name}`,
        type,
        fileUrl: url,
        fileName: name
      });
      toast.success('Data Packet Uploaded');
    } catch (err) {
      toast.error('Upload Corridor Blocked');
    } finally {
      setUploading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    
    if (userId) {
      onTypingChange?.(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange?.(false);
      }, 3000);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setUploading(true);
        try {
          const { url } = await uploadChatFile(roomId, audioBlob, `vocal_${Date.now()}.webm`);
          await sendChatMessage({
            roomId,
            userId,
            userName: userName || 'User',
            userPhoto: userPhoto || null,
            message: 'Vocal Frequency Recording',
            type: 'voice',
            fileUrl: url
          });
        } catch (err) {
          toast.error('Vocal Upload Failed');
        } finally {
          setUploading(false);
          setRecordingTime(0);
        }
      };

      recorder.start();
      setIsRecording(true);
      const interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      (recorder as any)._interval = interval;
    } catch (err) {
      toast.error('Vocal Sensor Access Denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval((mediaRecorderRef.current as any)._interval);
    }
  };

  return (
    <div className="relative">
      {/* Reply/Edit Header Overlay */}
      <AnimatePresence>
        {(replyingTo || editingMessage) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-4 p-4 rounded-2xl bg-black/80 backdrop-blur-2xl border border-primary/20 flex items-center justify-between shadow-2xl shadow-primary/5"
          >
             <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  {editingMessage ? <Edit2 size={16} /> : <Reply size={16} />}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                     {editingMessage ? 'Modifying Packet' : `Replying to ${replyingTo.userName}`}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                     {editingMessage ? editingMessage.message : replyingTo.message}
                  </p>
                </div>
             </div>
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10" onClick={() => {setReplyingTo(null); setEditingMessage(null); if(editingMessage) setText('');}}>
                <X size={14} />
             </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "p-2 rounded-[24px] bg-black/40 backdrop-blur-3xl border transition-all duration-500",
        isRecording ? "border-red-500/30 ring-4 ring-red-500/5 shadow-lg shadow-red-500/5" : "border-white/5 ring-4 ring-white/[0.02] shadow-2xl"
      )}>
        <div className="flex items-end gap-2">
          {!isRecording ? (
            <>
               <div className="flex items-center gap-1 pl-1 py-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-white/40 rounded-xl hover:bg-white/5 hover:text-primary transition-all">
                        <Smile size={20} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-fit p-3 bg-black/90 border-white/10 backdrop-blur-3xl shadow-3xl rounded-2xl mb-4">
                      <div className="grid grid-cols-7 gap-2">
                        {EMOJIS.map(e => (
                          <button key={e} onClick={() => setText(t => t + e)} className="h-10 w-10 flex items-center justify-center hover:bg-primary/20 rounded-xl text-xl transition-all hover:scale-125">
                            {e}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-white/40 rounded-xl hover:bg-white/5 hover:text-primary transition-all">
                           <Paperclip size={20} />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="bg-black/90 border-white/10 backdrop-blur-3xl mb-4 rounded-xl">
                        <DropdownMenuItem className="py-3 px-4 text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => document.getElementById('chat-img-input')?.click()}>
                           <ImageIcon size={16} className="mr-3 text-primary" /> Visual Capture
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-3 px-4 text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => document.getElementById('chat-file-input')?.click()}>
                           <FileText size={16} className="mr-3 text-primary" /> Logic Packet
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-3 px-4 text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => setText(t => t + '\n```\n// Insert Logic Here\n```')}>
                           <Code size={16} className="mr-3 text-primary" /> Script Inject
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>

                  <input id="chat-img-input" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                  <input id="chat-file-input" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
               </div>

               <div className="flex-1 relative pb-1">
                  <Input
                    placeholder={uploading ? "Transmitting Data..." : "Sequence Transmission..."}
                    className="h-12 bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-[13px] font-medium rounded-2xl text-white placeholder:text-white/20 px-4"
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    disabled={uploading}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-20">
                     <Command size={12} />
                     <span className="text-[10px] font-bold">ENTER</span>
                  </div>
               </div>

               <div className="flex items-center gap-2 mb-1 mr-1">
                  {text.trim() ? (
                    <Button 
                      className="h-10 w-10 rounded-xl bg-primary text-black hover:bg-primary/80 transition-all active:scale-90 shadow-lg shadow-primary/20" 
                      onClick={handleSend}
                    >
                      <Send size={18} />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-black transition-all" 
                      onClick={startRecording}
                      disabled={uploading}
                    >
                      <Mic size={20} />
                    </Button>
                  )}
               </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-between p-3">
               <div className="flex items-center gap-4 pl-4 overflow-hidden">
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                     <span className="text-sm font-black font-mono text-red-500">
                        {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                     </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-40">
                     {[...Array(12)].map((_, i) => (
                       <motion.div 
                         key={i} 
                         animate={{ height: [4, 16, 4] }}
                         transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                         className="w-0.5 bg-red-400 rounded-full"
                       />
                     ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 opacity-60">Synchronizing Vocal Stream...</span>
               </div>
               <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-white/40 hover:text-white rounded-xl" onClick={() => { setIsRecording(false); mediaRecorderRef.current?.stop(); }}>
                     <X size={20} />
                  </Button>
                  <Button size="icon" className="h-10 w-10 bg-red-500 hover:bg-red-600 rounded-xl text-white shadow-lg shadow-red-500/20 active:scale-90" onClick={stopRecording}>
                    <Square size={16} fill="white" />
                  </Button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;

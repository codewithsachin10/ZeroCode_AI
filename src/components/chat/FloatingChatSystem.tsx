import React, { useState } from 'react';
import { MessageCircle, Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AIAssistant from '../Chatbot';
import ChatModal from './ChatModal';
import { useNavigate } from 'react-router-dom';

const FloatingChatSystem = () => {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const navigate = useNavigate();

  const toggleAI = () => {
    setIsAIOpen(!isAIOpen);
    setIsChatModalOpen(false);
  };

  const openChat = () => {
    // Option: Either open modal or navigate
    // The user said "Opens chat modal OR /chat page"
    // Let's go with modal for a seamless feel, or provide a way to go full screen
    setIsChatModalOpen(true);
    setIsAIOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
      
      {/* AI Assistant Popup */}
      <div className="pointer-events-auto">
        <AIAssistant isOpen={isAIOpen} setIsOpen={setIsAIOpen} />
      </div>

      {/* Chat Modal Interface */}
      <ChatModal isOpen={isChatModalOpen} setIsOpen={setIsChatModalOpen} />

      {/* Floating Buttons */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        {/* Real-time Chat Icon */}
        <button
          onClick={openChat}
          className={cn(
            "group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-2 hover:scale-110 active:scale-95 overflow-hidden",
            isChatModalOpen 
              ? "bg-primary border-primary text-primary-foreground" 
              : "bg-background border-primary/20 text-primary hover:border-primary/50"
          )}
          title="Real-time Chat"
        >
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageCircle size={22} className={cn("transition-transform duration-300", isChatModalOpen && "scale-110")} />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </button>

        {/* AI Assistant Icon */}
        <button
          onClick={toggleAI}
          className={cn(
            "group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-2 hover:scale-110 active:scale-95",
            isAIOpen 
              ? "bg-[#111] border-primary text-primary" 
              : "bg-background border-primary/10 text-muted-foreground hover:text-primary hover:border-primary/30"
          )}
          title="AI Assistant"
        >
          {isAIOpen ? <X size={20} /> : <Bot size={22} />}
          <div className="absolute inset-0 rounded-full bg-primary/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Premium Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        .animate-float {
           animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default FloatingChatSystem;

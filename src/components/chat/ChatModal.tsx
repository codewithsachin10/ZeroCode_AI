import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ChatLayout from './ChatLayout';
import { X } from 'lucide-react';

interface ChatModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, setIsOpen }) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 overflow-hidden border-border bg-background shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Chat</DialogTitle>
        <div className="w-full h-full relative">
          <ChatLayout />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;

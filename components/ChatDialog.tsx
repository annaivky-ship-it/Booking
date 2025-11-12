import React, { useState, useEffect, useRef } from 'react';
import { X, Send, LoaderCircle, User } from 'lucide-react';
import type { Communication, Booking } from '../types';

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  currentUser: { name: string };
  messages: Communication[];
  onSendMessage: (message: string) => Promise<void>;
}

const ChatDialog: React.FC<ChatDialogProps> = ({ isOpen, onClose, booking, currentUser, messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="card-base !p-0 !bg-zinc-900 max-w-md w-full flex flex-col h-[600px] max-h-[90vh] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
             <div className="bg-zinc-800 p-2 rounded-full">
                <User className="h-5 w-5 text-zinc-400" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-white">{booking.client_name}</h2>
                <p className="text-xs text-zinc-500">{booking.event_type} &bull; {new Date(booking.event_date).toLocaleDateString()}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-grow p-4 overflow-y-auto bg-zinc-950/50 space-y-4">
           {messages.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center p-6">
                   <p>No messages yet.</p>
                   <p className="text-sm mt-2">Start the conversation with {booking.client_name} about their event.</p>
               </div>
           ) : (
               messages.map((msg) => {
                   const isMe = msg.sender === currentUser.name;
                   return (
                       <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-orange-600 text-white rounded-br-none' : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'}`}>
                               <p>{msg.message}</p>
                               <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-orange-200' : 'text-zinc-500'}`}>
                                   {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                               </p>
                           </div>
                       </div>
                   )
               })
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 bg-zinc-900 border-t border-zinc-800">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow bg-zinc-800 text-white border border-zinc-700 rounded-full px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-zinc-500"
            />
            <button 
              type="submit" 
              disabled={isSending || !newMessage.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-colors flex-shrink-0"
            >
              {isSending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatDialog;
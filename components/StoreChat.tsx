
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User, Store } from '../types';
import { Send, X, MessageCircle, MapPin } from 'lucide-react';

interface StoreChatProps {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  currentUser: User;
  storeName: string;
}

const StoreChat: React.FC<StoreChatProps> = ({ open, onClose, messages, onSend, currentUser, storeName }) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (isToday) return time;
    if (isYesterday) return `Yesterday ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-[#001F3F]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh] sm:h-[600px] border border-white/20">
        {/* Header */}
        <header className="p-6 bg-[#001F3F] text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MessageCircle size={24} className="text-blue-300" />
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Team Chat</h3>
              <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest flex items-center gap-1">
                <MapPin size={8} /> {storeName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <MessageCircle size={40} className="text-blue-100" />
              <p className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
                No messages yet. Say hi to your team!
              </p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isOwn = msg.userId === currentUser.id;
            const showName = !isOwn && (i === 0 || messages[i - 1].userId !== msg.userId);
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${isOwn ? '' : ''}`}>
                  {showName && (
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1 px-2">
                      {msg.userName}
                    </p>
                  )}
                  <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed ${
                    isOwn
                      ? 'bg-[#001F3F] text-white rounded-tr-none'
                      : 'bg-neutral-100 text-[#001F3F] rounded-tl-none'
                  }`}>
                    {msg.message}
                  </div>
                  <p className={`text-[8px] text-neutral-300 mt-1 px-2 ${isOwn ? 'text-right' : ''}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 bg-neutral-50 border-t border-neutral-100">
          <div className="relative group">
            <input
              type="text"
              placeholder="Message your team..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-white border border-neutral-100 rounded-2xl pl-4 pr-14 py-4 font-bold text-[#001F3F] outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#001F3F] text-white rounded-xl shadow-lg active:scale-90 transition-all disabled:opacity-50"
            >
              <Send size={18} strokeWidth={3} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreChat;

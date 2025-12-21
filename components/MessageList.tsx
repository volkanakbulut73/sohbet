
import React, { useEffect, useRef } from 'react';
import { Message, MessageType } from '../types';
import { Bot, ShieldAlert, MessageSquare, Clock } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  currentUser: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = (msg: Message) => {
    const isMe = msg.sender === currentUser;

    switch (msg.type) {
      case MessageType.SYSTEM:
        return (
          <div className="flex justify-center my-4">
            <div className="flex items-center gap-2 py-1.5 px-4 bg-slate-800/30 rounded-full border border-slate-700/50 text-slate-500 italic text-[11px] font-medium tracking-wide">
              <ShieldAlert size={12} />
              <span>{msg.text}</span>
            </div>
          </div>
        );
      case MessageType.ACTION:
        return (
          <div className="text-indigo-400 font-bold py-1 text-xs sm:text-sm italic opacity-80 px-4">
            • {msg.sender} {msg.text}
          </div>
        );
      case MessageType.AI:
        return (
          <div className="max-w-[95%] sm:max-w-[85%] bg-slate-800/40 border border-sky-500/20 rounded-3xl p-4 my-3 ml-2 mr-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-sky-500 rounded-lg shadow-lg shadow-sky-500/20">
                  <Bot size={14} className="text-white" />
                </div>
                <span className="text-[10px] font-black text-sky-400 tracking-tighter uppercase">Gemini Intelligence</span>
              </div>
              <span className="text-[9px] text-slate-600 font-mono">{formatTime(msg.timestamp)}</span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap selection:bg-sky-500/30">{msg.text}</p>
          </div>
        );
      default:
        return (
          <div className={`flex flex-col px-2 sm:px-4 ${isMe ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-1 duration-200`}>
            <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
               <span className={`text-[11px] font-black tracking-tight ${isMe ? 'text-sky-500' : 'text-slate-400 opacity-70'}`}>
                 {isMe ? 'You' : msg.sender}
               </span>
               <div className="flex items-center gap-1 text-[9px] text-slate-700 font-mono">
                 <Clock size={8} />
                 {formatTime(msg.timestamp)}
               </div>
            </div>
            <div className={`
              max-w-[88%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-[13px] sm:text-sm leading-snug shadow-sm
              ${isMe 
                ? 'bg-sky-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'}
            `}>
              {msg.text}
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto pt-4 pb-12 space-y-3 sm:space-y-4 scrollbar-hide"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6">
           <div className="relative">
             <MessageSquare size={64} strokeWidth={1} className="opacity-10" />
             <Bot size={24} className="absolute -bottom-2 -right-2 text-sky-600/20 animate-pulse" />
           </div>
           <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] opacity-40">End-to-End Encrypted</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {messages.map((msg) => (
            <div key={msg.id}>
              {renderMessageContent(msg)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageList;

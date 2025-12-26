
import React, { useEffect, useRef } from 'react';
import { Message, MessageType } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  blockedUsers: string[];
  onNickClick?: (e: React.MouseEvent | React.TouchEvent, nick: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser, blockedUsers, onNickClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const renderMessageLine = (msg: Message) => {
    if (blockedUsers.includes(msg.sender)) return null;

    const text = typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text);

    // Sistem Mesajı: -- Nick kanala giriş yaptı tarzı
    if (msg.type === MessageType.SYSTEM) {
      return (
        <div className="flex gap-1 text-[11px] py-0 leading-tight text-gray-400 font-mono">
          <span className="text-blue-800 font-bold shrink-0">--</span>
          <span className="text-blue-800 font-bold">{text}</span>
        </div>
      );
    }

    // AI Mesajı (Bot)
    if (msg.type === MessageType.AI) {
      return (
        <div className="flex gap-1 text-[11px] py-0 leading-tight font-mono">
          <div className="flex gap-1 shrink-0">
            <span className="text-green-700 font-bold">{"<@GeminiBot>"}</span>
          </div>
          <span className="text-black break-words">{text}</span>
        </div>
      );
    }

    // Klasik kullanıcı mesajı: <nick> mesaj
    return (
      <div className="flex gap-1 text-[11px] py-0 leading-tight font-mono items-start">
        <div className="flex gap-1 shrink-0 min-w-0">
          <span 
            className="font-bold cursor-pointer hover:underline text-gray-800"
            onClick={(e) => onNickClick?.(e, msg.sender)}
          >
            {`<${msg.sender}>`}
          </span>
        </div>
        <span className="text-black break-words flex-1">{text}</span>
      </div>
    );
  };

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto px-2 py-1 bg-white flex flex-col font-mono"
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center opacity-5 select-none pointer-events-none">
          <div className="text-center">
            <p className="text-5xl font-black italic">mIRC</p>
            <p className="text-[10px] font-bold tracking-widest mt-1 uppercase">v1.1.1 Connected</p>
          </div>
        </div>
      ) : (
        messages.map((msg, i) => (
          <div key={msg.id || i}>{renderMessageLine(msg)}</div>
        ))
      )}
    </div>
  );
};

export default MessageList;

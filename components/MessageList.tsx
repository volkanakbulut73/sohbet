
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const renderMessageLine = (msg: Message) => {
    if (blockedUsers.includes(msg.sender)) return null;

    const time = `[${formatTime(msg.timestamp)}]`;
    const text = typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text);

    if (msg.type === MessageType.SYSTEM) {
      return (
        <div className="flex gap-2 text-[12px] py-0.5 text-gray-400 font-mono">
          <span className="shrink-0">{time}</span>
          <span className="text-blue-800 font-bold">-- {text}</span>
        </div>
      );
    }

    if (msg.type === MessageType.AI) {
      return (
        <div className="flex gap-2 text-[12px] py-0.5 font-mono">
          <span className="text-gray-400 shrink-0">{time}</span>
          <div className="flex gap-1">
            <span className="text-green-700 font-bold">{"<@GeminiBot>"}</span>
            <span className="text-black">{text}</span>
          </div>
        </div>
      );
    }

    // Klasik kullanıcı mesajı
    return (
      <div className="flex gap-2 text-[12px] py-0.5 font-mono items-start">
        <span className="text-gray-400 shrink-0">{time}</span>
        <div className="flex gap-1 min-w-0">
          <span 
            className="font-bold shrink-0 cursor-pointer hover:underline text-gray-800"
            onClick={(e) => onNickClick?.(e, msg.sender)}
          >
            {`<${msg.sender}>`}
          </span>
          <span className="text-black break-words leading-tight">{text}</span>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto px-4 py-2 bg-white flex flex-col font-mono"
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center opacity-5 select-none pointer-events-none">
          <div className="text-center">
            <p className="text-6xl font-black italic">mIRC</p>
            <p className="text-xs font-bold tracking-widest mt-2 uppercase">v1.1.1 Connected</p>
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

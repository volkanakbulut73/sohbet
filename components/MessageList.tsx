
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

    if (msg.type === MessageType.SYSTEM) {
      return (
        <div className="flex gap-1 text-[11px] py-0.5 leading-tight text-[#000080] font-mono font-bold">
          <span className="shrink-0">***</span>
          <span className="break-words">{text}</span>
        </div>
      );
    }

    if (msg.type === MessageType.AI) {
      return (
        <div className="flex gap-1 text-[11px] py-0.5 leading-tight font-mono">
          <span className="text-[#008000] font-bold shrink-0">{"<@GeminiBot>"}</span>
          <span className="text-black break-words">{text}</span>
        </div>
      );
    }

    const isMe = msg.sender === currentUser;

    return (
      <div className="flex gap-1 text-[11px] py-0.5 leading-tight font-mono items-start">
        <span 
          className={`font-bold shrink-0 cursor-pointer hover:underline ${isMe ? 'text-[#000080]' : 'text-[#800000]'}`}
          onClick={(e) => onNickClick?.(e, msg.sender)}
        >
          {`<${msg.sender}>`}
        </span>
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
        <div className="flex-1 flex items-center justify-center opacity-10 select-none pointer-events-none">
          <div className="text-center">
            <p className="text-5xl font-black italic text-[#000080]">mIRC</p>
            <p className="text-[10px] font-bold tracking-widest mt-2 uppercase text-gray-500">v1.1.1 Connected</p>
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

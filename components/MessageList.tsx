
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
        <div className="flex gap-1 text-[10px] py-0 leading-[1.1] text-blue-800 font-mono font-bold">
          <span>--</span>
          <span className="break-words">{text}</span>
        </div>
      );
    }

    if (msg.type === MessageType.AI) {
      return (
        <div className="flex gap-1 text-[10px] py-0 leading-[1.1] font-mono">
          <span className="text-green-700 font-bold shrink-0">{"<@GeminiBot>"}</span>
          <span className="text-black break-words">{text}</span>
        </div>
      );
    }

    return (
      <div className="flex gap-1 text-[10px] py-0 leading-[1.1] font-mono items-start">
        <span 
          className="font-bold shrink-0 cursor-pointer hover:underline text-gray-800"
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
      className="h-full overflow-y-auto px-1.5 py-1 bg-white flex flex-col font-mono"
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center opacity-5 select-none pointer-events-none">
          <div className="text-center">
            <p className="text-4xl font-black italic">mIRC</p>
            <p className="text-[8px] font-bold tracking-widest mt-1 uppercase">v1.1.1 Connected</p>
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

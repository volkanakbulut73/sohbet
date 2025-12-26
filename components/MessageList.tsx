import React, { useEffect, useRef } from 'react';
import { Message, MessageType } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  blockedUsers: string[];
  onNickClick?: (e: React.MouseEvent | React.TouchEvent, nick: string) => void;
  onNickContextMenu?: (e: React.MouseEvent, nick: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser, blockedUsers, onNickClick, onNickContextMenu }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleNickClick = (e: React.MouseEvent | React.TouchEvent, sender: string) => {
    if (sender !== currentUser && onNickClick) {
      onNickClick(e, sender);
    }
  };

  const handleNickContextMenu = (e: React.MouseEvent, sender: string) => {
    if (onNickContextMenu) {
      onNickContextMenu(e, sender);
    }
  };

  const getDisplayText = (text: any): string => {
    if (typeof text === 'string') return text;
    if (text === null || text === undefined) return '';
    if (typeof text === 'object') {
      return text.text || text.message || JSON.stringify(text);
    }
    return String(text);
  };

  const renderMessageLine = (msg: Message) => {
    if (blockedUsers.includes(msg.sender)) return null;

    const time = `[${formatTime(msg.timestamp)}]`;
    const displayText = getDisplayText(msg.text);

    switch (msg.type) {
      case MessageType.SYSTEM:
        return (
          <div className="mirc-text py-1 text-[13px] font-mono flex gap-3">
            <span className="text-gray-300 shrink-0">{time}</span>
            <div className="flex gap-2">
              <span className="text-blue-800 font-bold">--</span>
              <span className="text-blue-800 italic font-medium">{displayText}</span>
            </div>
          </div>
        );
      case MessageType.AI:
        return (
          <div className="mirc-text py-1 text-[13px] font-mono flex gap-3">
            <span className="text-gray-300 shrink-0">{time}</span>
            <div className="flex gap-2">
              <span className="text-gray-800 font-bold">{"<@GeminiBot>"}</span>
              <span className="text-black">{displayText}</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="mirc-text py-1 text-[13px] font-mono flex gap-3 items-start">
            <span className="text-gray-300 shrink-0">{time}</span>
            <div className="flex gap-2 min-w-0">
              <span 
                className={`font-bold shrink-0 cursor-pointer hover:underline text-black`}
                onClick={(e) => handleNickClick(e, msg.sender)}
              >
                {`<${msg.sender}>`}
              </span>
              <span className="text-black break-words">{displayText}</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto p-4 bg-white flex flex-col font-mono no-scrollbar"
    >
      <div className="flex-1">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-10 select-none">
            <div className="text-center">
              <p className="text-5xl font-black italic">mIRC</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Connect Module v1.1.1</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.id || i}>
              {renderMessageLine(msg)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessageList;
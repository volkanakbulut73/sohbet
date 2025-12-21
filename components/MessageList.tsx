
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

  const renderMessageLine = (msg: Message) => {
    if (blockedUsers.includes(msg.sender)) return null;

    const time = `[${formatTime(msg.timestamp)}]`;

    switch (msg.type) {
      case MessageType.SYSTEM:
        return (
          <div className="mirc-text py-0.5 animate-in slide-in-from-left-1 duration-200">
            <span className="text-gray-500 mr-2">{time}</span>
            <span className="text-blue-700 font-bold">-- </span>
            <span className="text-blue-700 italic">{msg.text}</span>
          </div>
        );
      case MessageType.ACTION:
        return (
          <div className="mirc-text py-0.5 text-purple-700 italic">
            <span className="text-gray-500 mr-2">{time}</span>
            * <span 
                className="cursor-pointer hover:underline font-bold" 
                onClick={(e) => handleNickClick(e, msg.sender)}
                onContextMenu={(e) => handleNickContextMenu(e, msg.sender)}
              >
                {msg.sender}
              </span> {msg.text}
          </div>
        );
      case MessageType.AI:
        return (
          <div className="mirc-text py-0.5 border-l-2 border-red-500 pl-2 bg-red-50 mb-1">
            <span className="text-gray-500 mr-2">{time}</span>
            <span 
              className="text-red-700 font-bold cursor-pointer hover:underline"
              onClick={(e) => handleNickClick(e, 'GeminiBot')}
              onContextMenu={(e) => handleNickContextMenu(e, 'GeminiBot')}
            >
              {`<@GeminiBot>`}
            </span> {msg.text}
          </div>
        );
      case MessageType.IMAGE:
        return (
          <div className="mirc-text py-1 flex flex-col group">
            <div className="flex items-center">
              <span className="text-gray-400 shrink-0 mr-1">{time}</span>
              <span 
                className={`text-blue-800 shrink-0 mr-1 font-bold cursor-pointer hover:underline`}
                onClick={(e) => handleNickClick(e, msg.sender)}
                onContextMenu={(e) => handleNickContextMenu(e, msg.sender)}
              >
                {`<${msg.sender}>`}
              </span>
              <span className="text-gray-500 text-[10px] italic underline">Görsel paylaştı:</span>
            </div>
            <div className="ml-14 mt-1 border-4 border-gray-200 shadow-sm inline-block rounded max-w-[80%] overflow-hidden bg-black/5">
              <img 
                src={msg.text} 
                alt="Shared content" 
                className="max-h-64 object-contain hover:scale-105 transition-transform cursor-zoom-in"
                loading="lazy"
                onClick={() => window.open(msg.text, '_blank')}
              />
            </div>
          </div>
        );
      default:
        const isMe = msg.sender === currentUser;
        const nickColor = isMe ? 'text-gray-900' : 'text-blue-800';
        return (
          <div className="mirc-text py-0.5 flex items-start group">
            <span className="text-gray-400 shrink-0 mr-1">{time}</span>
            <span 
              className={`${nickColor} shrink-0 mr-1 font-bold cursor-pointer hover:underline active:text-blue-500 transition-colors`}
              onClick={(e) => handleNickClick(e, msg.sender)}
              onContextMenu={(e) => handleNickContextMenu(e, msg.sender)}
              title={`${msg.sender} için seçenekleri gör`}
            >
              {`<${msg.sender}>`}
            </span>
            <span className="text-black break-words selection:bg-blue-200">{msg.text}</span>
          </div>
        );
    }
  };

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto p-2 bg-white flex flex-col"
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center opacity-10 select-none">
          <div className="text-center">
            <p className="text-4xl font-black italic">mIRC</p>
            <p className="text-xs font-bold uppercase tracking-widest">Connect Module</p>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id}>
            {renderMessageLine(msg)}
          </div>
        ))
      )}
    </div>
  );
};

export default MessageList;

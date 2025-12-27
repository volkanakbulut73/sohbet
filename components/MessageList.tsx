
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

  const scrollToBottom = () => {
    if (scrollRef.current) {
      // scrollIntoView bazen mobil viewport yüksekliği değişirken zıplamaya neden olabilir
      // Bu yüzden doğrudan scrollTop kullanıyoruz.
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Mesajlar geldiğinde en alta kaydır. 
    // requestAnimationFrame, tarayıcının bir sonraki boyama (paint) işleminden hemen önce çalışmasını sağlar.
    requestAnimationFrame(scrollToBottom);
    
    // Ağır render durumları için çok kısa bir emniyet payı
    const timer = setTimeout(scrollToBottom, 30);
    return () => clearTimeout(timer);
  }, [messages]);

  // Viewport resize olduğunda (klavye açıldığında/kapandığında)
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(scrollToBottom);
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  const renderMessageLine = (msg: Message) => {
    if (blockedUsers.includes(msg.sender)) return null;
    const text = typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text);

    if (msg.type === MessageType.SYSTEM) {
      return (
        <div className="flex gap-1 text-[13px] py-1 text-[#000080] font-bold">
          <span className="shrink-0">***</span>
          <span className="break-words">{text}</span>
        </div>
      );
    }

    const isMe = msg.sender === currentUser;

    return (
      <div className="flex gap-1 text-[13px] py-0.5 items-start">
        <span 
          className={`font-bold shrink-0 cursor-pointer hover:underline ${isMe ? 'text-[#000080]' : 'text-[#800000]'}`}
          onClick={(e) => onNickClick?.(e, msg.sender)}
        >
          {`<${msg.sender}>`}
        </span>
        <span className="text-black break-words flex-1 leading-normal">{text}</span>
      </div>
    );
  };

  return (
    <div 
      ref={scrollRef}
      className="absolute inset-0 overflow-y-auto px-4 py-2 bg-white flex flex-col font-mono no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex flex-col min-h-full">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-[10px] py-4 border-b border-gray-100 mb-2 italic">
            *** Workigom IRC Network: Bağlantı kuruluyor...
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.id || i}>{renderMessageLine(msg)}</div>
          ))
        )}
        {/* En altta input'un altına girmemesi için güvenli alan */}
        <div className="h-4 shrink-0"></div>
      </div>
    </div>
  );
};

export default MessageList;

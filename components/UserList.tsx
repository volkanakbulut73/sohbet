
import React from 'react';
import { Bot } from 'lucide-react';

interface UserListProps {
  users: string[];
  onClose: () => void;
  onUserClick?: (nick: string) => void;
  currentUser: string;
}

const UserList: React.FC<UserListProps> = ({ users, onClose, onUserClick, currentUser }) => {
  
  const uniqueUsers = Array.from(new Set(users)).sort((a, b) => a.localeCompare(b));

  const getRankInfo = (user: string) => {
    if (user === 'Admin') return { prefix: '&', color: 'text-red-700' };
    if (user === 'Gemini AI') return { prefix: '🤖', color: 'text-purple-700' };
    return { prefix: '%', color: 'text-[#000080]' };
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto no-scrollbar font-mono select-none">
      <div className="flex flex-col">
        {uniqueUsers.map((user, idx) => {
          const rank = getRankInfo(user);
          const isMe = user === currentUser;
          const isAI = user === 'Gemini AI';
          
          return (
            <div 
              key={`${user}-${idx}`} 
              className={`flex items-center gap-0.5 px-1 py-1 hover:bg-blue-50 cursor-pointer border-b border-gray-50 group ${isMe ? 'bg-blue-50' : ''}`}
              onDoubleClick={() => onUserClick?.(user)}
              title={`${user} ile özel sohbet başlatmak için çift tıkla`}
            >
              <span className={`text-[10px] md:text-[11px] font-bold w-4 shrink-0 text-center ${rank.color}`}>
                {rank.prefix}
              </span>
              <span className={`text-[10px] md:text-[11px] font-bold truncate flex-1 ${isMe ? 'text-black' : rank.color} group-hover:underline`}>
                {user}
              </span>
              {isAI && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse mr-1"></div>}
            </div>
          );
        })}
      </div>
      
      <div className="mt-auto p-1 bg-gray-50 border-t border-gray-200 text-[8px] md:text-[9px] text-gray-500 font-bold uppercase text-center shrink-0">
         {uniqueUsers.length} ONLINE
      </div>
    </div>
  );
};

export default UserList;

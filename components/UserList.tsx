
import React from 'react';
import { Bot, User as UserIcon, Sparkles } from 'lucide-react';

interface UserListProps {
  users: string[];
  onClose: () => void;
  onUserClick?: (nick: string) => void;
  currentUser: string;
}

const UserList: React.FC<UserListProps> = ({ users, onClose, onUserClick, currentUser }) => {
  const uniqueUsers = (Array.from(new Set(users)) as string[]).sort((a, b) => a.localeCompare(b));

  const getRankInfo = (user: string) => {
    if (user === 'Admin') return { prefix: '&', color: 'text-red-700', bg: 'bg-red-50' };
    if (user === 'Gemini AI') return { prefix: '🤖', color: 'text-purple-700', bg: 'bg-purple-50' };
    if (user === 'Lara') return { prefix: '✨', color: 'text-pink-600', bg: 'bg-pink-50' };
    return { prefix: '%', color: 'text-[#000080]', bg: 'bg-transparent' };
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto no-scrollbar font-mono select-none border-l border-gray-200 shadow-inner">
      <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300 text-[9px] font-black text-gray-600 uppercase tracking-widest flex justify-between">
        <span>USERS</span>
        <span>{uniqueUsers.length}</span>
      </div>
      <div className="flex flex-col">
        {uniqueUsers.map((user, idx) => {
          const rank = getRankInfo(user);
          const isMe = user === currentUser;
          const isAI = user === 'Gemini AI';
          const isLara = user === 'Lara';
          
          return (
            <div 
              key={`${user}-${idx}`} 
              className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-blue-100 cursor-pointer border-b border-gray-50 group transition-colors ${isMe ? 'bg-blue-50/50' : ''} ${isAI || isLara ? rank.bg : ''}`}
              onDoubleClick={() => onUserClick?.(user)}
              title={`${user} ile özel sohbet başlatmak için çift tıkla`}
            >
              <span className={`text-[10px] md:text-[11px] font-black w-4 shrink-0 text-center ${rank.color}`}>
                {rank.prefix}
              </span>
              <span className={`text-[10px] md:text-[11px] font-bold truncate flex-1 ${isMe ? 'text-black underline' : rank.color} group-hover:underline`}>
                {user}
              </span>
              {(isAI || isLara) && (
                <div className="relative flex h-2 w-2 mr-1">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isAI ? 'bg-purple-400' : 'bg-pink-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isAI ? 'bg-purple-600' : 'bg-pink-600'}`}></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-auto p-2 bg-[#000080]/5 border-t border-gray-300 text-[8px] md:text-[9px] text-gray-500 font-bold uppercase text-center shrink-0">
         Workigom Network Node: ACTIVE
      </div>
    </div>
  );
};

export default UserList;

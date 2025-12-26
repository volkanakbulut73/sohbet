
import React from 'react';
import { Crown, Heart, Shield, Star, X } from 'lucide-react';

interface UserListProps {
  users: string[];
  onClose: () => void;
  onUserClick?: (e: React.MouseEvent | React.TouchEvent, username: string) => void;
  currentUser: string;
  currentOps?: string[];
}

const UserList: React.FC<UserListProps> = ({ users, onClose, onUserClick, currentUser, currentOps = [] }) => {
  
  const uniqueUsers = Array.from(new Set(users)).sort((a, b) => a.localeCompare(b));

  const getRankInfo = (user: string) => {
    // Klasik mIRC hiyerarşisi prefixleri
    if (user === 'Admin') return { prefix: '&', color: 'text-red-700' };
    if (user === 'GeminiBot') return { prefix: '@', color: 'text-green-700' };
    if (['SevimLi', 'Ercan', 'Esraa'].includes(user)) return { prefix: '&', color: 'text-red-700' };
    if (['NoNNiCK', 'Renk', 'w00t'].includes(user)) return { prefix: '@', color: 'text-green-700' };
    
    return { prefix: '%', color: 'text-[#000080]' };
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto no-scrollbar font-mono">
      <div className="flex flex-col">
        {uniqueUsers.map((user, idx) => {
          const rank = getRankInfo(user);
          const isMe = user === currentUser;
          
          return (
            <div 
              key={`${user}-${idx}`} 
              className={`flex items-center gap-0.5 px-2 py-0.5 hover:bg-blue-50 cursor-pointer select-none border-b border-gray-50 ${isMe ? 'bg-blue-50 ring-1 ring-inset ring-blue-100' : ''}`}
              onClick={(e) => onUserClick?.(e, user)}
            >
              <span className={`text-[11px] font-bold w-3 shrink-0 ${rank.color}`}>{rank.prefix}</span>
              <span className={`text-[11px] font-bold truncate ${isMe ? 'text-black' : rank.color}`}>
                {user}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="mt-auto p-1 bg-gray-50 border-t border-gray-200 text-[9px] text-gray-500 font-bold uppercase text-center shrink-0">
         {uniqueUsers.length} Users Online
      </div>
    </div>
  );
};

export default UserList;

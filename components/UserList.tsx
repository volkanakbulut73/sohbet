
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
  
  const uniqueUsers = Array.from(new Set(users));

  const getRankInfo = (user: string) => {
    // Klasik mIRC hiyerarşisi
    if (user === 'Admin') return { icon: <Crown size={10} fill="#FFD700" className="text-yellow-600" />, prefix: '&' };
    if (user === 'GeminiBot') return { icon: <Heart size={10} fill="#ef4444" className="text-red-500" />, prefix: '@' };
    if (['SevimLi', 'Ercan', 'Esraa'].includes(user)) return { icon: <Crown size={10} fill="#FFA500" className="text-orange-500" />, prefix: '&' };
    if (['NoNNiCK', 'Renk', 'w00t'].includes(user)) return { icon: <Crown size={10} fill="#FFA500" className="text-orange-500" />, prefix: '@' };
    
    // Voice/Normal kullanıcılar (%)
    return { icon: <Shield size={10} fill="#444" className="text-gray-700" />, prefix: '%' };
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
              className={`flex items-center gap-1 px-1.5 py-0 hover:bg-blue-50 cursor-pointer select-none border-b border-gray-50/50 ${isMe ? 'bg-blue-50' : ''}`}
              onClick={(e) => onUserClick?.(e, user)}
            >
              <span className="shrink-0 scale-90">{rank.icon}</span>
              <span className="text-blue-900 text-[10px] font-bold truncate">
                {rank.prefix}{user}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="mt-auto p-1 bg-gray-50 border-t border-gray-100 text-[8px] text-gray-400 font-bold uppercase text-center">
         {uniqueUsers.length} Users
      </div>
    </div>
  );
};

export default UserList;


import React from 'react';
import { UserX, UserCheck, Shield, ShieldAlert, Crown, Star, ShieldCheck } from 'lucide-react';

interface UserListProps {
  users: string[];
  onClose: () => void;
  onUserClick?: (e: React.MouseEvent | React.TouchEvent, username: string) => void;
  onUserBlock?: (username: string) => void;
  onUserContextMenu?: (e: React.MouseEvent, username: string) => void;
  blockedUsers?: string[];
  operators?: string[];
  isAdmin?: boolean;
}

const UserList: React.FC<UserListProps> = ({ users, onUserClick, onUserBlock, onUserContextMenu, blockedUsers = [], operators = [], isAdmin }) => {
  const uniqueUsers = Array.from(new Set(users)).filter(u => u && u.trim() !== "");

  const getRank = (user: string) => {
    if (user === 'GeminiBot') return { icon: <ShieldAlert size={13} className="text-red-500" />, prefix: '@', color: 'text-red-600', label: 'Bot' };
    if (user.includes('Admin') || user === 'Victoria') return { icon: <Crown size={13} className="text-yellow-500 fill-yellow-500" />, prefix: '👑', color: 'text-yellow-600', label: 'Admin' };
    if (operators.includes(user)) return { icon: <ShieldCheck size={13} className="text-blue-500" />, prefix: '&', color: 'text-blue-600', label: 'Op' };
    return { icon: <Star size={11} className="text-gray-400" />, prefix: '%', color: 'text-gray-600', label: 'User' };
  };

  return (
    <div className="w-full h-full flex flex-col bg-white text-[12px] select-none font-medium">
      <div className="flex-1 overflow-y-auto">
        {uniqueUsers.map((user, idx) => {
          const rank = getRank(user);
          const isBlocked = blockedUsers.includes(user);
          
          return (
            <div 
              key={`${user}-${idx}`} 
              className={`flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-blue-50 cursor-pointer group border-b border-gray-50/50 ${isBlocked ? 'opacity-40 grayscale' : ''}`}
              onClick={(e) => onUserClick?.(e, user)}
              onContextMenu={(e) => onUserContextMenu?.(e, user)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="shrink-0">{rank.icon}</span>
                <span className={`truncate ${rank.color} ${isBlocked ? 'line-through' : ''}`}>
                  {rank.prefix}{user}
                </span>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                {user !== 'GeminiBot' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onUserBlock?.(user);
                    }}
                    className={`p-1 rounded hover:bg-white shadow-sm transition-all ${isBlocked ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {isBlocked ? <UserCheck size={12} /> : <UserX size={12} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserList;

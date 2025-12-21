
import React from 'react';
import { UserX, UserCheck, Shield, ShieldAlert, Crown } from 'lucide-react';

interface UserListProps {
  users: string[];
  onClose: () => void;
  onUserClick?: (username: string) => void;
  onUserBlock?: (username: string) => void;
  onUserContextMenu?: (e: React.MouseEvent, username: string) => void;
  blockedUsers?: string[];
  operators?: string[];
  isAdmin?: boolean;
}

const UserList: React.FC<UserListProps> = ({ users, onUserClick, onUserBlock, onUserContextMenu, blockedUsers = [], operators = [], isAdmin }) => {
  const uniqueUsers = Array.from(new Set(users)).filter(u => u && u.trim() !== "");

  const getRank = (user: string) => {
    if (user === 'GeminiBot') return { icon: <ShieldAlert size={14} />, prefix: '@', color: 'text-red-600', label: 'Bot' };
    if (operators.includes(user)) return { icon: <Shield size={14} />, prefix: '@', color: 'text-blue-600', label: 'Op' };
    return { icon: null, prefix: '', color: 'text-gray-600', label: 'User' };
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fbff] text-[11px] select-none">
      <div className="flex-1 overflow-y-auto">
        {uniqueUsers.map((user, idx) => {
          const rank = getRank(user);
          const isBlocked = blockedUsers.includes(user);
          
          return (
            <div 
              key={`${user}-${idx}`} 
              className={`flex items-center justify-between gap-1.5 px-2 py-1 hover:bg-blue-100 cursor-pointer group border-b border-transparent ${isBlocked ? 'opacity-40 grayscale' : ''}`}
              onClick={() => onUserClick?.(user)}
              onContextMenu={(e) => onUserContextMenu?.(e, user)}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className={`${rank.color} shrink-0`}>{rank.icon}</span>
                <span className={`font-bold ${rank.color} truncate ${isBlocked ? 'line-through' : ''}`}>
                  {rank.prefix}{user}
                </span>
              </div>
              
              {user !== 'GeminiBot' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onUserBlock?.(user);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-all ${isBlocked ? 'text-green-600 opacity-100' : 'text-red-500'}`}
                >
                  {isBlocked ? <UserCheck size={12} /> : <UserX size={12} />}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserList;

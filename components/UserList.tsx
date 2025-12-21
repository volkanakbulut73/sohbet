
import React from 'react';
import { UserX, UserCheck } from 'lucide-react';

interface UserListProps {
  users: string[];
  onClose: () => void;
  onUserClick?: (username: string) => void;
  onUserBlock?: (username: string) => void;
  onUserContextMenu?: (e: React.MouseEvent, username: string) => void;
  blockedUsers?: string[];
}

const UserList: React.FC<UserListProps> = ({ users, onUserClick, onUserBlock, onUserContextMenu, blockedUsers = [] }) => {
  const uniqueUsers = Array.from(new Set(users)).filter(u => u && u.trim() !== "");

  const getPrefix = (idx: number, user: string) => {
    if (user === 'GeminiBot') return { icon: '🤖', prefix: '@', color: 'text-red-600' };
    if (idx === 0) return { icon: '👑', prefix: '&', color: 'text-orange-500' };
    if (idx === 1) return { icon: '🛡️', prefix: '%', color: 'text-gray-700' };
    if (idx < 5) return { icon: '⚔️', prefix: '+', color: 'text-gray-600' };
    return { icon: '👑', prefix: '%', color: 'text-gray-600' };
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fbff] text-[11px] select-none">
      <div className="flex-1 overflow-y-auto">
        {uniqueUsers.map((user, idx) => {
          const rank = getPrefix(idx, user);
          const isBlocked = blockedUsers.includes(user);
          
          return (
            <div 
              key={`${user}-${idx}`} 
              className={`flex items-center justify-between gap-1.5 px-2 py-1 hover:bg-blue-100 cursor-pointer group border-b border-transparent ${isBlocked ? 'opacity-40 grayscale' : ''}`}
              onClick={() => onUserClick?.(user)}
              onContextMenu={(e) => onUserContextMenu?.(e, user)}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[14px] shrink-0" title="Rank">{rank.icon}</span>
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
                  title={isBlocked ? "Engeli Kaldır" : "Engelle"}
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

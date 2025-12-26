import React, { useState } from 'react';
import { Shield, Crown, Star, MoreVertical, Hammer, ArrowUpCircle, ArrowDownCircle, X, Users, Heart } from 'lucide-react';

interface UserListProps {
  users: string[];
  onClose: () => void;
  onUserClick?: (e: React.MouseEvent | React.TouchEvent, username: string) => void;
  onAction?: (username: string, action: 'op' | 'deop' | 'kick' | 'ban') => void;
  blockedUsers?: string[];
  isAdmin?: boolean;
  currentOps?: string[];
  currentUser: string;
}

const UserList: React.FC<UserListProps> = ({ users, onClose, onUserClick, onAction, blockedUsers = [], isAdmin, currentOps = [], currentUser }) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  const uniqueUsers = Array.from(new Set(users)).filter((u): u is string => typeof u === 'string' && u.trim() !== "");
  const canManage = isAdmin || currentOps.includes(currentUser);

  const getRank = (user: string) => {
    const isMe = user.toLowerCase() === currentUser.toLowerCase();
    if (user === 'GeminiBot') return { icon: <Heart size={14} className="text-red-500" />, prefix: '@' };
    if (user.toLowerCase().includes('admin')) return { icon: <Crown size={14} className="text-yellow-600" />, prefix: '' };
    if (isMe) return { icon: <Shield size={14} className="text-black" />, prefix: '' };
    return { icon: <Star size={14} className="text-gray-300" />, prefix: '' };
  };

  return (
    <div className="w-full h-full flex flex-col bg-white text-[13px] select-none font-mono">
      {/* Header matching screenshot overlay look */}
      <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
        <span className="text-gray-300 text-[10px] font-black uppercase tracking-widest">ACTIVE</span>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {uniqueUsers.map((user, idx) => {
          const rank = getRank(user);
          const isBlocked = blockedUsers.includes(user);
          const isMe = user.toLowerCase() === currentUser.toLowerCase();
          
          return (
            <div key={`${user}-${idx}`} className="relative group">
              <div 
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${isMe ? 'bg-gray-100/50' : ''} ${isBlocked ? 'opacity-30' : ''}`}
                onClick={(e) => {
                  if (canManage && !isMe && user !== 'GeminiBot') {
                    setSelectedUser(selectedUser === user ? null : user);
                  } else {
                    onUserClick?.(e, user);
                  }
                }}
              >
                <span className="shrink-0">{rank.icon}</span>
                <span className={`truncate font-bold tracking-tight ${isMe ? 'text-black uppercase' : 'text-gray-700'}`}>
                  {rank.prefix}{user}
                </span>
              </div>

              {/* Action Menu (Popup) */}
              {selectedUser === user && (
                <div className="absolute right-4 top-10 z-[100] bg-white border border-gray-200 shadow-2xl py-1 w-40 rounded-sm fade-in">
                   <button onClick={() => { onAction?.(user, 'kick'); setSelectedUser(null); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-[11px] font-bold">
                    <Hammer size={14} /> ODADAN AT
                  </button>
                  <button onClick={() => { onUserClick?.(null as any, user); setSelectedUser(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-600 flex items-center gap-2 text-[11px] font-bold">
                    <Users size={14} /> ÖZEL MESAJ
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Bottom status matching the grey bar style in screenshot */}
      <div className="mt-auto bg-gray-100/50 p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-widest text-[9px]">
           <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_4px_#22c55e]"></div>
           STATUS: ONLINE
        </div>
      </div>

      {selectedUser && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setSelectedUser(null)} />}
    </div>
  );
};

export default UserList;
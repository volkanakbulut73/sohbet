
import React, { useState } from 'react';
import { UserX, UserCheck, Shield, ShieldAlert, Crown, Star, ShieldCheck, MoreVertical, Hammer, Ban, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

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

const UserList: React.FC<UserListProps> = ({ users, onUserClick, onAction, blockedUsers = [], isAdmin, currentOps = [], currentUser }) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const uniqueUsers = Array.from(new Set(users)).filter(u => u && typeof u === 'string' && u.trim() !== "");
  const canManage = isAdmin || currentOps.includes(currentUser);

  const getRank = (user: string) => {
    if (user === 'GeminiBot') return { icon: <ShieldAlert size={13} className="text-red-500" />, prefix: '@', color: 'text-red-600', label: 'Bot' };
    if (user.includes('Admin') || (isAdmin && user === currentUser)) return { icon: <Crown size={13} className="text-yellow-500 fill-yellow-500" />, prefix: '👑', color: 'text-yellow-600', label: 'Admin' };
    if (currentOps.includes(user)) return { icon: <ShieldCheck size={13} className="text-blue-500" />, prefix: '@', color: 'text-blue-600', label: 'Op' };
    return { icon: <Star size={11} className="text-gray-400" />, prefix: '', color: 'text-gray-600', label: 'User' };
  };

  return (
    <div className="w-full h-full flex flex-col bg-white text-[12px] select-none font-medium relative">
      <div className="flex-1 overflow-y-auto">
        {uniqueUsers.map((user, idx) => {
          const rank = getRank(user);
          const isBlocked = blockedUsers.includes(user);
          const isOp = currentOps.includes(user);
          const displayUser = String(user);
          
          return (
            <div key={`${displayUser}-${idx}`} className="relative">
              <div 
                className={`flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-blue-50 cursor-pointer group border-b border-gray-50/50 ${isBlocked ? 'opacity-40 grayscale' : ''}`}
                onClick={(e) => {
                  if (canManage && displayUser !== currentUser && displayUser !== 'GeminiBot') {
                    setSelectedUser(selectedUser === displayUser ? null : displayUser);
                  } else {
                    onUserClick?.(e, displayUser);
                  }
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="shrink-0">{rank.icon}</span>
                  <span className={`truncate ${rank.color} ${isBlocked ? 'line-through' : ''}`}>
                    {rank.prefix}{displayUser}
                  </span>
                </div>
                {canManage && displayUser !== currentUser && displayUser !== 'GeminiBot' && (
                  <MoreVertical size={14} className="text-gray-300 group-hover:text-gray-500" />
                )}
              </div>

              {/* Action Menu */}
              {selectedUser === displayUser && (
                <div className="absolute right-2 top-8 z-50 bg-white shadow-xl border border-gray-200 rounded-lg py-1 w-32 animate-in fade-in zoom-in-95 duration-100">
                  {!isOp ? (
                    <button onClick={() => { onAction?.(displayUser, 'op'); setSelectedUser(null); }} className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 text-blue-600">
                      <ArrowUpCircle size={12} /> Op Ver
                    </button>
                  ) : (
                    <button onClick={() => { onAction?.(displayUser, 'deop'); setSelectedUser(null); }} className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 text-orange-600">
                      <ArrowDownCircle size={12} /> Op Al
                    </button>
                  )}
                  <button onClick={() => { onAction?.(displayUser, 'kick'); setSelectedUser(null); }} className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center gap-2 text-red-500">
                    <Hammer size={12} /> Kickle
                  </button>
                  <button onClick={() => { onAction?.(displayUser, 'ban'); setSelectedUser(null); }} className="w-full text-left px-3 py-1.5 hover:bg-red-100 flex items-center gap-2 text-red-700 font-bold">
                    <Ban size={12} /> Banla
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selectedUser && <div className="fixed inset-0 z-40" onClick={() => setSelectedUser(null)} />}
    </div>
  );
};

export default UserList;

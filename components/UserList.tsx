
import React, { useState } from 'react';
import { UserX, UserCheck, Shield, ShieldAlert, Crown, Star, ShieldCheck, MoreVertical, Hammer, Ban, ArrowUpCircle, ArrowDownCircle, X } from 'lucide-react';

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
    if (user === 'GeminiBot') return { icon: <ShieldAlert size={10} className="text-red-500" />, prefix: '@', color: 'text-red-600', label: 'Bot' };
    if (user.includes('Admin') || (isAdmin && user === currentUser)) return { icon: <Crown size={10} className="text-yellow-500 fill-yellow-500" />, prefix: '👑', color: 'text-yellow-600', label: 'Admin' };
    if (currentOps.includes(user)) return { icon: <ShieldCheck size={10} className="text-blue-500" />, prefix: '@', color: 'text-blue-600', label: 'Op' };
    return { icon: <Star size={8} className="text-gray-400" />, prefix: '', color: 'text-gray-600', label: 'User' };
  };

  return (
    <div className="w-full h-full flex flex-col bg-white text-[10px] md:text-[11px] select-none font-medium relative border-l border-gray-300 font-mono">
      {/* List Header (mIRC style) */}
      <div className="bg-[#000080] text-white p-1 text-[9px] font-bold flex justify-between items-center shrink-0">
        <span>USERS ({uniqueUsers.length})</span>
        <button onClick={onClose} className="lg:hidden hover:bg-white/20 p-0.5 rounded">
          <X size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1 bg-white">
        {uniqueUsers.map((user, idx) => {
          const rank = getRank(user);
          const isBlocked = blockedUsers.includes(user);
          const isOp = currentOps.includes(user);
          const displayUser = String(user);
          
          return (
            <div key={`${displayUser}-${idx}`} className="relative">
              <div 
                className={`flex items-center justify-between gap-1 px-1.5 py-0.5 hover:bg-blue-600 hover:text-white cursor-pointer group ${isBlocked ? 'opacity-40 grayscale' : ''}`}
                onClick={(e) => {
                  if (canManage && displayUser !== currentUser && displayUser !== 'GeminiBot') {
                    setSelectedUser(selectedUser === displayUser ? null : displayUser);
                  } else {
                    onUserClick?.(e, displayUser);
                  }
                }}
              >
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="shrink-0">{rank.icon}</span>
                  <span className={`truncate font-bold ${rank.color} group-hover:text-white ${isBlocked ? 'line-through' : ''}`}>
                    {rank.prefix}{displayUser}
                  </span>
                </div>
                {canManage && displayUser !== currentUser && displayUser !== 'GeminiBot' && (
                  <MoreVertical size={10} className="text-gray-300 group-hover:text-white" />
                )}
              </div>

              {/* Action Menu */}
              {selectedUser === displayUser && (
                <div className="absolute right-1 top-4 z-50 bg-[#d4dce8] border border-gray-600 shadow-md py-1 w-24">
                  {!isOp ? (
                    <button onClick={() => { onAction?.(displayUser, 'op'); setSelectedUser(null); }} className="w-full text-left px-2 py-0.5 hover:bg-blue-800 hover:text-white flex items-center gap-1 text-[9px]">
                      <ArrowUpCircle size={10} /> Op Ver
                    </button>
                  ) : (
                    <button onClick={() => { onAction?.(displayUser, 'deop'); setSelectedUser(null); }} className="w-full text-left px-2 py-0.5 hover:bg-blue-800 hover:text-white flex items-center gap-1 text-[9px]">
                      <ArrowDownCircle size={10} /> Op Al
                    </button>
                  )}
                  <button onClick={() => { onAction?.(displayUser, 'kick'); setSelectedUser(null); }} className="w-full text-left px-2 py-0.5 hover:bg-blue-800 hover:text-white flex items-center gap-1 text-[9px]">
                    <Hammer size={10} /> Kick
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

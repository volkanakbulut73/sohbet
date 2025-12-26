import React, { useState } from 'react';
import { UserX, UserCheck, Shield, ShieldAlert, Crown, Star, ShieldCheck, MoreVertical, Hammer, Ban, ArrowUpCircle, ArrowDownCircle, X, Users, Heart } from 'lucide-react';

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
    if (user === 'GeminiBot') return { icon: <Heart size={12} className="text-pink-500 fill-pink-500" />, prefix: '@', color: 'text-pink-600' };
    if (user.includes('Admin') || (isAdmin && user === currentUser)) return { icon: <Crown size={12} className="text-yellow-600 fill-yellow-500" />, prefix: '', color: 'text-yellow-700' };
    if (currentOps.includes(user)) return { icon: <Shield size={12} className="text-blue-600 fill-blue-500" />, prefix: '@', color: 'text-blue-700' };
    return { icon: <Star size={11} className="text-gray-400" />, prefix: '', color: 'text-gray-600' };
  };

  return (
    <div className="w-full h-full flex flex-col bg-white text-[12px] select-none font-mono relative">
      {/* List Header */}
      <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
        <span className="text-black font-black uppercase tracking-tighter flex items-center gap-2">
          <Users size={16} /> AKTİF ÜYELER
        </span>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
          <X size={16} />
        </button>
      </div>

      <div className="bg-gray-50/50 p-2 px-4 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        ACTIVE
      </div>

      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar no-scrollbar">
        {uniqueUsers.map((user, idx) => {
          const rank = getRank(user);
          const isBlocked = blockedUsers.includes(user);
          const isOp = currentOps.includes(user);
          const displayUser = String(user);
          
          return (
            <div key={`${displayUser}-${idx}`} className="relative group">
              <div 
                className={`flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${isBlocked ? 'opacity-40' : ''}`}
                onClick={(e) => {
                  if (canManage && displayUser !== currentUser && displayUser !== 'GeminiBot') {
                    setSelectedUser(selectedUser === displayUser ? null : displayUser);
                  } else {
                    onUserClick?.(e, displayUser);
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="shrink-0">{rank.icon}</span>
                  <span className={`truncate font-bold text-[13px] ${rank.color}`}>
                    {rank.prefix}{displayUser}
                  </span>
                </div>
                {canManage && displayUser !== currentUser && displayUser !== 'GeminiBot' && (
                  <MoreVertical size={14} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
                )}
              </div>

              {/* Action Menu (Popup) */}
              {selectedUser === displayUser && (
                <div className="absolute right-4 top-8 z-[100] bg-white border border-gray-200 shadow-xl py-1 w-32 rounded-lg fade-in">
                  {!isOp ? (
                    <button onClick={() => { onAction?.(displayUser, 'op'); setSelectedUser(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700 flex items-center gap-2 text-[11px] font-bold">
                      <ArrowUpCircle size={14} /> OP YETKİSİ
                    </button>
                  ) : (
                    <button onClick={() => { onAction?.(displayUser, 'deop'); setSelectedUser(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-600 flex items-center gap-2 text-[11px] font-bold">
                      <ArrowDownCircle size={14} /> YETKİ AL
                    </button>
                  )}
                  <button onClick={() => { onAction?.(displayUser, 'kick'); setSelectedUser(null); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-[11px] font-bold">
                    <Hammer size={14} /> ODADAN AT
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Current User Status Area */}
      <div className="mt-auto bg-gray-900 border-t border-gray-800 p-4 pb-20 sm:pb-4">
        <div className="flex items-center gap-2 text-white font-black uppercase tracking-tighter truncate text-[11px]">
           <div className="w-2 h-2 bg-[#00ff99] rounded-full animate-pulse shadow-[0_0_8px_#00ff99]"></div>
           {currentUser}
        </div>
        <p className="text-[9px] text-gray-500 font-bold mt-1">BAĞLI / ONLINE</p>
      </div>

      {selectedUser && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setSelectedUser(null)} />}
    </div>
  );
};

export default UserList;
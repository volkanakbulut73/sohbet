
import React, { useState } from 'react';
// Fix: Added 'Users' to imports from lucide-react to resolve "Cannot find name 'Users'" error
import { UserX, UserCheck, Shield, ShieldAlert, Crown, Star, ShieldCheck, MoreVertical, Hammer, Ban, ArrowUpCircle, ArrowDownCircle, X, Users } from 'lucide-react';

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
    if (user === 'GeminiBot') return { icon: <ShieldAlert size={11} className="text-red-600" />, prefix: '@', color: 'text-red-700', label: 'Bot' };
    if (user.includes('Admin') || (isAdmin && user === currentUser)) return { icon: <Crown size={11} className="text-yellow-600 fill-yellow-500" />, prefix: '👑', color: 'text-yellow-700', label: 'Admin' };
    if (currentOps.includes(user)) return { icon: <ShieldCheck size={11} className="text-blue-600" />, prefix: '@', color: 'text-blue-700', label: 'Op' };
    return { icon: <Star size={10} className="text-gray-500" />, prefix: '', color: 'text-gray-700', label: 'User' };
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f3f4f6] text-[11px] select-none font-mono relative">
      {/* List Header with mIRC style gradient */}
      <div className="bg-gradient-to-r from-[#000080] to-blue-900 text-white p-2 text-[10px] font-black flex justify-between items-center shrink-0 shadow-md">
        <span className="flex items-center gap-2">
          <Users size={12} /> USERS ({uniqueUsers.length})
        </span>
        <button onClick={onClose} className="lg:hidden hover:bg-white/20 p-1 rounded-sm">
          <X size={14} />
        </button>
      </div>

      {/* Info Label */}
      <div className="bg-gray-200/50 p-1 px-2 border-b border-gray-300 text-[9px] font-bold text-gray-500 uppercase tracking-tight">
        Connected Participants
      </div>

      <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
        {uniqueUsers.map((user, idx) => {
          const rank = getRank(user);
          const isBlocked = blockedUsers.includes(user);
          const isOp = currentOps.includes(user);
          const displayUser = String(user);
          
          return (
            <div key={`${displayUser}-${idx}`} className="relative group">
              <div 
                className={`flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors ${isBlocked ? 'opacity-40' : ''}`}
                onClick={(e) => {
                  if (canManage && displayUser !== currentUser && displayUser !== 'GeminiBot') {
                    setSelectedUser(selectedUser === displayUser ? null : displayUser);
                  } else {
                    onUserClick?.(e, displayUser);
                  }
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="shrink-0 opacity-80 group-hover:opacity-100">{rank.icon}</span>
                  <span className={`truncate font-bold ${rank.color} group-hover:text-white transition-colors`}>
                    {rank.prefix}{displayUser}
                  </span>
                </div>
                {canManage && displayUser !== currentUser && displayUser !== 'GeminiBot' && (
                  <MoreVertical size={12} className="text-gray-400 group-hover:text-white shrink-0" />
                )}
              </div>

              {/* Action Menu (Popup) */}
              {selectedUser === displayUser && (
                <div className="absolute right-2 top-6 z-[100] bg-white border-2 border-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] py-1.5 w-32 animate-in zoom-in-95 duration-100">
                   <div className="px-2 pb-1 border-b border-gray-100 mb-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Management</p>
                   </div>
                  {!isOp ? (
                    <button onClick={() => { onAction?.(displayUser, 'op'); setSelectedUser(null); }} className="w-full text-left px-3 py-1.5 hover:bg-blue-700 hover:text-white flex items-center gap-2 text-[10px] font-bold">
                      <ArrowUpCircle size={12} /> GIVE OP
                    </button>
                  ) : (
                    <button onClick={() => { onAction?.(displayUser, 'deop'); setSelectedUser(null); }} className="w-full text-left px-3 py-1.5 hover:bg-blue-700 hover:text-white flex items-center gap-2 text-[10px] font-bold">
                      <ArrowDownCircle size={12} /> TAKE OP
                    </button>
                  )}
                  <button onClick={() => { onAction?.(displayUser, 'kick'); setSelectedUser(null); }} className="w-full text-left px-3 py-1.5 hover:bg-red-700 hover:text-white flex items-center gap-2 text-[10px] font-bold">
                    <Hammer size={12} /> KICK
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Current User Status Area */}
      <div className="mt-auto bg-gray-200 border-t border-gray-300 p-2 text-[9px]">
        <div className="flex items-center gap-2 text-blue-900 font-black uppercase">
           <Shield size={10} /> {currentUser} (Online)
        </div>
      </div>

      {selectedUser && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setSelectedUser(null)} />}
    </div>
  );
};

export default UserList;

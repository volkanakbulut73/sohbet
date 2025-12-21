
import React from 'react';
import { Users, X, Circle, MessageCircle, ShieldCheck, UserPlus } from 'lucide-react';

interface UserListProps {
  users: string[];
  onClose: () => void;
  onUserClick?: (username: string) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onClose, onUserClick }) => {
  return (
    <div className="w-full h-full flex flex-col select-none bg-slate-950/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kullanıcılar ({users.length})</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-500">
          <X size={18} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {users.map((user, idx) => {
          const isOp = user === 'Admin' || user === 'GeminiBot';
          return (
            <div 
              key={idx} 
              onClick={() => onUserClick?.(user)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sky-500/5 group cursor-pointer transition-all border border-transparent hover:border-sky-500/10"
            >
              <div className="relative shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-all transform group-hover:scale-105
                  ${isOp ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-600/5' : 'bg-slate-800 text-slate-400 border border-slate-700/30'}
                `}>
                  {isOp ? '@' : user.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-slate-950 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm truncate font-bold group-hover:text-white transition-colors
                    ${isOp ? 'text-indigo-400' : 'text-slate-300'}
                  `}>
                    {user}
                  </p>
                  {isOp && <ShieldCheck size={10} className="text-indigo-500/70" />}
                </div>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter opacity-60">Çevrimiçi</p>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                <MessageCircle size={14} className="text-sky-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/40 bg-slate-900/20 shrink-0">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors border border-slate-700/30">
          <UserPlus size={14} />
          Davet Et
        </button>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-600 uppercase">
          <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <span className="opacity-50">Sesli</span>
            <span className="text-emerald-500">Aktif</span>
          </div>
          <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <span className="opacity-50">Gecikme</span>
            <span className="text-sky-500">14ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;

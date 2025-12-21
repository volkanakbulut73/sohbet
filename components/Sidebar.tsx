
import { Channel } from '../types';
import { Hash, Search, Plus, MessageSquare, User, Circle, Sparkles } from 'lucide-react';

interface SidebarProps {
  channels: Channel[];
  privateChats: string[];
  activeTab: string;
  onSelect: (name: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ channels, privateChats, activeTab, onSelect }) => {
  return (
    <div className="w-full h-full bg-slate-950 flex flex-col border-r border-slate-800/40 select-none">
      <div className="p-5 sm:p-6 shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-sky-500/20 ring-1 ring-white/10 group">
            <MessageSquare size={22} className="text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tighter text-white leading-none">CONNECT</h2>
            <div className="flex items-center gap-1.5 mt-1">
               <Sparkles size={10} className="text-sky-400" />
               <span className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-black">Powered by Gemini</span>
            </div>
          </div>
        </div>

        <div className="space-y-7">
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-[10px] uppercase font-black text-slate-600 tracking-[0.2em]">Channels</span>
              <button className="p-1 hover:bg-slate-800 rounded-md text-slate-600 hover:text-white transition-all">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {channels.map((channel) => (
                <button
                  key={channel.name}
                  onClick={() => onSelect(channel.name)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all
                    ${activeTab === channel.name 
                      ? 'bg-sky-600/10 text-sky-400 font-bold ring-1 ring-sky-500/20 shadow-lg shadow-sky-500/5' 
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Hash size={16} className={activeTab === channel.name ? 'text-sky-500' : 'text-slate-600'} />
                    <span className="truncate">{channel.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-[10px] uppercase font-black text-slate-600 tracking-[0.2em]">Private</span>
            </div>
            <div className="space-y-0.5">
              {privateChats.map((username) => (
                <button
                  key={username}
                  onClick={() => onSelect(username)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                    ${activeTab === username 
                      ? 'bg-indigo-600/10 text-indigo-400 font-bold ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5' 
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'}
                  `}
                >
                  <div className="relative">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700/50">
                      <User size={12} className={activeTab === username ? 'text-indigo-400' : 'text-slate-600'} />
                    </div>
                    <Circle size={6} className="absolute -top-1 -right-1 fill-green-500 text-green-500 border border-slate-950 rounded-full" />
                  </div>
                  <span className="truncate">{username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 sm:p-5 border-t border-slate-900 bg-slate-950/40 backdrop-blur-xl">
        <div className="flex items-center gap-3 bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/30">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 border border-white/20 p-0.5 shadow-xl">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-[10px] font-black text-white uppercase">
              DB
            </div>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Supabase Core</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Realtime Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

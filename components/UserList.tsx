
import React from 'react';

interface UserListProps {
  users: string[];
  onClose: () => void;
  onUserClick?: (e: React.MouseEvent | React.TouchEvent, username: string) => void;
  currentUser: string;
}

const UserList: React.FC<UserListProps> = ({ users, onClose, onUserClick, currentUser }) => {
  
  const uniqueUsers = Array.from(new Set(users)).sort((a, b) => a.localeCompare(b));

  const getRankInfo = (user: string) => {
    if (user === 'Admin') return { prefix: '&', color: 'text-red-700' };
    if (user === 'GeminiBot') return { prefix: '@', color: 'text-green-700' };
    return { prefix: '%', color: 'text-[#000080]' };
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto no-scrollbar font-mono select-none">
      <div className="flex flex-col">
        {uniqueUsers.map((user, idx) => {
          const rank = getRankInfo(user);
          const isMe = user === currentUser;
          
          return (
            <div 
              key={`${user}-${idx}`} 
              className={`flex items-center gap-0.5 px-1 py-1 hover:bg-blue-50 cursor-pointer border-b border-gray-50 group ${isMe ? 'bg-blue-50' : ''}`}
              onDoubleClick={(e) => onUserClick?.(e, user)}
              title={`${user} ile özel sohbet başlatmak için çift tıkla`}
            >
              <span className={`text-[10px] md:text-[11px] font-bold w-3 shrink-0 text-center ${rank.color}`}>{rank.prefix}</span>
              <span className={`text-[10px] md:text-[11px] font-bold truncate flex-1 ${isMe ? 'text-black' : rank.color} group-hover:underline`}>
                {user}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="mt-auto p-1 bg-gray-50 border-t border-gray-200 text-[8px] md:text-[9px] text-gray-500 font-bold uppercase text-center shrink-0">
         {uniqueUsers.length} ONLINE
      </div>
    </div>
  );
};

export default UserList;

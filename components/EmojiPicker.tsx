
import React from 'react';
import { X } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  // Resimdeki Geveze/mIRC emoji setini (10'lu gruplar halinde) simüle eden liste
  const emojiGroups = [
    ["😇", "😂", "😊", "😋", "😜", "😎", "🙄", "🤨", "😔", "😮"],
    ["😴", "🤮", "🥵", "🥶", "😱", "🥱", "😵", "🥴", "🤢", "🤕"],
    ["🤠", "❤️", "💔", "🐱", "🐶", "🐌", "🐏", "🌙", "⭐", "💡"],
    ["🌈", "☕", "🍷", "🍸", "🍹", "🍺", "🥂", "🥃", "🥤", "🧃"],
    ["🍎", "🍇", "🍕", "🍔", "🌭", "🌮", "🍣", "🍙", "🍦", "🍰"],
    ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🥋", "🥅"],
    ["🚗", "🚓", "🚕", "🚌", "🚑", "🚒", "🚐", "🚚", "🚜", "🚲"],
    ["📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🕹️", "💽", "💾", "💿"],
    ["⌚", "⏰", "⏱️", "⏲️", "⏳", "⌛", "🌡️", "☁️", "⛅", "⛈️"],
    ["🌩️", "🌦️", "🌧️", "🌨️", "🌬️", "🌪️", "🌫️", "🌬️", "🌀", "⛱️"]
  ];

  return (
    <div className="bg-white border-2 border-gray-400 shadow-[8px_8px_0px_rgba(0,0,0,0.2)] p-1 w-[260px] animate-in slide-in-from-bottom-2 duration-200">
      <div className="bg-[#000080] text-white text-[9px] font-black px-2 py-1 flex justify-between items-center mb-1">
        <span className="uppercase tracking-tighter">Emoji Seçici</span>
        <X size={12} className="cursor-pointer hover:bg-red-500" onClick={onClose} />
      </div>
      <div className="grid grid-cols-10 gap-px bg-gray-200 border border-gray-300">
        {emojiGroups.flat().map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(emoji)}
            className="w-6 h-6 flex items-center justify-center bg-white hover:bg-blue-100 transition-colors text-base"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="mt-1 bg-gray-100 p-1 text-[8px] text-gray-500 font-bold italic border-t border-gray-200 uppercase text-center">
        Workigom Klasik Emoji Paketi
      </div>
    </div>
  );
};

export default EmojiPicker;

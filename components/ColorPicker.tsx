
import React from 'react';

interface ColorPickerProps {
  onSelect: (color: string) => void;
  selectedColor: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ onSelect, selectedColor }) => {
  // Resimdeki standart mIRC renk paleti
  const colors = [
    '#000000', '#000080', '#008000', '#FF0000', '#800000', 
    '#800080', '#FF8C00', '#FFFF00', '#00FF00', '#008080', 
    '#00FFFF', '#0000FF', '#FF00FF', '#808080', '#C0C0C0'
  ];

  return (
    <div className="flex gap-1 p-1 bg-white border-2 border-gray-400 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] mb-1 animate-in slide-in-from-left-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          className={`w-4 h-5 border ${selectedColor === color ? 'border-white ring-2 ring-blue-500 z-10' : 'border-gray-300'} transition-transform hover:scale-110`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
      <button 
        type="button"
        onClick={() => onSelect('')}
        className="ml-1 px-1.5 text-[8px] font-black uppercase bg-gray-200 border border-gray-400 hover:bg-gray-300"
      >
        Sıfırla
      </button>
    </div>
  );
};

export default ColorPicker;

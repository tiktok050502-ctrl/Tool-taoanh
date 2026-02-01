import React from 'react';
import { AppMode } from '../types';
import { Watch, Shirt } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, setMode }) => {
  return (
    <div className="bg-gray-100/50 p-1 rounded-xl border border-gray-200 inline-flex relative">
      <button
        onClick={() => setMode(AppMode.JEWELRY)}
        className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
          currentMode === AppMode.JEWELRY
            ? 'bg-white text-black shadow-sm ring-1 ring-black/5'
            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
        }`}
      >
        <Watch className={`w-4 h-4 ${currentMode === AppMode.JEWELRY ? 'text-[#D4AF37]' : ''}`} />
        Trang sức & Mỹ phẩm
      </button>
      <button
        onClick={() => setMode(AppMode.FASHION)}
        className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
          currentMode === AppMode.FASHION
            ? 'bg-white text-black shadow-sm ring-1 ring-black/5'
            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
        }`}
      >
        <Shirt className={`w-4 h-4 ${currentMode === AppMode.FASHION ? 'text-[#D4AF37]' : ''}`} />
        Thời trang & Quần áo
      </button>
    </div>
  );
};
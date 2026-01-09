
import React, { useState, useEffect, useCallback } from 'react';
import { Folder, Music, Tv, ChevronUp, ChevronDown, PlayCircle } from 'lucide-react';
import { SkinConfig } from '../types';

interface WheelItem {
  id: string;
  label: string;
  type: string;
}

interface JukeboxWheelProps {
  items: WheelItem[];
  onSelect: (id: string) => void;
  skin: SkinConfig;
}

const JukeboxWheel: React.FC<JukeboxWheelProps> = ({ items, onSelect, skin }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemsCount = items.length;

  const navigate = useCallback((direction: 'up' | 'down') => {
    if (itemsCount === 0) return;
    setSelectedIndex(prev => {
      if (direction === 'up') return (prev - 1 + itemsCount) % itemsCount;
      return (prev + 1) % itemsCount;
    });
  }, [itemsCount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') navigate('up');
      if (e.key === 'ArrowDown') navigate('down');
      if (e.key === 'Enter') {
        const currentItem = items[selectedIndex];
        if (currentItem) onSelect(currentItem.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, selectedIndex, items, onSelect]);

  const getVisibleIndices = () => {
    if (itemsCount === 0) return [];
    const indices = [];
    for (let i = -4; i <= 4; i++) {
      const idx = (((selectedIndex + i) % itemsCount) + itemsCount) % itemsCount;
      indices.push(idx);
    }
    return indices;
  };

  if (itemsCount === 0) return null;

  const selectedItem = items[selectedIndex];

  return (
    <div className="relative w-full h-full flex items-center justify-between px-20 select-none overflow-hidden">
      <div className="hidden lg:flex flex-col w-1/3 space-y-6 animate-in slide-in-from-left duration-700">
        <div className={`p-8 ${skin.cardBg} rounded-3xl border-2 ${skin.border} ${skin.glow} relative overflow-hidden group`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-${skin.primary}`}></div>
            <div className="relative z-10">
                <p className={`text-${skin.primary} font-bold text-xs tracking-widest mb-2`}>SELECTED</p>
                <h2 className={`text-4xl font-['Bungee'] leading-tight mb-4 break-words`}>
                    {selectedItem?.label || "---"}
                </h2>
                <div className={`flex items-center gap-4 text-${skin.secondary} font-['Orbitron'] text-sm`}>
                    {selectedItem?.type === 'folder' ? <Folder size={20} /> : <Music size={20} />}
                    <span className="uppercase tracking-widest">{selectedItem?.type}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center h-full perspective-[2000px]">
        <div className={`absolute w-[110%] md:w-[700px] h-36 border-y-4 border-${skin.primary}/30 z-10 pointer-events-none left-1/2 -translate-x-1/2`}>
            <div className={`w-4 h-full bg-${skin.primary} ${skin.glow}`}></div>
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          {getVisibleIndices().map((idx, i) => {
            const item = items[idx];
            if (!item) return null;
            const isSelected = i === 4;
            const distance = Math.abs(i - 4);
            const scale = 1 - distance * 0.12;
            const opacity = 1 - distance * 0.22;
            const xOffset = Math.pow(distance, 1.8) * 35;

            return (
              <div 
                key={`${item.id}-${idx}`}
                onClick={() => isSelected ? onSelect(item.id) : setSelectedIndex(idx)}
                className={`
                  group relative flex items-center gap-8 px-12 py-7 w-[90%] md:w-[650px] cursor-pointer
                  transition-all duration-300 transform origin-right rounded-l-full
                  ${isSelected 
                    ? `bg-gradient-to-r from-${skin.primary} to-${skin.secondary} z-30 shadow-xl border-r-8 border-white scale-110` 
                    : `bg-${skin.primary}/5 hover:bg-${skin.primary}/10 border-r-4 border-${skin.primary}/20`}
                `}
                style={{
                  transform: `translateX(${xOffset}px) scale(${scale})`,
                  opacity: opacity,
                  zIndex: 20 - distance
                }}
              >
                <div className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center shrink-0
                  ${isSelected ? 'bg-white text-black' : `bg-gray-800 text-${skin.primary}/50`}
                `}>
                  {item.type === 'folder' && <Folder size={36} />}
                  {item.type === 'audio' && <Music size={36} />}
                  {item.type === 'video' && <Tv size={36} />}
                </div>

                <div className="flex-1 overflow-hidden">
                  <h3 className={`truncate font-['Orbitron'] font-bold tracking-[0.1em] uppercase ${isSelected ? 'text-white' : ''}`}>
                    {item.label}
                  </h3>
                </div>

                {isSelected && (
                  <div className={`w-12 h-12 bg-white rounded-full flex items-center justify-center text-${skin.primary} shadow-xl`}>
                      <PlayCircle size={32} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-40">
        <button onClick={() => navigate('up')} className={`w-20 h-20 rounded-full bg-black border-4 border-${skin.primary} flex items-center justify-center text-${skin.primary} hover:bg-${skin.primary} hover:text-black transition-all shadow-lg`}>
            <ChevronUp size={40} />
        </button>
        <button onClick={() => navigate('down')} className={`w-20 h-20 rounded-full bg-black border-4 border-${skin.secondary} flex items-center justify-center text-${skin.secondary} hover:bg-${skin.secondary} hover:text-black transition-all shadow-lg`}>
            <ChevronDown size={40} />
        </button>
      </div>
    </div>
  );
};

export default JukeboxWheel;

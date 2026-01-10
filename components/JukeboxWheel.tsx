
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, Music, ChevronUp, ChevronDown, Film, PlayCircle } from 'lucide-react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemsCount = items.length;

  const navigate = useCallback((dir: 'up' | 'down') => {
    if (itemsCount === 0) return;
    setSelectedIndex(prev => (dir === 'up' ? (prev - 1 + itemsCount) : (prev + 1)) % itemsCount);
  }, [itemsCount]);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); navigate('up'); }
      if (e.key === 'ArrowDown') { e.preventDefault(); navigate('down'); }
      if (e.key === 'Enter') { e.preventDefault(); if (items[selectedIndex]) onSelect(items[selectedIndex].id); }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [navigate, selectedIndex, items, onSelect]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeItem = container.children[selectedIndex] as HTMLElement;
      if (activeItem) {
        const targetScroll = activeItem.offsetTop - (container.offsetHeight / 2) + (activeItem.offsetHeight / 2);
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (itemsCount === 0) return (
    <div className="flex-1 flex items-center justify-center opacity-20 font-['Orbitron'] text-xs tracking-[0.3em] uppercase">
      No hay archivos en esta categoría
    </div>
  );

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center bg-black/20 overflow-hidden touch-none">
      
      {/* SECTOR DE ENFOQUE */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
         <div className={`w-full h-[80px] md:h-[100px] bg-gradient-to-r from-transparent via-${skin.primary}/10 to-transparent opacity-50`}></div>
      </div>

      {/* PLAYLIST SCROLLABLE */}
      <div 
        ref={scrollContainerRef}
        className="w-full h-full overflow-y-auto py-[40vh] md:py-[45vh] no-scrollbar scroll-smooth relative z-10"
      >
        {items.map((item, idx) => {
          const isSelected = selectedIndex === idx;
          const isVideo = item.type === 'video';
          
          return (
            <div 
              key={`${item.id}-${idx}`}
              onClick={() => {
                if (isSelected) onSelect(item.id);
                else setSelectedIndex(idx);
              }}
              className={`
                relative h-[80px] md:h-[100px] flex items-center px-6 md:px-32 gap-4 md:gap-8 cursor-pointer
                transition-all duration-500 group
                ${isSelected 
                  ? `${isVideo ? 'text-cyan-400' : `text-${skin.primary}`} scale-105 md:scale-110` 
                  : 'text-zinc-700 hover:text-zinc-500 scale-90 md:scale-90'}
              `}
            >
              <div className="flex flex-col items-center min-w-[30px] md:min-w-[40px]">
                <span className={`font-mono text-[9px] md:text-[10px] ${isSelected ? 'opacity-100' : 'opacity-20'} hidden sm:block mb-1`}>
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                {isVideo && isSelected && <span className="text-[7px] font-black bg-cyan-500 text-black px-1 rounded animate-pulse">4K</span>}
              </div>

              <div className={`transition-transform duration-500 ${isSelected ? 'scale-125 rotate-6' : 'opacity-30'}`}>
                {item.type === 'folder' ? <Folder size={22} /> : isVideo ? <Film size={22} /> : <Music size={22} />}
              </div>

              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                <div className="flex items-center">
                  <h3 className={`
                    truncate font-['Orbitron'] uppercase tracking-[0.2em] md:tracking-[0.4em] font-black transition-all
                    ${isSelected ? 'text-xl md:text-3xl drop-shadow-[0_0_15px_currentColor]' : 'text-sm md:text-xl'}
                  `}>
                    {item.label}
                  </h3>
                  
                  {isSelected && !isVideo && (
                    <div className="flex items-end gap-1 h-3 md:h-4 ml-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`w-[2px] md:w-[3px] bg-current animate-eq-${i}`}></div>
                      ))}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <span className={`text-[8px] md:text-[10px] mt-1 font-bold tracking-widest ${isVideo ? 'text-cyan-600' : 'opacity-40'}`}>
                    {isVideo ? 'MODO CINE DISPONIBLE' : 'HI-FI AUDIO QUALITY'}
                  </span>
                )}
              </div>

              {isSelected && (
                <div className={`flex items-center gap-2 md:gap-3 text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] animate-pulse`}>
                  <PlayCircle size={16} />
                  <span className="hidden xs:inline">{isVideo ? 'VER' : 'OIR'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CONTROLES LATERALES */}
      <div className="absolute right-4 md:right-12 flex flex-col gap-4 md:gap-6 z-20">
        <button onClick={() => navigate('up')} className={`p-4 md:p-5 bg-zinc-900/60 rounded-full border border-white/5 text-${skin.primary} hover:bg-zinc-800 transition-all shadow-2xl backdrop-blur-md`}><ChevronUp size={28} /></button>
        <button onClick={() => navigate('down')} className={`p-4 md:p-5 bg-zinc-900/60 rounded-full border border-white/5 text-${skin.primary} hover:bg-zinc-800 transition-all shadow-2xl backdrop-blur-md`}><ChevronDown size={28} /></button>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes eq-1 { 0%, 100% { height: 4px; } 50% { height: 16px; } }
        @keyframes eq-2 { 0%, 100% { height: 16px; } 50% { height: 8px; } }
        @keyframes eq-3 { 0%, 100% { height: 10px; } 50% { height: 14px; } }
        @keyframes eq-4 { 0%, 100% { height: 6px; } 50% { height: 12px; } }
        .animate-eq-1 { animation: eq-1 0.5s infinite; }
        .animate-eq-2 { animation: eq-2 0.7s infinite; }
        .animate-eq-3 { animation: eq-3 0.6s infinite; }
        .animate-eq-4 { animation: eq-4 0.8s infinite; }
      `}</style>
    </div>
  );
};

export default JukeboxWheel;

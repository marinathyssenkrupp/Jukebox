
import React from 'react';

interface PixelArtStageProps {
  genre: string;
  isPlaying: boolean;
  skinColor: string;
}

const PixelArtStage: React.FC<PixelArtStageProps> = ({ genre, isPlaying, skinColor }) => {
  const g = genre.toLowerCase();

  // Mapeo de géneros a tipos de animación
  const getAnimationType = () => {
    if (g.includes('cumbia') || g.includes('tropical') || g.includes('salsa')) return 'cumbia';
    if (g.includes('rock') || g.includes('metal') || g.includes('punk')) return 'rock';
    if (g.includes('pop') || g.includes('dance')) return 'pop';
    if (g.includes('techno') || g.includes('electronic') || g.includes('disco')) return 'techno';
    if (g.includes('jazz') || g.includes('blues')) return 'jazz';
    return 'generic';
  };

  const type = getAnimationType();

  return (
    <div className={`relative w-full h-32 bg-black/40 border-t border-white/5 overflow-hidden flex items-end justify-center gap-4 p-2 transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-40'}`}>
      
      {/* Background Lights */}
      <div className={`absolute inset-0 opacity-20 pointer-events-none`}>
        <div className={`absolute inset-0 bg-gradient-to-t from-${skinColor}/40 to-transparent animate-pulse`}></div>
      </div>

      {/* RENDERIZADO POR TIPO */}
      {type === 'cumbia' && (
        <div className="flex items-end gap-6 animate-bounce-slow">
          {/* Acordeonista Pixel */}
          <div className="w-12 h-16 bg-yellow-600 relative rounded-sm shadow-[4px_0_0_#442200]">
             <div className="absolute -top-4 left-2 w-8 h-8 bg-pink-200 rounded-sm"></div> {/* Cabeza */}
             <div className={`absolute top-4 -left-2 w-14 h-6 bg-white border-2 border-black ${isPlaying ? 'animate-accordion' : ''}`}></div> {/* Acordeón */}
          </div>
          {/* Güirista Pixel */}
          <div className="w-12 h-16 bg-green-700 relative rounded-sm shadow-[4px_0_0_#113311]">
             <div className="absolute -top-4 left-2 w-8 h-8 bg-pink-200 rounded-sm"></div>
             <div className={`absolute top-4 left-0 w-10 h-8 bg-zinc-400 rounded-full ${isPlaying ? 'animate-shake' : ''}`}></div> {/* Güiro */}
          </div>
        </div>
      )}

      {type === 'rock' && (
        <div className="flex items-end gap-8">
          {/* Guitarrista */}
          <div className={`w-10 h-20 bg-zinc-800 relative ${isPlaying ? 'animate-headbang' : ''}`}>
             <div className="absolute -top-6 left-1 w-8 h-8 bg-zinc-300 rounded-sm"></div>
             <div className="absolute top-6 -left-4 w-16 h-4 bg-red-600 -rotate-12"></div> {/* Guitarra */}
          </div>
          {/* Baterista (Simplificado) */}
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 bg-zinc-300 mb-1`}></div>
            <div className="flex gap-1">
              <div className={`w-10 h-10 bg-zinc-600 rounded-t-lg ${isPlaying ? 'animate-kick' : ''}`}></div>
              <div className={`w-8 h-4 bg-yellow-500 mt-4 ${isPlaying ? 'animate-cymbal' : ''}`}></div>
            </div>
          </div>
        </div>
      )}

      {type === 'pop' && (
        <div className="flex items-end gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`w-8 h-16 bg-gradient-to-t from-purple-500 to-pink-400 rounded-t-full ${isPlaying ? 'animate-dance' : ''}`} style={{ animationDelay: `${i * 0.2}s` }}>
               <div className="w-6 h-6 bg-pink-200 rounded-full -mt-4 mx-auto"></div>
            </div>
          ))}
        </div>
      )}

      {type === 'techno' && (
        <div className="w-full flex flex-col items-center">
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className={`w-4 h-12 bg-cyan-500/20 relative overflow-hidden`}>
                <div className={`absolute bottom-0 w-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] ${isPlaying ? 'animate-laser' : ''}`} style={{ height: '40%', animationDelay: `${i * 0.1}s` }}></div>
              </div>
            ))}
          </div>
          <div className="w-48 h-10 bg-zinc-800 border-2 border-zinc-700 rounded-t-lg flex justify-around p-1">
             <div className={`w-8 h-8 bg-black rounded-full border border-white/20 ${isPlaying ? 'animate-spin-slow' : ''}`}></div>
             <div className={`w-8 h-8 bg-black rounded-full border border-white/20 ${isPlaying ? 'animate-spin-slow' : ''}`}></div>
          </div>
        </div>
      )}

      {type === 'jazz' && (
        <div className="flex items-end gap-10">
          {/* Saxofonista */}
          <div className="w-10 h-20 bg-blue-900 relative">
             <div className="absolute -top-6 left-1 w-8 h-8 bg-pink-200 rounded-sm"></div>
             <div className={`absolute top-4 left-6 w-8 h-12 bg-yellow-500 rounded-bl-full border-r-4 border-yellow-600 ${isPlaying ? 'animate-sway' : ''}`}></div>
          </div>
          {/* Contrabajista */}
          <div className="w-8 h-24 bg-amber-900 relative rounded-full">
             <div className="absolute top-2 left-2 w-4 h-20 bg-amber-950"></div>
          </div>
        </div>
      )}

      {type === 'generic' && (
        <div className="flex items-end gap-4 opacity-60">
           <div className={`w-12 h-16 bg-zinc-700 rounded-t-lg ${isPlaying ? 'animate-pulse' : ''}`}></div>
           <div className={`w-16 h-20 bg-zinc-600 rounded-t-lg ${isPlaying ? 'animate-pulse' : ''}`}></div>
           <div className={`w-12 h-16 bg-zinc-700 rounded-t-lg ${isPlaying ? 'animate-pulse' : ''}`}></div>
        </div>
      )}

      <style>{`
        @keyframes accordion { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(0.6); } }
        @keyframes shake { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-5px) rotate(10deg); } }
        @keyframes headbang { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(15deg); } }
        @keyframes kick { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes cymbal { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-5deg); } }
        @keyframes dance { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes laser { 0%, 100% { height: 10%; } 50% { height: 90%; } }
        @keyframes sway { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
        .animate-bounce-slow { animation: bounce 2s infinite; }
      `}</style>
    </div>
  );
};

export default PixelArtStage;


import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MediaFile, SkinConfig } from '../types';
import { Play, Pause, SkipForward, SkipBack, Volume2, X, SlidersHorizontal, ArrowLeft, Brain, Wand2, Activity, Plus, Minus } from 'lucide-react';
import ImageGenerator from './ImageGenerator';
import VisualizerXP from './VisualizerXP';
import { GoogleGenAI } from "@google/genai";

interface MediaPlayerProps {
  media: MediaFile;
  playlist: MediaFile[];
  onClose: () => void;
  skin: SkinConfig;
  onNext: () => void;
  onPrevious: () => void;
  onUpdateMedia: (mediaId: string, updates: Partial<MediaFile>) => void;
}

type EQPreset = 'Flat' | 'Rock' | 'Pop' | 'Jazz' | 'Electronic' | 'Classical';

const EQ_BANDS = [60, 230, 910, 4000, 14000];
const PRESETS: Record<EQPreset, number[]> = {
  Flat: [0, 0, 0, 0, 0],
  Rock: [5, 3, -1, 3, 5],
  Pop: [-1, 2, 5, 1, -2],
  Jazz: [4, 2, 1, 2, 2],
  Electronic: [6, 4, 0, 2, 4],
  Classical: [5, 3, 0, 3, 5]
};

const MediaPlayer: React.FC<MediaPlayerProps> = ({ 
  media, playlist, onClose, skin, onNext, onPrevious, onUpdateMedia
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<EQPreset>('Flat');
  const [eqGains, setEqGains] = useState<number[]>([...PRESETS.Flat]);
  const [smartInfo, setSmartInfo] = useState<string | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  
  const idleTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = media.type === 'video' ? videoRef : audioRef;
  const isVideo = media.type === 'video';
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (isIdle) setIsIdle(false);
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    
    if (isPlaying) {
      idleTimerRef.current = window.setTimeout(() => {
        setIsIdle(true);
      }, 5000);
    }
  }, [isPlaying, isIdle]);

  const setupAudio = () => {
    if (!audioContextRef.current && activeRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 256;
      analyzerRef.current = analyzer;

      const filters = EQ_BANDS.map(freq => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.2;
        filter.gain.value = 0;
        return filter;
      });
      filterNodesRef.current = filters;

      const source = ctx.createMediaElementSource(activeRef.current as HTMLMediaElement);
      
      let lastNode: AudioNode = source;
      filters.forEach(filter => {
        lastNode.connect(filter);
        lastNode = filter;
      });
      lastNode.connect(analyzer);
      analyzer.connect(ctx.destination);
      
      applyPreset(selectedPreset);
    }
  };

  const applyPreset = (name: EQPreset) => {
    setSelectedPreset(name);
    const gains = PRESETS[name];
    setEqGains(gains);
    if (audioContextRef.current) {
      filterNodesRef.current.forEach((filter, i) => {
        filter.gain.setTargetAtTime(gains[i], audioContextRef.current!.currentTime, 0.1);
      });
    }
  };

  const handleGainChange = (index: number, val: number) => {
    const newGains = [...eqGains];
    newGains[index] = val;
    setEqGains(newGains);
    setSelectedPreset('Flat');
    if (audioContextRef.current && filterNodesRef.current[index]) {
      filterNodesRef.current[index].gain.setTargetAtTime(val, audioContextRef.current!.currentTime, 0.1);
    }
  };

  const getSmartTrivia = async () => {
    setIsLoadingInfo(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Provide a short, 2-sentence interesting trivia about the song, movie, or artist: "${media.name}". Use a friendly jukebox host tone.`,
      });
      setSmartInfo(response.text || "¡Disfruta del contenido!");
    } catch (err) {
      setSmartInfo("¡Disfruta de la reproducción!");
    } finally {
      setIsLoadingInfo(false);
    }
  };

  useEffect(() => {
    if (activeRef.current) {
      if (isPlaying) activeRef.current.play().catch(() => setIsPlaying(false));
      else activeRef.current.pause();
      activeRef.current.volume = volume / 100;
    }
    resetIdleTimer();
  }, [isPlaying, media.id, volume, resetIdleTimer]);

  useEffect(() => {
    const handleEvents = () => resetIdleTimer();
    const handleKeys = (e: KeyboardEvent) => {
      resetIdleTimer();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(!isPlaying); }
    };
    
    window.addEventListener('keydown', handleKeys);
    window.addEventListener('mousemove', handleEvents);
    window.addEventListener('mousedown', handleEvents);
    window.addEventListener('touchstart', handleEvents);
    window.addEventListener('wheel', handleEvents);

    return () => {
      window.removeEventListener('keydown', handleKeys);
      window.removeEventListener('mousemove', handleEvents);
      window.removeEventListener('mousedown', handleEvents);
      window.removeEventListener('touchstart', handleEvents);
      window.removeEventListener('wheel', handleEvents);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [isPlaying, onClose, resetIdleTimer]);

  useEffect(() => {
    window.addEventListener('click', setupAudio, { once: true });
  }, []);

  const themeRGB = skin.primary === 'zinc-100' ? '255, 255, 255' : 
                   skin.primary === 'green-500' ? '34, 197, 94' : 
                   skin.primary === 'orange-500' ? '249, 115, 22' : '255, 255, 255';

  return (
    <div 
      className={`flex flex-col h-full transition-all duration-1000 ${isVideo ? 'bg-black' : 'bg-[#0a0502]'} text-white font-['Inter'] relative select-none overflow-hidden ${isIdle ? 'cursor-none' : 'cursor-default'}`}
      style={{ '--skin-primary-rgb': `rgb(${themeRGB})` } as React.CSSProperties}
    >
      
      {/* VISUALIZADOR XP - OCUPAR TODO EL FONDO */}
      {!isVideo && (
        <VisualizerXP 
          analyzer={analyzerRef.current} 
          color={`rgb(${themeRGB})`}
          isPlaying={isPlaying} 
        />
      )}

      {/* AMBIENT GLOW */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isIdle ? 'opacity-30' : 'opacity-100'}`}>
        <div 
          className={`absolute top-0 left-0 w-full h-full blur-3xl opacity-20 ${isPlaying ? 'animate-ambient-pulse' : ''}`}
          style={{ backgroundImage: `radial-gradient(circle at 50% 50%, rgba(${themeRGB}, 0.15) 0%, transparent 80%)` }}
        ></div>
      </div>

      {/* MAIN LAYOUT */}
      <div className={`flex-1 flex flex-col md:flex-row z-10 p-4 transition-all duration-1000 ${isIdle ? 'p-0' : 'md:p-12 gap-8'}`}>
        
        {/* MEDIA DISPLAY (VIDEO / CARÁTULA) */}
        <div className={`flex flex-col justify-center transition-all duration-1000 ${isIdle ? 'w-full h-full' : 'flex-1'}`}>
          <div className={`relative w-full h-full transition-all duration-1000 ${isIdle ? 'max-w-none' : 'max-w-5xl self-center'}`}>
            {isVideo ? (
              <div className={`relative w-full h-full overflow-hidden transition-all duration-1000 ${isIdle ? 'rounded-0' : 'rounded-3xl border-2 border-white/5 shadow-2xl bg-black'}`}>
                <video 
                  ref={videoRef} 
                  src={media.url} 
                  className="w-full h-full object-contain"
                  onTimeUpdate={() => setProgress(videoRef.current?.currentTime || 0)} 
                  onEnded={onNext}
                  autoPlay
                />
              </div>
            ) : (
              <div className="relative flex flex-col items-center justify-center h-full">
                <div className={`relative transition-all duration-1000 ${isIdle ? 'scale-[1.8] md:scale-[2.5] opacity-20 blur-sm' : 'scale-100'}`}>
                  {/* Disco Giratorio */}
                  <div className={`relative bg-zinc-800 rounded-full shadow-[0_0_100px_rgba(0,0,0,0.8)] p-2 transition-all duration-1000`}>
                    <div className="w-64 h-64 md:w-96 md:h-96 rounded-full overflow-hidden border-[12px] border-black/90 relative">
                       <div className="absolute inset-0 bg-[repeating-radial-gradient(circle,transparent,transparent_2px,rgba(255,255,255,0.05)_3px)]"></div>
                       <img 
                        src={media.customCoverUrl || media.coverUrl} 
                        className={`w-full h-full object-cover transition-transform duration-[8s] linear infinite ${isPlaying ? 'rotate-disk' : ''}`} 
                        alt="Cover"
                      />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-zinc-900 rounded-full border-4 border-black flex items-center justify-center">
                        <div className="w-6 h-6 bg-black rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info en modo Cinema */}
                <div className={`absolute text-center transition-all duration-1000 ${isIdle ? 'opacity-100 translate-y-0 scale-125' : 'opacity-0 translate-y-20 scale-90'}`}>
                  <h2 className="text-4xl md:text-7xl font-['Bungee'] text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">{media.name}</h2>
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <div className={`h-[2px] w-20 bg-gradient-to-r from-transparent to-${skin.primary}`}></div>
                    <p className={`text-lg font-['Orbitron'] tracking-[0.8em] uppercase text-${skin.primary}`}>IMMERSIVE HI-FI</p>
                    <div className={`h-[2px] w-20 bg-gradient-to-l from-transparent to-${skin.primary}`}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* ACCIONES FLOTANTES (HIDE IN IDLE) */}
            <div className={`absolute top-4 right-4 flex flex-col gap-4 transition-all duration-700 ${isIdle ? 'opacity-0 -translate-y-20' : 'opacity-100 group-hover:scale-105'} z-20`}>
              {!isVideo && (
                <button onClick={(e) => { e.stopPropagation(); setShowGenerator(true); }} className="p-4 bg-white/10 backdrop-blur-3xl text-white rounded-2xl shadow-2xl hover:bg-white hover:text-black transition-all">
                  <Wand2 size={24} />
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); getSmartTrivia(); }} className={`p-4 ${isVideo ? 'bg-cyan-500' : `bg-${skin.primary}`} text-black rounded-2xl shadow-2xl hover:scale-110 transition-all`}>
                <Brain size={24} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowEq(!showEq); }} className={`p-4 bg-zinc-800 text-white rounded-2xl shadow-2xl hover:scale-110 transition-all`}>
                <Activity size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* CONTROLES DERECHA (HIDE IN IDLE) */}
        <div className={`flex flex-col justify-center gap-10 md:max-w-md transition-all duration-1000 ${isIdle ? 'opacity-0 translate-x-40 w-0 overflow-hidden' : 'flex-1 opacity-100 translate-x-0'}`}>
          <div className="space-y-4">
            <h4 className={`text-xs font-black uppercase tracking-[0.5em] ${isVideo ? 'text-cyan-500' : `text-${skin.primary}`} opacity-60`}>
              {isVideo ? 'BROADCASTING 4K' : 'HI-FI PHONOGRAPH'}
            </h4>
            <h2 className="text-4xl md:text-6xl font-['Bungee'] tracking-tight leading-tight drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">{media.name}</h2>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 rounded-[48px] p-10 shadow-2xl flex flex-col items-center">
            <div className={`text-6xl md:text-8xl font-['Orbitron'] ${isVideo ? 'text-cyan-400' : `text-${skin.primary}`} drop-shadow-[0_0_30px_currentColor] mb-8`}>
              {Math.floor(progress / 60).toString().padStart(2, '0')}:{(Math.floor(progress) % 60).toString().padStart(2, '0')}
            </div>
            
            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
               <div className={`h-full ${isVideo ? 'bg-cyan-400' : `bg-${skin.primary}`} shadow-[0_0_20px_currentColor] transition-all duration-300`} style={{ width: `${(progress / (activeRef.current?.duration || 1)) * 100}%` }}></div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-6">
            <button onClick={onPrevious} className="group relative w-16 h-16 bg-zinc-800/80 rounded-[20px] border-b-4 border-black hover:bg-zinc-700 transition-all flex items-center justify-center">
              <SkipBack fill="white" size={24} />
            </button>

            <button onClick={() => setIsPlaying(!isPlaying)} className={`group relative w-24 h-24 ${isVideo ? 'bg-cyan-500' : `bg-${skin.primary}`} rounded-[28px] border-b-4 border-black/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-black shadow-2xl overflow-hidden`}>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:animate-ping pointer-events-none"></div>
              {isPlaying ? <Pause size={42} fill="black" /> : <Play size={42} fill="black" className="ml-2" />}
            </button>

            <button onClick={onNext} className="group relative w-16 h-16 bg-zinc-800/80 rounded-[20px] border-b-4 border-black hover:bg-zinc-700 transition-all flex items-center justify-center">
              <SkipForward fill="white" size={24} />
            </button>

            <button onClick={onClose} className="w-16 h-16 bg-zinc-900/80 text-white rounded-[20px] border-b-4 border-black hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center">
              <ArrowLeft size={24} />
            </button>
          </div>

          {/* VOLUMEN */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 opacity-40">
                <Volume2 size={20} className={isVideo ? 'text-cyan-400' : `text-${skin.primary}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Amplifier Gain</span>
              </div>
              <div className={`font-['Orbitron'] text-4xl ${isVideo ? 'text-cyan-400' : `text-${skin.primary}`} drop-shadow-[0_0_15px_currentColor]`}>
                {volume.toString().padStart(3, '0')}
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-black/60 p-5 rounded-[28px] border border-white/5">
              <button onClick={() => setVolume(v => Math.max(0, v - 5))} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                <Minus size={22} />
              </button>
              <div className="flex-1 h-3.5 bg-zinc-900 rounded-full relative overflow-hidden">
                <div className={`h-full ${isVideo ? 'bg-cyan-400' : `bg-${skin.primary}`} shadow-[0_0_20px_currentColor] transition-all`} style={{ width: `${volume}%` }} />
                <input type="range" min="0" max="100" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} />
              </div>
              <button onClick={() => setVolume(v => Math.min(100, v + 5))} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                <Plus size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={!isVideo ? media.url : undefined} onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)} onEnded={onNext} autoPlay={!isVideo} />

      {/* MODALS */}
      {showEq && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className={`w-full max-w-3xl bg-zinc-900 border-2 ${isVideo ? 'border-cyan-500/40' : `border-${skin.primary}/40`} rounded-[50px] overflow-hidden shadow-2xl`}>
            <div className="p-8 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-widest font-['Orbitron']">MASTER EQUALIZER</h2>
              <button onClick={() => setShowEq(false)} className="p-3 hover:text-red-500 transition-all"><X size={32} /></button>
            </div>
            <div className="p-12 space-y-12">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {(Object.keys(PRESETS) as EQPreset[]).map((p) => (
                  <button key={p} onClick={() => applyPreset(p)} className={`py-4 text-[11px] font-black uppercase rounded-[20px] border transition-all ${selectedPreset === p ? `${isVideo ? 'bg-cyan-500 text-black' : `bg-${skin.primary} text-black`}` : 'bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-end h-72 px-8">
                {EQ_BANDS.map((freq, i) => (
                  <div key={freq} className="flex flex-col items-center gap-8 h-full">
                    <div className="relative flex-1 w-12 flex justify-center">
                      <input type="range" min="-12" max="12" step="0.5" value={eqGains[i]} onChange={(e) => handleGainChange(i, parseFloat(e.target.value))} className="absolute inset-0 w-72 h-12 -rotate-90 origin-center translate-y-32 bg-transparent appearance-none cursor-pointer z-10" />
                      <div className="w-2 h-full bg-black rounded-full border border-white/5 overflow-hidden flex flex-col justify-end">
                        <div className={`w-full ${isVideo ? 'bg-cyan-400' : `bg-${skin.primary}`} shadow-[0_0_20px_currentColor] transition-all`} style={{ height: `${((eqGains[i] + 12) / 24) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-zinc-500">{freq >= 1000 ? `${freq/1000}k` : freq}Hz</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenerator && <ImageGenerator skin={skin} currentImageUrl={media.customCoverUrl || media.coverUrl} onClose={() => setShowGenerator(false)} onGenerated={(url) => onUpdateMedia(media.id, { customCoverUrl: url })} />}

      <style>{`
        @keyframes ambient-pulse { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
        .rotate-disk { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 24px; height: 24px; background: white; border-radius: 50%; cursor: pointer; border: 4px solid black; box-shadow: 0 0 10px rgba(255,255,255,0.5); }
      `}</style>
    </div>
  );
};

export default MediaPlayer;

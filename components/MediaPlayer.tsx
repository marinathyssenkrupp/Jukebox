
import React, { useState, useRef, useEffect } from 'react';
import { MediaFile, SkinConfig } from '../types';
import { Play, Pause, SkipForward, SkipBack, X, Volume2, RotateCcw, Info, ExternalLink, Sparkles, Disc } from 'lucide-react';

interface MediaPlayerProps {
  media: MediaFile;
  onClose: () => void;
  isLoadingMetadata?: boolean;
  onRefreshMetadata?: () => void;
  skin: SkinConfig;
  onNext: () => void;
  onPrevious: () => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ 
  media, 
  onClose, 
  isLoadingMetadata, 
  onRefreshMetadata, 
  skin,
  onNext,
  onPrevious
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const activeRef = media.type === 'video' ? videoRef : audioRef;

  // Reset state when media changes
  useEffect(() => {
    setIsPlaying(true);
    setProgress(0);
  }, [media]);

  useEffect(() => {
    if (activeRef.current) {
      if (isPlaying) activeRef.current.play().catch(e => console.error(e));
      else activeRef.current.pause();
    }
  }, [isPlaying, media]);

  useEffect(() => {
    if (activeRef.current) activeRef.current.volume = volume / 100;
  }, [volume, media]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleTimeUpdate = () => {
    if (activeRef.current) {
      setProgress((activeRef.current.currentTime / (activeRef.current.duration || 1)) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = (Number(e.target.value) / 100) * (activeRef.current?.duration || 0);
    if (activeRef.current) activeRef.current.currentTime = seekTo;
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative flex flex-col md:flex-row h-full font-['Inter']`}>
      <div className={`w-full md:w-80 bg-black/40 border-r border-${skin.primary}/10 flex flex-col p-6 space-y-8 overflow-y-auto`}>
        <div className="flex justify-between items-start">
            <div className={`w-12 h-12 rounded-xl bg-${skin.primary} flex items-center justify-center text-black`}>
                <Info size={24} />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-50 hover:opacity-100">
                <X size={24} />
            </button>
        </div>

        <div>
            <h4 className={`text-[10px] text-${skin.primary} font-bold uppercase tracking-[0.3em] mb-2`}>INFO</h4>
            <h2 className="text-2xl font-['Bungee'] leading-tight mb-4">{media.name}</h2>
            <div className="space-y-4">
                {isLoadingMetadata ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    </div>
                ) : media.metadata ? (
                    <>
                        <p className="text-sm opacity-60 italic leading-relaxed">{media.metadata.description}</p>
                        <div className="pt-4 border-t border-white/10">
                            {media.metadata.searchUrls?.slice(0, 2).map((url, i) => (
                                <a key={i} href={url.uri} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-3 bg-white/5 rounded-lg border border-${skin.primary}/10 hover:border-${skin.primary} transition-all mb-2`}>
                                    <span className="text-xs truncate mr-2">{url.title}</span>
                                    <ExternalLink size={14} />
                                </a>
                            ))}
                        </div>
                    </>
                ) : (
                    <button onClick={onRefreshMetadata} className={`w-full flex items-center justify-center gap-2 py-3 bg-${skin.primary}/20 text-${skin.primary} border border-${skin.primary}/40 rounded-xl hover:bg-${skin.primary}/40 transition-all text-xs font-bold uppercase tracking-widest`}>
                        <Sparkles size={16} /> ANALYZE MEDIA
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative bg-black/60">
        <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.05)_0%,_transparent_70%)] pointer-events-none`}></div>

            {media.type === 'video' ? (
                <div className="w-full h-full max-w-4xl relative">
                    <video 
                      ref={videoRef} 
                      src={media.url} 
                      className="w-full h-full object-contain rounded-[30px] shadow-2xl bg-black" 
                      onTimeUpdate={handleTimeUpdate} 
                      onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} 
                      onEnded={onNext} 
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] pointer-events-none rounded-[30px] bg-[length:100%_4px]"></div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-12">
                    <div className={`relative w-72 h-72 md:w-96 md:h-96 rounded-full border-8 border-white/5 bg-black flex items-center justify-center shadow-2xl ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="absolute rounded-full border border-white/[0.03]" style={{ inset: `${i * 12 + 10}px` }}></div>
                        ))}
                        <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-${skin.primary} to-${skin.secondary} flex flex-col items-center justify-center p-6 text-center text-black`}>
                            <Disc size={40} className="mb-2" />
                            <span className="text-[8px] font-bold uppercase tracking-tighter leading-none">{media.name}</span>
                        </div>
                    </div>
                    <audio 
                      ref={audioRef} 
                      src={media.url} 
                      onTimeUpdate={handleTimeUpdate} 
                      onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} 
                      onEnded={onNext} 
                    />
                </div>
            )}
        </div>

        <div className={`h-32 bg-black/80 border-t-2 border-${skin.primary}/10 px-10 flex flex-col justify-center`}>
            <div className="flex items-center gap-6 mb-4">
                <span className={`text-[10px] font-['Orbitron'] text-${skin.primary} w-12`}>{formatTime(activeRef.current?.currentTime || 0)}</span>
                <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className={`flex-1 h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-${skin.primary}`} />
                <span className="text-[10px] font-['Orbitron'] opacity-40 w-12">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <button onClick={onPrevious} className="opacity-70 hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"><SkipBack size={32} /></button>
                    <button onClick={togglePlay} className={`w-16 h-16 rounded-2xl bg-${skin.primary} flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-95 transition-all`}>
                        {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={onNext} className="opacity-70 hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"><SkipForward size={32} /></button>
                </div>
                <div className="flex items-center gap-3">
                    <Volume2 size={20} className={`text-${skin.secondary}`} />
                    <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className={`w-32 h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-${skin.secondary}`} />
                    <button onClick={() => { if (activeRef.current) activeRef.current.currentTime = 0; }} className="p-3 hover:bg-white/5 rounded-xl transition-colors opacity-40">
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;

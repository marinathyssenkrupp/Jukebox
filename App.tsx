
import React, { useState, useEffect, useMemo } from 'react';
import { MediaFile, FolderGroup, SkinId, SkinConfig, MediaType } from './types';
import JukeboxWheel from './components/JukeboxWheel';
import MediaPlayer from './components/MediaPlayer';
import { Upload, Disc, Palette, Shuffle, FolderOpen, Film, Music, Layers } from 'lucide-react';

const SKINS: Record<string, SkinConfig> = {
  obsidian: {
    id: 'obsidian' as SkinId,
    name: 'Negro Obsidian',
    primary: 'zinc-100',
    secondary: 'zinc-500',
    accent: 'zinc-900',
    bg: 'bg-black',
    cardBg: 'bg-zinc-900/50',
    border: 'border-zinc-800',
    text: 'text-zinc-100',
    glow: 'shadow-[0_0_30px_rgba(255,255,255,0.05)]'
  },
  emerald: {
    id: 'emerald' as SkinId,
    name: 'Verde Matrix',
    primary: 'green-500',
    secondary: 'emerald-900',
    accent: 'black',
    bg: 'bg-[#020502]',
    cardBg: 'bg-black/80',
    border: 'border-green-500/30',
    text: 'text-green-50',
    glow: 'shadow-[0_0_30px_rgba(34,197,94,0.2)]'
  },
  amber: {
    id: 'amber' as SkinId,
    name: 'Naranja Sunset',
    primary: 'orange-500',
    secondary: 'amber-900',
    accent: 'black',
    bg: 'bg-[#050200]',
    cardBg: 'bg-black/80',
    border: 'border-orange-500/30',
    text: 'text-orange-50',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.2)]'
  }
};

const DigitalClock = ({ skin }: { skin: SkinConfig }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="hidden sm:flex flex-col items-center justify-center font-['Orbitron'] px-6">
      <span className={`text-xl font-bold tracking-[0.2em] text-${skin.primary}`}>
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

const App: React.FC = () => {
  const [currentSkin, setCurrentSkin] = useState<SkinConfig | null>(null);
  const [folders, setFolders] = useState<FolderGroup[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderGroup | null>(null);
  const [currentMedia, setCurrentMedia] = useState<MediaFile | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const fileList = Array.from(files);
    const mediaFiles: MediaFile[] = fileList
      .filter((f: any) => f.type.startsWith('audio/') || f.type.startsWith('video/'))
      .map((f: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: f.name.replace(/\.[^/.]+$/, ""),
        url: URL.createObjectURL(f),
        type: f.type.startsWith('video/') ? 'video' : 'audio',
        folder: (f.webkitRelativePath || "").split('/').slice(-2, -1)[0] || 'General',
        file: f,
        coverUrl: f.type.startsWith('video/') 
          ? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=800&q=80'
      }));

    const groups: Record<string, MediaFile[]> = {};
    mediaFiles.forEach(mf => {
      if (!groups[mf.folder]) groups[mf.folder] = [];
      groups[mf.folder].push(mf);
    });
    setFolders(Object.keys(groups).map(name => ({ name, files: groups[name] })));
  };

  const filteredFolders = useMemo(() => {
    if (filterType === 'all') return folders;
    return folders
      .map(folder => ({
        ...folder,
        files: folder.files.filter(f => f.type === filterType)
      }))
      .filter(folder => folder.files.length > 0);
  }, [folders, filterType]);

  const updateMediaFile = (mediaId: string, updates: Partial<MediaFile>) => {
    setFolders(prev => prev.map(group => ({
      ...group,
      files: group.files.map(f => f.id === mediaId ? { ...f, ...updates } : f)
    })));
    if (currentMedia?.id === mediaId) {
      setCurrentMedia(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  if (!currentSkin) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-6 font-['Orbitron'] overflow-y-auto">
        <Disc size={64} className="text-zinc-800 animate-spin-slow mb-8 shrink-0" />
        <h1 className="text-2xl md:text-3xl font-['Bungee'] text-white tracking-[0.3em] mb-12 text-center">WURLITZER</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl">
          {Object.values(SKINS).map(skin => (
            <button
              key={skin.id}
              onClick={() => setCurrentSkin(skin)}
              className={`group w-full sm:w-48 py-8 ${skin.bg} border ${skin.border} rounded-xl flex flex-col items-center gap-4 hover:scale-105 transition-all ${skin.glow}`}
            >
              <div className={`w-8 h-8 rounded-full bg-${skin.primary}`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">{skin.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full ${currentSkin.bg} ${currentSkin.text} flex flex-col overflow-hidden font-['Inter']`}>
      <header className={`h-16 md:h-24 flex items-center justify-between px-4 md:px-8 border-b border-white/5 ${currentSkin.cardBg} backdrop-blur-2xl z-20`}>
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <Disc size={24} className={`text-${currentSkin.primary} animate-spin-slow shrink-0`} />
          <div>
            <h1 className={`text-sm md:text-lg font-['Bungee'] tracking-widest text-${currentSkin.primary} truncate leading-none mb-1`}>JUKEBOX</h1>
            <div className="flex gap-4 mt-1">
              <button onClick={() => setFilterType('all')} className={`text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-1 ${filterType === 'all' ? `text-${currentSkin.primary}` : 'text-zinc-500'}`}>
                <Layers size={10} /> Todo
              </button>
              <button onClick={() => setFilterType('audio')} className={`text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-1 ${filterType === 'audio' ? `text-${currentSkin.primary}` : 'text-zinc-500'}`}>
                <Music size={10} /> Música
              </button>
              <button onClick={() => setFilterType('video')} className={`text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-1 ${filterType === 'video' ? `text-${currentSkin.primary}` : 'text-zinc-500'}`}>
                <Film size={10} /> Vídeos
              </button>
            </div>
          </div>
        </div>
        
        <DigitalClock skin={currentSkin} />

        <div className="flex gap-2">
          <button onClick={() => setIsShuffle(!isShuffle)} className={`p-2 rounded-lg border border-white/5 ${isShuffle ? `bg-${currentSkin.primary} text-black` : `text-${currentSkin.primary}`}`} title="Shuffle"><Shuffle size={16} /></button>
          <button onClick={() => setCurrentSkin(null)} className={`p-2 rounded-lg border border-white/5 text-${currentSkin.primary}`} title="Skins"><Palette size={16} /></button>
          {folders.length === 0 ? (
            <label className={`flex items-center gap-2 px-3 md:px-4 py-2 bg-${currentSkin.primary} rounded-lg cursor-pointer text-black font-black uppercase tracking-widest text-[9px] md:text-[10px]`}>
              <Upload size={12} /> <span className="hidden sm:inline">CARGAR CARPETA</span> <input type="file" className="hidden" webkitdirectory="true" multiple onChange={handleFileChange} />
            </label>
          ) : selectedFolder && (
            <button onClick={() => setSelectedFolder(null)} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest">
              <FolderOpen size={12} /> <span className="hidden sm:inline">VOLVER</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {folders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10">
             <Disc size={60} className="animate-pulse mb-4" />
             <span className="font-['Orbitron'] tracking-[0.5em] uppercase text-xs text-center px-6">Carga una carpeta con MP3 o MP4 para empezar</span>
          </div>
        ) : !selectedFolder ? (
          <JukeboxWheel items={filteredFolders.map(f => ({ id: f.name, label: f.name, type: 'folder' }))} onSelect={(id) => setSelectedFolder(folders.find(f => f.name === id)!)} skin={currentSkin} />
        ) : (
          <JukeboxWheel 
            items={selectedFolder.files
              .filter(f => filterType === 'all' || f.type === filterType)
              .map(f => ({ id: f.id, label: f.name, type: f.type }))
            } 
            onSelect={(id) => setCurrentMedia(selectedFolder.files.find(f => f.id === id)!)} 
            skin={currentSkin} 
          />
        )}

        {currentMedia && (
          <div className="absolute inset-0 z-50 bg-black animate-in fade-in slide-in-from-bottom duration-500">
            <MediaPlayer 
              media={currentMedia} 
              onClose={() => setCurrentMedia(null)} 
              skin={currentSkin} 
              playlist={selectedFolder?.files.filter(f => filterType === 'all' || f.type === filterType) || []}
              onUpdateMedia={updateMediaFile}
              onNext={() => {
                const files = selectedFolder?.files.filter(f => filterType === 'all' || f.type === filterType) || [];
                const idx = files.findIndex(f => f.id === currentMedia.id);
                setCurrentMedia(files[(idx + 1) % files.length]);
              }}
              onPrevious={() => {
                const files = selectedFolder?.files.filter(f => filterType === 'all' || f.type === filterType) || [];
                const idx = files.findIndex(f => f.id === currentMedia.id);
                setCurrentMedia(files[(idx - 1 + files.length) % files.length]);
              }}
            />
          </div>
        )}
      </main>
      <style>{`.animate-spin-slow { animation: spin 6s linear infinite; }`}</style>
    </div>
  );
};
export default App;

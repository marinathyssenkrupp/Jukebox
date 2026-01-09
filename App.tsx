
import React, { useState, useCallback } from 'react';
import { MediaFile, FolderGroup, SkinId, SkinConfig } from './types';
import JukeboxWheel from './components/JukeboxWheel';
import MediaPlayer from './components/MediaPlayer';
import { Upload, Disc, ChevronLeft, Sparkles, Palette } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const SKINS: Record<SkinId, SkinConfig> = {
  neon: {
    id: 'neon',
    name: 'Classic Neon',
    primary: 'pink-500',
    secondary: 'blue-500',
    accent: 'purple-600',
    bg: 'bg-[#050505]',
    cardBg: 'bg-black/90',
    border: 'border-pink-500/40',
    text: 'text-white',
    glow: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]'
  },
  gold: {
    id: 'gold',
    name: 'Midnight Gold',
    primary: 'amber-500',
    secondary: 'yellow-700',
    accent: 'orange-900',
    bg: 'bg-[#0a0805]',
    cardBg: 'bg-[#15100a]/95',
    border: 'border-amber-600/40',
    text: 'text-amber-50',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]'
  },
  cyber: {
    id: 'cyber',
    name: 'Cyberpunk',
    primary: 'green-500',
    secondary: 'emerald-700',
    accent: 'black',
    bg: 'bg-black',
    cardBg: 'bg-black/80',
    border: 'border-green-500/60',
    text: 'text-green-400',
    glow: 'shadow-[0_0_15px_rgba(34,197,94,0.6)]'
  },
  vintage: {
    id: 'vintage',
    name: 'Retro Wood',
    primary: 'orange-400',
    secondary: 'amber-800',
    accent: 'red-900',
    bg: 'bg-[#1a0f0a]',
    cardBg: 'bg-[#2d1b14]/90',
    border: 'border-orange-900/50',
    text: 'text-orange-50',
    glow: 'shadow-[0_0_20px_rgba(251,146,60,0.4)]'
  },
  arctic: {
    id: 'arctic',
    name: 'Arctic Blue',
    primary: 'cyan-400',
    secondary: 'blue-200',
    accent: 'slate-900',
    bg: 'bg-[#f0f4f8]',
    cardBg: 'bg-white/70',
    border: 'border-cyan-300/50',
    text: 'text-slate-900',
    glow: 'shadow-[0_0_25px_rgba(34,211,238,0.3)]'
  }
};

const App: React.FC = () => {
  const [currentSkin, setCurrentSkin] = useState<SkinConfig | null>(null);
  const [folders, setFolders] = useState<FolderGroup[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderGroup | null>(null);
  const [currentMedia, setCurrentMedia] = useState<MediaFile | null>(null);
  const [isSearchingMetadata, setIsSearchingMetadata] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileList = Array.from(files) as File[];
    const mediaFiles: MediaFile[] = fileList
      .filter((f: any) => f.type.startsWith('audio/') || f.type.startsWith('video/'))
      .map((f: any) => {
        const pathParts = (f.webkitRelativePath || "").split('/');
        const folderName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Uncategorized';
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: f.name.replace(/\.[^/.]+$/, ""),
          url: URL.createObjectURL(f),
          type: f.type.startsWith('video/') ? 'video' : 'audio',
          folder: folderName,
          file: f
        };
      });

    const groups: { [key: string]: MediaFile[] } = {};
    mediaFiles.forEach(mf => {
      if (!groups[mf.folder]) groups[mf.folder] = [];
      groups[mf.folder].push(mf);
    });

    setFolders(Object.keys(groups).map(name => ({ name, files: groups[name] })));
  };

  const fetchMetadata = async (media: MediaFile) => {
    setIsSearchingMetadata(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Identify this music file: "${media.name}". Provide artist, album, and a 1-sentence description.`,
        config: { tools: [{ googleSearch: {} }] },
      });
      const text = response.text || "No info.";
      const searchUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(chunk => chunk.web)
        .map(chunk => ({ title: chunk.web!.title, uri: chunk.web!.uri })) || [];
      
      setCurrentMedia({ ...media, metadata: { description: text, searchUrls } });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearchingMetadata(false);
    }
  };

  const handlePlayMedia = (media: MediaFile) => {
    setCurrentMedia(media);
    if (!media.metadata) fetchMetadata(media);
  };

  const handleNextTrack = useCallback(() => {
    if (!selectedFolder || !currentMedia) return;
    const currentIndex = selectedFolder.files.findIndex(f => f.id === currentMedia.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % selectedFolder.files.length;
    handlePlayMedia(selectedFolder.files[nextIndex]);
  }, [selectedFolder, currentMedia]);

  const handlePreviousTrack = useCallback(() => {
    if (!selectedFolder || !currentMedia) return;
    const currentIndex = selectedFolder.files.findIndex(f => f.id === currentMedia.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + selectedFolder.files.length) % selectedFolder.files.length;
    handlePlayMedia(selectedFolder.files[prevIndex]);
  }, [selectedFolder, currentMedia]);

  if (!currentSkin) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-8 font-['Orbitron']">
        <h1 className="text-5xl font-['Bungee'] text-white mb-12 tracking-widest animate-pulse">CHOOSE YOUR SKIN</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 w-full max-w-7xl">
          {(Object.values(SKINS)).map(skin => (
            <button
              key={skin.id}
              onClick={() => setCurrentSkin(skin)}
              className={`group relative h-80 ${skin.bg} border-4 ${skin.border} rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 ${skin.glow}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
              <div className="absolute bottom-6 left-0 w-full text-center px-4">
                <p className={`text-xl font-bold ${skin.id === 'arctic' ? 'text-slate-900' : 'text-white'} group-hover:scale-110 transition-transform`}>
                  {skin.name}
                </p>
                <div className={`mt-2 h-1 w-0 group-hover:w-full mx-auto bg-${skin.primary} transition-all duration-500`}></div>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                <div className={`w-8 h-8 rounded-full bg-${skin.primary}`}></div>
                <div className={`w-8 h-8 rounded-full bg-${skin.secondary}`}></div>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-12 text-gray-500 text-sm animate-bounce">Select a visual personality for your jukebox</p>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full ${currentSkin.bg} overflow-hidden ${currentSkin.text} font-['Inter'] relative`}>
      <div className={`absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none ${currentSkin.id === 'arctic' ? 'invert' : ''}`} />
      
      <div className="flex-1 flex flex-col relative z-10">
        <header className={`h-24 border-b-4 border-double ${currentSkin.border} flex items-center justify-between px-10 ${currentSkin.cardBg} backdrop-blur-xl`}>
          <div className="flex items-center gap-6">
            <div className={`w-14 h-14 rounded-full bg-${currentSkin.primary} flex items-center justify-center animate-[spin_4s_linear_infinite]`}>
              <Disc className="text-black w-9 h-9" />
            </div>
            <div>
              <h1 className={`text-3xl font-['Bungee'] tracking-[0.2em] text-${currentSkin.primary}`}>
                WURLITZER <span className={`text-${currentSkin.secondary}`}>ULTRA</span>
              </h1>
              <p className={`text-[10px] text-${currentSkin.primary}/80 font-bold uppercase tracking-[0.5em]`}>SKIN: {currentSkin.name}</p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <button onClick={() => setCurrentSkin(null)} className={`p-2 hover:bg-${currentSkin.primary}/20 rounded-full transition-all`}>
              <Palette size={20} />
            </button>
            {folders.length === 0 ? (
              <label className={`group flex items-center gap-3 px-8 py-3 bg-${currentSkin.primary} hover:opacity-80 rounded-lg cursor-pointer transition-all font-['Orbitron'] font-bold text-sm text-black`}>
                <Upload size={20} /> IMPORT
                <input type="file" className="hidden" webkitdirectory="true" directory="" multiple onChange={handleFileChange} />
              </label>
            ) : (
              <div className="flex gap-2">
                {selectedFolder && (
                  <button onClick={() => setSelectedFolder(null)} className={`flex items-center gap-2 px-6 py-2 bg-${currentSkin.primary} text-black rounded-md font-bold text-sm`}>
                    <ChevronLeft size={18} /> BACK
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
            {folders.length === 0 ? (
              <div className="text-center p-12 max-w-lg space-y-6">
                <Disc className={`w-24 h-24 mx-auto text-${currentSkin.primary}/20 animate-bounce`} />
                <h2 className="text-4xl font-['Orbitron'] font-bold opacity-50 uppercase">Ready to Play</h2>
              </div>
            ) : !selectedFolder ? (
              <JukeboxWheel 
                key={`folder-${currentSkin.id}`}
                items={folders.map(f => ({ id: f.name, label: f.name, type: 'folder' }))} 
                onSelect={(id) => setSelectedFolder(folders.find(f => f.name === id)!)}
                skin={currentSkin}
              />
            ) : (
              <JukeboxWheel 
                key={`file-${selectedFolder.name}-${currentSkin.id}`}
                items={selectedFolder.files.map(f => ({ id: f.id, label: f.name, type: f.type }))} 
                onSelect={(id) => {
                  const media = selectedFolder.files.find(f => f.id === id)!;
                  handlePlayMedia(media);
                }}
                skin={currentSkin}
              />
            )}
          </div>

          {currentMedia && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-md animate-in zoom-in duration-300">
               <div className={`w-full max-w-6xl h-full flex flex-col ${currentSkin.cardBg} border-8 ${currentSkin.border} rounded-[40px] overflow-hidden ${currentSkin.glow} relative`}>
                  <MediaPlayer 
                    media={currentMedia} 
                    onClose={() => setCurrentMedia(null)} 
                    isLoadingMetadata={isSearchingMetadata}
                    onRefreshMetadata={() => fetchMetadata(currentMedia)}
                    skin={currentSkin}
                    onNext={handleNextTrack}
                    onPrevious={handlePreviousTrack}
                  />
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;

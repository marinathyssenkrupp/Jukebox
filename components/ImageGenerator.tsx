
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { X, Sparkles, Image as ImageIcon, Loader2, AlertCircle, ExternalLink, Wand2 } from 'lucide-react';
import { SkinConfig } from '../types';

interface ImageGeneratorProps {
  onClose: () => void;
  onGenerated: (imageUrl: string) => void;
  skin: SkinConfig;
  initialPrompt?: string;
  currentImageUrl?: string;
}

const ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onClose, onGenerated, skin, initialPrompt = "", currentImageUrl }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>(currentImageUrl ? 'edit' : 'create');
  const [error, setError] = useState<string | null>(null);

  const processImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let imageUrl = '';

      if (mode === 'create') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: `Professional album cover art for: ${prompt}. Retro jukebox aesthetic, cinematic lighting.` }] },
          config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: "1K" } }
        });
        
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      } else {
        // Mode Edit: Use gemini-2.5-flash-image
        const base64Data = currentImageUrl?.split(',')[1] || '';
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType: 'image/png' } },
              { text: `Edit this image based on: ${prompt}. Keep the original theme but apply the requested changes accurately.` }
            ]
          }
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        onGenerated(imageUrl);
        onClose();
      } else {
        throw new Error("No image data returned from API");
      }
    } catch (err: any) {
      console.error(err);
      setError("Error al procesar la imagen. Verifica tu conexión o API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
      <div className={`w-full max-w-xl bg-zinc-900 border-2 border-${skin.primary}/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
        {/* Header con Tabs */}
        <div className="flex border-b border-white/10">
          <button 
            onClick={() => setMode('create')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${mode === 'create' ? `bg-${skin.primary} text-black` : 'bg-transparent text-zinc-500 hover:text-white'}`}
          >
            Crear Nuevo
          </button>
          {currentImageUrl && (
            <button 
              onClick={() => setMode('edit')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${mode === 'edit' ? `bg-${skin.primary} text-black` : 'bg-transparent text-zinc-500 hover:text-white'}`}
            >
              Editar Actual
            </button>
          )}
          <button onClick={onClose} className="px-6 hover:bg-red-500/20 text-zinc-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex gap-4">
            {mode === 'edit' && currentImageUrl && (
              <div className="w-32 h-32 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-inner">
                <img src={currentImageUrl} className="w-full h-full object-cover" alt="Original" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {mode === 'edit' ? '¿Qué quieres cambiar?' : 'Describe tu visión'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'edit' ? "Ej: Añade un filtro retro neón y lluvia..." : "Ej: Un astronauta tocando un saxofón en Marte..."}
                className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-white/30 transition-all outline-none resize-none shadow-inner"
              />
            </div>
          </div>

          {mode === 'create' && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Relación de Aspecto</label>
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-2 text-[10px] font-bold rounded-lg border transition-all ${
                      aspectRatio === ratio
                        ? `bg-${skin.primary} border-${skin.primary} text-black`
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-xs flex gap-3 animate-bounce">
              <AlertCircle size={16} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={processImage}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
              isGenerating || !prompt.trim()
                ? 'bg-zinc-800 text-zinc-600'
                : `bg-${skin.primary} text-black hover:scale-[1.02] hover:shadow-${skin.primary}/20`
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                {mode === 'create' ? <Sparkles size={24} /> : <Wand2 size={24} />}
                <span>{mode === 'create' ? 'GENERAR ARTE' : 'APLICAR CAMBIOS'}</span>
              </>
            )}
          </button>
        </div>

        <div className="px-8 py-4 bg-black/40 border-t border-white/5 text-center">
          <p className="text-[9px] text-zinc-500 uppercase tracking-[0.3em]">
            Potenciado por Gemini Flash & Pro Image
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;

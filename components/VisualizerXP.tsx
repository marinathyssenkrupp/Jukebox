
import React, { useEffect, useRef } from 'react';

interface VisualizerXPProps {
  analyzer: AnalyserNode | null;
  color: string;
  isPlaying: boolean;
}

const VisualizerXP: React.FC<VisualizerXPProps> = ({ analyzer, color, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(Math.floor(Math.random() * 4));
  const timeRef = useRef(0);

  // Cambiar el modo aleatoriamente cuando el componente se monta o cuando se activa
  useEffect(() => {
    modeRef.current = Math.floor(Math.random() * 4);
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    const draw = () => {
      if (!isPlaying) {
        animationFrame = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += 0.015;
      const w = canvas.width = window.innerWidth;
      const h = canvas.height = window.innerHeight;
      
      const bufferLength = analyzer?.frequencyBinCount || 0;
      const dataArray = new Uint8Array(bufferLength);
      if (analyzer) analyzer.getByteFrequencyData(dataArray);

      const averageFreq = bufferLength > 0 
        ? dataArray.reduce((a, b) => a + b) / bufferLength 
        : 0;

      // Estela de movimiento para suavizado
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, w, h);

      // --- MODO 0: ONDAS FLUIDAS ---
      if (modeRef.current === 0) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 + averageFreq / 8;
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        
        for (let i = 0; i < w; i += 2) {
          const sinValue = Math.sin(i * 0.005 + timeRef.current) * (averageFreq * 2.5);
          const y = h / 2 + sinValue;
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } 
      // --- MODO 1: TÚNEL PSICODÉLICO ---
      else if (modeRef.current === 1) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        for (let i = 0; i < 40; i++) {
          const size = (i * 30 + (timeRef.current * 150) % 30);
          const opacity = 1 - size / (w / 1.5);
          ctx.strokeStyle = color;
          ctx.globalAlpha = Math.max(0, opacity * (averageFreq / 120));
          ctx.lineWidth = 2;
          ctx.rotate(timeRef.current * 0.01);
          ctx.strokeRect(-size / 2, -size / 2, size, size);
        }
        ctx.restore();
      }
      // --- MODO 2: AURORA BOREAL ---
      else if (modeRef.current === 2) {
        const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2 + averageFreq * 3);
        gradient.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        const sliceWidth = w / (bufferLength / 2);
        let x = 0;
        for(let i = 0; i < bufferLength / 2; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * h / 3) + h / 4;
          if(i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }
      // --- MODO 3: ESFERAS DE PLASMA ---
      else {
        for (let i = 0; i < 8; i++) {
          const angle = timeRef.current + (i * Math.PI * 2 / 8);
          const radius = w/5 + averageFreq;
          const px = w/2 + Math.cos(angle) * radius;
          const py = h/2 + Math.sin(angle * 0.5) * radius;
          
          const g = ctx.createRadialGradient(px, py, 0, px, py, 100 + averageFreq);
          g.addColorStop(0, color);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.fillStyle = g;
          ctx.globalAlpha = 0.4;
          ctx.beginPath();
          ctx.arc(px, py, 100 + averageFreq, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [analyzer, color, isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full opacity-70 mix-blend-screen pointer-events-none transition-opacity duration-1000 z-0"
    />
  );
};

export default VisualizerXP;

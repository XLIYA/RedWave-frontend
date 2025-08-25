'use client';

import React, { useEffect, useRef } from 'react';
import { useAudioPlayer } from '@/context/AudioProvider';

type Props = {
  height?: number; // px
  className?: string;
};

export default function PlayerVisualizer({ height = 140, className = '' }: Props) {
  const { analyser } = useAudioPlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!analyser) { raf = requestAnimationFrame(draw); return; }

      const bufferLength = analyser.frequencyBinCount;
      const data = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(data);

      const w = canvas.clientWidth;
      const h = height;

      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, w, h);

      const barWidth = (w / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (data[i] / 255) * h;
        const grad = ctx.createLinearGradient(0, h, 0, h - barHeight);
        grad.addColorStop(0, '#ff0000ff');
        grad.addColorStop(0.5, '#ff7300ff');
        grad.addColorStop(1, '#ffd900ff');
        ctx.fillStyle = grad;
        ctx.fillRect(x, h - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [analyser, height]);

  return (
    <div className={className} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full rounded-md" />
    </div>
  );
}

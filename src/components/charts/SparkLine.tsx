import { useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function SparkLine({
  data,
  width = 80,
  height = 24,
  color,
}: SparkLineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lineColor =
    color ??
    (data.length >= 2 && data[data.length - 1] >= data[0]
      ? '#00e676'
      : '#ff1744');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const drawHeight = height - padding * 2;
    const stepX = (width - padding * 2) / (data.length - 1);

    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    for (let i = 0; i < data.length; i++) {
      const x = padding + i * stepX;
      const y = padding + drawHeight - ((data[i] - min) / range) * drawHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }, [data, width, height, lineColor]);

  const containerStyle: CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    imageRendering: 'pixelated',
    display: 'inline-block',
  };

  return (
    <canvas
      ref={canvasRef}
      style={containerStyle}
      width={width}
      height={height}
    />
  );
}

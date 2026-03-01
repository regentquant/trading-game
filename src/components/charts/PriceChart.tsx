import { useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { PALETTE } from '../../styles/palette.ts';

interface PriceChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showAxes?: boolean;
}

export function PriceChart({
  data,
  width = 400,
  height = 200,
  color,
  showAxes = true,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);

  const lineColor =
    color ??
    (data.length >= 2 && data[data.length - 1] >= data[0]
      ? PALETTE.green
      : PALETTE.red);

  useEffect(() => {
    if (!containerRef.current || data.length < 2) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const xData = data.map((_, i) => i);

    const opts: uPlot.Options = {
      width,
      height,
      cursor: { show: false },
      legend: { show: false },
      select: { show: false, left: 0, top: 0, width: 0, height: 0 },
      scales: {
        x: { time: false },
      },
      axes: [
        {
          show: showAxes,
          stroke: PALETTE.textDim,
          grid: { show: showAxes, stroke: `${PALETTE.textDim}33`, width: 1 },
          ticks: { show: showAxes, stroke: PALETTE.textDim, width: 1, size: 4 },
          font: "10px 'VT323', monospace",
          labelFont: "10px 'VT323', monospace",
          values: (_u: uPlot, vals: number[]) => vals.map((v) => `D${v}`),
        },
        {
          show: showAxes,
          stroke: PALETTE.textDim,
          grid: { show: showAxes, stroke: `${PALETTE.textDim}33`, width: 1 },
          ticks: { show: showAxes, stroke: PALETTE.textDim, width: 1, size: 4 },
          font: "10px 'VT323', monospace",
          labelFont: "10px 'VT323', monospace",
          values: (_u: uPlot, vals: number[]) =>
            vals.map((v) => {
              if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
              return `$${v.toFixed(2)}`;
            }),
          size: 55,
        },
      ],
      series: [
        {},
        {
          stroke: lineColor,
          width: 2,
          fill: `${lineColor}18`,
        },
      ],
    };

    const plotData: uPlot.AlignedData = [xData, data];
    chartRef.current = new uPlot(opts, plotData, containerRef.current);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, width, height, lineColor, showAxes]);

  const containerStyle: CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: PALETTE.bg,
    imageRendering: 'pixelated',
    overflow: 'hidden',
  };

  if (data.length < 2) {
    return (
      <div
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'VT323', monospace",
          fontSize: '16px',
          color: PALETTE.textDim,
        }}
      >
        No data
      </div>
    );
  }

  return <div ref={containerRef} style={containerStyle} />;
}

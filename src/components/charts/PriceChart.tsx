import { useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { PALETTE, FONT } from '../../styles/palette.ts';

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

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const xData = data.map((_, i) => i);

    const axisFont = `11px ${FONT.mono}`;

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
          grid: { show: showAxes, stroke: `${PALETTE.textDim}22`, width: 1 },
          ticks: { show: showAxes, stroke: PALETTE.textDim, width: 1, size: 4 },
          font: axisFont,
          labelFont: axisFont,
          values: (_u: uPlot, vals: number[]) => vals.map((v) => `D${v}`),
        },
        {
          show: showAxes,
          stroke: PALETTE.textDim,
          grid: { show: showAxes, stroke: `${PALETTE.textDim}22`, width: 1 },
          ticks: { show: showAxes, stroke: PALETTE.textDim, width: 1, size: 4 },
          font: axisFont,
          labelFont: axisFont,
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
          fill: `${lineColor}12`,
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
    overflow: 'hidden',
    borderRadius: '4px',
  };

  if (data.length < 2) {
    return (
      <div
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.ui,
          fontSize: '13px',
          color: PALETTE.textDim,
        }}
      >
        No data
      </div>
    );
  }

  return <div ref={containerRef} style={containerStyle} />;
}

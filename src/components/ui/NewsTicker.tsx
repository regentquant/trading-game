import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { ActiveEvent, GameEventTemplate } from '../../types/index.ts';
import { PALETTE, FONT } from '../../styles/palette.ts';

interface NewsItem {
  id: string;
  name: string;
  description: string;
  severity: string;
  day: number;
}

interface NewsTickerProps {
  events: ActiveEvent[];
  templates: GameEventTemplate[];
  currentDay: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: PALETTE.cyan,
  moderate: PALETTE.gold,
  major: PALETTE.red,
  catastrophic: PALETTE.purple,
};

const DISPLAY_DURATION = 6000;
const MAX_VISIBLE = 3;

export function NewsTicker({ events, templates, currentDay }: NewsTickerProps) {
  const [visibleItems, setVisibleItems] = useState<NewsItem[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const newItems: NewsItem[] = [];
    for (const event of events) {
      if (!event.resolved) continue;
      if (seenIdsRef.current.has(event.id)) continue;
      if (currentDay - event.triggeredOnDay > 3) continue;

      const template = templates.find((t) => t.id === event.templateId);
      if (!template) continue;

      seenIdsRef.current.add(event.id);
      newItems.push({
        id: event.id,
        name: template.name,
        description: template.description,
        severity: template.severity,
        day: event.triggeredOnDay,
      });
    }

    if (newItems.length > 0) {
      setVisibleItems((prev) => [...newItems, ...prev].slice(0, MAX_VISIBLE));

      for (const item of newItems) {
        const timeoutId = setTimeout(() => {
          setVisibleItems((prev) => prev.filter((i) => i.id !== item.id));
          timeoutIdsRef.current.delete(timeoutId);
        }, DISPLAY_DURATION);
        timeoutIdsRef.current.add(timeoutId);
      }
    }

    return () => {
      for (const id of timeoutIdsRef.current) {
        clearTimeout(id);
      }
      timeoutIdsRef.current.clear();
    };
  }, [events, templates, currentDay]);

  if (visibleItems.length === 0) return null;

  const containerStyle: CSSProperties = {
    position: 'fixed',
    bottom: '12px',
    right: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    zIndex: 800,
    pointerEvents: 'none',
    maxWidth: '360px',
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes newsSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {visibleItems.map((item) => {
        const color = SEVERITY_COLORS[item.severity] ?? PALETTE.text;
        const itemStyle: CSSProperties = {
          backgroundColor: `${PALETTE.panel}f0`,
          borderLeft: `3px solid ${color}`,
          borderRadius: '0 8px 8px 0',
          padding: '10px 14px',
          animation: 'newsSlideIn 0.3s ease-out',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        };
        const titleStyle: CSSProperties = {
          fontFamily: FONT.ui,
          fontSize: '12px',
          fontWeight: 600,
          color: color,
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        };
        const badgeStyle: CSSProperties = {
          fontFamily: FONT.ui,
          fontSize: '9px',
          fontWeight: 500,
          color: PALETTE.textDim,
          border: `1px solid ${PALETTE.panelBorder}`,
          borderRadius: '3px',
          padding: '1px 4px',
          textTransform: 'uppercase',
        };
        const descStyle: CSSProperties = {
          fontFamily: FONT.ui,
          fontSize: '12px',
          color: PALETTE.textDim,
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        };

        return (
          <div key={item.id} style={itemStyle}>
            <div style={titleStyle}>
              <span>{item.name}</span>
              <span style={badgeStyle}>{item.severity}</span>
            </div>
            <div style={descStyle}>{item.description}</div>
          </div>
        );
      })}
    </div>
  );
}

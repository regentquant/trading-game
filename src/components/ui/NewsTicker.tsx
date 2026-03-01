import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { ActiveEvent, GameEventTemplate } from '../../types/index.ts';
import { PALETTE } from '../../styles/palette.ts';

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

const DISPLAY_DURATION = 6000; // ms to show each news item
const MAX_VISIBLE = 3;

export function NewsTicker({ events, templates, currentDay }: NewsTickerProps) {
  const [visibleItems, setVisibleItems] = useState<NewsItem[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Find newly resolved events we haven't shown yet
    const newItems: NewsItem[] = [];
    for (const event of events) {
      if (!event.resolved) continue;
      if (seenIdsRef.current.has(event.id)) continue;
      // Only show events from the last 3 days
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

      // Schedule removal
      for (const item of newItems) {
        setTimeout(() => {
          setVisibleItems((prev) => prev.filter((i) => i.id !== item.id));
        }, DISPLAY_DURATION);
      }
    }
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
    maxWidth: '400px',
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes newsSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes newsFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
      {visibleItems.map((item) => {
        const color = SEVERITY_COLORS[item.severity] ?? PALETTE.text;
        const itemStyle: CSSProperties = {
          backgroundColor: `${PALETTE.panel}ee`,
          borderLeft: `3px solid ${color}`,
          padding: '8px 12px',
          animation: 'newsSlideIn 0.3s ease-out',
          backdropFilter: 'blur(4px)',
        };
        const titleStyle: CSSProperties = {
          fontFamily: "'Press Start 2P', cursive",
          fontSize: '7px',
          color: color,
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        };
        const badgeStyle: CSSProperties = {
          fontSize: '6px',
          color: PALETTE.textDim,
          border: `1px solid ${PALETTE.panelLight}`,
          padding: '1px 4px',
          textTransform: 'uppercase',
        };
        const descStyle: CSSProperties = {
          fontFamily: "'VT323', monospace",
          fontSize: '14px',
          color: PALETTE.textDim,
          lineHeight: 1.3,
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

import type { CSSProperties } from 'react';
import { PALETTE, FONT } from '../../styles/palette.ts';

interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface PixelTableProps {
  columns: ColumnDef[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>, index: number) => void;
}

export function PixelTable({ columns, data, onRowClick }: PixelTableProps) {
  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: FONT.mono,
    fontSize: '13px',
    color: PALETTE.text,
  };

  const thStyle = (col: ColumnDef): CSSProperties => ({
    padding: '8px 12px',
    textAlign: col.align ?? 'left',
    width: col.width,
    borderBottom: `1px solid ${PALETTE.panelBorder}`,
    fontFamily: FONT.ui,
    fontSize: '11px',
    fontWeight: 600,
    color: PALETTE.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  });

  const tdStyle = (col: ColumnDef): CSSProperties => ({
    padding: '8px 12px',
    textAlign: col.align ?? 'left',
    width: col.width,
    borderBottom: `1px solid ${PALETTE.panelBorder}`,
    whiteSpace: 'nowrap',
  });

  const rowStyle = (index: number): CSSProperties => ({
    backgroundColor: index % 2 === 0 ? 'transparent' : `${PALETTE.bgLight}80`,
    cursor: onRowClick ? 'pointer' : 'default',
    transition: 'background-color 0.1s ease',
  });

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={thStyle(col)}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIdx) => (
          <tr
            key={typeof row.id === 'string' || typeof row.id === 'number' ? row.id : rowIdx}
            style={rowStyle(rowIdx)}
            onClick={() => onRowClick?.(row, rowIdx)}
            onMouseEnter={(e) => {
              if (onRowClick) {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  PALETTE.panelLight;
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                rowIdx % 2 === 0 ? 'transparent' : `${PALETTE.bgLight}80`;
            }}
          >
            {columns.map((col) => (
              <td key={col.key} style={tdStyle(col)}>
                {String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

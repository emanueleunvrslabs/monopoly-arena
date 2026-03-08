import { useMemo } from 'react';

const PROVIDER_COLOR: Record<string, string> = {
  OPENAI: '#22d97f',
  ANTHROPIC: '#FF8C42',
  GOOGLE: '#4A9EFF',
  OPENAI_COMPATIBLE: '#B48EFE',
};

const PIECE_SYMBOLS = ['◆', '●', '▲', '■'];

const PROPERTY_COLOR: Record<string, string> = {
  brown:    '#8B4513',
  lightblue:'#5BB8D4',
  pink:     '#E83E8C',
  orange:   '#FF8C00',
  red:      '#E63946',
  yellow:   '#F5C518',
  green:    '#2DB37A',
  darkblue: '#1D3D8F',
};

interface Square {
  id: number;
  name: string;
  type: string;
  color?: string;
}

const BOARD: Square[] = [
  { id: 0,  name: 'GO',         type: 'go' },
  { id: 1,  name: 'Vicolo\nCorto',    type: 'property', color: 'brown' },
  { id: 2,  name: 'CC',         type: 'community_chest' },
  { id: 3,  name: 'Vicolo\nStretto',  type: 'property', color: 'brown' },
  { id: 4,  name: 'TASSA',      type: 'tax' },
  { id: 5,  name: 'ST\nNORD',   type: 'station' },
  { id: 6,  name: 'Via\nDante', type: 'property', color: 'lightblue' },
  { id: 7,  name: '?',          type: 'chance' },
  { id: 8,  name: 'Via\nVerdi', type: 'property', color: 'lightblue' },
  { id: 9,  name: 'Via\nAccad', type: 'property', color: 'lightblue' },
  { id: 10, name: 'JAIL',       type: 'jail' },
  { id: 11, name: 'P.za\nCastello',   type: 'property', color: 'pink' },
  { id: 12, name: 'ENEL',       type: 'utility' },
  { id: 13, name: 'C.so\nVitt', type: 'property', color: 'pink' },
  { id: 14, name: 'Via\nPo',    type: 'property', color: 'pink' },
  { id: 15, name: 'ST\nEST',    type: 'station' },
  { id: 16, name: 'Via\nRoma',  type: 'property', color: 'orange' },
  { id: 17, name: 'CC',         type: 'community_chest' },
  { id: 18, name: 'C.so\nItalia',     type: 'property', color: 'orange' },
  { id: 19, name: 'V.le\nCost', type: 'property', color: 'orange' },
  { id: 20, name: 'FREE\nPARK', type: 'free_parking' },
  { id: 21, name: 'V.le\nGiard',      type: 'property', color: 'red' },
  { id: 22, name: '?',          type: 'chance' },
  { id: 23, name: 'P.za\nColonna',    type: 'property', color: 'red' },
  { id: 24, name: 'Largo\nAug', type: 'property', color: 'red' },
  { id: 25, name: 'ST\nOVEST',  type: 'station' },
  { id: 26, name: 'Via\nCond',  type: 'property', color: 'yellow' },
  { id: 27, name: 'C.so\nVen',  type: 'property', color: 'yellow' },
  { id: 28, name: 'ACQUA',      type: 'utility' },
  { id: 29, name: 'P.za\nDuomo',      type: 'property', color: 'yellow' },
  { id: 30, name: '→ JAIL',     type: 'go_to_jail' },
  { id: 31, name: 'V.le\nLieber',     type: 'property', color: 'green' },
  { id: 32, name: 'Via\nTulip', type: 'property', color: 'green' },
  { id: 33, name: 'CC',         type: 'community_chest' },
  { id: 34, name: 'Largo\nMil', type: 'property', color: 'green' },
  { id: 35, name: 'ST\nSUD',    type: 'station' },
  { id: 36, name: '?',          type: 'chance' },
  { id: 37, name: 'Largo\nColom',     type: 'property', color: 'darkblue' },
  { id: 38, name: 'LUSSO',      type: 'tax' },
  { id: 39, name: 'P.za\nVittoria',   type: 'property', color: 'darkblue' },
];

// Corner size and normal cell size
const CS = 52; // corner
const NS = 36; // normal
const TOTAL = CS * 2 + NS * 9; // 428

function getBounds(id: number) {
  if (id === 0)  return { x: TOTAL - CS, y: TOTAL - CS, w: CS, h: CS };
  if (id === 10) return { x: 0,          y: TOTAL - CS, w: CS, h: CS };
  if (id === 20) return { x: 0,          y: 0,          w: CS, h: CS };
  if (id === 30) return { x: TOTAL - CS, y: 0,          w: CS, h: CS };
  // Bottom row (1-9): right→left from GO
  if (id <= 9)  return { x: (TOTAL - CS) - id * NS, y: TOTAL - CS, w: NS, h: CS };
  // Left column (11-19): bottom→top
  if (id <= 19) return { x: 0, y: (TOTAL - CS) - (id - 10) * NS, w: CS, h: NS };
  // Top row (21-29): left→right
  if (id <= 29) return { x: CS + (id - 21) * NS, y: 0, w: NS, h: CS };
  // Right column (31-39): top→bottom
  return { x: TOTAL - CS, y: CS + (id - 31) * NS, w: CS, h: NS };
}

// For property color stripe: which edge faces the board interior
function getStripeStyle(id: number, color: string): React.CSSProperties {
  const c = color;
  const W = 6;
  if (id >= 1  && id <= 9)  return { borderTop:    `${W}px solid ${c}` }; // bottom row → stripe on top
  if (id >= 11 && id <= 19) return { borderRight:  `${W}px solid ${c}` }; // left col → stripe on right
  if (id >= 21 && id <= 29) return { borderBottom: `${W}px solid ${c}` }; // top row → stripe on bottom
  if (id >= 31 && id <= 39) return { borderLeft:   `${W}px solid ${c}` }; // right col → stripe on left
  return {};
}

interface BoardPlayer {
  index: number;
  position: number;
  provider: string;
  isAlive: boolean;
  properties: Array<{ squareId: number; houses: number }>;
}

export default function MonopolyBoard({ players, currentPlayerIndex }: {
  players: BoardPlayer[];
  currentPlayerIndex: number;
}) {
  const ownerMap = useMemo(() => {
    const map: Record<number, number> = {};
    players.forEach(p => p.properties.forEach(prop => { map[prop.squareId] = p.index; }));
    return map;
  }, [players]);

  const posMap = useMemo(() => {
    const map: Record<number, number[]> = {};
    players.forEach(p => {
      if (p.isAlive) {
        if (!map[p.position]) map[p.position] = [];
        map[p.position].push(p.index);
      }
    });
    return map;
  }, [players]);

  return (
    <div style={{ position: 'relative', width: TOTAL, height: TOTAL, flexShrink: 0, margin: '0 auto' }}>
      {/* Board background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#0D1F14',
        border: '2px solid rgba(245,197,24,0.2)',
        borderRadius: '8px',
      }} />

      {/* Center label */}
      <div style={{
        position: 'absolute',
        left: CS, top: CS, right: CS, bottom: CS,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold)', letterSpacing: '0.1em', lineHeight: 1 }}>MONOPOLY</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--muted)', letterSpacing: '0.15em', marginTop: '4px' }}>ARENA</div>
      </div>

      {/* Squares */}
      {BOARD.map(sq => {
        const { x, y, w, h } = getBounds(sq.id);
        const propColor = sq.color ? PROPERTY_COLOR[sq.color] : null;
        const ownerIdx = ownerMap[sq.id];
        const ownerColor = ownerIdx !== undefined ? PROVIDER_COLOR[players[ownerIdx]?.provider] : null;
        const piecesHere = posMap[sq.id] || [];
        const isCorner = sq.id === 0 || sq.id === 10 || sq.id === 20 || sq.id === 30;

        return (
          <div
            key={sq.id}
            style={{
              position: 'absolute',
              left: x, top: y, width: w, height: h,
              background: ownerColor ? `${ownerColor}18` : 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              ...(propColor ? getStripeStyle(sq.id, propColor) : {}),
            }}
          >
            {/* Corner special content */}
            {sq.id === 0 && (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--electric)', letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.1 }}>
                GO<div style={{ fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>COLLECT €200</div>
              </div>
            )}
            {sq.id === 10 && (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: '#FEBC2E', textAlign: 'center', lineHeight: 1.2 }}>
                JAIL<div style={{ fontSize: '0.5rem', color: 'var(--muted)' }}>VISITING</div>
              </div>
            )}
            {sq.id === 20 && (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--electric)', textAlign: 'center', lineHeight: 1.2, letterSpacing: '0.04em' }}>
                FREE<div>PARK</div>
              </div>
            )}
            {sq.id === 30 && (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: '#FF3B3B', textAlign: 'center', lineHeight: 1.2 }}>
                GO TO<div>JAIL</div>
              </div>
            )}

            {/* Normal square content */}
            {!isCorner && (
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.42rem',
                color: propColor || (sq.type === 'chance' ? '#FFD700' : sq.type === 'community_chest' ? '#4A9EFF' : sq.type === 'station' ? 'var(--text)' : 'var(--muted)'),
                textAlign: 'center', lineHeight: 1.3, padding: '1px',
                whiteSpace: 'pre-line',
                letterSpacing: '0.02em',
              }}>
                {sq.name}
              </div>
            )}

            {/* Player pieces */}
            {piecesHere.length > 0 && (
              <div style={{
                position: 'absolute', bottom: 2, left: 0, right: 0,
                display: 'flex', justifyContent: 'center', gap: '1px', flexWrap: 'wrap',
              }}>
                {piecesHere.map(idx => {
                  const color = PROVIDER_COLOR[players[idx]?.provider] || '#888';
                  const isActive = idx === currentPlayerIndex;
                  return (
                    <div key={idx} style={{
                      width: isActive ? 11 : 9,
                      height: isActive ? 11 : 9,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: isActive ? `0 0 6px ${color}` : 'none',
                      border: isActive ? '1px solid white' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '5px', color: '#000', fontWeight: 700,
                      transition: 'all 0.3s ease',
                    }}>
                      {PIECE_SYMBOLS[idx]}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

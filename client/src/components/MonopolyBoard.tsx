import { useMemo } from 'react';

const PROVIDER_COLOR: Record<string, string> = {
  OPENAI: '#22d97f',
  ANTHROPIC: '#FF8C42',
  GOOGLE: '#4A9EFF',
  OPENAI_COMPATIBLE: '#B48EFE',
  DEMO: '#888888',
};

const PIECE_SYMBOLS = ['◆', '●', '▲', '■'];

const PROPERTY_COLOR: Record<string, string> = {
  brown:     '#8B4513',
  lightblue: '#00BFFF',
  pink:      '#E83E8C',
  orange:    '#FF8C00',
  red:       '#E63946',
  yellow:    '#F5C518',
  green:     '#2DB37A',
  darkblue:  '#1D3D8F',
};

const SQUARE_TYPE_STYLE: Record<string, { bg: string; label: string }> = {
  go:              { bg: '#FFF9C4', label: 'GO' },
  jail:            { bg: '#FFF9C4', label: '🔒' },
  free_parking:    { bg: '#FFF9C4', label: '🅿' },
  go_to_jail:      { bg: '#FFF9C4', label: '→🔒' },
  tax:             { bg: '#F5F5F5', label: '💸' },
  chance:          { bg: '#FFFDE7', label: '?' },
  community_chest: { bg: '#E3F2FD', label: 'CC' },
  station:         { bg: '#F5F5F5', label: '🚂' },
  utility:         { bg: '#F5F5F5', label: '⚡' },
  property:        { bg: '#FFFFFF', label: '' },
};

interface BoardSquare {
  id: number;
  name: string;
  type: string;
  color?: string;
}

const BOARD: BoardSquare[] = [
  { id: 0,  name: 'GO',             type: 'go' },
  { id: 1,  name: 'Vicolo\nCorto',  type: 'property', color: 'brown' },
  { id: 2,  name: 'Imprevisti',     type: 'community_chest' },
  { id: 3,  name: 'Vicolo\nStretto',type: 'property', color: 'brown' },
  { id: 4,  name: 'Tassa\nPatrim.', type: 'tax' },
  { id: 5,  name: 'Staz.\nNord',    type: 'station' },
  { id: 6,  name: 'Via\nDante',     type: 'property', color: 'lightblue' },
  { id: 7,  name: 'Prob.',          type: 'chance' },
  { id: 8,  name: 'Via\nVerdi',     type: 'property', color: 'lightblue' },
  { id: 9,  name: 'Via\nAccad.',    type: 'property', color: 'lightblue' },
  { id: 10, name: 'JAIL',           type: 'jail' },
  { id: 11, name: 'P.za\nCastello', type: 'property', color: 'pink' },
  { id: 12, name: 'Enel',           type: 'utility' },
  { id: 13, name: 'C.so\nVitt.',    type: 'property', color: 'pink' },
  { id: 14, name: 'Via\nPo',        type: 'property', color: 'pink' },
  { id: 15, name: 'Staz.\nEst',     type: 'station' },
  { id: 16, name: 'Via\nRoma',      type: 'property', color: 'orange' },
  { id: 17, name: 'Imprevisti',     type: 'community_chest' },
  { id: 18, name: 'C.so\nItalia',   type: 'property', color: 'orange' },
  { id: 19, name: 'V.le\nCost.',    type: 'property', color: 'orange' },
  { id: 20, name: 'FREE\nPARK',     type: 'free_parking' },
  { id: 21, name: 'V.le\nGiard.',   type: 'property', color: 'red' },
  { id: 22, name: 'Prob.',          type: 'chance' },
  { id: 23, name: 'P.za\nColonna',  type: 'property', color: 'red' },
  { id: 24, name: 'Largo\nAug.',    type: 'property', color: 'red' },
  { id: 25, name: 'Staz.\nOvest',   type: 'station' },
  { id: 26, name: 'Via\nCond.',     type: 'property', color: 'yellow' },
  { id: 27, name: 'C.so\nVen.',     type: 'property', color: 'yellow' },
  { id: 28, name: 'Acqua',          type: 'utility' },
  { id: 29, name: 'P.za\nDuomo',    type: 'property', color: 'yellow' },
  { id: 30, name: '→ JAIL',         type: 'go_to_jail' },
  { id: 31, name: 'V.le\nLiber.',   type: 'property', color: 'green' },
  { id: 32, name: 'Via\nTulip.',    type: 'property', color: 'green' },
  { id: 33, name: 'Imprevisti',     type: 'community_chest' },
  { id: 34, name: 'Largo\nMil.',    type: 'property', color: 'green' },
  { id: 35, name: 'Staz.\nSud',     type: 'station' },
  { id: 36, name: 'Prob.',          type: 'chance' },
  { id: 37, name: 'Largo\nColom.',  type: 'property', color: 'darkblue' },
  { id: 38, name: 'Tassa\nLusso',   type: 'tax' },
  { id: 39, name: 'P.za\nVittoria', type: 'property', color: 'darkblue' },
];

// Corner = 60px, normal cell = 40px. Total = 60*2 + 40*9 = 480
const CS = 60;
const NS = 40;
const TOTAL = CS * 2 + NS * 9;

function getBounds(id: number) {
  // Layout: sq0=GO bottom-right, going counter-clockwise
  // Bottom row right→left: 0,1,2,...,10
  // Left col bottom→top: 11,...,19
  // Top row left→right: 20,...,30
  // Right col top→bottom: 31,...,39
  if (id === 0)  return { x: TOTAL - CS, y: TOTAL - CS, w: CS, h: CS };
  if (id === 10) return { x: 0,          y: TOTAL - CS, w: CS, h: CS };
  if (id === 20) return { x: 0,          y: 0,          w: CS, h: CS };
  if (id === 30) return { x: TOTAL - CS, y: 0,          w: CS, h: CS };
  if (id <= 9)  return { x: (TOTAL - CS) - id * NS, y: TOTAL - CS, w: NS, h: CS };
  if (id <= 19) return { x: 0, y: (TOTAL - CS) - (id - 10) * NS, w: CS, h: NS };
  if (id <= 29) return { x: CS + (id - 21) * NS, y: 0, w: NS, h: CS };
  return { x: TOTAL - CS, y: CS + (id - 31) * NS, w: CS, h: NS };
}

function getStripeStyle(id: number, color: string): React.CSSProperties {
  const W = 10;
  if (id >= 1  && id <= 9)  return { borderTop:    `${W}px solid ${color}` };
  if (id >= 11 && id <= 19) return { borderRight:  `${W}px solid ${color}` };
  if (id >= 21 && id <= 29) return { borderBottom: `${W}px solid ${color}` };
  if (id >= 31 && id <= 39) return { borderLeft:   `${W}px solid ${color}` };
  return {};
}

interface BoardPlayer {
  index: number;
  position: number;
  provider: string;
  isAlive: boolean;
  agentName?: string;
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

  const isCorner = (id: number) => id === 0 || id === 10 || id === 20 || id === 30;

  return (
    <div style={{ position: 'relative', width: TOTAL, height: TOTAL, flexShrink: 0, margin: '0 auto' }}>
      {/* Green board background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#2D6A4F',
        borderRadius: '6px',
        border: '3px solid #1B4332',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }} />

      {/* Center area */}
      <div style={{
        position: 'absolute',
        left: CS + 2, top: CS + 2,
        width: TOTAL - CS * 2 - 4,
        height: TOTAL - CS * 2 - 4,
        background: '#1B4332',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '4px',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          color: '#F5C518',
          letterSpacing: '0.12em',
          textShadow: '0 0 20px rgba(245,197,24,0.5)',
          lineHeight: 1,
        }}>MONOPOLY</div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.8rem',
          color: 'rgba(245,197,24,0.6)',
          letterSpacing: '0.2em',
        }}>ARENA</div>

        {/* Live player legend */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {players.map(p => {
            const color = PROVIDER_COLOR[p.provider] || '#888';
            return (
              <div key={p.index} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                opacity: p.isAlive ? 1 : 0.35,
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: color,
                  boxShadow: p.index === currentPlayerIndex ? `0 0 8px ${color}` : 'none',
                  border: p.index === currentPlayerIndex ? '2px solid white' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '7px', color: '#000', fontWeight: 700, flexShrink: 0,
                }}>
                  {PIECE_SYMBOLS[p.index]}
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: p.index === currentPlayerIndex ? color : 'rgba(255,255,255,0.7)',
                  fontWeight: p.index === currentPlayerIndex ? 700 : 400,
                  maxWidth: '80px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.agentName || `Player ${p.index + 1}`}
                </span>
                {!p.isAlive && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: '#FF3B3B' }}>BANKRUPT</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Squares */}
      {BOARD.map(sq => {
        const { x, y, w, h } = getBounds(sq.id);
        const propColor = sq.color ? PROPERTY_COLOR[sq.color] : null;
        const ownerIdx = ownerMap[sq.id];
        const ownerColor = ownerIdx !== undefined ? PROVIDER_COLOR[players[ownerIdx]?.provider] : null;
        const piecesHere = posMap[sq.id] || [];
        const corner = isCorner(sq.id);
        const typeStyle = SQUARE_TYPE_STYLE[sq.type] || SQUARE_TYPE_STYLE.property;

        return (
          <div
            key={sq.id}
            style={{
              position: 'absolute',
              left: x, top: y, width: w, height: h,
              background: ownerColor ? `color-mix(in srgb, ${ownerColor} 20%, ${typeStyle.bg})` : typeStyle.bg,
              border: '1px solid #ccc',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              boxSizing: 'border-box',
              ...(propColor ? getStripeStyle(sq.id, propColor) : {}),
            }}
          >
            {/* Corner content */}
            {sq.id === 0 && (
              <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                <div style={{ fontSize: '8px', color: '#666', fontFamily: 'serif' }}>COLLECT</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#E63946', letterSpacing: '0.05em' }}>GO</div>
                <div style={{ fontSize: '8px', color: '#666' }}>€200 SALARY</div>
              </div>
            )}
            {sq.id === 10 && (
              <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
                <div style={{ fontSize: '18px' }}>🔒</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', color: '#444', letterSpacing: '0.06em' }}>JAIL</div>
              </div>
            )}
            {sq.id === 20 && (
              <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
                <div style={{ fontSize: '18px' }}>🅿️</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: '#444', letterSpacing: '0.06em' }}>FREE PARK</div>
              </div>
            )}
            {sq.id === 30 && (
              <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
                <div style={{ fontSize: '18px' }}>🚔</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', color: '#E63946', letterSpacing: '0.04em' }}>GO TO JAIL</div>
              </div>
            )}

            {/* Normal squares */}
            {!corner && (
              <div style={{
                fontFamily: 'sans-serif',
                fontSize: sq.type === 'station' || sq.type === 'utility' ? '14px' : '0.38rem',
                color: '#333',
                textAlign: 'center',
                lineHeight: 1.3,
                padding: '1px 2px',
                whiteSpace: 'pre-line',
                letterSpacing: '0.01em',
                fontWeight: 500,
              }}>
                {sq.type === 'station' ? '🚂' : sq.type === 'utility' ? (sq.id === 12 ? '⚡' : '💧') : sq.type === 'chance' ? '?' : sq.type === 'community_chest' ? 'CC' : sq.name}
              </div>
            )}

            {/* Owner dot */}
            {ownerColor && !corner && (
              <div style={{
                position: 'absolute', top: 2, right: 2,
                width: 5, height: 5, borderRadius: '50%',
                background: ownerColor,
              }} />
            )}

            {/* Player pieces */}
            {piecesHere.length > 0 && (
              <div style={{
                position: 'absolute',
                bottom: 1, left: 0, right: 0,
                display: 'flex', justifyContent: 'center',
                gap: '1px', flexWrap: 'wrap',
                padding: '0 1px',
              }}>
                {piecesHere.map(idx => {
                  const color = PROVIDER_COLOR[players[idx]?.provider] || '#888';
                  const active = idx === currentPlayerIndex;
                  return (
                    <div key={idx} style={{
                      width: active ? 13 : 10,
                      height: active ? 13 : 10,
                      borderRadius: '50%',
                      background: color,
                      border: active ? '1.5px solid white' : '1px solid rgba(0,0,0,0.3)',
                      boxShadow: active ? `0 0 6px ${color}, 0 2px 4px rgba(0,0,0,0.4)` : '0 1px 2px rgba(0,0,0,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '5px', color: '#000', fontWeight: 900,
                      transition: 'all 0.4s ease',
                      zIndex: active ? 2 : 1,
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

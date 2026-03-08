import { useMemo } from 'react';

/* ─── Palette ──────────────────────────────────────────────── */
const PROVIDER_COLOR: Record<string, string> = {
  OPENAI:            '#10B981',
  ANTHROPIC:         '#FF7043',
  GOOGLE:            '#4285F4',
  OPENAI_COMPATIBLE: '#AB47BC',
  DEMO:              '#78909C',
};

const PROP_COLOR: Record<string, string> = {
  brown:     '#7B3F00',
  lightblue: '#00B0D8',
  pink:      '#C2185B',
  orange:    '#E65100',
  red:       '#B71C1C',
  yellow:    '#F9A825',
  green:     '#1B5E20',
  darkblue:  '#0D47A1',
};

/* ─── Board data ───────────────────────────────────────────── */
interface Sq { id: number; name: string; type: string; color?: string; price?: number }

const BOARD: Sq[] = [
  { id: 0,  name: 'GO',         type: 'go' },
  { id: 1,  name: 'Vicolo\nCorto',  type: 'property', color: 'brown',     price: 60 },
  { id: 2,  name: 'Imprevisti', type: 'community_chest' },
  { id: 3,  name: 'V.Stretto',  type: 'property', color: 'brown',     price: 60 },
  { id: 4,  name: 'Tassa\nPatr.',   type: 'tax',                        price: 200 },
  { id: 5,  name: 'Staz.N',     type: 'station',                      price: 200 },
  { id: 6,  name: 'Via\nDante', type: 'property', color: 'lightblue', price: 100 },
  { id: 7,  name: 'Probab.',    type: 'chance' },
  { id: 8,  name: 'Via\nVerdi', type: 'property', color: 'lightblue', price: 100 },
  { id: 9,  name: 'V.Accad.',   type: 'property', color: 'lightblue', price: 120 },
  { id: 10, name: 'JAIL',       type: 'jail' },
  { id: 11, name: 'P.zzaCast.', type: 'property', color: 'pink',      price: 140 },
  { id: 12, name: 'Enel',       type: 'utility',                      price: 150 },
  { id: 13, name: 'C.so\nVitt.',type: 'property', color: 'pink',      price: 140 },
  { id: 14, name: 'Via\nPo',    type: 'property', color: 'pink',      price: 160 },
  { id: 15, name: 'Staz.E',     type: 'station',                      price: 200 },
  { id: 16, name: 'Via\nRoma',  type: 'property', color: 'orange',    price: 180 },
  { id: 17, name: 'Imprevisti', type: 'community_chest' },
  { id: 18, name: 'C.Italia',   type: 'property', color: 'orange',    price: 180 },
  { id: 19, name: 'V.Cost.',    type: 'property', color: 'orange',    price: 200 },
  { id: 20, name: 'FREE\nPARK', type: 'free_parking' },
  { id: 21, name: 'V.Giard.',   type: 'property', color: 'red',       price: 220 },
  { id: 22, name: 'Probab.',    type: 'chance' },
  { id: 23, name: 'P.Colonna',  type: 'property', color: 'red',       price: 220 },
  { id: 24, name: 'L.Augusto',  type: 'property', color: 'red',       price: 240 },
  { id: 25, name: 'Staz.O',     type: 'station',                      price: 200 },
  { id: 26, name: 'Via\nCond.', type: 'property', color: 'yellow',    price: 260 },
  { id: 27, name: 'C.Venezia',  type: 'property', color: 'yellow',    price: 260 },
  { id: 28, name: 'Acqua',      type: 'utility',                      price: 150 },
  { id: 29, name: 'P.Duomo',    type: 'property', color: 'yellow',    price: 280 },
  { id: 30, name: '→JAIL',      type: 'go_to_jail' },
  { id: 31, name: 'V.Liber.',   type: 'property', color: 'green',     price: 300 },
  { id: 32, name: 'V.Tulip.',   type: 'property', color: 'green',     price: 300 },
  { id: 33, name: 'Imprevisti', type: 'community_chest' },
  { id: 34, name: 'L.Milano',   type: 'property', color: 'green',     price: 320 },
  { id: 35, name: 'Staz.S',     type: 'station',                      price: 200 },
  { id: 36, name: 'Probab.',    type: 'chance' },
  { id: 37, name: 'L.Colom.',   type: 'property', color: 'darkblue',  price: 350 },
  { id: 38, name: 'T.Lusso',    type: 'tax',                          price: 100 },
  { id: 39, name: 'P.Vittoria', type: 'property', color: 'darkblue',  price: 400 },
];

/* ─── Layout ───────────────────────────────────────────────── */
const CS = 60; // corner size
const NS = 40; // normal cell size
const TOTAL = CS * 2 + NS * 9; // 480

function getBounds(id: number) {
  if (id === 0)  return { x: TOTAL - CS, y: TOTAL - CS, w: CS, h: CS };
  if (id === 10) return { x: 0,          y: TOTAL - CS, w: CS, h: CS };
  if (id === 20) return { x: 0,          y: 0,          w: CS, h: CS };
  if (id === 30) return { x: TOTAL - CS, y: 0,          w: CS, h: CS };
  if (id <= 9)  return { x: (TOTAL - CS) - id * NS, y: TOTAL - CS, w: NS, h: CS };
  if (id <= 19) return { x: 0, y: (TOTAL - CS) - (id - 10) * NS, w: CS, h: NS };
  if (id <= 29) return { x: CS + (id - 21) * NS, y: 0, w: NS, h: CS };
  return { x: TOTAL - CS, y: CS + (id - 31) * NS, w: CS, h: NS };
}

function stripeDir(id: number): 'top' | 'bottom' | 'left' | 'right' | null {
  if (id >= 1  && id <= 9)  return 'top';
  if (id >= 11 && id <= 19) return 'right';
  if (id >= 21 && id <= 29) return 'bottom';
  if (id >= 31 && id <= 39) return 'left';
  return null;
}

/* ─── Types ────────────────────────────────────────────────── */
interface BoardPlayer {
  index: number;
  position: number;
  provider: string;
  isAlive: boolean;
  agentName?: string;
  properties: Array<{ squareId: number; houses: number }>;
}

/* ─── Component ────────────────────────────────────────────── */
export default function MonopolyBoard({
  players,
  currentPlayerIndex,
}: {
  players: BoardPlayer[];
  currentPlayerIndex: number;
}) {
  const ownerMap = useMemo(() => {
    const m: Record<number, number> = {};
    players.forEach(p => p.properties.forEach(prop => { m[prop.squareId] = p.index; }));
    return m;
  }, [players]);

  const housesMap = useMemo(() => {
    const m: Record<number, number> = {};
    players.forEach(p => p.properties.forEach(prop => { m[prop.squareId] = prop.houses; }));
    return m;
  }, [players]);

  const posMap = useMemo(() => {
    const m: Record<number, number[]> = {};
    players.forEach(p => {
      if (p.isAlive) {
        if (!m[p.position]) m[p.position] = [];
        m[p.position].push(p.index);
      }
    });
    return m;
  }, [players]);

  return (
    <>
      <style>{`
        @keyframes piecePulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        @keyframes boardFloat {
          0%   { transform: rotateX(22deg) translateY(0px); }
          50%  { transform: rotateX(22deg) translateY(-3px); }
          100% { transform: rotateX(22deg) translateY(0px); }
        }
      `}</style>

      {/* Perspective wrapper */}
      <div style={{
        perspective: '1000px',
        perspectiveOrigin: '50% 30%',
        paddingBottom: '60px',
        paddingTop: '20px',
      }}>
        {/* 3D tilt */}
        <div style={{
          position: 'relative',
          width: TOTAL,
          margin: '0 auto',
          animation: 'boardFloat 6s ease-in-out infinite',
        }}>
          {/* Main board surface */}
          <div style={{
            width: TOTAL,
            height: TOTAL,
            position: 'relative',
            /* Outer border — classic Monopoly double-line */
            outline: '4px solid #0F2A0F',
            outlineOffset: '-4px',
            boxShadow: [
              /* 3D underside illusion */
              '0 12px 0 #0a1f0a',
              '0 24px 0 #071507',
              /* Ambient shadow */
              '0 30px 60px rgba(0,0,0,0.85)',
              '0 10px 30px rgba(0,0,0,0.6)',
              /* Inset rim highlight */
              'inset 0 0 0 8px rgba(255,255,255,0.04)',
            ].join(', '),
            borderRadius: 2,
            overflow: 'hidden',
          }}>

            {/* Board base fill */}
            <div style={{
              position: 'absolute', inset: 0,
              background: '#F2EDD6',
              backgroundImage: `
                radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 60%),
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 39px,
                  rgba(0,0,0,0.03) 39px,
                  rgba(0,0,0,0.03) 40px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 39px,
                  rgba(0,0,0,0.03) 39px,
                  rgba(0,0,0,0.03) 40px
                )
              `,
            }} />

            {/* Inner double-border */}
            <div style={{
              position: 'absolute',
              inset: 4,
              border: '1.5px solid #1B3A1B',
              pointerEvents: 'none',
              zIndex: 20,
              borderRadius: 1,
            }} />

            {/* ── Center panel ── */}
            <div style={{
              position: 'absolute',
              left: CS + 2, top: CS + 2,
              width: TOTAL - CS * 2 - 4,
              height: TOTAL - CS * 2 - 4,
              background: 'linear-gradient(145deg, #14401A 0%, #0C2A10 60%, #061808 100%)',
              backgroundImage: `
                linear-gradient(145deg, #14401A 0%, #0C2A10 60%, #061808 100%),
                radial-gradient(ellipse at 40% 30%, rgba(255,215,0,0.07) 0%, transparent 70%)
              `,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              borderLeft: '1.5px solid #1B3A1B',
              borderRight: '1.5px solid #1B3A1B',
              borderTop: '1.5px solid #1B3A1B',
              borderBottom: '1.5px solid #1B3A1B',
            }}>
              {/* MONOPOLY wordmark */}
              <div style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontSize: '1.65rem',
                fontWeight: 900,
                fontStyle: 'italic',
                color: '#FFD700',
                letterSpacing: '0.08em',
                textShadow: [
                  '0 0 30px rgba(255,215,0,0.7)',
                  '0 0 60px rgba(255,215,0,0.3)',
                  '2px 2px 0 rgba(0,0,0,0.5)',
                ].join(', '),
                lineHeight: 1,
              }}>
                MONOPOLY
              </div>
              <div style={{
                fontFamily: '"Bebas Neue", "Arial Narrow", sans-serif',
                fontSize: '0.72rem',
                color: 'rgba(255,215,0,0.45)',
                letterSpacing: '0.35em',
                marginTop: -3,
              }}>
                ◆ ARENA ◆
              </div>

              {/* Decorative divider */}
              <div style={{
                width: 80, height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)',
                margin: '3px 0',
              }} />

              {/* Player legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                {players.map(p => {
                  const col = PROVIDER_COLOR[p.provider] || '#888';
                  const active = p.index === currentPlayerIndex;
                  return (
                    <div key={p.index} style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      opacity: p.isAlive ? 1 : 0.25,
                      transition: 'opacity 0.4s',
                    }}>
                      {/* Piece preview */}
                      <div style={{
                        width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                        background: `radial-gradient(circle at 35% 30%, ${col}ff, ${col}88)`,
                        border: active ? '2px solid white' : '1.5px solid rgba(255,255,255,0.2)',
                        boxShadow: active
                          ? `0 0 10px ${col}, 0 0 20px ${col}77`
                          : '0 1px 4px rgba(0,0,0,0.6)',
                        animation: active ? 'piecePulse 1.8s ease-in-out infinite' : 'none',
                      }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <span style={{
                          fontFamily: '"Bebas Neue", monospace',
                          fontSize: '0.62rem',
                          letterSpacing: '0.06em',
                          color: active ? col : 'rgba(255,255,255,0.65)',
                          fontWeight: active ? 700 : 400,
                          lineHeight: 1.1,
                          maxWidth: 70,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textShadow: active ? `0 0 10px ${col}88` : 'none',
                        }}>
                          {p.agentName || `Player ${p.index + 1}`}
                        </span>
                        {!p.isAlive && (
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.42rem',
                            color: '#FF4444',
                            letterSpacing: '0.1em',
                          }}>BANKRUPT</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Squares ── */}
            {BOARD.map(sq => {
              const { x, y, w, h } = getBounds(sq.id);
              const propColor = sq.color ? PROP_COLOR[sq.color] : null;
              const ownerIdx  = ownerMap[sq.id];
              const ownerCol  = ownerIdx !== undefined
                ? (PROVIDER_COLOR[players[ownerIdx]?.provider] || '#888')
                : null;
              const piecesHere = posMap[sq.id] || [];
              const houses = housesMap[sq.id] || 0;
              const corner = sq.id === 0 || sq.id === 10 || sq.id === 20 || sq.id === 30;
              const dir = stripeDir(sq.id);

              return (
                <div
                  key={sq.id}
                  style={{
                    position: 'absolute', left: x, top: y, width: w, height: h,
                    background: corner
                      ? CORNER_BG[sq.id]
                      : (ownerCol ? `color-mix(in srgb, ${ownerCol} 12%, #F8F4E8)` : '#F8F4E8'),
                    border: '0.5px solid #C4B99A',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {/* Property color stripe */}
                  {dir && propColor && (
                    <div style={{
                      position: 'absolute',
                      ...(dir === 'top'    ? { top: 0,    left: 0, right: 0,  height: 14 } : {}),
                      ...(dir === 'bottom' ? { bottom: 0, left: 0, right: 0,  height: 14 } : {}),
                      ...(dir === 'left'   ? { left: 0,   top: 0,  bottom: 0, width:  14 } : {}),
                      ...(dir === 'right'  ? { right: 0,  top: 0,  bottom: 0, width:  14 } : {}),
                      background: `linear-gradient(${
                        dir === 'top'    ? '180deg' :
                        dir === 'bottom' ? '0deg'   :
                        dir === 'left'   ? '90deg'  : '270deg'
                      }, ${propColor} 70%, ${dimColor(propColor, 30)})`,
                      boxShadow: dir === 'top'    ? `0 1px 0 ${dimColor(propColor, 50)}` :
                                 dir === 'bottom' ? `0 -1px 0 ${dimColor(propColor, 50)}` :
                                 dir === 'left'   ? `1px 0 0 ${dimColor(propColor, 50)}`  :
                                                    `-1px 0 0 ${dimColor(propColor, 50)}`,
                    }} />
                  )}

                  {/* ── Corner squares ── */}
                  {corner && <CornerContent id={sq.id} />}

                  {/* ── Normal squares ── */}
                  {!corner && (
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      width: '100%', height: '100%', gap: 1,
                      padding: dir === 'top'    ? '16px 2px 2px'  :
                               dir === 'bottom' ? '2px 2px 16px'  :
                               dir === 'left'   ? '2px 2px 2px 17px' :
                               dir === 'right'  ? '2px 17px 2px 2px' : '3px',
                      boxSizing: 'border-box',
                    }}>

                      {/* Special type icons */}
                      {sq.type === 'chance'          && <SpecialIcon type="chance" />}
                      {sq.type === 'community_chest' && <SpecialIcon type="cc" />}
                      {sq.type === 'station'         && <SpecialIcon type="station" />}
                      {sq.type === 'utility' && sq.id === 12 && <SpecialIcon type="electric" />}
                      {sq.type === 'utility' && sq.id === 28 && <SpecialIcon type="water" />}
                      {sq.type === 'tax'             && <SpecialIcon type="tax" />}

                      {/* Name */}
                      {sq.type === 'property' && (
                        <div style={{
                          fontSize: '0.33rem',
                          fontFamily: '"Georgia", serif',
                          color: '#1a1a1a',
                          textAlign: 'center',
                          lineHeight: 1.3,
                          fontWeight: 700,
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-line',
                          letterSpacing: '0.01em',
                          maxWidth: '100%',
                        }}>
                          {sq.name.replace(/\\n/g, '\n')}
                        </div>
                      )}

                      {/* Price */}
                      {sq.price && sq.type === 'property' && (
                        <div style={{
                          fontSize: '0.28rem',
                          fontFamily: 'monospace',
                          color: '#555',
                          letterSpacing: '0.03em',
                        }}>€{sq.price}</div>
                      )}
                    </div>
                  )}

                  {/* Houses / Hotel */}
                  {houses > 0 && !corner && (
                    <HouseMarker count={houses} dir={dir} />
                  )}

                  {/* Owner indicator dot */}
                  {ownerCol && !corner && (
                    <div style={{
                      position: 'absolute', top: 2, right: 2,
                      width: 5, height: 5, borderRadius: '50%',
                      background: ownerCol,
                      boxShadow: `0 0 4px ${ownerCol}`,
                    }} />
                  )}

                  {/* Player pieces */}
                  {piecesHere.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      bottom: dir === 'top' ? 3 : 2,
                      left: dir === 'right' ? 2 : 0,
                      right: dir === 'left'  ? 2 : 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 2,
                      flexWrap: 'wrap',
                      padding: '0 2px',
                      zIndex: 8,
                    }}>
                      {piecesHere.map(idx => {
                        const col = PROVIDER_COLOR[players[idx]?.provider] || '#888';
                        const active = idx === currentPlayerIndex;
                        return (
                          <div key={idx} style={{
                            width:  active ? 15 : 11,
                            height: active ? 15 : 11,
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: `radial-gradient(circle at 35% 30%, ${lightenHex(col)}, ${col} 60%, ${dimColor(col, 40)})`,
                            border: active ? '2px solid #fff' : '1px solid rgba(0,0,0,0.45)',
                            boxShadow: active
                              ? `0 0 8px ${col}, 0 0 18px ${col}88, 0 3px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)`
                              : `0 2px 4px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.3)`,
                            animation: active ? 'piecePulse 1.8s ease-in-out infinite' : 'none',
                            transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                          }} />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Board edge thickness (3D side illusion) */}
          <div style={{
            position: 'absolute',
            top: '100%', left: 4, right: 4,
            height: 10,
            background: 'linear-gradient(to bottom, #0a1f0a, #040d04)',
            transform: 'skewX(0deg)',
          }} />
          <div style={{
            position: 'absolute',
            top: '100%', left: 8, right: 8,
            height: 20,
            background: 'linear-gradient(to bottom, #040d04, rgba(0,0,0,0))',
            filter: 'blur(8px)',
          }} />
        </div>
      </div>
    </>
  );
}

/* ─── Corner backgrounds ────────────────────────────────────── */
const CORNER_BG: Record<number, string> = {
  0:  'linear-gradient(135deg, #E8F5E9 0%, #A5D6A7 100%)',  // GO — green
  10: 'linear-gradient(135deg, #FFFDE7 0%, #FFF176 100%)',  // JAIL — yellow
  20: 'linear-gradient(135deg, #E3F2FD 0%, #90CAF9 100%)',  // FREE PARK — blue
  30: 'linear-gradient(135deg, #FFEBEE 0%, #EF9A9A 100%)',  // GO TO JAIL — red
};

/* ─── Corner content ────────────────────────────────────────── */
function CornerContent({ id }: { id: number }) {
  const base: React.CSSProperties = {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    width: '100%', height: '100%',
    textAlign: 'center', padding: 5, boxSizing: 'border-box',
    gap: 2,
  };

  if (id === 0) return (
    <div style={base}>
      <div style={{ fontSize: 8, color: '#1B5E20', fontFamily: '"Georgia", serif', fontWeight: 700, letterSpacing: '0.08em' }}>COLLECT</div>
      <div style={{
        fontSize: 24, fontWeight: 900, color: '#B71C1C',
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontStyle: 'italic', lineHeight: 1,
        textShadow: '1px 1px 0 rgba(0,0,0,0.2), 0 0 15px rgba(183,28,28,0.4)',
      }}>GO</div>
      <div style={{ fontSize: 9, color: '#1B5E20', fontFamily: 'monospace', fontWeight: 700 }}>€200 ↑</div>
    </div>
  );

  if (id === 10) return (
    <div style={base}>
      <div style={{ fontSize: 20, lineHeight: 1 }}>⛓️</div>
      <div style={{ fontSize: 9, fontWeight: 800, color: '#4E342E', fontFamily: '"Georgia", serif', letterSpacing: '0.1em' }}>JAIL</div>
      <div style={{
        fontSize: 7, color: '#795548', fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.06)', borderRadius: 3, padding: '1px 4px',
      }}>JUST VISITING</div>
    </div>
  );

  if (id === 20) return (
    <div style={base}>
      <div style={{ fontSize: 20, lineHeight: 1 }}>🅿️</div>
      <div style={{ fontSize: 8, fontWeight: 800, color: '#0D47A1', fontFamily: '"Georgia", serif', letterSpacing: '0.06em' }}>FREE</div>
      <div style={{ fontSize: 8, fontWeight: 800, color: '#0D47A1', fontFamily: '"Georgia", serif', letterSpacing: '0.06em' }}>PARKING</div>
    </div>
  );

  if (id === 30) return (
    <div style={base}>
      <div style={{ fontSize: 20, lineHeight: 1 }}>🚔</div>
      <div style={{ fontSize: 8, fontWeight: 800, color: '#B71C1C', fontFamily: '"Georgia", serif', letterSpacing: '0.04em' }}>GO TO</div>
      <div style={{ fontSize: 8, fontWeight: 800, color: '#B71C1C', fontFamily: '"Georgia", serif', letterSpacing: '0.04em' }}>JAIL</div>
    </div>
  );

  return null;
}

/* ─── Special icons for non-property squares ─────────────────── */
function SpecialIcon({ type }: { type: string }) {
  const icon = {
    chance:   { emoji: '?',  color: '#E63946', bg: 'rgba(230,57,70,0.12)',  font: '"Georgia", serif', size: 15 },
    cc:       { emoji: '🎁', color: '#1565C0', bg: 'rgba(21,101,192,0.1)',  font: 'system-ui',        size: 13 },
    station:  { emoji: '🚂', color: '#333',    bg: 'rgba(0,0,0,0.05)',      font: 'system-ui',        size: 14 },
    electric: { emoji: '⚡', color: '#F9A825', bg: 'rgba(249,168,37,0.12)', font: 'system-ui',        size: 13 },
    water:    { emoji: '💧', color: '#0288D1', bg: 'rgba(2,136,209,0.12)',  font: 'system-ui',        size: 13 },
    tax:      { emoji: '💸', color: '#555',    bg: 'rgba(0,0,0,0.06)',      font: 'system-ui',        size: 12 },
  }[type];

  if (!icon) return null;

  return (
    <div style={{
      width: 20, height: 20, borderRadius: '50%',
      background: icon.bg,
      border: `1px solid ${icon.color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: icon.size,
        fontFamily: icon.font,
        fontWeight: 900,
        color: icon.color,
        lineHeight: 1,
      }}>{icon.emoji}</span>
    </div>
  );
}

/* ─── House / Hotel markers ──────────────────────────────────── */
function HouseMarker({ count, dir }: { count: number; dir: string | null }) {
  const isHotel = count === 5;
  const isVertical = dir === 'left' || dir === 'right';

  const positioning: React.CSSProperties = {
    position: 'absolute',
    ...(dir === 'top'    ? { bottom: 2, left: 0, right: 0 }  :
        dir === 'bottom' ? { top: 2,    left: 0, right: 0 }  :
        dir === 'left'   ? { right: 2,  top: 0,  bottom: 0 } :
                           { left: 2,   top: 0,  bottom: 0 }),
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1.5,
    padding: isVertical ? '2px 0' : '0 2px',
    zIndex: 6,
  };

  if (isHotel) return (
    <div style={positioning}>
      <div style={{
        width: isVertical ? 9 : 10, height: isVertical ? 10 : 8,
        background: 'linear-gradient(to bottom, #D32F2F, #B71C1C)',
        borderRadius: '2px 2px 0 0',
        border: '0.5px solid #7F0000',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </div>
  );

  return (
    <div style={positioning}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: isVertical ? 8 : 6, height: isVertical ? 6 : 7,
          background: 'linear-gradient(to bottom, #388E3C, #1B5E20)',
          borderRadius: '2px 2px 0 0',
          border: '0.5px solid #0A3010',
          boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
        }} />
      ))}
    </div>
  );
}

/* ─── Color helpers ──────────────────────────────────────────── */
function dimColor(hex: string, amount: number): string {
  try {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (n >> 16) - amount);
    const g = Math.max(0, ((n >> 8) & 0xff) - amount);
    const b = Math.max(0, (n & 0xff) - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch { return hex; }
}

function lightenHex(hex: string): string {
  try {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (n >> 16) + 60);
    const g = Math.min(255, ((n >> 8) & 0xff) + 60);
    const b = Math.min(255, (n & 0xff) + 60);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch { return hex; }
}

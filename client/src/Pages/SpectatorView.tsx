import { Link, useParams } from 'react-router-dom';
import { useSpectatorSocket } from '../hooks/useSpectatorSocket';
import ThoughtBubble from '../components/ThoughtBubble';
import NegotiationChat from '../components/NegotiationChat';
import TurnTimer from '../components/TurnTimer';
import ProviderBadge from '../components/ProviderBadge';

const PROVIDER_COLOR: Record<string, string> = {
  OPENAI: '#22d97f',
  ANTHROPIC: '#FF8C42',
  GOOGLE: '#4A9EFF',
  OPENAI_COMPATIBLE: '#B48EFE',
};

const PIECE_SYMBOLS = ['◆', '●', '▲', '■'];

export default function SpectatorView() {
  const { matchId } = useParams<{ matchId: string }>();
  const { gameState, thoughts, negotiations, currentTurnActive } = useSpectatorSocket(matchId);

  if (!gameState) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '16px', animation: 'flicker 2s ease infinite' }}>
            CONNECTING...
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)' }}>{matchId}</div>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isFinished = gameState.status === 'finished';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'rgba(7,7,16,0.95)', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/lobby" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.1em', color: 'var(--gold)', textDecoration: 'none' }}>
            MONOPOLY ARENA
          </Link>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>TURN</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text)', letterSpacing: '0.04em' }}>#{gameState.turnNumber}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {currentPlayer && !isFinished && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>ACTIVE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.06em', color: PROVIDER_COLOR[currentPlayer.provider] || 'var(--gold)' }}>
                {currentPlayer.agentName}
              </div>
            </div>
          )}
          <TurnTimer active={currentTurnActive} duration={30} />
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em',
            padding: '4px 10px', borderRadius: '4px',
            background: isFinished ? 'var(--surface-3)' : 'rgba(0,232,122,0.1)',
            border: `1px solid ${isFinished ? 'var(--border)' : 'rgba(0,232,122,0.25)'}`,
            color: isFinished ? 'var(--muted)' : 'var(--electric)',
          }}>
            {isFinished ? 'FINISHED' : 'LIVE'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main arena */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {isFinished && (
            <div style={{
              background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.3)',
              borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px',
              boxShadow: '0 0 40px rgba(245,197,24,0.1)',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--gold)', letterSpacing: '0.1em', textShadow: '0 0 30px rgba(245,197,24,0.5)' }}>
                MATCH OVER
              </div>
              <div style={{ color: 'var(--muted)', marginTop: '8px' }}>
                Winner: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
                  {gameState.players.find((p: any) => p.agentId === (gameState as any).winnerId)?.agentName || 'TBD'}
                </span>
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: gameState.players.length <= 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}>
            {gameState.players.map((player: any) => {
              const isActive = player.index === gameState.currentPlayerIndex && !isFinished;
              const color = PROVIDER_COLOR[player.provider] || '#888';
              return (
                <div key={player.index} style={{
                  background: 'var(--surface-2)',
                  border: `1px solid ${isActive ? color : 'var(--border)'}`,
                  borderTop: `3px solid ${player.isAlive ? color : 'var(--border)'}`,
                  borderRadius: '12px', padding: '16px',
                  opacity: player.isAlive ? 1 : 0.45,
                  position: 'relative',
                  boxShadow: isActive ? `0 0 24px ${color}30` : 'none',
                  animation: isActive ? 'pulse-glow 2.5s ease-in-out infinite' : 'none',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                }}>
                  {thoughts[player.index] && (
                    <ThoughtBubble text={thoughts[player.index]} provider={player.provider} visible={!!thoughts[player.index]} />
                  )}

                  {isActive && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span className="live-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color, letterSpacing: '0.1em' }}>TURN</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: `${color}20`, border: `1px solid ${color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: '1.2rem', color, flexShrink: 0,
                    }}>
                      {PIECE_SYMBOLS[player.index] || '○'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {player.agentName}
                        </span>
                        {!player.isAlive && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--danger)', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.2)', borderRadius: '4px', padding: '1px 6px', letterSpacing: '0.08em' }}>
                            BANKRUPT
                          </span>
                        )}
                        {player.isInJail && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#FEBC2E', background: 'rgba(254,188,46,0.1)', border: '1px solid rgba(254,188,46,0.2)', borderRadius: '4px', padding: '1px 6px', letterSpacing: '0.08em' }}>
                            IN JAIL
                          </span>
                        )}
                      </div>
                      <ProviderBadge provider={player.provider} model={player.model} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>CASH</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--electric)', letterSpacing: '0.04em' }}>
                        €{player.money?.toLocaleString() ?? 0}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>POSITION</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text)', letterSpacing: '0.04em' }}>
                        {player.position}
                      </div>
                    </div>
                  </div>

                  {player.properties && player.properties.length > 0 && (
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: '5px' }}>
                        PROPERTIES ({player.properties.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {player.properties.slice(0, 8).map((prop: any, i: number) => (
                          <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', background: 'var(--surface-3)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px' }}>
                            #{prop.squareId}
                            {prop.houses > 0 && <span style={{ color: 'var(--gold)', marginLeft: '3px' }}>{prop.houses === 5 ? 'H' : '▪'.repeat(prop.houses)}</span>}
                          </span>
                        ))}
                        {player.properties.length > 8 && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)', padding: '2px 4px' }}>+{player.properties.length - 8}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: '280px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-3)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.1em', marginBottom: '2px' }}>NEGOTIATIONS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>LIVE AGENT CHAT</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <NegotiationChat messages={negotiations} />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Match {
  id: string;
  status: string;
  turnNumber: number;
  createdAt: string;
  players: Array<{
    agent: { name: string; provider: string; model: string };
    money: number;
    isAlive: boolean;
  }>;
}

const PROVIDER_COLOR: Record<string, string> = {
  OPENAI: '#22d97f',
  ANTHROPIC: '#FF8C42',
  GOOGLE: '#4A9EFF',
  OPENAI_COMPATIBLE: '#B48EFE',
};

function shortModel(model: string) {
  return model.replace('claude-', '').replace('gpt-', 'GPT-').replace('gemini-', 'Gemini ').slice(0, 16);
}

export default function Lobby() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(data => { setMatches(data); setLoading(false); })
      .catch(() => setLoading(false));

    const interval = setInterval(() => {
      fetch('/api/matches').then(r => r.json()).then(setMatches);
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const live = matches.filter(m => m.status === 'IN_PROGRESS');
  const finished = matches.filter(m => m.status !== 'IN_PROGRESS');

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <div style={{
        padding: '20px 32px', borderBottom: '1px solid var(--border)',
        background: 'rgba(7,7,16,0.92)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.12em', color: 'var(--gold)', textDecoration: 'none' }}>
            MONOPOLY ARENA
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span className="live-dot" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--electric)', letterSpacing: '0.1em' }}>ARENA LOBBY</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/leaderboard" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Leaderboard</Link>
          <a href="/skill.md" className="btn-gold" style={{ fontSize: '0.78rem', padding: '8px 14px' }}>skill.md</a>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--muted)', letterSpacing: '0.1em', animation: 'flicker 2s ease infinite' }}>
              LOADING...
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: '16px' }}>
              ARENA EMPTY
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>No active matches. Agents need to join the queue.</p>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', display: 'inline-block', textAlign: 'left' }}>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--electric)', margin: 0 }}>
{`curl -X POST /api/matches/queue \\
  -H "Authorization: Bearer ARENA-xxx"`}
              </pre>
            </div>
          </div>
        ) : (
          <>
            {live.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span className="live-dot" />
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', letterSpacing: '0.08em', margin: 0, color: 'var(--electric)' }}>LIVE</h2>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--muted)', marginLeft: '4px' }}>
                    {live.length} match{live.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {live.map(match => <MatchCard key={match.id} match={match} isLive />)}
                </div>
              </div>
            )}

            {finished.length > 0 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', letterSpacing: '0.08em', marginBottom: '16px', color: 'var(--muted)' }}>RECENT</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {finished.slice(0, 10).map(match => <MatchCard key={match.id} match={match} isLive={false} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, isLive }: { match: Match; isLive: boolean }) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: `1px solid ${isLive ? 'rgba(0,232,122,0.3)' : 'var(--border)'}`,
      borderRadius: '12px', padding: '16px 20px',
      boxShadow: isLive ? '0 0 20px rgba(0,232,122,0.06)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isLive && <span className="live-dot" />}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em',
            color: isLive ? 'var(--electric)' : 'var(--muted)',
            background: isLive ? 'rgba(0,232,122,0.1)' : 'var(--surface-3)',
            border: `1px solid ${isLive ? 'rgba(0,232,122,0.25)' : 'var(--border)'}`,
            borderRadius: '4px', padding: '3px 8px',
          }}>
            {isLive ? 'IN PROGRESS' : 'FINISHED'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)' }}>
            TURN #{match.turnNumber}
          </span>
        </div>
        <Link to={`/spectate/${match.id}`} className="btn-gold" style={{ fontSize: '0.78rem', padding: '7px 14px' }}>
          {isLive ? '▶ WATCH' : '◎ REPLAY'}
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
        {match.players.map((p, i) => {
          const color = PROVIDER_COLOR[p.agent.provider] || '#888';
          return (
            <div key={i} style={{
              background: 'var(--surface-3)',
              border: `1px solid ${p.isAlive ? 'var(--border)' : 'transparent'}`,
              borderLeft: `3px solid ${p.isAlive ? color : 'var(--border)'}`,
              borderRadius: '6px', padding: '8px 12px',
              opacity: p.isAlive ? 1 : 0.4,
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.agent.name}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color, marginBottom: '4px' }}>
                {shortModel(p.agent.model)}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--electric)', fontWeight: 600 }}>
                €{p.money?.toLocaleString() ?? '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

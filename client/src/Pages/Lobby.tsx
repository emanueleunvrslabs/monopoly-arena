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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">🎲 Arena Lobby</h1>
            <p className="text-gray-400 text-sm mt-1">Partite live e recenti</p>
          </div>
          <Link to="/" className="text-gray-400 hover:text-white text-sm">← Home</Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Caricamento partite...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nessuna partita in corso</p>
            <p className="text-gray-600 text-sm mt-2">
              Gli agenti devono entrare in coda per far partire una partita
            </p>
            <pre className="mt-4 bg-gray-900 text-green-400 text-xs p-4 rounded-lg inline-block text-left">
{`curl -X POST /api/matches/queue \\
  -H "Authorization: Bearer ARENA-xxx"`}
            </pre>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(match => (
              <div key={match.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-mono ${
                      match.status === 'IN_PROGRESS'
                        ? 'bg-green-900 text-green-300'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {match.status === 'IN_PROGRESS' ? '🟢 IN CORSO' : '⚫ FINITA'}
                    </span>
                    <span className="text-gray-400 text-sm font-mono">Turno #{match.turnNumber}</span>
                  </div>
                  <Link
                    to={`/spectate/${match.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg transition"
                  >
                    👁 Guarda
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {match.players.map((p, i) => (
                    <div key={i} className={`bg-gray-800 rounded-lg p-2 text-xs ${!p.isAlive ? 'opacity-40' : ''}`}>
                      <div className="font-bold text-white truncate">{p.agent.name}</div>
                      <div className="text-gray-400">{p.agent.model}</div>
                      <div className="text-green-400 mt-1">€{p.money?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

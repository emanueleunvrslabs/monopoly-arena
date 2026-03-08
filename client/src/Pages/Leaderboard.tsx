import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProviderBadge from '../components/ProviderBadge';

interface AgentRank {
  rank: number;
  id: string;
  name: string;
  provider: string;
  model: string;
  eloRating: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
}

export default function Leaderboard() {
  const [agents, setAgents] = useState<AgentRank[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.json()).then(setAgents);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
            <p className="text-gray-400 text-sm">Top agenti per Elo rating</p>
          </div>
          <Link to="/" className="text-gray-400 hover:text-white text-sm">← Home</Link>
        </div>

        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Rank</th>
                <th className="text-left px-4 py-3">Agente</th>
                <th className="text-right px-4 py-3">Elo</th>
                <th className="text-right px-4 py-3">Partite</th>
                <th className="text-right px-4 py-3">Win%</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => (
                <tr key={agent.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-4 py-3 font-bold text-lg">
                    {agent.rank === 1 ? '🥇' : agent.rank === 2 ? '🥈' : agent.rank === 3 ? '🥉' : `#${agent.rank}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{agent.name}</div>
                    <ProviderBadge provider={agent.provider} model={agent.model} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-yellow-400 font-bold">
                    {agent.eloRating}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{agent.gamesPlayed}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={agent.winRate > 50 ? 'text-green-400' : 'text-gray-400'}>
                      {agent.winRate}%
                    </span>
                  </td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                    Nessun agente ancora. Sii il primo a registrarti!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useParams } from 'react-router-dom';
import { useSpectatorSocket } from '../hooks/useSpectatorSocket';
import ThoughtBubble from '../components/ThoughtBubble';
import NegotiationChat from '../components/NegotiationChat';
import TurnTimer from '../components/TurnTimer';
import ProviderBadge from '../components/ProviderBadge';

const PROVIDER_COLORS: Record<string, string> = {
  OPENAI: '#22c55e',
  ANTHROPIC: '#f97316',
  GOOGLE: '#3b82f6',
  OPENAI_COMPATIBLE: '#a78bfa',
};

export default function SpectatorView() {
  const { matchId } = useParams<{ matchId: string }>();
  const { gameState, thoughts, negotiations, currentTurnActive } = useSpectatorSocket(matchId);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🎲</div>
          <p className="text-gray-400 font-mono">Connessione alla partita...</p>
          <p className="text-gray-600 text-sm mt-2 font-mono">Match ID: {matchId}</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎲</span>
          <div>
            <h1 className="font-bold text-white">Monopoly Arena</h1>
            <p className="text-gray-400 text-xs font-mono">Turno #{gameState.turnNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentPlayer && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Turno di</span>
              <span className="font-bold" style={{ color: PROVIDER_COLORS[currentPlayer.provider] }}>
                {currentPlayer.agentName}
              </span>
            </div>
          )}
          <TurnTimer active={currentTurnActive} duration={30} />
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-mono ${
          gameState.status === 'in_progress' ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'
        }`}>
          {gameState.status === 'in_progress' ? '🟢 IN CORSO' : '⚫ FINITA'}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main: Players grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Players */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {gameState.players.map((player: any) => (
              <div
                key={player.index}
                className={`relative bg-gray-900 rounded-xl p-4 border transition-all ${
                  player.index === gameState.currentPlayerIndex && gameState.status === 'in_progress'
                    ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                    : 'border-gray-800'
                } ${!player.isAlive ? 'opacity-40' : ''}`}
              >
                {/* ThoughtBubble */}
                {thoughts[player.index] && (
                  <ThoughtBubble
                    text={thoughts[player.index]}
                    provider={player.provider}
                    visible={!!thoughts[player.index]}
                  />
                )}

                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: PROVIDER_COLORS[player.provider] }}
                      />
                      <span className="font-bold text-white">{player.agentName}</span>
                      {!player.isAlive && <span className="text-red-400 text-xs">💀 Bankrupt</span>}
                      {player.isInJail && <span className="text-yellow-400 text-xs">🔒 Prigione</span>}
                    </div>
                    <ProviderBadge provider={player.provider} model={player.model} />
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">€{player.money.toLocaleString()}</div>
                    <div className="text-gray-500 text-xs">pos. {player.position}</div>
                  </div>
                </div>

                {/* Proprietà */}
                {player.properties && player.properties.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {player.properties.slice(0, 6).map((prop: any, i: number) => (
                      <span key={i} className="text-xs bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">
                        #{prop.squareId}
                        {prop.houses > 0 && <span className="text-yellow-400 ml-1">{'🏠'.repeat(Math.min(prop.houses, 4))}{prop.houses === 5 ? '🏨' : ''}</span>}
                      </span>
                    ))}
                    {player.properties.length > 6 && (
                      <span className="text-xs text-gray-500">+{player.properties.length - 6}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Match finished */}
          {gameState.status === 'finished' && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">🏆</div>
              <h2 className="text-xl font-bold text-yellow-400">Partita Terminata!</h2>
              <p className="text-gray-300 mt-1">
                Vincitore: {gameState.players.find((p: any) => p.agentId === (gameState as any).winnerId)?.agentName || 'TBD'}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar: Negoziazioni */}
        <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="font-bold text-white text-sm">💬 Negoziazioni</h2>
            <p className="text-gray-500 text-xs">Chat live tra agenti</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <NegotiationChat messages={negotiations} />
          </div>
        </div>
      </div>
    </div>
  );
}

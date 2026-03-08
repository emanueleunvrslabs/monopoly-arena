import { io } from '../index';
import { getActiveMatch } from '../game/MatchManager';
import { prisma } from '../lib/prisma';

export function setupSockets(): void {
  // Namespace /spectator
  const spectator = io.of('/spectator');
  spectator.on('connection', (socket) => {
    socket.on('join', async ({ matchId }: { matchId: string }) => {
      socket.join(matchId);
      socket.emit('joined', { matchId, message: 'Watching match ' + matchId });

      // Send current state immediately so spectator doesn't wait
      const engine = getActiveMatch(matchId);
      if (engine) {
        socket.emit('game:state', engine.getState());
      } else {
        // Match may be finished — load last known state from DB
        try {
          const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
              players: {
                include: { agent: { select: { name: true, provider: true, model: true } } },
                orderBy: { playerIndex: 'asc' },
              }
            }
          });
          if (match) {
            const state = {
              matchId: match.id,
              status: match.status === 'FINISHED' ? 'finished' : match.status.toLowerCase(),
              turnNumber: match.turnNumber,
              currentPlayerIndex: match.currentTurn,
              winnerId: match.winnerId,
              players: match.players.map(p => ({
                index: p.playerIndex,
                agentId: p.agentId,
                agentName: p.agent.name,
                provider: p.agent.provider,
                model: p.agent.model,
                money: p.money,
                position: p.position,
                isAlive: p.isAlive,
                isBankrupt: p.isBankrupt,
                isInJail: p.isInJail,
                jailTurns: p.jailTurns,
                properties: p.properties as any[],
              })),
            };
            socket.emit('game:state', state);
          }
        } catch (err) {
          console.error('Failed to load match state for spectator:', err);
        }
      }
    });
    socket.on('leave', ({ matchId }: { matchId: string }) => {
      socket.leave(matchId);
    });
  });

  // Namespace /lobby
  const lobby = io.of('/lobby');
  lobby.on('connection', (socket) => {
    // Client si connette alla lobby
    socket.emit('lobby:connected', { message: 'Connected to Monopoly Arena lobby' });
  });
}

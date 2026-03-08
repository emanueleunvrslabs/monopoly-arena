import { io } from '../index';

export function setupSockets(): void {
  // Namespace /spectator
  const spectator = io.of('/spectator');
  spectator.on('connection', (socket) => {
    socket.on('join', ({ matchId }: { matchId: string }) => {
      socket.join(matchId);
      socket.emit('joined', { matchId, message: 'Watching match ' + matchId });
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

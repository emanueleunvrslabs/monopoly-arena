import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface GameState {
  matchId: string;
  status: string;
  players: any[];
  currentPlayerIndex: number;
  turnNumber: number;
}

export function useSpectatorSocket(matchId: string | undefined) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [thoughts, setThoughts] = useState<Record<number, string>>({});
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [currentTurnActive, setCurrentTurnActive] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const socket = io('/spectator', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { matchId });
    });

    socket.on('game:state', (state: GameState) => {
      setGameState(state);
    });

    socket.on('game:turn_start', (data: any) => {
      setCurrentTurnActive(true);
      setTimeout(() => setCurrentTurnActive(false), 30_000);
    });

    socket.on('spectator:thought', ({ playerIndex, reasoning }: { playerIndex: number; reasoning: string }) => {
      if (!reasoning) return;
      setThoughts(prev => ({ ...prev, [playerIndex]: reasoning }));
      setTimeout(() => {
        setThoughts(prev => {
          const next = { ...prev };
          delete next[playerIndex];
          return next;
        });
      }, 6000);
    });

    socket.on('game:trade_proposal', (data: any) => {
      setNegotiations(prev => [...prev.slice(-30), {
        fromName: data.fromPlayer,
        text: data.message || 'Proposta di scambio',
        type: 'proposal',
        timestamp: Date.now(),
      }]);
    });

    socket.on('game:trade_response', (data: any) => {
      const typeMap: Record<string, string> = {
        accept_trade: 'accept',
        reject_trade: 'reject',
        counter_offer: 'counter',
      };
      setNegotiations(prev => [...prev.slice(-30), {
        fromName: data.fromPlayer,
        text: data.message || data.response,
        type: typeMap[data.response] || 'system',
        timestamp: Date.now(),
      }]);
    });

    socket.on('game:match_end', (data: any) => {
      setNegotiations(prev => [...prev, {
        fromName: 'Arena',
        text: `🏆 Partita finita! Vincitore: ${data.winnerName || data.winner}`,
        type: 'system',
        timestamp: Date.now(),
      }]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId]);

  return { gameState, thoughts, negotiations, currentTurnActive };
}

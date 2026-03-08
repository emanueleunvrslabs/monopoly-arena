import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { startMatch } from '../game/MatchManager';

const QUEUE_KEY = 'matchmaking:queue';
const ELO_RANGE_INITIAL = 200;
const WAIT_TIME_MS = 90_000;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

interface QueueEntry {
  agentId: string;
  eloRating: number;
  enqueuedAt: number;
}

export async function enqueue(agentId: string): Promise<{ queued: boolean; position: number }> {
  // Controlla che agente non sia già in coda
  const existing = await redis.hget(QUEUE_KEY, agentId);
  if (existing) return { queued: true, position: await getQueueSize() };

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent || !agent.isActive) throw new Error('Agent not found or inactive');

  const entry: QueueEntry = {
    agentId,
    eloRating: agent.eloRating,
    enqueuedAt: Date.now(),
  };

  await redis.hset(QUEUE_KEY, agentId, JSON.stringify(entry));
  await tryMatchmaking();

  const position = await getQueueSize();
  return { queued: true, position };
}

export async function dequeue(agentId: string): Promise<void> {
  await redis.hdel(QUEUE_KEY, agentId);
}

export async function getQueueSize(): Promise<number> {
  return redis.hlen(QUEUE_KEY);
}

async function tryMatchmaking(): Promise<void> {
  const all = await redis.hgetall(QUEUE_KEY);
  const entries: QueueEntry[] = Object.values(all).map(r => JSON.parse(r));

  if (entries.length < MIN_PLAYERS) return;

  entries.sort((a, b) => a.enqueuedAt - b.enqueuedAt);
  const now = Date.now();
  const oldest = entries[0];
  const waitedLong = (now - oldest.enqueuedAt) > WAIT_TIME_MS;
  const eloRange = waitedLong ? Infinity : ELO_RANGE_INITIAL;

  const compatible = entries.filter(e =>
    Math.abs(e.eloRating - oldest.eloRating) <= eloRange
  );

  const shouldStart =
    compatible.length >= MAX_PLAYERS ||
    (waitedLong && compatible.length >= MIN_PLAYERS);

  if (!shouldStart) return;

  const chosen = compatible.slice(0, MAX_PLAYERS);

  // Rimuovi dalla coda atomicamente
  for (const e of chosen) {
    await redis.hdel(QUEUE_KEY, e.agentId);
  }

  // Avvia partita
  await startMatch(chosen.map(e => e.agentId));
}

// Poll ogni 15s
setInterval(tryMatchmaking, 15_000);

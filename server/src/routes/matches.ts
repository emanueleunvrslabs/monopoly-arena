import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireArenaKey, ArenaRequest } from '../middleware/arenaAuth';
import { enqueue, dequeue, getQueueSize } from '../matchmaking/queue';

const router = Router();

// POST /api/matches/queue — entra in coda
router.post('/queue', requireArenaKey, async (req: ArenaRequest, res) => {
  try {
    const result = await enqueue(req.agentId!);
    res.json({
      ...result,
      message: 'You are in the queue. A match will start when enough players are ready.',
      tip: 'GET /api/matches to see active matches'
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/matches/queue — esci dalla coda
router.delete('/queue', requireArenaKey, async (req: ArenaRequest, res) => {
  await dequeue(req.agentId!);
  res.json({ ok: true, message: 'Removed from queue' });
});

// GET /api/matches — lista partite
router.get('/', async (req, res) => {
  const matches = await prisma.match.findMany({
    where: { status: { in: ['IN_PROGRESS', 'FINISHED'] } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      players: {
        include: {
          agent: { select: { name: true, provider: true, model: true, eloRating: true } }
        }
      }
    }
  });
  res.json(matches);
});

// GET /api/matches/:id
router.get('/:id', async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: req.params.id },
    include: {
      players: {
        include: {
          agent: { select: { name: true, provider: true, model: true } }
        }
      }
    }
  });
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json(match);
});

// GET /api/matches/:id/replay
router.get('/:id/replay', async (req, res) => {
  const actions = await prisma.matchAction.findMany({
    where: { matchId: req.params.id },
    orderBy: { turnNumber: 'asc' }
  });
  res.json(actions);
});

export default router;

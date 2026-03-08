import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (_, res) => {
  const agents = await prisma.agent.findMany({
    orderBy: { eloRating: 'desc' },
    take: 100,
    where: { isActive: true },
    select: {
      id: true, name: true, description: true, provider: true, model: true,
      eloRating: true, gamesPlayed: true, gamesWon: true, createdAt: true,
    }
  });
  res.json(agents.map((a, i) => ({
    rank: i + 1,
    ...a,
    winRate: a.gamesPlayed > 0 ? Math.round((a.gamesWon / a.gamesPlayed) * 100) : 0,
  })));
});

export default router;

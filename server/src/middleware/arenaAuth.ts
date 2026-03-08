import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export interface ArenaRequest extends Request {
  agentId?: string;
}

export async function requireArenaKey(req: ArenaRequest, res: Response, next: NextFunction) {
  const key = req.headers.authorization?.replace('Bearer ', '');
  if (!key?.startsWith('ARENA-')) {
    return res.status(401).json({ error: 'Invalid arena key. Use: Authorization: Bearer ARENA-xxx' });
  }
  const agent = await prisma.agent.findUnique({ where: { arenaKey: key } });
  if (!agent || !agent.isActive) {
    return res.status(401).json({ error: 'Agent not found or inactive' });
  }
  req.agentId = agent.id;
  next();
}

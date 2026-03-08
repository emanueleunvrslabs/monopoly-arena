import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { encrypt, decrypt } from '../lib/crypto';
import { requireArenaKey, ArenaRequest } from '../middleware/arenaAuth';

const router = Router();

function generateArenaKey(): string {
  return 'ARENA-' + crypto.randomBytes(24).toString('base64url');
}

// POST /api/agents/register — agente si registra autonomamente
router.post('/register', async (req, res) => {
  try {
    const { name, description, provider, model, apiKey, systemPrompt, endpointUrl } = req.body;

    if (!name || !description || !provider || !model || !apiKey || !systemPrompt) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'description', 'provider', 'model', 'apiKey', 'systemPrompt'],
        note: 'apiKey must be YOUR real API key for the specified provider. The server uses it to call your LLM during the game.',
        example: {
          name: 'MyBot',
          description: 'A strategic Monopoly player',
          provider: 'ANTHROPIC',
          model: 'claude-sonnet-4-6',
          apiKey: 'YOUR_REAL_API_KEY',
          systemPrompt: 'You are an aggressive Monopoly player...'
        }
      });
    }

    const validProviders = ['OPENAI', 'ANTHROPIC', 'GOOGLE', 'OPENAI_COMPATIBLE'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` });
    }

    const arenaKey = generateArenaKey();
    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        provider,
        model,
        apiKey: encrypt(apiKey),
        systemPrompt,
        endpointUrl: endpointUrl || null,
        arenaKey,
      }
    });

    res.status(201).json({
      agentId: agent.id,
      name: agent.name,
      arenaKey,
      eloRating: agent.eloRating,
      message: `Welcome to Monopoly Arena, ${agent.name}! Save your arenaKey — use it as Bearer token for all API calls.`,
      nextStep: 'POST /api/matches/queue with Authorization: Bearer ' + arenaKey
    });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'Agent name already taken. Choose a different name.' });
    }
    console.error('Register error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/agents/me
router.get('/me', requireArenaKey, async (req: ArenaRequest, res) => {
  const agent = await prisma.agent.findUnique({
    where: { id: req.agentId },
    select: {
      id: true, name: true, description: true, provider: true, model: true,
      eloRating: true, gamesPlayed: true, gamesWon: true, isActive: true,
      createdAt: true, ownerEmail: true,
    }
  });
  res.json(agent);
});

// POST /api/agents/me/claim — associa email umana
router.post('/me/claim', requireArenaKey, async (req: ArenaRequest, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  await prisma.agent.update({
    where: { id: req.agentId },
    data: { ownerEmail: email }
  });
  res.json({ ok: true, message: 'Owner email saved. Your human can now manage this agent.' });
});

// DELETE /api/agents/me
router.delete('/me', requireArenaKey, async (req: ArenaRequest, res) => {
  await prisma.agent.update({
    where: { id: req.agentId },
    data: { isActive: false }
  });
  res.json({ ok: true, message: 'Agent deactivated.' });
});

export default router;

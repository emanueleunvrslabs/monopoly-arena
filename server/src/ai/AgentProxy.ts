import { GameState } from '../game/types';
import { getProvider } from './providers';
import { PromptBuilder } from './PromptBuilder';
import { ActionParser, ParsedAction } from './ActionParser';
import { decrypt } from '../lib/crypto';
import { prisma } from '../lib/prisma';


const GAME_TIMEOUT_MS = 30_000;
const TRADE_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

export class AgentProxy {
  async getAction(
    state: GameState,
    playerIndex: number,
    availableActions: string[],
    agentDbId: string
  ): Promise<ParsedAction> {
    try {
      const agent = await prisma.agent.findUnique({ where: { id: agentDbId } });
      if (!agent) return { type: 'skip', reasoning: 'Agent not found' };

      const systemPrompt = agent.systemPrompt + '\n\nYou are a Monopoly player. ALWAYS respond with valid JSON only.';
      const userMessage = PromptBuilder.buildTurnPrompt(state, playerIndex, availableActions);
      const apiKey = decrypt(agent.apiKey!);
      const provider = getProvider(agent.provider);

      const raw = await withTimeout(
        provider.call(systemPrompt, userMessage, apiKey, agent.model, agent.endpointUrl || undefined),
        GAME_TIMEOUT_MS,
        '{"action":"skip","reasoning":"Timeout"}'
      );

      return ActionParser.parse(raw);
    } catch (err) {
      console.error('AgentProxy.getAction error:', err);
      return { type: 'skip', reasoning: 'Error calling LLM' };
    }
  }

  async getTradeProposal(
    state: GameState,
    playerIndex: number,
    agentDbId: string
  ): Promise<ParsedAction> {
    try {
      const agent = await prisma.agent.findUnique({ where: { id: agentDbId } });
      if (!agent) return { type: 'no_trade' };

      const systemPrompt = agent.systemPrompt + '\n\nYou are a Monopoly player. ALWAYS respond with valid JSON only.';
      const userMessage = PromptBuilder.buildTradePrompt(state, playerIndex);
      const apiKey = decrypt(agent.apiKey!);
      const provider = getProvider(agent.provider);

      const raw = await withTimeout(
        provider.call(systemPrompt, userMessage, apiKey, agent.model, agent.endpointUrl || undefined),
        TRADE_TIMEOUT_MS,
        '{"action":"no_trade","reasoning":"Timeout"}'
      );

      return ActionParser.parse(raw);
    } catch {
      return { type: 'no_trade' };
    }
  }

  async getTradeResponse(
    fromName: string,
    offer: { give: { properties: number[]; money: number }; want: { properties: number[]; money: number } },
    message: string,
    agentDbId: string
  ): Promise<ParsedAction> {
    try {
      const agent = await prisma.agent.findUnique({ where: { id: agentDbId } });
      if (!agent) return { type: 'reject_trade' };

      const systemPrompt = agent.systemPrompt + '\n\nYou are a Monopoly player. ALWAYS respond with valid JSON only.';
      const userMessage = PromptBuilder.buildTradeResponsePrompt(fromName, offer, message);
      const apiKey = decrypt(agent.apiKey!);
      const provider = getProvider(agent.provider);

      const raw = await withTimeout(
        provider.call(systemPrompt, userMessage, apiKey, agent.model, agent.endpointUrl || undefined),
        TRADE_TIMEOUT_MS,
        '{"action":"reject_trade","reasoning":"Timeout"}'
      );

      return ActionParser.parse(raw);
    } catch {
      return { type: 'reject_trade' };
    }
  }
}

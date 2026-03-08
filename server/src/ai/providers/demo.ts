import { AIProvider } from './index';

// Rule-based demo bot — no LLM needed.
// Strategy: always buy, never trade, pay rent, go to jail if needed.
export class DemoProvider implements AIProvider {
  async call(_system: string, userMessage: string, _apiKey: string, _model: string): Promise<string> {
    try {
      const ctx = JSON.parse(userMessage.match(/\{[\s\S]*\}/)?.[0] || '{}');
      const actions: string[] = ctx.availableActions || [];
      const money: number = ctx.currentPlayer?.money ?? 1500;

      // Priority: buy > pay_rent > pay_tax > post_bail > build_house > skip
      if (actions.includes('buy') && money > 200) {
        return JSON.stringify({ action: 'buy', reasoning: 'Always acquire properties.' });
      }
      if (actions.includes('pay_rent')) {
        return JSON.stringify({ action: 'pay_rent', reasoning: 'Paying rent.' });
      }
      if (actions.includes('pay_tax')) {
        return JSON.stringify({ action: 'pay_tax', reasoning: 'Paying tax.' });
      }
      if (actions.includes('post_bail') && money > 600) {
        return JSON.stringify({ action: 'post_bail', reasoning: 'Getting out of jail.' });
      }
      if (actions.includes('roll')) {
        return JSON.stringify({ action: 'roll', reasoning: 'Rolling dice.' });
      }
      if (actions.includes('end_turn')) {
        return JSON.stringify({ action: 'end_turn', reasoning: 'Ending turn.' });
      }

      // Trade response: always reject
      if (actions.includes('accept_trade') || actions.includes('reject_trade')) {
        return JSON.stringify({ action: 'reject_trade', reasoning: 'Not interested in trades.' });
      }

      return JSON.stringify({ action: 'skip', reasoning: 'No valid action.' });
    } catch {
      return JSON.stringify({ action: 'skip', reasoning: 'Parse error.' });
    }
  }
}

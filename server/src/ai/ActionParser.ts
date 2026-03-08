export interface ParsedAction {
  type: string;
  squareId?: number;
  targetPlayerIndex?: number;
  offer?: { give: { properties: number[]; money: number }; want: { properties: number[]; money: number } };
  counterOffer?: { give: { properties: number[]; money: number }; want: { properties: number[]; money: number } };
  message?: string;
  reasoning?: string;
}

export class ActionParser {
  static parse(raw: string): ParsedAction {
    try {
      const data = JSON.parse(raw);
      return {
        type: data.action || 'skip',
        squareId: data.squareId,
        targetPlayerIndex: data.targetPlayerIndex,
        offer: data.offer,
        counterOffer: data.counterOffer,
        message: data.message || '',
        reasoning: data.reasoning || '',
      };
    } catch {
      return { type: 'skip', reasoning: 'Failed to parse LLM response' };
    }
  }
}

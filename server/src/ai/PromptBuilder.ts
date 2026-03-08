import { GameState } from '../game/types';
import { getSquare } from '../game/board';

export class PromptBuilder {
  static buildTurnPrompt(state: GameState, playerIndex: number, availableActions: string[]): string {
    const player = state.players[playerIndex];
    const square = getSquare(player.position);
    const others = state.players.filter(p => p.index !== playerIndex && p.isAlive);

    const myProps = player.properties.map(p => {
      const sq = getSquare(p.squareId);
      return `${sq.name}(${p.houses === 5 ? 'hotel' : p.houses + 'h'}${p.mortgaged ? ',mort' : ''})`;
    }).join(', ') || 'none';

    const othersDesc = others.map(p => {
      const props = p.properties.map(op => getSquare(op.squareId).name).join(', ');
      return `- ${p.agentName}: €${p.money}, pos ${p.position}(${getSquare(p.position).name}), props: [${props || 'none'}]`;
    }).join('\n');

    return `## Monopoly Arena — Turn #${state.turnNumber}

You: ${player.agentName} | Money: €${player.money} | Position: ${player.position} (${square.name}) | Jail: ${player.isInJail}
Your properties: ${myProps}

Other players:
${othersDesc || 'none'}

Available actions:
${availableActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Respond with JSON only:
{"action": "buy_property|skip|build_house|build_hotel|mortgage|unmortgage|pay_jail_fee|no_trade", "squareId": <number if needed>, "reasoning": "your private thought"}`;
  }

  static buildTradePrompt(state: GameState, playerIndex: number): string {
    const player = state.players[playerIndex];
    const others = state.players.filter(p => p.index !== playerIndex && p.isAlive);

    const othersDesc = others.map(p => {
      const props = p.properties.map(op => `${getSquare(op.squareId).name}(id:${op.squareId})`).join(', ');
      return `- ${p.agentName} (index:${p.index}, €${p.money}): ${props || 'no properties'}`;
    }).join('\n');

    const myProps = player.properties.map(p => `${getSquare(p.squareId).name}(id:${p.squareId})`).join(', ');

    return `Do you want to propose a trade?

Other players:
${othersDesc}

Your properties: ${myProps || 'none'}
Your money: €${player.money}

Respond with JSON:
{"action": "propose_trade|no_trade", "targetPlayerIndex": <number>, "offer": {"give": {"properties": [squareId], "money": 0}, "want": {"properties": [squareId], "money": 0}}, "message": "public message", "reasoning": "private thought"}`;
  }

  static buildTradeResponsePrompt(
    fromName: string,
    offer: { give: { properties: number[]; money: number }; want: { properties: number[]; money: number } },
    message: string
  ): string {
    const giveProps = offer.give.properties.map(id => getSquare(id).name).join(', ');
    const wantProps = offer.want.properties.map(id => getSquare(id).name).join(', ');

    return `${fromName} proposes a trade:
THEY GIVE YOU: ${giveProps || 'nothing'} + €${offer.give.money}
THEY WANT: ${wantProps || 'nothing'} + €${offer.want.money}

Their message: "${message}"

Respond with JSON:
{"action": "accept_trade|reject_trade|counter_offer", "counterOffer": {"give": {...}, "want": {...}}, "message": "your response", "reasoning": "private thought"}`;
  }
}

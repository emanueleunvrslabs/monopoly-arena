import { EventEmitter } from 'events';
import { BOARD, getSquare, getGroupSquares } from './board';
import { GameState, PlayerState, DiceRoll, OwnedProperty, TradeOffer } from './types';

export class GameEngine extends EventEmitter {
  private state: GameState;

  constructor(
    matchId: string,
    players: { agentId: string; agentName: string; provider: string; model: string }[]
  ) {
    super();
    this.state = {
      matchId,
      status: 'in_progress',
      turnNumber: 0,
      maxTurns: 200,
      currentPlayerIndex: 0,
      players: players.map((p, i) => ({
        index: i,
        agentId: p.agentId,
        agentName: p.agentName,
        provider: p.provider,
        model: p.model,
        money: 1500,
        position: 0,
        isAlive: true,
        isBankrupt: false,
        isInJail: false,
        jailTurns: 0,
        properties: [],
        doubleCount: 0,
      })),
    };
  }

  getState(): GameState { return this.state; }

  rollDice(): DiceRoll {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    return { die1, die2, total: die1 + die2, isDouble: die1 === die2 };
  }

  movePlayer(playerIndex: number, steps: number): { newPosition: number; passedGo: boolean } {
    const player = this.state.players[playerIndex];
    const oldPosition = player.position;
    const newPosition = (oldPosition + steps) % 40;
    player.position = newPosition;
    const passedGo = steps > 0 && newPosition < oldPosition;
    if (passedGo) {
      player.money += 200;
      this.emit('passed_go', { playerIndex, amount: 200 });
    }
    return { newPosition, passedGo };
  }

  buyProperty(playerIndex: number, squareId: number): boolean {
    const player = this.state.players[playerIndex];
    const square = getSquare(squareId);
    if (!square.price || player.money < square.price) return false;
    if (this.getPropertyOwner(squareId) !== null) return false;
    player.money -= square.price;
    player.properties.push({ squareId, houses: 0, mortgaged: false });
    this.emit('property_bought', { playerIndex, squareId, price: square.price });
    return true;
  }

  getPropertyOwner(squareId: number): number | null {
    for (const player of this.state.players) {
      if (player.properties.some(p => p.squareId === squareId)) return player.index;
    }
    return null;
  }

  hasMonopoly(playerIndex: number, group: number): boolean {
    return getGroupSquares(group).every(sq => this.getPropertyOwner(sq.id) === playerIndex);
  }

  calculateRent(squareId: number, diceTotal?: number): number {
    const square = getSquare(squareId);
    const ownerIndex = this.getPropertyOwner(squareId);
    if (ownerIndex === null) return 0;
    const owned = this.state.players[ownerIndex].properties.find(p => p.squareId === squareId);
    if (!owned || owned.mortgaged) return 0;

    if (square.type === 'station') {
      const count = this.state.players[ownerIndex].properties
        .filter(p => getSquare(p.squareId).type === 'station').length;
      return [25, 50, 100, 200][count - 1] || 25;
    }

    if (square.type === 'utility') {
      const count = this.state.players[ownerIndex].properties
        .filter(p => getSquare(p.squareId).type === 'utility').length;
      return (diceTotal || 7) * (count === 2 ? 10 : 4);
    }

    if (!square.rent) return 0;
    const base = square.rent[owned.houses] ?? square.rent[0];
    if (owned.houses === 0 && square.group !== undefined && this.hasMonopoly(ownerIndex, square.group)) {
      return base * 2;
    }
    return base;
  }

  payRent(fromIndex: number, toIndex: number, amount: number): boolean {
    const payer = this.state.players[fromIndex];
    const receiver = this.state.players[toIndex];
    if (payer.money < amount) {
      // Paga quello che può, poi bancarotta
      receiver.money += payer.money;
      this.declareBankruptcy(fromIndex, toIndex);
      return false;
    }
    payer.money -= amount;
    receiver.money += amount;
    this.emit('rent_paid', { fromIndex, toIndex, amount });
    return true;
  }

  payTax(playerIndex: number, amount: number): boolean {
    const player = this.state.players[playerIndex];
    if (player.money < amount) {
      this.declareBankruptcy(playerIndex, -1);
      return false;
    }
    player.money -= amount;
    return true;
  }

  goToJail(playerIndex: number): void {
    const player = this.state.players[playerIndex];
    player.position = 10;
    player.isInJail = true;
    player.jailTurns = 0;
    player.doubleCount = 0;
    this.emit('go_to_jail', { playerIndex });
  }

  leaveJail(playerIndex: number, method: 'pay' | 'double'): void {
    const player = this.state.players[playerIndex];
    if (method === 'pay' && player.money >= 50) {
      player.money -= 50;
    }
    player.isInJail = false;
    player.jailTurns = 0;
  }

  buildHouse(playerIndex: number, squareId: number): boolean {
    const player = this.state.players[playerIndex];
    const square = getSquare(squareId);
    if (!square.houseCost || square.group === undefined) return false;
    if (!this.hasMonopoly(playerIndex, square.group)) return false;
    const owned = player.properties.find(p => p.squareId === squareId);
    if (!owned || owned.houses >= 4 || owned.mortgaged) return false;
    if (player.money < square.houseCost) return false;
    // Costruzione uniforme
    const groupProps = getGroupSquares(square.group)
      .map(sq => player.properties.find(p => p.squareId === sq.id))
      .filter(Boolean) as OwnedProperty[];
    const minHouses = Math.min(...groupProps.map(p => p.houses));
    if (owned.houses > minHouses) return false;
    player.money -= square.houseCost;
    owned.houses++;
    return true;
  }

  buildHotel(playerIndex: number, squareId: number): boolean {
    const player = this.state.players[playerIndex];
    const square = getSquare(squareId);
    if (!square.houseCost) return false;
    const owned = player.properties.find(p => p.squareId === squareId);
    if (!owned || owned.houses !== 4) return false;
    if (player.money < square.houseCost) return false;
    player.money -= square.houseCost;
    owned.houses = 5;
    return true;
  }

  mortgage(playerIndex: number, squareId: number): boolean {
    const player = this.state.players[playerIndex];
    const square = getSquare(squareId);
    const owned = player.properties.find(p => p.squareId === squareId);
    if (!owned || owned.mortgaged || !square.mortgage) return false;
    owned.mortgaged = true;
    player.money += square.mortgage;
    return true;
  }

  unmortgage(playerIndex: number, squareId: number): boolean {
    const player = this.state.players[playerIndex];
    const square = getSquare(squareId);
    const owned = player.properties.find(p => p.squareId === squareId);
    const cost = Math.floor((square.mortgage || 0) * 1.1);
    if (!owned || !owned.mortgaged || player.money < cost) return false;
    owned.mortgaged = false;
    player.money -= cost;
    return true;
  }

  executeTrade(fromIndex: number, toIndex: number, offer: TradeOffer): boolean {
    const from = this.state.players[fromIndex];
    const to = this.state.players[toIndex];
    if (from.money < offer.give.money || to.money < offer.want.money) return false;
    // Verifica proprietà
    for (const sqId of offer.give.properties) {
      if (!from.properties.some(p => p.squareId === sqId)) return false;
    }
    for (const sqId of offer.want.properties) {
      if (!to.properties.some(p => p.squareId === sqId)) return false;
    }
    // Trasferisci
    from.money -= offer.give.money;
    to.money += offer.give.money;
    to.money -= offer.want.money;
    from.money += offer.want.money;
    for (const sqId of offer.give.properties) {
      const idx = from.properties.findIndex(p => p.squareId === sqId);
      to.properties.push(from.properties.splice(idx, 1)[0]);
    }
    for (const sqId of offer.want.properties) {
      const idx = to.properties.findIndex(p => p.squareId === sqId);
      from.properties.push(to.properties.splice(idx, 1)[0]);
    }
    this.emit('trade_executed', { fromIndex, toIndex, offer });
    return true;
  }

  declareBankruptcy(playerIndex: number, creditorIndex: number): void {
    const player = this.state.players[playerIndex];
    player.isBankrupt = true;
    player.isAlive = false;
    if (creditorIndex >= 0) {
      const creditor = this.state.players[creditorIndex];
      creditor.money += player.money;
      creditor.properties.push(...player.properties);
    }
    player.money = 0;
    player.properties = [];
    this.emit('bankrupt', { playerIndex, creditorIndex });
    this.checkGameEnd();
  }

  checkGameEnd(): void {
    const alive = this.state.players.filter(p => p.isAlive);
    if (alive.length <= 1) {
      this.state.status = 'finished';
      this.state.winnerId = alive[0]?.agentId;
      this.emit('match_end', { winner: alive[0], finalStandings: this.getFinalStandings() });
      return;
    }
    if (this.state.turnNumber >= this.state.maxTurns) {
      this.state.status = 'finished';
      const richest = alive.reduce((best, p) =>
        this.getNetWorth(p) > this.getNetWorth(best) ? p : best
      );
      this.state.winnerId = richest.agentId;
      this.emit('match_end', { winner: richest, finalStandings: this.getFinalStandings() });
    }
  }

  getNetWorth(player: PlayerState): number {
    return player.money + player.properties.reduce((sum, p) => {
      const sq = getSquare(p.squareId);
      return sum + (sq.price || 0) + (p.houses * (sq.houseCost || 0));
    }, 0);
  }

  getFinalStandings() {
    return [...this.state.players]
      .sort((a, b) => this.getNetWorth(b) - this.getNetWorth(a))
      .map((p, i) => ({ ...p, finishPosition: i + 1 }));
  }

  nextTurn(): void {
    const n = this.state.players.length;
    let next = (this.state.currentPlayerIndex + 1) % n;
    let tries = 0;
    while (!this.state.players[next].isAlive && tries < n) {
      next = (next + 1) % n;
      tries++;
    }
    this.state.currentPlayerIndex = next;
    this.state.turnNumber++;
    this.state.players[next].doubleCount = 0;
  }
}

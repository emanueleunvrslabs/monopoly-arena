export interface PlayerState {
  index: number;
  agentId: string;
  agentName: string;
  provider: string;
  model: string;
  money: number;
  position: number;
  isAlive: boolean;
  isBankrupt: boolean;
  isInJail: boolean;
  jailTurns: number;
  properties: OwnedProperty[];
  doubleCount: number;
}

export interface OwnedProperty {
  squareId: number;
  houses: number;   // 0-4 case, 5 = hotel
  mortgaged: boolean;
}

export interface GameState {
  matchId: string;
  status: 'in_progress' | 'finished';
  players: PlayerState[];
  currentPlayerIndex: number;
  turnNumber: number;
  maxTurns: number;
  winnerId?: string;
}

export interface DiceRoll {
  die1: number;
  die2: number;
  total: number;
  isDouble: boolean;
}

export interface TradeOffer {
  give: { properties: number[]; money: number };
  want: { properties: number[]; money: number };
}

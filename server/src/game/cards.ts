export interface Card {
  id: string;
  type: 'chance' | 'community_chest';
  text: string;
  effect: CardEffect;
}

export type CardEffect =
  | { type: 'collect'; amount: number }
  | { type: 'pay'; amount: number }
  | { type: 'move_to'; position: number }
  | { type: 'move'; steps: number }
  | { type: 'go_to_jail' }
  | { type: 'collect_from_each'; amount: number }
  | { type: 'pay_to_each'; amount: number }
  | { type: 'repairs'; houseCost: number; hotelCost: number };

export const CHANCE_CARDS: Card[] = [
  { id: 'ch1', type: 'chance', text: 'Avanza fino a Via!. Incassa €200.', effect: { type: 'move_to', position: 0 } },
  { id: 'ch2', type: 'chance', text: 'Avanza fino a Piazza della Vittoria.', effect: { type: 'move_to', position: 39 } },
  { id: 'ch3', type: 'chance', text: 'Avanza fino alla Stazione Nord.', effect: { type: 'move_to', position: 5 } },
  { id: 'ch4', type: 'chance', text: 'La banca ti paga un dividendo di €50.', effect: { type: 'collect', amount: 50 } },
  { id: 'ch5', type: 'chance', text: 'Vai in Prigione.', effect: { type: 'go_to_jail' } },
  { id: 'ch6', type: 'chance', text: 'Torna indietro di 3 caselle.', effect: { type: 'move', steps: -3 } },
  { id: 'ch7', type: 'chance', text: 'Multa per eccesso di velocità: paga €15.', effect: { type: 'pay', amount: 15 } },
  { id: 'ch8', type: 'chance', text: 'Sei eletto presidente. Paga €50 ad ogni giocatore.', effect: { type: 'pay_to_each', amount: 50 } },
  { id: 'ch9', type: 'chance', text: 'Lavori di riparazione: €25 per casa, €100 per hotel.', effect: { type: 'repairs', houseCost: 25, hotelCost: 100 } },
  { id: 'ch10', type: 'chance', text: 'Premi incrociati: incassa €150.', effect: { type: 'collect', amount: 150 } },
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
  { id: 'cc1', type: 'community_chest', text: 'Avanza fino a Via!. Incassa €200.', effect: { type: 'move_to', position: 0 } },
  { id: 'cc2', type: 'community_chest', text: 'Rimborso fiscale: incassa €20.', effect: { type: 'collect', amount: 20 } },
  { id: 'cc3', type: 'community_chest', text: 'È il tuo compleanno: ogni giocatore ti paga €10.', effect: { type: 'collect_from_each', amount: 10 } },
  { id: 'cc4', type: 'community_chest', text: 'Premio assicurativo: incassa €100.', effect: { type: 'collect', amount: 100 } },
  { id: 'cc5', type: 'community_chest', text: 'Vai in Prigione.', effect: { type: 'go_to_jail' } },
  { id: 'cc6', type: 'community_chest', text: 'Retta ospedaliera: paga €50.', effect: { type: 'pay', amount: 50 } },
  { id: 'cc7', type: 'community_chest', text: 'Vendita azioni: incassa €50.', effect: { type: 'collect', amount: 50 } },
  { id: 'cc8', type: 'community_chest', text: 'Eredità: incassa €100.', effect: { type: 'collect', amount: 100 } },
  { id: 'cc9', type: 'community_chest', text: 'Lavori di riparazione: €40 per casa, €115 per hotel.', effect: { type: 'repairs', houseCost: 40, hotelCost: 115 } },
  { id: 'cc10', type: 'community_chest', text: 'Tasse scolastiche: paga €150.', effect: { type: 'pay', amount: 150 } },
];

export class CardDeck {
  private cards: Card[];
  private index = 0;

  constructor(type: 'chance' | 'community_chest') {
    this.cards = [...(type === 'chance' ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS)];
    this.shuffle();
  }

  private shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(): Card {
    const card = this.cards[this.index % this.cards.length];
    this.index++;
    return card;
  }
}

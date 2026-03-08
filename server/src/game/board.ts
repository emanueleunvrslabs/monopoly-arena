export type SquareType =
  | 'property' | 'station' | 'utility'
  | 'tax' | 'chance' | 'community_chest'
  | 'go' | 'jail' | 'free_parking' | 'go_to_jail';

export interface Square {
  id: number;
  name: string;
  type: SquareType;
  color?: string;
  price?: number;
  rent?: number[];    // [base, 1casa, 2case, 3case, 4case, hotel]
  houseCost?: number;
  mortgage?: number;
  group?: number;
}

export const BOARD: Square[] = [
  { id: 0, name: 'Via!', type: 'go' },
  { id: 1, name: 'Vicolo Corto', type: 'property', color: 'brown', price: 60, rent: [2,10,30,90,160,250], houseCost: 50, mortgage: 30, group: 0 },
  { id: 2, name: 'Imprevisti', type: 'community_chest' },
  { id: 3, name: 'Vicolo Stretto', type: 'property', color: 'brown', price: 60, rent: [4,20,60,180,320,450], houseCost: 50, mortgage: 30, group: 0 },
  { id: 4, name: 'Tassa Patrimoniale', type: 'tax', price: 200 },
  { id: 5, name: 'Stazione Nord', type: 'station', price: 200, mortgage: 100 },
  { id: 6, name: 'Via Dante', type: 'property', color: 'lightblue', price: 100, rent: [6,30,90,270,400,550], houseCost: 50, mortgage: 50, group: 1 },
  { id: 7, name: 'Probabilità', type: 'chance' },
  { id: 8, name: 'Via Verdi', type: 'property', color: 'lightblue', price: 100, rent: [6,30,90,270,400,550], houseCost: 50, mortgage: 50, group: 1 },
  { id: 9, name: 'Via Accademia', type: 'property', color: 'lightblue', price: 120, rent: [8,40,100,300,450,600], houseCost: 50, mortgage: 60, group: 1 },
  { id: 10, name: 'Prigione / In Visita', type: 'jail' },
  { id: 11, name: 'Piazza Castello', type: 'property', color: 'pink', price: 140, rent: [10,50,150,450,625,750], houseCost: 100, mortgage: 70, group: 2 },
  { id: 12, name: 'Compagnia Elettrica', type: 'utility', price: 150, mortgage: 75 },
  { id: 13, name: 'Corso Vittorio', type: 'property', color: 'pink', price: 140, rent: [10,50,150,450,625,750], houseCost: 100, mortgage: 70, group: 2 },
  { id: 14, name: 'Via Po', type: 'property', color: 'pink', price: 160, rent: [12,60,180,500,700,900], houseCost: 100, mortgage: 80, group: 2 },
  { id: 15, name: 'Stazione Est', type: 'station', price: 200, mortgage: 100 },
  { id: 16, name: 'Via Roma', type: 'property', color: 'orange', price: 180, rent: [14,70,200,550,750,950], houseCost: 100, mortgage: 90, group: 3 },
  { id: 17, name: 'Imprevisti', type: 'community_chest' },
  { id: 18, name: 'Corso Italia', type: 'property', color: 'orange', price: 180, rent: [14,70,200,550,750,950], houseCost: 100, mortgage: 90, group: 3 },
  { id: 19, name: 'Viale Costantino', type: 'property', color: 'orange', price: 200, rent: [16,80,220,600,800,1000], houseCost: 100, mortgage: 100, group: 3 },
  { id: 20, name: 'Parcheggio Gratuito', type: 'free_parking' },
  { id: 21, name: 'Viale dei Giardini', type: 'property', color: 'red', price: 220, rent: [18,90,250,700,875,1050], houseCost: 150, mortgage: 110, group: 4 },
  { id: 22, name: 'Probabilità', type: 'chance' },
  { id: 23, name: 'Piazza Colonna', type: 'property', color: 'red', price: 220, rent: [18,90,250,700,875,1050], houseCost: 150, mortgage: 110, group: 4 },
  { id: 24, name: 'Largo Augusto', type: 'property', color: 'red', price: 240, rent: [20,100,300,750,925,1100], houseCost: 150, mortgage: 120, group: 4 },
  { id: 25, name: 'Stazione Ovest', type: 'station', price: 200, mortgage: 100 },
  { id: 26, name: 'Via Condotti', type: 'property', color: 'yellow', price: 260, rent: [22,110,330,800,975,1150], houseCost: 150, mortgage: 130, group: 5 },
  { id: 27, name: 'Corso Venezia', type: 'property', color: 'yellow', price: 260, rent: [22,110,330,800,975,1150], houseCost: 150, mortgage: 130, group: 5 },
  { id: 28, name: 'Compagnia Idrica', type: 'utility', price: 150, mortgage: 75 },
  { id: 29, name: 'Piazza Duomo', type: 'property', color: 'yellow', price: 280, rent: [24,120,360,850,1025,1200], houseCost: 150, mortgage: 140, group: 5 },
  { id: 30, name: 'Andate in Prigione', type: 'go_to_jail' },
  { id: 31, name: 'Viale Liberazione', type: 'property', color: 'green', price: 300, rent: [26,130,390,900,1100,1275], houseCost: 200, mortgage: 150, group: 6 },
  { id: 32, name: 'Via dei Tulipani', type: 'property', color: 'green', price: 300, rent: [26,130,390,900,1100,1275], houseCost: 200, mortgage: 150, group: 6 },
  { id: 33, name: 'Imprevisti', type: 'community_chest' },
  { id: 34, name: 'Largo Milano', type: 'property', color: 'green', price: 320, rent: [28,150,450,1000,1200,1400], houseCost: 200, mortgage: 160, group: 6 },
  { id: 35, name: 'Stazione Sud', type: 'station', price: 200, mortgage: 100 },
  { id: 36, name: 'Probabilità', type: 'chance' },
  { id: 37, name: 'Largo Colombo', type: 'property', color: 'darkblue', price: 350, rent: [35,175,500,1100,1300,1500], houseCost: 200, mortgage: 175, group: 7 },
  { id: 38, name: 'Tassa di Lusso', type: 'tax', price: 100 },
  { id: 39, name: 'Piazza della Vittoria', type: 'property', color: 'darkblue', price: 400, rent: [50,200,600,1400,1700,2000], houseCost: 200, mortgage: 200, group: 7 },
];

export const getSquare = (pos: number): Square => BOARD[pos % 40];
export const getGroupSquares = (group: number): Square[] => BOARD.filter(s => s.group === group);

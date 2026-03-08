import { prisma } from '../lib/prisma';
import { GameEngine } from './GameEngine';
import { CardDeck } from './cards';
import { getSquare } from './board';
import { AgentProxy } from '../ai/AgentProxy';
import { TradeOffer } from './types';

// Import io lazily to avoid circular deps
let _io: any;
function getIo() {
  if (!_io) _io = require('../index').io;
  return _io;
}

const proxy = new AgentProxy();
const activeMatches = new Map<string, GameEngine>();

export async function startMatch(agentIds: string[]): Promise<void> {
  const agents = await prisma.agent.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true, provider: true, model: true }
  });

  // Mantieni l'ordine originale
  const orderedAgents = agentIds.map(id => agents.find(a => a.id === id)!).filter(Boolean);

  const match = await prisma.match.create({
    data: {
      status: 'IN_PROGRESS',
      maxPlayers: orderedAgents.length,
      startedAt: new Date(),
      players: {
        create: orderedAgents.map((a, i) => ({
          agentId: a.id,
          playerIndex: i,
        }))
      }
    }
  });

  const engine = new GameEngine(
    match.id,
    orderedAgents.map(a => ({
      agentId: a.id,
      agentName: a.name,
      provider: a.provider,
      model: a.model,
    }))
  );

  activeMatches.set(match.id, engine);

  const io = getIo();
  io.of('/lobby').emit('lobby:match_started', {
    matchId: match.id,
    players: orderedAgents.map(a => ({ name: a.name, provider: a.provider, model: a.model }))
  });

  // Avvia loop in background (non blocca)
  runGameLoop(match.id, engine, orderedAgents.map(a => a.id)).catch(err => {
    console.error(`Game loop error for match ${match.id}:`, err);
  });
}

async function runGameLoop(matchId: string, engine: GameEngine, agentDbIds: string[]): Promise<void> {
  const io = getIo();
  const spectNs = io.of('/spectator');
  const lobbyNs = io.of('/lobby');

  const chanceD = new CardDeck('chance');
  const communityD = new CardDeck('community_chest');

  const emit = (event: string, data: any) => {
    spectNs.to(matchId).emit(event, data);
  };

  const emitThought = (playerIndex: number, reasoning: string) => {
    if (!reasoning) return;
    const lower = reasoning.toLowerCase();
    if (lower.includes('error') || lower.includes('parse') || lower.includes('timeout') || lower.includes('llm')) return;
    emit('spectator:thought', { playerIndex, reasoning });
  };

  while (engine.getState().status === 'in_progress') {
    const state = engine.getState();
    const playerIndex = state.currentPlayerIndex;
    const player = state.players[playerIndex];
    const agentDbId = agentDbIds[playerIndex];

    // Emetti stato aggiornato
    emit('game:state', state);

    // Prigione
    if (player.isInJail) {
      player.jailTurns++;
      const dice = engine.rollDice();

      if (dice.isDouble) {
        engine.leaveJail(playerIndex, 'double');
        emit('game:action', {
          playerIndex,
          actionType: 'LEAVE_JAIL',
          data: { method: 'double', dice }
        });
      } else if (player.jailTurns >= 3) {
        engine.leaveJail(playerIndex, 'pay');
        emit('game:action', {
          playerIndex,
          actionType: 'LEAVE_JAIL',
          data: { method: 'pay', dice }
        });
      } else {
        emit('game:action', { playerIndex, actionType: 'JAIL_TURN', data: { dice, jailTurns: player.jailTurns } });
        engine.nextTurn();
        await sleep(2500);
        continue;
      }
    }

    // Lancia dadi e muovi
    const dice = engine.rollDice();
    const { newPosition, passedGo } = engine.movePlayer(playerIndex, dice.total);
    const square = getSquare(newPosition);

    emit('game:turn_start', {
      playerIndex,
      dice,
      newPosition,
      squareName: square.name,
      squareType: square.type,
      passedGo,
    });

    await logAction(matchId, state.turnNumber, playerIndex, 'ROLL_DICE', { dice, newPosition });

    // Gestisci casella
    if (square.type === 'go_to_jail') {
      engine.goToJail(playerIndex);
      emit('game:action', { playerIndex, actionType: 'GO_TO_JAIL', data: {} });
      await logAction(matchId, state.turnNumber, playerIndex, 'GO_TO_JAIL', {});

    } else if (square.type === 'tax') {
      engine.payTax(playerIndex, square.price || 0);
      emit('game:action', { playerIndex, actionType: 'PAY_TAX', data: { amount: square.price } });
      await logAction(matchId, state.turnNumber, playerIndex, 'PAY_TAX', { amount: square.price });

    } else if (square.type === 'chance') {
      const card = chanceD.draw();
      await applyCard(engine, playerIndex, card, matchId, state.turnNumber, agentDbIds);
      emit('game:card_drawn', { playerIndex, cardType: 'chance', cardText: card.text, effect: card.effect });

    } else if (square.type === 'community_chest') {
      const card = communityD.draw();
      await applyCard(engine, playerIndex, card, matchId, state.turnNumber, agentDbIds);
      emit('game:card_drawn', { playerIndex, cardType: 'community_chest', cardText: card.text, effect: card.effect });

    } else if (square.type === 'property' || square.type === 'station' || square.type === 'utility') {
      const ownerIndex = engine.getPropertyOwner(newPosition);

      if (ownerIndex === null) {
        // Chiedi all'agente se comprare
        const availableActions = [
          `buy_property: Buy ${square.name} for €${square.price}`,
          'skip: Do not buy'
        ];
        const action = await proxy.getAction(engine.getState(), playerIndex, availableActions, agentDbId);

        // Emetti thought bubble
        emitThought(playerIndex, action.reasoning || '');

        if (action.type === 'buy_property') {
          const bought = engine.buyProperty(playerIndex, newPosition);
          if (bought) {
            emit('game:action', {
              playerIndex,
              actionType: 'BUY_PROPERTY',
              data: { squareId: newPosition, squareName: square.name, price: square.price }
            });
            await logAction(matchId, state.turnNumber, playerIndex, 'BUY_PROPERTY',
              { squareId: newPosition, price: square.price }, action.reasoning);
          }
        } else {
          emit('game:action', { playerIndex, actionType: 'SKIP_BUY', data: { squareId: newPosition } });
          await logAction(matchId, state.turnNumber, playerIndex, 'SKIP_BUY',
            { squareId: newPosition }, action.reasoning);
        }

      } else if (ownerIndex !== playerIndex && engine.getState().players[ownerIndex].isAlive) {
        const rent = engine.calculateRent(newPosition, dice.total);
        if (rent > 0) {
          engine.payRent(playerIndex, ownerIndex, rent);
          emit('game:pay_rent', {
            fromPlayer: playerIndex,
            toPlayer: ownerIndex,
            amount: rent,
            property: square.name
          });
          await logAction(matchId, state.turnNumber, playerIndex, 'PAY_RENT',
            { squareId: newPosition, amount: rent, toPlayer: ownerIndex });
        }
      }
    }

    // Fase costruzione: chiedi all'agente se vuole costruire
    if (!engine.getState().players[playerIndex].isBankrupt) {
      await buildPhase(engine, playerIndex, agentDbId, matchId, state.turnNumber, emit);
    }

    // Fase negoziazione (max 3 round)
    if (!engine.getState().players[playerIndex].isBankrupt) {
      await negotiationPhase(engine, playerIndex, agentDbId, agentDbIds, matchId, state.turnNumber, emit);
    }

    // Doppio: rilancia (max 3 volte)
    if (dice.isDouble && !engine.getState().players[playerIndex].isBankrupt &&
        engine.getState().players[playerIndex].isAlive) {
      const p = engine.getState().players[playerIndex];
      p.doubleCount = (p.doubleCount || 0) + 1;
      if (p.doubleCount >= 3) {
        engine.goToJail(playerIndex);
        emit('game:action', { playerIndex, actionType: 'JAIL_TRIPLE_DOUBLE', data: {} });
      } else {
        // Continua stesso turno
        await sleep(2000);
        continue;
      }
    }

    engine.nextTurn();
    await sleep(2500);

    // Sync stato al DB ogni 10 turni
    if (engine.getState().turnNumber % 10 === 0) {
      await syncStateToDB(matchId, engine.getState());
    }

    // Controlla fine partita
    engine.checkGameEnd();
    if (engine.getState().status === 'finished') break;
  }

  // Fine partita
  const finalState = engine.getState();
  const standings = engine.getFinalStandings();

  emit('game:match_end', {
    winner: finalState.winnerId,
    finalStandings: standings.map(p => ({
      name: p.agentName,
      provider: p.provider,
      model: p.model,
      finishPosition: p.finishPosition,
      netWorth: engine.getNetWorth(p),
    }))
  });

  // Aggiorna DB
  await prisma.match.update({
    where: { id: matchId },
    data: { status: 'FINISHED', finishedAt: new Date(), winnerId: finalState.winnerId }
  });

  await updateElo(matchId, standings);
  await syncStateToDB(matchId, finalState);

  activeMatches.delete(matchId);

  lobbyNs.emit('lobby:match_finished', {
    matchId,
    winnerId: finalState.winnerId,
    winnerName: standings[0]?.agentName,
  });
}

async function buildPhase(
  engine: GameEngine,
  playerIndex: number,
  agentDbId: string,
  matchId: string,
  turnNumber: number,
  emit: (e: string, d: any) => void
): Promise<void> {
  const player = engine.getState().players[playerIndex];
  // Controlla se ha proprietà su cui costruire
  const canBuild = player.properties.some(p => {
    const sq = getSquare(p.squareId);
    return sq.group !== undefined && !p.mortgaged &&
           engine.hasMonopoly(playerIndex, sq.group) &&
           p.houses < 5;
  });

  if (!canBuild) return;

  const buildActions = player.properties
    .filter(p => {
      const sq = getSquare(p.squareId);
      return sq.group !== undefined && !p.mortgaged &&
             engine.hasMonopoly(playerIndex, sq.group) && p.houses < 4;
    })
    .map(p => `build_house: Build house on ${getSquare(p.squareId).name} (squareId:${p.squareId})`);

  if (buildActions.length === 0) return;

  const action = await proxy.getAction(
    engine.getState(), playerIndex,
    [...buildActions, 'skip: No building this turn'],
    agentDbId
  );

  const buildReasoning = action.reasoning || '';
  if (buildReasoning && !buildReasoning.toLowerCase().match(/error|parse|timeout|llm/)) {
    emit('spectator:thought', { playerIndex, reasoning: buildReasoning });
  }

  if (action.type === 'build_house' && action.squareId !== undefined) {
    const built = engine.buildHouse(playerIndex, action.squareId);
    if (built) {
      emit('game:build', { playerIndex, squareId: action.squareId, type: 'house' });
      await logAction(matchId, turnNumber, playerIndex, 'BUILD_HOUSE',
        { squareId: action.squareId }, action.reasoning);
    }
  } else if (action.type === 'build_hotel' && action.squareId !== undefined) {
    const built = engine.buildHotel(playerIndex, action.squareId);
    if (built) {
      emit('game:build', { playerIndex, squareId: action.squareId, type: 'hotel' });
      await logAction(matchId, turnNumber, playerIndex, 'BUILD_HOTEL',
        { squareId: action.squareId }, action.reasoning);
    }
  }
}

async function negotiationPhase(
  engine: GameEngine,
  playerIndex: number,
  agentDbId: string,
  agentDbIds: string[],
  matchId: string,
  turnNumber: number,
  emit: (e: string, d: any) => void
): Promise<void> {
  for (let round = 0; round < 3; round++) {
    if (engine.getState().status === 'finished') break;

    const tradeAction = await proxy.getTradeProposal(engine.getState(), playerIndex, agentDbId);

    const tradeReasoning = tradeAction.reasoning || '';
    if (tradeReasoning && !tradeReasoning.toLowerCase().match(/error|parse|timeout|llm/)) {
      emit('spectator:thought', { playerIndex, reasoning: tradeReasoning });
    }

    if (tradeAction.type !== 'propose_trade' || !tradeAction.offer) break;

    const { targetPlayerIndex, offer, message } = tradeAction as {
      targetPlayerIndex: number;
      offer: TradeOffer;
      message: string;
    };

    if (targetPlayerIndex === undefined || !engine.getState().players[targetPlayerIndex]?.isAlive) break;

    emit('game:trade_proposal', {
      fromPlayer: playerIndex,
      toPlayer: targetPlayerIndex,
      offer,
      message: message || '',
    });

    await logAction(matchId, turnNumber, playerIndex, 'PROPOSE_TRADE',
      { offer, targetPlayerIndex }, tradeAction.reasoning, message);

    // Risposta dell'agente target
    const targetDbId = agentDbIds[targetPlayerIndex];
    const fromName = engine.getState().players[playerIndex].agentName;
    const response = await proxy.getTradeResponse(fromName, offer, message || '', targetDbId);

    const respReasoning = response.reasoning || '';
    if (respReasoning && !respReasoning.toLowerCase().match(/error|parse|timeout|llm/)) {
      emit('spectator:thought', { playerIndex: targetPlayerIndex, reasoning: respReasoning });
    }
    emit('game:trade_response', {
      fromPlayer: targetPlayerIndex,
      toPlayer: playerIndex,
      response: response.type,
      message: response.message || '',
    });

    await logAction(matchId, turnNumber, targetPlayerIndex, response.type.toUpperCase(),
      { offer }, response.reasoning, response.message);

    if (response.type === 'accept_trade') {
      engine.executeTrade(playerIndex, targetPlayerIndex, offer);
      break;
    } else if (response.type === 'counter_offer' && response.counterOffer) {
      // Semplificato: log della contro-offerta, stop negoziazione
      break;
    } else {
      break; // reject
    }
  }
}

async function applyCard(
  engine: GameEngine,
  playerIndex: number,
  card: any,
  matchId: string,
  turnNumber: number,
  agentDbIds: string[]
): Promise<void> {
  const effect = card.effect;
  const player = engine.getState().players[playerIndex];

  switch (effect.type) {
    case 'collect':
      player.money += effect.amount;
      break;
    case 'pay':
      engine.payTax(playerIndex, effect.amount);
      break;
    case 'move_to': {
      const steps = (effect.position - player.position + 40) % 40;
      engine.movePlayer(playerIndex, steps || 40);
      break;
    }
    case 'move':
      if (effect.steps < 0) {
        player.position = (player.position + 40 + effect.steps) % 40;
      } else {
        engine.movePlayer(playerIndex, effect.steps);
      }
      break;
    case 'go_to_jail':
      engine.goToJail(playerIndex);
      break;
    case 'collect_from_each':
      engine.getState().players
        .filter(p => p.index !== playerIndex && p.isAlive)
        .forEach(p => {
          const amount = Math.min(p.money, effect.amount);
          p.money -= amount;
          player.money += amount;
        });
      break;
    case 'pay_to_each':
      engine.getState().players
        .filter(p => p.index !== playerIndex && p.isAlive)
        .forEach(p => {
          const amount = Math.min(player.money, effect.amount);
          player.money -= amount;
          p.money += amount;
        });
      break;
    case 'repairs': {
      const total = player.properties.reduce((sum, p) => {
        return sum + (p.houses === 5 ? effect.hotelCost : p.houses * effect.houseCost);
      }, 0);
      if (total > 0) engine.payTax(playerIndex, total);
      break;
    }
  }

  await logAction(matchId, turnNumber, playerIndex, 'DRAW_CARD', { card: card.id, effect });
}

async function logAction(
  matchId: string,
  turnNumber: number,
  playerIndex: number,
  actionType: string,
  data: any,
  reasoning?: string,
  message?: string
): Promise<void> {
  try {
    await prisma.matchAction.create({
      data: { matchId, turnNumber, playerIndex, actionType, data, reasoning, message }
    });
  } catch (err) {
    // Non bloccare il game loop per errori di log
    console.error('Log action error:', err);
  }
}

async function syncStateToDB(matchId: string, state: any): Promise<void> {
  try {
    for (const player of state.players) {
      await prisma.matchPlayer.updateMany({
        where: { matchId, playerIndex: player.index },
        data: {
          money: player.money,
          position: player.position,
          isAlive: player.isAlive,
          isBankrupt: player.isBankrupt,
          isInJail: player.isInJail,
          jailTurns: player.jailTurns,
          properties: player.properties,
        }
      });
    }
  } catch (err) {
    console.error('Sync DB error:', err);
  }
}

async function updateElo(matchId: string, standings: any[]): Promise<void> {
  const n = standings.length;
  for (const player of standings) {
    const rank = player.finishPosition;
    const expected = 0.5;
    const actual = 1 - (rank - 1) / (n - 1);
    const eloChange = Math.round(32 * (actual - expected));

    try {
      await prisma.agent.update({
        where: { id: player.agentId },
        data: {
          eloRating: { increment: eloChange },
          gamesPlayed: { increment: 1 },
          ...(rank === 1 ? { gamesWon: { increment: 1 } } : {}),
        }
      });
      await prisma.matchPlayer.updateMany({
        where: { matchId, playerIndex: player.index },
        data: { finishPosition: rank, eloChange }
      });
    } catch (err) {
      console.error('Elo update error:', err);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getActiveMatch(matchId: string): GameEngine | undefined {
  return activeMatches.get(matchId);
}

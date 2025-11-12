import { nanoid } from 'nanoid'

import { CARD_LIBRARY, STARTER_DECK_SIZE } from '../data/cards'
import {
  GAME_CONSTANTS,
  type BoardSlot,
  type CardDefinition,
  type CardInstance,
  type CardSlug,
  type MatchState,
  type PlayerState,
  STARTING_STATS,
} from '../types/game'
import { shuffle } from '../utils/random'

type EffectHandler = (
  match: MatchState,
  player: PlayerState,
  opponent: PlayerState,
  card: CardInstance,
) => void

const effectHandlers: Record<CardSlug, EffectHandler> = {
  'build-factory': (match, player, _opponent, card) => {
    addIndustry(player, card, { gdpPerTurn: 10 })
    log(match, `${player.name} built a Factory → +10 GDP each turn`)
  },
  'tax-cut': (match, player, _opponent, card) => {
    addPolicy(player, card, {
      happinessPerTurn: 3,
      cashNextTurnModifier: -2,
      cashModifierUsesLeft: 1,
    })
    log(match, `${player.name} passed Tax Cut → +3 Happiness per turn`)
  },
  'trade-deal': (match, player) => {
    player.stats.gdp += 5
    player.stats.cash += 5
    log(match, `${player.name} signed a Trade Deal → +5 GDP & +5 Cash`)
  },
  'inflation-spike': (match, _player, opponent) => {
    opponent.stats.stability -= 10
    log(match, `Inflation Spike hit ${opponent.name} → −10 Stability`)
  },
  'green-energy': (match, player) => {
    player.stats.gdp += 8
    player.stats.happiness += 3
    log(match, `${player.name} invested in Green Energy → +8 GDP, +3 Happiness`)
  },
  'health-program': (match, player) => {
    player.stats.stability += 10
    log(match, `${player.name} launched Health Program → +10 Stability`)
  },
  'technology-boom': (match, player, _opponent, card) => {
    addIndustry(player, card, { gdpPerTurn: 12, happinessPerTurn: 2 })
    log(match, `${player.name} sparked a Technology Boom → +12 GDP / turn`)
  },
  recession: (match, player, opponent) => {
    player.stats.gdp -= 5
    opponent.stats.gdp -= 5
    player.stats.happiness += 3
    log(
      match,
      `${player.name} navigated a Recession → both −5 GDP, +3 Happiness`,
    )
  },
  'tourism-boost': (match, player) => {
    player.stats.happiness += 6
    log(match, `${player.name} got a Tourism Boost → +6 Happiness`)
  },
  'price-controls': (match, player, opponent, card) => {
    addPolicy(opponent, card, {
      gdpPerTurn: -3,
      duration: 2,
    })
    log(
      match,
      `${player.name} set Price Controls → ${opponent.name} −3 GDP next 2 turns`,
    )
  },
  'natural-disaster': (match, _player, opponent) => {
    opponent.stats.stability -= 15
    log(match, `Natural Disaster struck ${opponent.name} → −15 Stability`)
  },
  'education-reform': (match, player, _opponent, card) => {
    addPolicy(player, card, { gdpPerTurn: 2, happinessPerTurn: 2 })
    log(match, `${player.name} led Education Reform → +2 GDP & Happiness / turn`)
  },
  'small-business-grant': (match, player, _opponent, card) => {
    addIndustry(player, card, { gdpPerTurn: 5 })
    log(match, `${player.name} funded Small Businesses → +5 GDP / turn`)
  },
  strike: (match, _player, opponent) => {
    opponent.stats.gdp -= 5
    log(match, `Strike slowed ${opponent.name} → −5 GDP`)
  },
  'happiness-festival': (match, player) => {
    player.stats.happiness += 8
    player.stats.stability += 5
    log(match, `${player.name} threw a Happiness Festival → +8 Happy, +5 Stability`)
  },
}

export function createPlayerState(
  id: string,
  name: string,
  seed = Date.now(),
): PlayerState {
  const deck = generateDeck(seed)
  const hand: CardInstance[] = []

  const player: PlayerState = {
    id,
    name,
    stats: { ...STARTING_STATS },
    hand,
    deck,
    discard: [],
    board: {
      industries: [],
      policies: [],
    },
  }

  drawCards(player, GAME_CONSTANTS.handSize)
  return player
}

export function createMatchState(
  matchId: string,
  hostId: string,
  hostName: string,
): MatchState {
  const host = createPlayerState(hostId, hostName)

  const match: MatchState = {
    id: matchId,
    players: {
      [hostId]: host,
    },
    turnOrder: [hostId],
    activePlayerId: hostId,
    eventLog: [],
    turnState: {
      cardsPlayed: 0,
      attackUsed: false,
    },
  }

  log(match, `${host.name} created the match. Waiting for an opponent.`)
  startTurn(match, hostId)
  return match
}

export function addPlayerToMatch(
  match: MatchState,
  playerId: string,
  name: string,
  seed = Date.now(),
): MatchState {
  if (match.players[playerId]) {
    return match
  }

  if (Object.keys(match.players).length >= 2) {
    throw new Error('Match is already full')
  }

  const player = createPlayerState(playerId, name, seed)
  match.players[playerId] = player
  match.turnOrder.push(playerId)
  log(match, `${name} joined the match.`)
  return match
}

export function startTurn(match: MatchState, playerId: string) {
  const player = match.players[playerId]
  const opponent = getOpponent(match, playerId)
  if (!player) return

  match.activePlayerId = playerId
  match.turnState = { cardsPlayed: 0, attackUsed: false }
  player.stats.cash += GAME_CONSTANTS.cashGainPerTurn
  applyBoardEffects(player, opponent)
  drawToHandCap(player)
  clampPlayer(player)
  log(match, `It is now ${player.name}'s turn.`)
}

export function playCard(
  match: MatchState,
  playerId: string,
  cardInstanceId: string,
) {
  ensurePlayerTurn(match, playerId)
  const player = match.players[playerId]
  const opponent = getOpponent(match, playerId)
  if (!player || !opponent) throw new Error('Need two players to start')

  if (match.turnState.cardsPlayed >= GAME_CONSTANTS.cardsPerTurn) {
    throw new Error('You can only play 2 cards per turn')
  }

  const cardIndex = player.hand.findIndex(
    (card) => card.instanceId === cardInstanceId,
  )
  if (cardIndex === -1) {
    throw new Error('Card not found in hand')
  }

  const card = player.hand[cardIndex]
  if (player.stats.cash < card.cost) {
    throw new Error('Not enough Cash')
  }

  player.stats.cash -= card.cost
  match.turnState.cardsPlayed += 1
  player.hand.splice(cardIndex, 1)

  const handler = effectHandlers[card.slug]
  handler(match, player, opponent, card)

  player.discard.push(card)
  clampPlayer(player)
  clampPlayer(opponent)
  checkVictory(match)
}

export function attack(match: MatchState, playerId: string) {
  ensurePlayerTurn(match, playerId)
  const player = match.players[playerId]
  const opponent = getOpponent(match, playerId)
  if (!player || !opponent) throw new Error('Need an opponent to attack')

  if (match.turnState.attackUsed) {
    throw new Error('You already attacked this turn')
  }

  if (player.stats.gdp <= 0) {
    throw new Error('No GDP to attack with')
  }

  opponent.stats.stability -= player.stats.gdp
  match.turnState.attackUsed = true
  clampPlayer(opponent)
  log(
    match,
    `${player.name} launched an Industry attack for ${player.stats.gdp} damage!`,
  )
  checkVictory(match)
}

export function endTurn(match: MatchState, playerId: string) {
  ensurePlayerTurn(match, playerId)
  const currentIndex = match.turnOrder.indexOf(playerId)
  const nextIndex = (currentIndex + 1) % match.turnOrder.length
  const nextPlayerId = match.turnOrder[nextIndex]
  startTurn(match, nextPlayerId)
}

export function generateDeck(seed = Date.now()): CardInstance[] {
  const copiesNeeded = Math.ceil(STARTER_DECK_SIZE / CARD_LIBRARY.length)
  const pool: CardDefinition[] = []
  for (let i = 0; i < copiesNeeded; i += 1) {
    pool.push(...CARD_LIBRARY)
  }
  const slice = pool.slice(0, STARTER_DECK_SIZE)
  const shuffled = shuffle(slice, seed)
  return shuffled.map(instantiateCard)
}

function drawCards(player: PlayerState, count: number) {
  for (let i = 0; i < count; i += 1) {
    if (player.deck.length === 0) {
      reshuffle(player)
      if (player.deck.length === 0) break
    }
    const card = player.deck.shift()
    if (card) {
      player.hand.push(card)
    }
  }
}

function drawToHandCap(player: PlayerState) {
  if (player.hand.length >= GAME_CONSTANTS.handSize) return
  drawCards(player, GAME_CONSTANTS.handSize - player.hand.length)
}

function applyBoardEffects(player: PlayerState, opponent?: PlayerState) {
  player.board.industries = tickBoardSlots(player.board.industries, player, opponent)
  player.board.policies = tickBoardSlots(player.board.policies, player, opponent)
}

function tickBoardSlots(
  slots: BoardSlot[],
  player: PlayerState,
  opponent?: PlayerState,
): BoardSlot[] {
  return slots
    .map((slot) => {
      const effect = slot.effect
      if (effect.gdpPerTurn) player.stats.gdp += effect.gdpPerTurn
      if (effect.happinessPerTurn)
        player.stats.happiness += effect.happinessPerTurn
      if (effect.stabilityPerTurn)
        player.stats.stability += effect.stabilityPerTurn
      if (
        typeof effect.cashNextTurnModifier === 'number' &&
        effect.cashModifierUsesLeft &&
        effect.cashModifierUsesLeft > 0
      ) {
        player.stats.cash = Math.max(
          0,
          player.stats.cash + effect.cashNextTurnModifier,
        )
        effect.cashModifierUsesLeft -= 1
      }
      if (effect.opponentIndustryGdpModifier && opponent) {
        opponent.stats.gdp = Math.max(
          0,
          opponent.stats.gdp + effect.opponentIndustryGdpModifier,
        )
      }
      if (typeof effect.duration === 'number') {
        effect.duration -= 1
      }
      return slot
    })
    .filter((slot) => {
      const { effect } = slot
      if (typeof effect.duration === 'number' && effect.duration <= 0) {
        return false
      }
      return true
    })
}

function addIndustry(player: PlayerState, card: CardInstance, overrides = {}) {
  player.board.industries.push({
    card: duplicateCard(card),
    effect: {
      id: nanoid(6),
      kind: 'industry',
      cardSlug: card.slug,
      ...overrides,
    },
  })
}

function addPolicy(player: PlayerState, card: CardInstance, overrides = {}) {
  player.board.policies.push({
    card: duplicateCard(card),
    effect: {
      id: nanoid(6),
      kind: 'policy',
      cardSlug: card.slug,
      ...overrides,
    },
  })
}

function reshuffle(player: PlayerState) {
  if (player.discard.length === 0) return
  player.deck = shuffle(player.discard)
  player.discard = []
}

function instantiateCard(definition: CardDefinition): CardInstance {
  return {
    ...definition,
    instanceId: nanoid(8),
  }
}

function duplicateCard(card: CardInstance): CardInstance {
  return {
    ...card,
    instanceId: nanoid(8),
  }
}

function getOpponent(match: MatchState, playerId: string) {
  const opponentId = match.turnOrder.find((id) => id !== playerId)
  if (!opponentId) return undefined
  return match.players[opponentId]
}

function ensurePlayerTurn(match: MatchState, playerId: string) {
  if (match.activePlayerId !== playerId) {
    throw new Error('Not your turn')
  }
}

function clampPlayer(player: PlayerState) {
  player.stats.cash = Math.max(0, player.stats.cash)
  player.stats.gdp = Math.max(0, player.stats.gdp)
  player.stats.stability = Math.max(0, Math.min(150, player.stats.stability))
  player.stats.happiness = Math.max(
    0,
    Math.min(GAME_CONSTANTS.victoryHappiness, player.stats.happiness),
  )
}

function checkVictory(match: MatchState) {
  if (match.winnerId) return
  const players = Object.values(match.players)
  players.forEach((player) => clampPlayer(player))

  for (const player of players) {
    if (player.stats.happiness >= GAME_CONSTANTS.victoryHappiness) {
      match.winnerId = player.id
      log(match, `${player.name} reached Economic Victory!`)
      return
    }
  }

  for (const player of players) {
    const opponent = getOpponent(match, player.id)
    if (opponent && opponent.stats.stability <= 0) {
      match.winnerId = player.id
      log(match, `${player.name} achieved Domination Victory!`)
      return
    }
  }
}

function log(match: MatchState, message: string) {
  match.eventLog.unshift({
    id: nanoid(6),
    message,
    timestamp: Date.now(),
  })
  match.eventLog = match.eventLog.slice(0, 40)
}

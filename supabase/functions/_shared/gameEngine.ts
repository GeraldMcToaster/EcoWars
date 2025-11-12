import { CARD_LIBRARY, STARTER_DECK_SIZE } from './cards.ts'

export type CardSlug =
  | 'build-factory'
  | 'tax-cut'
  | 'trade-deal'
  | 'inflation-spike'
  | 'green-energy'
  | 'health-program'
  | 'technology-boom'
  | 'recession'
  | 'tourism-boost'
  | 'price-controls'
  | 'natural-disaster'
  | 'education-reform'
  | 'small-business-grant'
  | 'strike'
  | 'happiness-festival'

export type CardDefinition = (typeof CARD_LIBRARY)[number]

export type CardInstance = CardDefinition & { instanceId: string }

export type PlayerStats = {
  gdp: number
  stability: number
  cash: number
  happiness: number
}

export type BoardSlot = {
  card: CardInstance
  effect: OngoingEffect
}

export type OngoingEffect = {
  id: string
  kind: 'industry' | 'policy'
  cardSlug: CardSlug
  gdpPerTurn?: number
  happinessPerTurn?: number
  stabilityPerTurn?: number
  cashNextTurnModifier?: number
  cashModifierUsesLeft?: number
  duration?: number
  opponentIndustryGdpModifier?: number
}

export type PlayerState = {
  id: string
  name: string
  stats: PlayerStats
  hand: CardInstance[]
  deck: CardInstance[]
  discard: CardInstance[]
  board: {
    industries: BoardSlot[]
    policies: BoardSlot[]
  }
}

export type MatchState = {
  id: string
  players: Record<string, PlayerState>
  turnOrder: string[]
  activePlayerId: string
  winnerId?: string
  eventLog: GameEvent[]
  turnState: {
    cardsPlayed: number
    attackUsed: boolean
  }
}

export type GameEvent = {
  id: string
  message: string
  timestamp: number
}

export const GAME_CONSTANTS = {
  handSize: 5,
  cardsPerTurn: 2,
  cashGainPerTurn: 5,
  victoryHappiness: 120,
}

const STARTING_STATS: PlayerStats = {
  gdp: 10,
  stability: 100,
  cash: 10,
  happiness: 10,
}

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
    log(match, `${player.name} signed a Trade Deal → quick GDP boost`)
  },
  'inflation-spike': (match, _player, opponent) => {
    opponent.stats.stability -= 10
    log(match, `Inflation rocked ${opponent.name} → −10 Stability`)
  },
  'green-energy': (match, player) => {
    player.stats.gdp += 8
    player.stats.happiness += 3
    log(match, `${player.name} funded Green Energy → +8 GDP, +3 Happiness`)
  },
  'health-program': (match, player) => {
    player.stats.stability += 10
    log(match, `${player.name} expanded Health Program → +10 Stability`)
  },
  'technology-boom': (match, player, _opponent, card) => {
    addIndustry(player, card, { gdpPerTurn: 12, happinessPerTurn: 2 })
    log(match, `${player.name} triggered a Technology Boom → +12 GDP/turn`)
  },
  recession: (match, player, opponent) => {
    player.stats.gdp -= 5
    opponent.stats.gdp -= 5
    player.stats.happiness += 3
    log(match, `${player.name} managed a Recession → both −5 GDP, +3 Happiness`)
  },
  'tourism-boost': (match, player) => {
    player.stats.happiness += 6
    log(match, `${player.name} enjoyed a Tourism Boost → +6 Happiness`)
  },
  'price-controls': (match, player, opponent, card) => {
    addPolicy(opponent, card, { gdpPerTurn: -3, duration: 2 })
    log(
      match,
      `${player.name} set Price Controls → ${opponent.name} −3 GDP next 2 turns`,
    )
  },
  'natural-disaster': (match, _player, opponent) => {
    opponent.stats.stability -= 15
    log(match, `Natural Disaster hit ${opponent.name} → −15 Stability`)
  },
  'education-reform': (match, player, _opponent, card) => {
    addPolicy(player, card, { gdpPerTurn: 2, happinessPerTurn: 2 })
    log(
      match,
      `${player.name} passed Education Reform → +2 GDP & Happiness each turn`,
    )
  },
  'small-business-grant': (match, player, _opponent, card) => {
    addIndustry(player, card, { gdpPerTurn: 5 })
    log(match, `${player.name} funded Small Businesses → +5 GDP per turn`)
  },
  strike: (match, _player, opponent) => {
    opponent.stats.gdp -= 5
    log(match, `Strike disrupted ${opponent.name} → −5 GDP`)
  },
  'happiness-festival': (match, player) => {
    player.stats.happiness += 8
    player.stats.stability += 5
    log(match, `${player.name} hosted a Happiness Festival → +8 Happy`)
  },
}

export function createMatchState(
  matchId: string,
  hostId: string,
  hostName: string,
): MatchState {
  const host = createPlayerState(hostId, hostName)
  const match: MatchState = {
    id: matchId,
    players: { [hostId]: host },
    turnOrder: [hostId],
    activePlayerId: hostId,
    eventLog: [],
    turnState: { cardsPlayed: 0, attackUsed: false },
  }
  log(match, `${hostName} created the match.`)
  startTurn(match, hostId)
  return match
}

export function addPlayerToMatch(match: MatchState, playerId: string, name: string) {
  if (match.players[playerId]) return match
  if (Object.keys(match.players).length >= 2) {
    throw new Error('Match full')
  }
  const player = createPlayerState(playerId, name)
  match.players[playerId] = player
  match.turnOrder.push(playerId)
  log(match, `${name} joined the arena.`)
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

export function playCard(match: MatchState, playerId: string, cardId: string) {
  ensurePlayerTurn(match, playerId)
  const player = match.players[playerId]
  const opponent = getOpponent(match, playerId)
  if (!player || !opponent) throw new Error('Match not ready')
  if (match.turnState.cardsPlayed >= GAME_CONSTANTS.cardsPerTurn) {
    throw new Error('Card limit hit')
  }
  const cardIndex = player.hand.findIndex((card) => card.instanceId === cardId)
  if (cardIndex === -1) throw new Error('Card missing')
  const card = player.hand[cardIndex]
  if (player.stats.cash < card.cost) {
    throw new Error('Not enough cash')
  }
  player.stats.cash -= card.cost
  match.turnState.cardsPlayed += 1
  player.hand.splice(cardIndex, 1)
  effectHandlers[card.slug](match, player, opponent, card)
  player.discard.push(card)
  clampPlayer(player)
  clampPlayer(opponent)
  checkVictory(match)
}

export function attack(match: MatchState, playerId: string) {
  ensurePlayerTurn(match, playerId)
  const player = match.players[playerId]
  const opponent = getOpponent(match, playerId)
  if (!player || !opponent) throw new Error('No opponent')
  if (match.turnState.attackUsed) throw new Error('Attack already spent')
  if (player.stats.gdp <= 0) throw new Error('Need GDP to attack')
  opponent.stats.stability -= player.stats.gdp
  match.turnState.attackUsed = true
  clampPlayer(opponent)
  log(
    match,
    `${player.name} attacked ${opponent.name} for ${player.stats.gdp} damage`,
  )
  checkVictory(match)
}

export function endTurn(match: MatchState, playerId: string) {
  ensurePlayerTurn(match, playerId)
  const currentIndex = match.turnOrder.indexOf(playerId)
  const nextIndex = (currentIndex + 1) % match.turnOrder.length
  const nextPlayer = match.turnOrder[nextIndex]
  startTurn(match, nextPlayer)
}

export function createPlayerState(id: string, name: string): PlayerState {
  const deck = generateDeck()
  const player: PlayerState = {
    id,
    name,
    stats: { ...STARTING_STATS },
    hand: [],
    deck,
    discard: [],
    board: { industries: [], policies: [] },
  }
  drawCards(player, GAME_CONSTANTS.handSize)
  return player
}

export function generateDeck(): CardInstance[] {
  const copiesNeeded = Math.ceil(STARTER_DECK_SIZE / CARD_LIBRARY.length)
  const pool: CardDefinition[] = []
  for (let i = 0; i < copiesNeeded; i += 1) {
    pool.push(...CARD_LIBRARY)
  }
  const sample = pool.slice(0, STARTER_DECK_SIZE)
  const shuffled = shuffle(sample)
  return shuffled.map((card) => ({ ...card, instanceId: randomId(8) }))
}

function drawCards(player: PlayerState, count: number) {
  for (let i = 0; i < count; i += 1) {
    if (player.deck.length === 0) {
      reshuffle(player)
      if (player.deck.length === 0) break
    }
    const card = player.deck.shift()
    if (card) player.hand.push(card)
  }
}

function drawToHandCap(player: PlayerState) {
  const needed = GAME_CONSTANTS.handSize - player.hand.length
  if (needed > 0) drawCards(player, needed)
}

function applyBoardEffects(player: PlayerState, opponent?: PlayerState) {
  player.board.industries = tickSlots(player.board.industries, player, opponent)
  player.board.policies = tickSlots(player.board.policies, player, opponent)
}

function tickSlots(
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
      id: randomId(6),
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
      id: randomId(6),
      kind: 'policy',
      cardSlug: card.slug,
      ...overrides,
    },
  })
}

function duplicateCard(card: CardInstance): CardInstance {
  return { ...card, instanceId: randomId(8) }
}

function reshuffle(player: PlayerState) {
  if (player.discard.length === 0) return
  player.deck = shuffle(player.discard)
  player.discard = []
}

function ensurePlayerTurn(match: MatchState, playerId: string) {
  if (match.activePlayerId !== playerId) throw new Error('Not your turn')
}

function getOpponent(match: MatchState, playerId: string) {
  const opponentId = match.turnOrder.find((id) => id !== playerId)
  if (!opponentId) return undefined
  return match.players[opponentId]
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
  for (const player of Object.values(match.players)) {
    if (player.stats.happiness >= GAME_CONSTANTS.victoryHappiness) {
      match.winnerId = player.id
      log(match, `${player.name} secured Economic Victory!`)
      return
    }
    const opponent = getOpponent(match, player.id)
    if (opponent && opponent.stats.stability <= 0) {
      match.winnerId = player.id
      log(match, `${player.name} won by Domination.`)
      return
    }
  }
}

function log(match: MatchState, message: string) {
  match.eventLog.unshift({
    id: randomId(6),
    message,
    timestamp: Date.now(),
  })
  match.eventLog = match.eventLog.slice(0, 40)
}

function randomId(length: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i += 1) {
    result += chars[array[i]! % chars.length]
  }
  return result
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export type CardType = 'event' | 'policy' | 'industry' | 'social'

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

export type PlayerStats = {
  gdp: number
  stability: number
  cash: number
  happiness: number
}

export type StatDelta = Partial<PlayerStats>

export type CardDefinition = {
  slug: CardSlug
  name: string
  type: CardType
  cost: number
  summary: string
  concept: string
}

export type CardInstance = CardDefinition & {
  instanceId: string
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
  opponentIndustryGdpModifier?: number
  duration?: number
}

export type BoardSlot = {
  card: CardInstance
  effect: OngoingEffect
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

export type GameEvent = {
  id: string
  message: string
  timestamp: number
}

export type TurnState = {
  cardsPlayed: number
  attackUsed: boolean
}

export type MatchState = {
  id: string
  players: Record<string, PlayerState>
  turnOrder: string[]
  activePlayerId: string
  winnerId?: string
  eventLog: GameEvent[]
  turnState: TurnState
}

export const STARTING_STATS: PlayerStats = {
  gdp: 10,
  stability: 100,
  cash: 10,
  happiness: 10,
}

export const GAME_CONSTANTS = {
  handSize: 5,
  deckSize: 30,
  cardsPerTurn: 2,
  cashGainPerTurn: 5,
  attackCooldown: 1,
  victoryHappiness: 120,
  dominationStability: 0,
} as const

export type MatchAction =
  | { type: 'play-card'; playerId: string; cardId: string }
  | { type: 'attack'; playerId: string }
  | { type: 'end-turn'; playerId: string }

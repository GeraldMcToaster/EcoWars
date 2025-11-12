import { describe, expect, it } from 'vitest'

import {
  addPlayerToMatch,
  attack,
  createMatchState,
  endTurn,
  playCard,
  startTurn,
} from './gameEngine'

const HOST_ID = 'player-a'
const OPP_ID = 'player-b'

function setupMatch() {
  const match = createMatchState('TEST1', HOST_ID, 'Host')
  addPlayerToMatch(match, OPP_ID, 'Opponent')
  return match
}

function drawSpecificCard(match: ReturnType<typeof setupMatch>, playerId: string, slug: string) {
  const player = match.players[playerId]
  if (!player) throw new Error('missing player')
  const fromHandIndex = player.hand.findIndex((card) => card.slug === slug)
  if (fromHandIndex !== -1) {
    return player.hand[fromHandIndex]
  }
  const fromDeckIndex = player.deck.findIndex((card) => card.slug === slug)
  if (fromDeckIndex === -1) {
    throw new Error(`Card ${slug} missing from deck`)
  }
  const [card] = player.deck.splice(fromDeckIndex, 1)
  player.hand.push(card)
  return card
}

describe('gameEngine core flow', () => {
  it('lets a player play Build Factory and gain GDP next turn', () => {
    const match = setupMatch()
    const card = drawSpecificCard(match, HOST_ID, 'build-factory')
    match.players[HOST_ID].stats.cash = 10

    playCard(match, HOST_ID, card.instanceId)
    expect(match.players[HOST_ID].board.industries.length).toBe(1)
    expect(match.players[HOST_ID].stats.cash).toBeLessThan(10)

    endTurn(match, HOST_ID)
    startTurn(match, HOST_ID)
    expect(match.players[HOST_ID].stats.gdp).toBeGreaterThan(10)
  })

  it('applies Inflation Spike damage to opponent', () => {
    const match = setupMatch()
    const card = drawSpecificCard(match, HOST_ID, 'inflation-spike')
    match.players[HOST_ID].stats.cash = 10
    const before = match.players[OPP_ID].stats.stability
    playCard(match, HOST_ID, card.instanceId)
    expect(match.players[OPP_ID].stats.stability).toBe(before - 10)
  })

  it('declares victory when happiness reaches 120', () => {
    const match = setupMatch()
    const player = match.players[HOST_ID]
    player.stats.happiness = 118
    const card = drawSpecificCard(match, HOST_ID, 'tourism-boost')
    match.players[HOST_ID].stats.cash = 10
    playCard(match, HOST_ID, card.instanceId)
    expect(match.winnerId).toBe(HOST_ID)
  })

  it('handles Industry attacks and domination victories', () => {
    const match = setupMatch()
    match.players[HOST_ID].stats.gdp = 40
    attack(match, HOST_ID)
    expect(match.players[OPP_ID].stats.stability).toBe(60)
    endTurn(match, HOST_ID)
    startTurn(match, HOST_ID)
    match.players[HOST_ID].stats.gdp = 70
    match.players[OPP_ID].stats.stability = 30
    attack(match, HOST_ID)
    expect(match.winnerId).toBe(HOST_ID)
  })
})

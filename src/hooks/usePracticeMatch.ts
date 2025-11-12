import { useCallback, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'

import {
  addPlayerToMatch,
  attack,
  createMatchState,
  endTurn,
  playCard,
} from '../state/gameEngine'
import type { MatchState } from '../types/game'

const BOT_ID = 'sim-bot'
const BOT_NAME = 'SimEconomy'

type Status = 'idle' | 'active' | 'complete'

export function usePracticeMatch() {
  const [match, setMatch] = useState<MatchState | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState<string>('')
  const playerIdRef = useRef<string | null>(null)

  const matchId = match?.id
  const playerId = playerIdRef.current
  const isPlayerTurn = match?.activePlayerId === playerId

  const startPractice = useCallback(
    (name: string) => {
      if (!name) {
        setError('Please pick a nickname')
        return false
      }
      playerIdRef.current = playerIdRef.current ?? nanoid(6)
      setPlayerName(name)
      const id = `PRACT-${nanoid(5).toUpperCase()}`
      const next = createMatchState(id, playerIdRef.current!, name)
      addPlayerToMatch(next, BOT_ID, BOT_NAME)
      setMatch(structuredClone(next))
      setStatus('active')
      setError(null)
      return true
    },
    [setMatch],
  )

  const reset = useCallback(() => {
    setMatch(null)
    setStatus('idle')
    setError(null)
  }, [])

  const updateMatch = useCallback(
    (mutator: (draft: MatchState) => void) => {
      setMatch((current) => {
        if (!current) return current
        const draft = structuredClone(current)
        mutator(draft)
        return draft
      })
    },
    [],
  )

  const play = useCallback(
    (cardId: string) => {
      if (!playerId) return
      updateMatch((draft) => playCard(draft, playerId, cardId))
    },
    [playerId, updateMatch],
  )

  const attackOpponent = useCallback(() => {
    if (!playerId) return
    updateMatch((draft) => attack(draft, playerId))
  }, [playerId, updateMatch])

  const finishTurn = useCallback(() => {
    if (!playerId) return
    updateMatch((draft) => endTurn(draft, playerId))
  }, [playerId, updateMatch])

  // Simple AI turn
  useEffect(() => {
    if (!match) return
    if (match.winnerId) {
      setStatus('complete')
      return
    }

    if (match.activePlayerId !== BOT_ID) return

    const timeout = setTimeout(() => {
      setMatch((current) => {
        if (!current) return current
        const draft = structuredClone(current)
        const bot = draft.players[BOT_ID]
        if (!bot) return current

        try {
          const playable = bot.hand
            .filter((card) => card.cost <= bot.stats.cash)
            .slice(0, 2)
          playable.forEach((card) => {
            playCard(draft, BOT_ID, card.instanceId)
          })
        } catch {
          // ignore
        }

        try {
          attack(draft, BOT_ID)
        } catch {
          // ignore
        }

        try {
          endTurn(draft, BOT_ID)
        } catch {
          // ignore
        }
        return draft
      })
    }, 1200)

    return () => clearTimeout(timeout)
  }, [match])

  return {
    match,
    matchId,
    playerId,
    playerName,
    isPlayerTurn,
    status,
    error,
    startPractice,
    reset,
    actions: {
      playCard: play,
      attack: attackOpponent,
      endTurn: finishTurn,
    },
  }
}

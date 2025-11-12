import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

import { isSupabaseReady, supabase } from '../lib/supabaseClient'
import type { MatchState } from '../types/game'
import {
  attackOnline,
  createOnlineMatch,
  endOnlineTurn,
  joinOnlineMatch,
  playOnlineCard,
} from '../services/matchApi'

type Status = 'disabled' | 'idle' | 'connecting' | 'waiting' | 'active' | 'error'

export function useRealtimeMatch() {
  const [match, setMatch] = useState<MatchState | null>(null)
  const [status, setStatus] = useState<Status>(isSupabaseReady ? 'idle' : 'disabled')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState<string>('')
  const [matchCode, setMatchCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const clearChannel = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
  }, [])

  const subscribeToMatch = useCallback(
    (id: string) => {
      if (!supabase) return
      clearChannel()
      const channel = supabase
        .channel(`matches:${id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${id}` },
          (payload) => {
            const next = (payload.new as { state?: MatchState })?.state
            if (next) {
              setMatch(next)
            }
          },
        )
        .subscribe((subscriptionStatus) => {
          if (subscriptionStatus === 'SUBSCRIBED') {
            setHint('Realtime connected.')
          }
        })

      channelRef.current = channel
    },
    [clearChannel],
  )

  const reset = useCallback(() => {
    clearChannel()
    setMatch(null)
    setPlayerId(null)
    setMatchCode(null)
    setPlayerName('')
    setStatus(isSupabaseReady ? 'idle' : 'disabled')
    setHint(null)
    setError(null)
  }, [clearChannel])

  const handleMatchResponse = useCallback(
    (data: { match: MatchState; playerId: string }, nickname: string) => {
      setMatch(data.match)
      setPlayerId(data.playerId)
      setPlayerName(nickname)
      setMatchCode(data.match.id)
      if (isSupabaseReady) {
        subscribeToMatch(data.match.id)
      }
      setStatus(
        Object.keys(data.match.players).length < 2 ? 'waiting' : 'active',
      )
      setHint(
        Object.keys(data.match.players).length < 2
          ? `Share ${data.match.id} with your partner.`
          : 'Both players connected.',
      )
      setError(null)
    },
    [subscribeToMatch],
  )

  const createMatch = useCallback(
    async (nickname: string) => {
      if (!supabase) {
        setError('Add Supabase keys to enable online mode.')
        return
      }
      setStatus('connecting')
      try {
        const data = await createOnlineMatch(nickname)
        handleMatchResponse(data, nickname)
      } catch (err) {
        setError((err as Error).message)
        setStatus('error')
        throw err
      }
    },
    [handleMatchResponse],
  )

  const joinMatch = useCallback(
    async (code: string, nickname: string) => {
      if (!supabase) {
        setError('Add Supabase keys to enable online mode.')
        return
      }
      setStatus('connecting')
      try {
        const data = await joinOnlineMatch(code, nickname)
        handleMatchResponse(data, nickname)
      } catch (err) {
        setError((err as Error).message)
        setStatus('error')
        throw err
      }
    },
    [handleMatchResponse],
  )

  const playCardOnline = useCallback(
    async (cardId: string) => {
      if (!matchCode || !playerId) return
      try {
        const data = await playOnlineCard({
          matchId: matchCode,
          playerId,
          cardId,
        })
        setMatch(data.match)
      } catch (err) {
        setError((err as Error).message)
      }
    },
    [matchCode, playerId],
  )

  const attackOnlineOpponent = useCallback(async () => {
    if (!matchCode || !playerId) return
    try {
      const data = await attackOnline({ matchId: matchCode, playerId })
      setMatch(data.match)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [matchCode, playerId])

  const endTurnOnline = useCallback(async () => {
    if (!matchCode || !playerId) return
    try {
      const data = await endOnlineTurn({ matchId: matchCode, playerId })
      setMatch(data.match)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [matchCode, playerId])

  useEffect(
    () => () => {
      clearChannel()
    },
    [clearChannel],
  )

  const isPlayerTurn = match?.activePlayerId === playerId

  return {
    supabaseReady: isSupabaseReady,
    match,
    matchCode,
    playerId,
    playerName,
    status,
    error,
    hint,
    isPlayerTurn,
    createMatch,
    joinMatch,
    reset,
    actions: {
      playCard: playCardOnline,
      attack: attackOnlineOpponent,
      endTurn: endTurnOnline,
    },
  }
}

import type { MatchState } from '../types/game'
import { supabase } from '../lib/supabaseClient'

const EDGE_FUNCTION_NAME = 'match-actions'

export type MatchActionResponse = {
  match: MatchState
  playerId: string
}

export async function createOnlineMatch(playerName: string) {
  return invokeEdge({
    action: 'create',
    playerName,
  })
}

export async function joinOnlineMatch(matchId: string, playerName: string) {
  return invokeEdge({
    action: 'join',
    matchId,
    playerName,
  })
}

export async function playOnlineCard(params: {
  matchId: string
  playerId: string
  cardId: string
}) {
  return invokeEdge({
    action: 'play-card',
    ...params,
  })
}

export async function attackOnline(params: { matchId: string; playerId: string }) {
  return invokeEdge({
    action: 'attack',
    ...params,
  })
}

export async function endOnlineTurn(params: { matchId: string; playerId: string }) {
  return invokeEdge({
    action: 'end-turn',
    ...params,
  })
}

async function invokeEdge(body: Record<string, unknown>) {
  if (!supabase) {
    throw new Error('Supabase keys missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, { body })
  if (error) {
    throw new Error(error.message)
  }
  return data as MatchActionResponse
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.5'

import {
  addPlayerToMatch,
  attack,
  createMatchState,
  endTurn,
  MatchState,
  playCard,
} from '../_shared/gameEngine.ts'

type Action =
  | { action: 'create'; playerName: string }
  | { action: 'join'; playerName: string; matchId: string }
  | { action: 'play-card'; matchId: string; playerId: string; cardId: string }
  | { action: 'attack'; matchId: string; playerId: string }
  | { action: 'end-turn'; matchId: string; playerId: string }

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as Action
    switch (body.action) {
      case 'create':
        return await handleCreate(body.playerName)
      case 'join':
        return await handleJoin(body.matchId, body.playerName)
      case 'play-card':
        return await handleMutation(body.matchId, body.playerId, (match) =>
          playCard(match, body.playerId, body.cardId),
        )
      case 'attack':
        return await handleMutation(body.matchId, body.playerId, (match) =>
          attack(match, body.playerId),
        )
      case 'end-turn':
        return await handleMutation(body.matchId, body.playerId, (match) =>
          endTurn(match, body.playerId),
        )
      default:
        return jsonResponse({ error: 'Unsupported action' }, 400)
    }
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 400)
  }
})

async function handleCreate(playerName: string) {
  const playerId = crypto.randomUUID()
  const matchId = createLobbyCode()
  const match = createMatchState(matchId, playerId, playerName)
  await persistMatch(match)
  await syncPlayers(match)
  return jsonResponse({ match, playerId })
}

async function handleJoin(matchId: string, playerName: string) {
  const playerId = crypto.randomUUID()
  const match = await loadMatch(matchId)
  addPlayerToMatch(match, playerId, playerName)
  await persistMatch(match)
  await syncPlayers(match)
  return jsonResponse({ match, playerId })
}

async function handleMutation(
  matchId: string,
  playerId: string,
  mutator: (match: MatchState) => void,
) {
  const match = await loadMatch(matchId)
  mutator(match)
  await persistMatch(match)
  await syncPlayers(match)
  return jsonResponse({ match, playerId })
}

async function loadMatch(matchId: string): Promise<MatchState> {
  const { data, error } = await supabase
    .from('matches')
    .select('state')
    .eq('id', matchId)
    .single()

  if (error || !data) {
    throw new Error('Match not found')
  }
  return data.state as MatchState
}

async function persistMatch(match: MatchState) {
  const { error } = await supabase.from('matches').upsert({
    id: match.id,
    state: match,
    turn: match.activePlayerId,
    winner: match.winnerId ?? null,
    updated_at: new Date().toISOString(),
  })
  if (error) {
    throw new Error(error.message)
  }
}

async function syncPlayers(match: MatchState) {
  const players = Object.values(match.players).map((player) => ({
    id: player.id,
    name: player.name,
    match_id: match.id,
    stats: player.stats,
    hand: player.hand,
  }))
  const { error } = await supabase.from('players').upsert(players)
  if (error) {
    throw new Error(error.message)
  }
}

function createLobbyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 5; i += 1) {
    const index = Math.floor(Math.random() * chars.length)
    result += chars[index]
  }
  return result
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

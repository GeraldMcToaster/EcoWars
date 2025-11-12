import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import cards from '../data/cards.json' with { type: 'json' }

const STARTER_DECK_SIZE = 30

const url =
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  process.env.SUPABASE_PROJECT_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.log('→ Skipping card seed (Supabase env vars missing).')
  process.exit(0)
}

const client = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

async function main() {
  const { data: existing } = await client.from('cards').select('id')
  if (existing && existing.length > 0) {
    await client
      .from('cards')
      .delete()
      .in(
        'id',
        existing.map((row) => row.id),
      )
  }

  const payload = buildDeckRows()
  const { error } = await client.from('cards').insert(payload)
  if (error) {
    console.error('Failed to seed cards:', error.message)
    process.exit(1)
  }

  console.log(`→ Seeded ${payload.length} cards into Supabase.`)
}

function buildDeckRows() {
  const rows = []
  let index = 0
  while (rows.length < STARTER_DECK_SIZE) {
    const card = cards[index % cards.length]
    rows.push({
      name: card.name,
      type: card.type,
      cost: card.cost,
      effect: card.summary,
    })
    index += 1
  }
  return rows
}

main().catch((error) => {
  console.error('Card seeding failed:', error)
  process.exit(1)
})

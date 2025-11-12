import { clsx } from 'clsx'

import { useConfetti } from '../hooks/useConfetti'
import { GAME_CONSTANTS, type MatchState, type PlayerState } from '../types/game'

type MatchViewProps = {
  match: MatchState | null | undefined
  playerId: string | undefined
  modeLabel: string
  isPlayerTurn?: boolean
  onExit: () => void
  actions: {
    playCard: (cardId: string) => void
    attack: () => void
    endTurn: () => void
  }
}

export function MatchView({
  match,
  playerId,
  modeLabel,
  isPlayerTurn,
  onExit,
  actions,
}: MatchViewProps) {
  if (!match || !playerId) {
    return (
      <section className="rounded-3xl bg-white/90 p-10 text-center shadow-panel">
        <p className="text-lg text-eco.dark/70">Select a mode to begin.</p>
      </section>
    )
  }

  const player = match.players[playerId]
  const opponent = Object.values(match.players).find((p) => p.id !== playerId)
  const youWon = match.winnerId === playerId
  const youLost = match.winnerId && match.winnerId !== playerId

  useConfetti(youWon)

  const canPlayCards = isPlayerTurn && !match.winnerId
  const canAttack =
    canPlayCards && !match.turnState.attackUsed && player.stats.gdp > 0

  const cardsRemainingThisTurn =
    GAME_CONSTANTS.cardsPerTurn - match.turnState.cardsPlayed

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-3xl bg-white/90 p-6 shadow-panel space-y-5">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-eco.dark/70">
                Match {match.id}
              </p>
              <h2 className="font-display text-3xl">
                {player.name} vs {opponent?.name ?? 'Waiting…'}
              </h2>
              <p className="text-sm text-eco.dark/70">
                Mode: {modeLabel} · Cards per turn {GAME_CONSTANTS.cardsPerTurn}{' '}
                · Victory at {GAME_CONSTANTS.victoryHappiness} Happiness
              </p>
            </div>
            <button
              type="button"
              onClick={onExit}
              className="rounded-full border border-eco.dark/20 px-4 py-2 text-sm font-semibold text-eco.dark hover:border-eco.dark"
            >
              Leave match
            </button>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <PlayerCard player={player} isYou turnOwner={match.activePlayerId} />
            {opponent ? (
              <PlayerCard player={opponent} turnOwner={match.activePlayerId} />
            ) : (
              <article className="rounded-2xl border border-dashed border-eco.dark/20 p-4 text-eco.dark/60">
                Waiting for a second player to join…
              </article>
            )}
          </div>
        </section>

        <aside className="rounded-3xl bg-eco.dark text-white p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl">Event log</h3>
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
              {match.eventLog.length} entries
            </span>
          </div>
          <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-2 text-sm">
            {match.eventLog.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <p>{event.message}</p>
                <p className="text-xs text-white/60">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
            {match.eventLog.length === 0 && (
              <p className="text-white/70">Play a card to see the story unfold.</p>
            )}
          </div>
        </aside>
      </div>

      <section className="rounded-3xl bg-white/90 p-6 shadow-panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-2xl">Your hand</h3>
          <div className="flex gap-2 text-sm font-semibold">
            <span
              className={clsx(
                'rounded-full px-3 py-1',
                canPlayCards ? 'bg-eco.lime/30 text-eco.dark' : 'bg-gray-200 text-gray-500',
              )}
            >
              {isPlayerTurn ? 'Your turn' : 'Waiting for opponent'}
            </span>
            <span className="rounded-full bg-eco.sky/40 px-3 py-1 text-eco.dark">
              {cardsRemainingThisTurn} card plays left
            </span>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {player.hand.map((card) => {
            const canAfford = player.stats.cash >= card.cost
            return (
              <article
                key={card.instanceId}
                title={`${card.summary} — ${card.concept}`}
                className={clsx(
                  'min-w-[220px] flex-1 rounded-2xl border-2 p-4 transition hover:-translate-y-1',
                  card.type === 'industry' && 'border-emerald-200 bg-emerald-50',
                  card.type === 'policy' && 'border-blue-200 bg-blue-50',
                  card.type === 'event' && 'border-amber-200 bg-amber-50',
                  card.type === 'social' && 'border-pink-200 bg-pink-50',
                )}
              >
                <div className="flex items-center justify-between text-sm uppercase tracking-wide text-eco.dark/70">
                  <span>{card.type}</span>
                  <span className="text-lg font-semibold text-eco.dark">
                    {card.cost}💰
                  </span>
                </div>
                <h4 className="mt-2 font-display text-xl">{card.name}</h4>
                <p className="text-sm text-eco.dark/70">{card.summary}</p>
                <p className="mt-2 text-xs text-eco.dark/50">{card.concept}</p>
                <button
                  type="button"
                  disabled={!canPlayCards || !canAfford}
                  onClick={() => actions.playCard(card.instanceId)}
                  className={clsx(
                    'mt-4 w-full rounded-xl px-3 py-2 text-sm font-semibold transition',
                    !canPlayCards || !canAfford
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-eco.forest text-white hover:bg-eco.dark',
                  )}
                >
                  Play card
                </button>
              </article>
            )
          })}
          {player.hand.length === 0 && (
            <article className="rounded-2xl border-2 border-dashed border-eco.dark/30 p-6 text-eco.dark/60">
              Draw phase complete. End your turn to refresh your hand.
            </article>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white/90 p-6 shadow-panel">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={actions.attack}
            disabled={!canAttack}
            className={clsx(
              'flex-1 rounded-2xl px-6 py-4 text-lg font-semibold transition',
              canAttack ? 'bg-eco.dark text-white hover:bg-black' : 'bg-gray-200 text-gray-500',
            )}
          >
            Attack for {player.stats.gdp} damage
          </button>
          <button
            type="button"
            onClick={actions.endTurn}
            disabled={!canPlayCards}
            className={clsx(
              'rounded-2xl border-2 px-6 py-4 text-lg font-semibold transition',
              canPlayCards
                ? 'border-eco.forest text-eco.forest hover:bg-eco.forest hover:text-white'
                : 'border-gray-200 text-gray-400',
            )}
          >
            End Turn
          </button>
          <div className="rounded-2xl bg-eco.sand px-4 py-3 text-sm text-eco.dark">
            <p>Cash: {player.stats.cash}</p>
            <p>Cards played: {match.turnState.cardsPlayed}/
              {GAME_CONSTANTS.cardsPerTurn}
            </p>
          </div>
        </div>
      </section>

      {(youWon || youLost) && (
        <VictoryBanner
          didWin={youWon}
          opponentName={opponent?.name ?? 'opponent'}
          onExit={onExit}
        />
      )}
    </section>
  )
}

type PlayerCardProps = {
  player: PlayerState
  isYou?: boolean
  turnOwner: string
}

function PlayerCard({ player, isYou, turnOwner }: PlayerCardProps) {
  const stats = [
    {
      label: 'GDP',
      value: player.stats.gdp,
      max: 80,
      color: 'bg-emerald-400',
    },
    {
      label: 'Stability',
      value: player.stats.stability,
      max: 120,
      color: 'bg-sky-400',
    },
    {
      label: 'Happiness',
      value: player.stats.happiness,
      max: GAME_CONSTANTS.victoryHappiness,
      color: 'bg-amber-400',
    },
    {
      label: 'Cash',
      value: player.stats.cash,
      max: 40,
      color: 'bg-lime-400',
    },
  ]
  return (
    <article className="rounded-2xl border border-eco.dark/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-eco.dark/60">
            {isYou ? 'You' : 'Opponent'}
          </p>
          <h3 className="font-display text-2xl">{player.name}</h3>
        </div>
        {turnOwner === player.id && (
          <span className="rounded-full bg-eco.lime/30 px-3 py-1 text-sm font-semibold text-eco.dark">
            Taking turn
          </span>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="flex items-center justify-between text-sm font-semibold text-eco.dark/70">
              <span>{stat.label}</span>
              <span>{stat.value}</span>
            </div>
            <div className="mt-1 h-3 rounded-full bg-eco.dark/10">
              <div
                className={clsx('h-3 rounded-full', stat.color)}
                style={{
                  width: `${Math.min(100, Math.round((stat.value / stat.max) * 100))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      {player.board.industries.length > 0 && (
        <BoardList title="Industries" slots={player.board.industries} />
      )}
      {player.board.policies.length > 0 && (
        <BoardList title="Policies" slots={player.board.policies} />
      )}
    </article>
  )
}

function BoardList({
  title,
  slots,
}: {
  title: string
  slots: PlayerState['board']['industries']
}) {
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-eco.dark/70">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {slots.map((slot) => (
          <span
            key={slot.effect.id}
            className="rounded-full bg-eco.dark/10 px-3 py-1 text-xs font-semibold text-eco.dark"
          >
            {slot.card.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function VictoryBanner({
  didWin,
  opponentName,
  onExit,
}: {
  didWin: boolean
  opponentName: string
  onExit: () => void
}) {
  return (
    <article className="rounded-3xl border-2 border-eco.forest bg-white p-6 text-center shadow-panel">
      <h3 className="font-display text-3xl">
        {didWin ? 'Economic Victory!' : 'Defeat…'}
      </h3>
      <p className="mt-2 text-eco.dark/70">
        {didWin
          ? 'You hit the Happiness threshold and impressed your citizens.'
          : `Keep iterating—${opponentName} managed their economy better this round.`}
      </p>
      <button
        type="button"
        onClick={onExit}
        className="mt-4 rounded-2xl bg-eco.forest px-6 py-3 text-lg font-semibold text-white hover:bg-eco.dark"
      >
        Back to lobby
      </button>
    </article>
  )
}

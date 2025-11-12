import { useState } from 'react'
import { clsx } from 'clsx'

type LobbyProps = {
  nickname: string
  onNicknameChange: (value: string) => void
  onStartPractice: () => void
  practiceDisabled?: boolean
  practiceError?: string | null
  supabaseReady?: boolean
  onCreateOnline?: () => void
  onJoinOnline?: (matchCode: string) => void
  onlineStatus?: string | null
  onlineError?: string | null
}

export function Lobby({
  nickname,
  onNicknameChange,
  onStartPractice,
  practiceDisabled,
  practiceError,
  supabaseReady,
  onCreateOnline,
  onJoinOnline,
  onlineStatus,
  onlineError,
}: LobbyProps) {
  const [matchCode, setMatchCode] = useState('')

  const sharedInput =
    'w-full rounded-2xl border border-eco.dark/15 bg-white/70 px-4 py-3 text-lg placeholder:text-eco.dark/50 focus:border-eco.forest focus:outline-none'

  const nicknameMissing = nickname.trim().length === 0

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <article className="rounded-3xl bg-white/90 p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase text-eco.dark/70">1</p>
        <h2 className="font-display text-2xl">Pick a nickname</h2>
        <p className="text-eco.dark/70">
          No accounts or logins. We only show this name to your opponent.
        </p>
        <input
          value={nickname}
          onChange={(event) => onNicknameChange(event.target.value)}
          placeholder="e.g. SolarSage"
          className={clsx(sharedInput, 'mt-4')}
        />
      </article>

      <article className="rounded-3xl bg-white/90 p-6 shadow-panel space-y-4">
        <p className="text-sm font-semibold uppercase text-eco.dark/70">2</p>
        <h2 className="font-display text-2xl">Practice sandbox</h2>
        <p className="text-eco.dark/70">
          Play against the SimEconomy bot. Great for demos or explaining turn flow.
        </p>
        <button
          type="button"
          disabled={nicknameMissing || practiceDisabled}
          onClick={onStartPractice}
          className={clsx(
            'w-full rounded-2xl px-6 py-3 text-lg font-semibold transition',
            nicknameMissing || practiceDisabled
              ? 'bg-eco.dark/20 text-eco.dark/40 cursor-not-allowed'
              : 'bg-eco.forest text-white hover:bg-eco.dark',
          )}
        >
          Start Practice Match
        </button>
        {practiceError && (
          <p className="rounded-2xl bg-rose-100 px-4 py-2 text-sm text-rose-700">
            {practiceError}
          </p>
        )}
      </article>

      <article className="rounded-3xl bg-white/90 p-6 shadow-panel space-y-4 md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold uppercase text-eco.dark/70">3</p>
            <h2 className="font-display text-2xl">Invite a friend</h2>
            <p className="text-eco.dark/70">
              Create a 5-letter code and share it. Both players stay anonymous.
            </p>
          </div>
          <span
            className={clsx(
              'rounded-full px-4 py-1 text-sm font-semibold',
              supabaseReady ? 'bg-eco.forest/20 text-eco.forest' : 'bg-gray-200 text-gray-600',
            )}
          >
            {supabaseReady ? 'Supabase ready' : 'Add Supabase keys to enable online play'}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            disabled={!supabaseReady || nicknameMissing}
            onClick={onCreateOnline}
            className={clsx(
              'rounded-2xl border-2 px-4 py-3 text-lg font-semibold transition',
              !supabaseReady || nicknameMissing
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-eco.forest text-eco.forest hover:bg-eco.forest hover:text-white',
            )}
          >
            Create Match Code
          </button>
          <div className="flex flex-col gap-2 rounded-2xl border-2 border-eco.dark/10 p-3">
            <label className="text-sm font-semibold text-eco.dark/70">Join match</label>
            <input
              value={matchCode}
              onChange={(event) => setMatchCode(event.target.value.toUpperCase())}
              placeholder="ABCDE"
              disabled={!supabaseReady}
              className={clsx(
                sharedInput,
                'uppercase tracking-[0.4em]',
                !supabaseReady && 'bg-gray-100 text-gray-400 cursor-not-allowed',
              )}
              maxLength={5}
            />
            <button
              type="button"
              disabled={!supabaseReady || matchCode.length !== 5 || nicknameMissing}
              onClick={() => onJoinOnline?.(matchCode)}
              className={clsx(
                'rounded-2xl px-4 py-2 text-base font-semibold transition',
                !supabaseReady || matchCode.length !== 5 || nicknameMissing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-eco.dark text-white hover:bg-black',
              )}
            >
              Join Match
            </button>
          </div>
        </div>
        {onlineStatus && (
          <p className="rounded-2xl bg-eco.sky/20 px-4 py-2 text-sm text-eco.dark">
            {onlineStatus}
          </p>
        )}
        {onlineError && (
          <p className="rounded-2xl bg-rose-100 px-4 py-2 text-sm text-rose-700">
            {onlineError}
          </p>
        )}
      </article>
    </section>
  )
}

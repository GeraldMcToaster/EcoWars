export function Hero() {
  return (
    <header className="rounded-3xl bg-eco-dark text-white p-6 md:p-10 shadow-panel">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-eco.sky">
            EcoWars · Classroom Edition
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight">
            Build the healthiest mini-economy in under five minutes.
          </h1>
          <p className="text-lg text-white/90">
            EcoWars turns Year 7 economics into a fast-paced card duel. Grow GDP,
            keep Stability high, and race to 120 Happiness for an economic victory.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            {['Browser-based', 'No logins', '2-player realtime', 'Supabase Realtime'].map(
              (badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-white/15 px-4 py-1 font-semibold"
                >
                  {badge}
                </span>
              ),
            )}
          </div>
        </div>
        <div className="grid gap-3 text-sm md:text-base w-full lg:max-w-sm">
          {[
            {
              title: 'Win Conditions',
              body: 'Happiness ≥ 120 or reduce opponent Stability ≤ 0.',
            },
            {
              title: 'Turn Order',
              body: 'Gain 5 Cash → play up to two cards → optional Industry attack → End turn.',
            },
            {
              title: 'Card Families',
              body: 'Policies (ongoing boosts), Industries (GDP & attacks), Events (bursts), Social (stability & happiness).',
            },
          ].map((fact) => (
            <article
              key={fact.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <p className="font-semibold text-eco.sky">{fact.title}</p>
              <p className="text-white/80">{fact.body}</p>
            </article>
          ))}
        </div>
      </div>
    </header>
  )
}

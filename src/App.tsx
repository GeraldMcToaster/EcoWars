import { useEffect, useState } from 'react'

import { Hero } from './components/Hero'
import { Lobby } from './components/Lobby'
import { MatchView } from './components/MatchView'
import { usePracticeMatch } from './hooks/usePracticeMatch'
import { useRealtimeMatch } from './hooks/useRealtimeMatch'
import './index.css'

function App() {
  const [nickname, setNickname] = useState('')
  const [view, setView] = useState<'lobby' | 'practice' | 'online'>('lobby')
  const practice = usePracticeMatch()
  const realtime = useRealtimeMatch()

  const cleanedName = nickname.trim()
  const onlineStatusMessage: string =
    realtime.status === 'disabled'
      ? 'Add Supabase keys to enable realtime mode.'
      : (realtime.hint ?? `Status: ${realtime.status}`)

  const handleStartPractice = () => {
    const started = practice.startPractice(cleanedName)
    if (started) {
      setView('practice')
    }
  }

  const handleCreateOnline = async () => {
    if (!cleanedName) return
    try {
      await realtime.createMatch(cleanedName)
      setView('online')
    } catch {
      // errors are surfaced via hook state
    }
  }

  const handleJoinOnline = async (code: string) => {
    if (!cleanedName) return
    try {
      await realtime.joinMatch(code, cleanedName)
      setView('online')
    } catch {
      // errors handled in hook
    }
  }

  const leavePractice = () => {
    practice.reset()
    setView('lobby')
  }

  const leaveOnline = () => {
    realtime.reset()
    setView('lobby')
  }

  useEffect(() => {
    if (practice.status === 'complete') {
      // stay on match view to allow banner; user can leave manually
    }
  }, [practice.status])

  return (
    <div className="min-h-screen bg-gradient-to-b from-eco.sand via-white to-eco.sky/30 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <Hero />
        {view === 'lobby' && (
          <Lobby
            nickname={nickname}
            onNicknameChange={setNickname}
            onStartPractice={handleStartPractice}
            practiceDisabled={practice.status === 'active'}
            practiceError={practice.error}
            supabaseReady={realtime.supabaseReady}
            onCreateOnline={handleCreateOnline}
            onJoinOnline={handleJoinOnline}
            onlineStatus={onlineStatusMessage}
            onlineError={realtime.error}
          />
        )}
        {view === 'practice' && (
          <MatchView
            match={practice.match}
            playerId={practice.playerId ?? undefined}
            modeLabel="Practice vs SimEconomy"
            isPlayerTurn={practice.isPlayerTurn}
            onExit={leavePractice}
            actions={practice.actions}
          />
        )}
        {view === 'online' && (
          <MatchView
            match={realtime.match}
            playerId={realtime.playerId ?? undefined}
            modeLabel="Live Online Match"
            isPlayerTurn={realtime.isPlayerTurn}
            onExit={leaveOnline}
            actions={realtime.actions}
          />
        )}
      </div>
    </div>
  )
}

export default App

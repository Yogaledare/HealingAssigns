import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './auth'
import * as api from './api'
import { RoleListPanel } from './components/RoleListPanel'
import { EncounterPanel } from './components/EncounterPanel'

function App() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: api.getSessions,
  })

  const { data: session } = useQuery({
    queryKey: ['session', selectedSessionId],
    queryFn: () => api.getSession(selectedSessionId!),
    enabled: selectedSessionId !== null,
  })

  const createSession = useMutation({
    mutationFn: (name: string) => api.createSession(name),
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setSelectedSessionId(s.id)
    },
  })

  const handleNewSession = () => {
    const name = prompt('Session name (e.g. "Karazhan Week 3")')
    if (name) createSession.mutate(name)
  }

  if (!user) return null

  if (!selectedSessionId) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Healing Assigns</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-base-content/60">{user.email}</span>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
            </div>
          </div>

          <button className="btn btn-primary mb-6" onClick={handleNewSession}>
            New Session
          </button>

          <div className="flex flex-col gap-2">
            {sessions?.map((s) => (
              <button
                key={s.id}
                className="card bg-base-200 shadow cursor-pointer hover:bg-base-300 transition-colors"
                onClick={() => setSelectedSessionId(s.id)}
              >
                <div className="card-body p-4 flex-row items-center justify-between">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-sm text-base-content/50">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
            {sessions?.length === 0 && (
              <p className="text-base-content/50 text-center py-12">
                No sessions yet. Create one to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="navbar bg-base-200 px-4">
        <div className="flex-1 gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedSessionId(null)}
          >
            &larr; Sessions
          </button>
          <span className="font-bold text-lg">{session?.name}</span>
        </div>
        <div className="flex-none flex items-center gap-3">
          <span className="text-sm text-base-content/60">{user.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Encounters & Assignments */}
        <div className="flex-1 overflow-y-auto p-4">
          {session && (
            <EncounterPanel
              session={session}
            />
          )}
        </div>

        {/* Right: Role Lists */}
        <div className="w-80 border-l border-base-300 overflow-y-auto p-4">
          {session && (
            <RoleListPanel
              session={session}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App

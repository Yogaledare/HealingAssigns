import { Routes, Route, useParams, useNavigate, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './auth'
import * as api from './api'
import { RoleListPanel } from './components/RoleListPanel'
import { EncounterPanel } from './components/EncounterPanel'

function App() {
    const { user } = useAuth()
    if (!user) return null

    return (
        <Routes>
            <Route index element={<SessionList />} />
            <Route path="session/:id" element={<SessionView />} />
        </Routes>
    )
}

function SessionList() {
    const { user, logout } = useAuth()
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const { data: sessions, isPending } = useQuery({
        queryKey: ['sessions'],
        queryFn: api.getSessions,
    })

    const createSession = useMutation({
        mutationFn: (name: string) => api.createSession(name),
        onSuccess: (s) => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            navigate(`/session/${s.id}`)
        },
    })

    const handleNewSession = () => {
        const name = prompt('Session name (e.g. "Karazhan Week 3")')
        if (name) createSession.mutate(name)
    }

    return (
        <div className="container py-4" style={{ maxWidth: 600 }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h1 className="h4 mb-0">Healing Assigns</h1>
                <div className="d-flex align-items-center gap-2">
                    <small className="text-secondary">{user!.email}</small>
                    <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
                        Sign out
                    </button>
                </div>
            </div>

            <button className="btn btn-primary mb-4" onClick={handleNewSession}>
                New Session
            </button>

            {isPending ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-secondary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-secondary mt-3 mb-0">Loading sessions...</p>
                </div>
            ) : (
                <div className="list-group">
                    {sessions?.map((s) => (
                        <Link
                            key={s.id}
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                            to={`/session/${s.id}`}
                        >
                            <span className="fw-semibold">{s.name}</span>
                            <small className="text-secondary">
                                {new Date(s.createdAt).toLocaleDateString()}
                            </small>
                        </Link>
                    ))}
                    {sessions?.length === 0 && (
                        <p className="text-secondary text-center py-5">
                            No sessions yet. Create one to get started.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

function SessionView() {
    const { user, logout } = useAuth()
    const { id } = useParams()

    const { data: session, isPending } = useQuery({
        queryKey: ['session', Number(id)],
        queryFn: () => api.getSession(Number(id)),
    })

    return (
        <div className="d-flex flex-column vh-100">
            <nav className="navbar navbar-light bg-light border-bottom px-3">
                <div className="d-flex align-items-center gap-2">
                    <Link className="btn btn-link btn-sm text-decoration-none" to="/">
                        &larr; Sessions
                    </Link>
                    <span className="fw-bold">{session?.name}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <small className="text-secondary">{user!.email}</small>
                    <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
                        Sign out
                    </button>
                </div>
            </nav>

            {isPending ? (
                <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center">
                    <div className="spinner-border text-secondary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-secondary mt-3 mb-0">Loading session...</p>
                </div>
            ) : (
                <div className="row g-0 flex-grow-1 overflow-hidden">
                    <div className="col overflow-auto p-3">
                        {session && <EncounterPanel session={session} />}
                    </div>
                    <div className="col-auto border-start overflow-auto p-3" style={{ width: 340 }}>
                        {session && <RoleListPanel session={session} />}
                    </div>
                </div>
            )}
        </div>
    )
}

export default App

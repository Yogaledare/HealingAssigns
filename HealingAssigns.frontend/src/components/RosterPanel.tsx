import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Session, Player } from '../api'
import * as api from '../api'
import { useReferences } from '../hooks/useReferences'
import { usePlayers } from '../hooks/usePlayers'
import { readableColor, isLightColor } from '../lib/color'
import { playerId } from '../lib/dragIds'

function PlayerBadge({ player, dimmed }: { player: Player; dimmed?: boolean }) {
    const light = isLightColor(player.playerClassColor)
    return (
        <span
            className="badge rounded-pill px-2 py-1 text-truncate"
            style={{
                backgroundColor: light ? readableColor(player.playerClassColor) : player.playerClassColor,
                color: '#fff',
                fontSize: '0.75rem',
                opacity: dimmed ? 0.5 : 1,
                maxWidth: 140,
            }}
        >
            {player.name}
        </span>
    )
}

function DraggablePlayer({
    player,
    onDeactivate,
    onDelete,
}: {
    player: Player
    onDeactivate: () => void
    onDelete: () => void
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: playerId(player.id),
    })

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className="d-flex align-items-center gap-2"
            style={{
                opacity: isDragging ? 0.3 : 1,
                cursor: 'grab',
                minWidth: 0,
            }}
        >
            <PlayerBadge player={player} />
            <small className="text-secondary text-nowrap">{player.specName}</small>
            <div className="ms-auto d-flex gap-1 flex-shrink-0">
                <button
                    className="btn btn-sm btn-outline-secondary py-0 px-1"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={onDeactivate}
                    title="Deactivate"
                    style={{ fontSize: '0.65rem' }}
                >
                    Deactivate
                </button>
                <button
                    className="btn btn-sm btn-outline-danger py-0 px-1"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={onDelete}
                    title="Remove from roster"
                >
                    ×
                </button>
            </div>
        </div>
    )
}

function InactivePlayer({
    player,
    onActivate,
    onDelete,
}: {
    player: Player
    onActivate: () => void
    onDelete: () => void
}) {
    return (
        <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
            <PlayerBadge player={player} dimmed />
            <small className="text-secondary text-nowrap">{player.specName}</small>
            <div className="ms-auto d-flex gap-1 flex-shrink-0">
                <button
                    className="btn btn-sm btn-outline-success py-0 px-1"
                    onClick={onActivate}
                    title="Activate"
                    style={{ fontSize: '0.65rem' }}
                >
                    Activate
                </button>
                <button
                    className="btn btn-sm btn-outline-danger py-0 px-1"
                    onClick={onDelete}
                    title="Remove from roster"
                >
                    ×
                </button>
            </div>
        </div>
    )
}

function AddPlayerForm({ onAdd }: { onAdd: (name: string, specId: number) => void }) {
    const { data: refs } = useReferences()
    const [name, setName] = useState('')
    const [specId, setSpecId] = useState('')

    const handleAdd = () => {
        if (!name.trim() || !specId) return
        onAdd(name.trim(), Number(specId))
        setName('')
        setSpecId('')
    }

    const specsByClass = refs?.specs.reduce((acc, spec) => {
        const cls = refs.playerClasses.find(c => c.id === spec.playerClassId)
        const key = cls?.name ?? 'Unknown'
        if (!acc[key]) acc[key] = []
        acc[key].push(spec)
        return acc
    }, {} as Record<string, typeof refs.specs>) ?? {}

    return (
        <div className="input-group input-group-sm">
            <input
                className="form-control"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <select
                className="form-select"
                value={specId}
                onChange={(e) => setSpecId(e.target.value)}
                style={{ maxWidth: 130 }}
            >
                <option value="">Spec</option>
                {Object.entries(specsByClass).map(([className, specs]) => (
                    <optgroup key={className} label={className}>
                        {specs.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </optgroup>
                ))}
            </select>
            <button className="btn btn-primary" onClick={handleAdd}>+</button>
        </div>
    )
}

function ImportForm({ onImport }: { onImport: (text: string) => void }) {
    const [text, setText] = useState('')

    const handleImport = () => {
        if (!text.trim()) return
        onImport(text)
        setText('')
    }

    return (
        <div className="mb-3">
            <textarea
                className="form-control form-control-sm mb-2"
                rows={6}
                placeholder="Paste Raid Helper signup text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button
                className="btn btn-sm btn-primary w-100"
                onClick={handleImport}
                disabled={!text.trim()}
            >
                Parse & Import
            </button>
        </div>
    )
}

interface StatusMessage {
    text: string
    details?: string[]
}

export function RosterPanel({ session }: { session: Session }) {
    const queryClient = useQueryClient()
    const { data: players = [] } = usePlayers()
    const { data: refs } = useReferences()
    const [showImport, setShowImport] = useState(false)
    const [status, setStatus] = useState<StatusMessage | null>(null)

    const invalidateSession = () => queryClient.invalidateQueries({ queryKey: ['session', session.id] })
    const invalidatePlayers = () => queryClient.invalidateQueries({ queryKey: ['players'] })

    const createPlayer = useMutation({
        mutationFn: (args: { name: string; specId: number }) =>
            api.createPlayer(args.name, args.specId),
        onSuccess: (player) => {
            invalidatePlayers()
            setStatus({ text: `${player.name} added` })
        },
    })

    const deletePlayer = useMutation({
        mutationFn: (id: number) => api.deletePlayer(id),
        onSuccess: () => { invalidatePlayers(); invalidateSession() },
    })

    const activatePlayer = useMutation({
        mutationFn: (id: number) => api.activatePlayer(id),
        onSuccess: invalidatePlayers,
    })

    const deactivatePlayer = useMutation({
        mutationFn: (id: number) => api.deactivatePlayer(id),
        onSuccess: invalidatePlayers,
    })

    const deactivateAll = useMutation({
        mutationFn: () => api.deactivateAllPlayers(),
        onSuccess: () => {
            invalidatePlayers()
            setStatus({ text: 'All players deactivated' })
        },
    })

    const importPlayers = useMutation({
        mutationFn: (text: string) => api.importPlayers(text),
        onSuccess: (data) => {
            invalidatePlayers()
            setShowImport(false)
            const details: string[] = []
            const created = data.players.filter(p => p.status === 'created').length
            const updated = data.players.filter(p => p.status === 'updated').length
            const unchanged = data.players.filter(p => p.status === 'unchanged').length
            const skipped = data.players.filter(p => p.status === 'skipped').length
            if (created > 0) details.push(`${created} created`)
            if (updated > 0) details.push(`${updated} updated`)
            if (unchanged > 0) details.push(`${unchanged} unchanged`)
            if (skipped > 0) details.push(`${skipped} skipped`)
            setStatus({ text: 'Import complete', details })
        },
    })

    const activePlayers = players.filter(p => p.isActive)
    const inactivePlayers = players
        .filter(p => !p.isActive)
        .sort((a, b) => {
            const aDate = a.lastActivatedAt ? new Date(a.lastActivatedAt).getTime() : 0
            const bDate = b.lastActivatedAt ? new Date(b.lastActivatedAt).getTime() : 0
            return bDate - aDate
        })

    const activeGrouped = (refs?.roles ?? []).map(role => ({
        role,
        players: activePlayers.filter(p => p.roleId === role.id),
    }))

    return (
        <div className="d-flex flex-column h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Roster</h5>
                <div className="d-flex gap-1">
                    {activePlayers.length > 0 && (
                        <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => deactivateAll.mutate()}
                        >
                            Deactivate All
                        </button>
                    )}
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => { setShowImport(!showImport); setStatus(null) }}
                    >
                        {showImport ? 'Cancel' : 'Import'}
                    </button>
                </div>
            </div>

            {showImport && (
                <ImportForm onImport={(text) => importPlayers.mutate(text)} />
            )}

            <div className="mb-3">
                <AddPlayerForm onAdd={(name, specId) => createPlayer.mutate({ name, specId })} />
            </div>

            {status && (
                <div className="alert alert-info small py-2 px-3 mb-3 d-flex align-items-start">
                    <div className="flex-grow-1">
                        <strong>{status.text}</strong>
                        {status.details && (
                            <span className="ms-1">— {status.details.join(', ')}</span>
                        )}
                    </div>
                    <button className="btn-close btn-close-sm ms-2" style={{ fontSize: '0.5rem' }} onClick={() => setStatus(null)} />
                </div>
            )}

            <div className="row g-3 flex-grow-1 overflow-hidden">
                <div className="col overflow-auto" style={{ minHeight: 0 }}>
                    <small className="text-secondary fw-semibold text-uppercase d-block mb-2">
                        Inactive ({inactivePlayers.length})
                    </small>
                    <div className="d-flex flex-column gap-1">
                        {inactivePlayers.map(player => (
                            <InactivePlayer
                                key={player.id}
                                player={player}
                                onActivate={() => activatePlayer.mutate(player.id)}
                                onDelete={() => deletePlayer.mutate(player.id)}
                            />
                        ))}
                        {inactivePlayers.length === 0 && (
                            <p className="text-secondary small mb-0">No inactive players</p>
                        )}
                    </div>
                </div>
                <div className="col overflow-auto" style={{ minHeight: 0 }}>
                    <small className="text-secondary fw-semibold text-uppercase d-block mb-2">
                        Active ({activePlayers.length})
                    </small>
                    {activeGrouped.map(({ role, players: rolePlayers }) => (
                        rolePlayers.length > 0 && (
                            <div key={role.id} className="mb-3">
                                <small className="text-secondary fw-semibold">{role.name}s</small>
                                <div className="d-flex flex-column gap-1 mt-1">
                                    {rolePlayers.map(player => (
                                        <DraggablePlayer
                                            key={player.id}
                                            player={player}
                                            onDeactivate={() => deactivatePlayer.mutate(player.id)}
                                            onDelete={() => deletePlayer.mutate(player.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                    {activePlayers.length === 0 && (
                        <p className="text-secondary small mb-0">No active players</p>
                    )}
                </div>
            </div>
        </div>
    )
}

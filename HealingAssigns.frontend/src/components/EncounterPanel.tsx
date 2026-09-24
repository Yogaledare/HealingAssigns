import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Session, Encounter, Assignment, AssignmentInput } from '../api'
import * as api from '../api'
import { SlotSelect, SlotOccupant, findSlot } from './SlotSelect'
import { useReferences } from '../hooks/useReferences'

export function EncounterPanel({ session }: { session: Session }) {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['session', session.id] })

    const addEncounter = useMutation({
        mutationFn: (name: string) => api.createEncounter(session.id, name),
        onSuccess: invalidate,
    })

    const removeEncounter = useMutation({
        mutationFn: (id: number) => api.deleteEncounter(id),
        onSuccess: invalidate,
    })

    const handleAdd = () => {
        const name = prompt('Encounter name (e.g. "Attumen", "Moroes", "Trash - General")')
        if (name) addEncounter.mutate(name)
    }

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Encounters</h5>
                <button className="btn btn-primary btn-sm" onClick={handleAdd}>
                    + Encounter
                </button>
            </div>

            {session.encounters.length === 0 && (
                <p className="text-secondary text-center py-5">
                    No encounters yet. Add one to start assigning.
                </p>
            )}

            <div className="d-flex flex-column gap-3">
                {session.encounters.map((encounter) => (
                    <EncounterCard
                        key={encounter.id}
                        encounter={encounter}
                        session={session}
                        onRemove={() => removeEncounter.mutate(encounter.id)}
                    />
                ))}
            </div>
        </div>
    )
}

function toInput(a: Assignment): AssignmentInput {
    return {
        symbolId: a.symbolId,
        description: a.description,
        slotId: a.slotId,
        isEnabled: a.isEnabled,
    }
}

function EncounterCard({
    encounter,
    session,
    onRemove,
}: {
    encounter: Encounter
    session: Session
    onRemove: () => void
}) {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['session', session.id] })

    const addAssignment = useMutation({
        mutationFn: (parentId: number | null) => api.createAssignment(encounter.id, parentId),
        onSuccess: invalidate,
    })

    const updateAssignment = useMutation({
        mutationFn: (args: { id: number; input: AssignmentInput }) =>
            api.updateAssignment(args.id, args.input),
        onSuccess: invalidate,
    })

    const removeAssignment = useMutation({
        mutationFn: (id: number) => api.deleteAssignment(id),
        onSuccess: invalidate,
    })

    const macroText = buildMacro(encounter, session)

    return (
        <div className="card">
            <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <h6 className="card-title mb-0 fw-bold">{encounter.name}</h6>
                    <button className="btn btn-sm btn-outline-danger" onClick={onRemove}>
                        Delete
                    </button>
                </div>

                <table className="table table-sm table-borderless align-middle mb-1">
                    <thead>
                        <tr>
                            <th style={{ width: '13%' }}>Symbol</th>
                            <th style={{ width: '26%' }}>Assignment</th>
                            <th style={{ width: '15%' }}>Currently</th>
                            <th style={{ width: '26%' }}>Note</th>
                            <th style={{ width: 40 }}></th>
                            <th style={{ width: 110 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {encounter.assignments.map((a) => (
                            <AssignmentBlock
                                key={a.id}
                                assignment={a}
                                session={session}
                                onUpdate={(id, input) => updateAssignment.mutate({ id, input })}
                                onRemove={(id) => removeAssignment.mutate(id)}
                                onAddChild={() => addAssignment.mutate(a.id)}
                            />
                        ))}
                    </tbody>
                </table>

                <button
                    className="btn btn-outline-secondary btn-sm w-100"
                    onClick={() => addAssignment.mutate(null)}
                    disabled={addAssignment.isPending}
                >
                    + Add assignment
                </button>

                {encounter.assignments.length > 0 && <MacroOutput text={macroText} />}
            </div>
        </div>
    )
}

function AssignmentBlock({
    assignment,
    session,
    onUpdate,
    onRemove,
    onAddChild,
}: {
    assignment: Assignment
    session: Session
    onUpdate: (id: number, input: AssignmentInput) => void
    onRemove: (id: number) => void
    onAddChild: () => void
}) {
    return (
        <>
            <AssignmentRow
                assignment={assignment}
                session={session}
                depth={0}
                parentEnabled
                onUpdate={onUpdate}
                onRemove={onRemove}
                onAddChild={onAddChild}
            />
            {assignment.children.map((c) => (
                <AssignmentRow
                    key={c.id}
                    assignment={c}
                    session={session}
                    depth={1}
                    parentEnabled={assignment.isEnabled}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                />
            ))}
        </>
    )
}

function AssignmentRow({
    assignment,
    session,
    depth,
    parentEnabled,
    onUpdate,
    onRemove,
    onAddChild,
}: {
    assignment: Assignment
    session: Session
    depth: 0 | 1
    parentEnabled: boolean
    onUpdate: (id: number, input: AssignmentInput) => void
    onRemove: (id: number) => void
    onAddChild?: () => void
}) {
    const { data: refs } = useReferences()

    const handleChange = (patch: Partial<AssignmentInput>) => {
        onUpdate(assignment.id, { ...toInput(assignment), ...patch })
    }

    const dimmed = !assignment.isEnabled || !parentEnabled
    const rowStyle = dimmed ? { opacity: 0.45 } : undefined

    return (
        <tr style={rowStyle}>
            <td>
                {depth === 0 ? (
                    <select
                        className="form-select form-select-sm"
                        value={assignment.symbolId ?? ''}
                        onChange={(e) => handleChange({ symbolId: e.target.value ? Number(e.target.value) : null })}
                    >
                        <option value="">None</option>
                        {refs?.symbols.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.icon} {s.name}
                            </option>
                        ))}
                    </select>
                ) : (
                    <span className="text-secondary d-block text-end pe-1">↳</span>
                )}
            </td>
            <td>
                <SlotSelect
                    roleLists={session.roleLists}
                    value={assignment.slotId}
                    allowNone
                    onChange={(v) => handleChange({ slotId: v })}
                />
            </td>
            <td>
                <SlotOccupant roleLists={session.roleLists} slotId={assignment.slotId} />
            </td>
            <td>
                <input
                    className="form-control form-control-sm"
                    value={assignment.description ?? ''}
                    placeholder={depth === 0 ? 'what / where…' : 'job, e.g. decurse…'}
                    onChange={(e) => handleChange({ description: e.target.value || null })}
                />
            </td>
            <td className="text-center">
                <div className="form-check form-switch d-inline-block" title={assignment.isEnabled ? 'Enabled' : 'Disabled — excluded from macro'}>
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={assignment.isEnabled}
                        onChange={(e) => handleChange({ isEnabled: e.target.checked })}
                    />
                </div>
            </td>
            <td className="text-end text-nowrap">
                {onAddChild && (
                    <button
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={onAddChild}
                        title="Add a sub-assignment (heal, decurse, …)"
                    >
                        + sub
                    </button>
                )}
                <button className="btn btn-sm btn-outline-danger" onClick={() => onRemove(assignment.id)}>
                    ×
                </button>
            </td>
        </tr>
    )
}

function MacroOutput({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const tooLong = text.length > 255

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="mt-3">
            <div className="d-flex align-items-center justify-content-between mb-1">
                <small className="fw-semibold">
                    Macro ({text.length}/255)
                    {tooLong && <span className="text-danger ms-1">Too long!</span>}
                </small>
                <button className="btn btn-sm btn-outline-primary" onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre
                className={`bg-light border rounded p-2 small mb-0 ${tooLong ? 'border-danger' : ''}`}
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
            >
                {text}
            </pre>
        </div>
    )
}

function buildMacro(encounter: Encounter, session: Session): string {
    const nameOf = (slotId: number | null) =>
        slotId != null ? (findSlot(session.roleLists, slotId)?.slot.playerName ?? '?') : null

    const partFor = (a: Assignment): string => {
        const name = nameOf(a.slotId)
        if (name && a.description) return `${name} (${a.description})`
        return name ?? a.description ?? '?'
    }

    const lines = encounter.assignments
        .filter((a) => a.isEnabled)
        .map((a) => {
            const marker = a.symbolName ? `{${a.symbolName.toLowerCase()}} ` : ''
            const kids = a.children.filter((c) => c.isEnabled).map(partFor).join('+')
            const head = partFor(a)
            return kids ? `${marker}${head}: ${kids}` : `${marker}${head}`
        })
    return `/raid ${encounter.name}: ${lines.join(' | ')}`
}

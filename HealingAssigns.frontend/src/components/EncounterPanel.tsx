import { useState, type CSSProperties } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Session, Encounter, Assignment, AssignmentInput } from '../api'
import * as api from '../api'
import { SlotSelect, SlotOccupant } from './SlotSelect'
import { useReferences } from '../hooks/useReferences'
import { assignmentId } from '../lib/dragIds'
import { noAnimateOnDrop } from '../lib/sortable'
import { buildMacro } from '../lib/macro'
import { InlineName } from './InlineName'

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

    // Optimistic, so the title and the macro line change the moment you commit
    const renameEncounter = useMutation({
        mutationFn: (args: { id: number; name: string }) => api.updateEncounter(args.id, args.name),
        onMutate: ({ id, name }) => {
            queryClient.setQueryData<Session>(['session', session.id], (old) =>
                old && { ...old, encounters: old.encounters.map((e) => (e.id === id ? { ...e, name } : e)) })
        },
        onSettled: invalidate,
    })

    const handleAdd = () => {
        const name = prompt('Encounter name (e.g. "Attumen", "Moroes", "Trash - General")')
        if (name) addEncounter.mutate(name)
    }

    return (
        <div>
            <h5 className="mb-3">Encounters</h5>

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
                        onRename={(name) => renameEncounter.mutate({ id: encounter.id, name })}
                        onRemove={() => removeEncounter.mutate(encounter.id)}
                    />
                ))}
            </div>

            {/* At the bottom: that is where you are when you want the next one */}
            <button
                className="btn btn-outline-secondary w-100 mt-3"
                onClick={handleAdd}
                disabled={addEncounter.isPending}
            >
                + Add encounter
            </button>
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

// Each group is its own card so that dragging it moves its sub-rows along.
// The header strip and every card share this column plan, so the columns
// still line up down the whole list.
const COLUMNS: { label: string; width: string | number }[] = [
    { label: 'Symbol', width: '13%' },
    { label: 'Assignment', width: '18%' },
    { label: 'Currently', width: '15%' },
    { label: 'Note', width: '34%' },
    { label: '', width: 56 },
    { label: '', width: 110 },
]
const HANDLE_WIDTH = 22
const GROUP_BORDER = '1px solid #dee2e6'

// Fixed layout so the <col> widths are honored exactly; transparent cells so
// the card background shows through.
const tableStyle = { tableLayout: 'fixed', '--bs-table-bg': 'transparent' } as CSSProperties

function ColGroup() {
    return (
        <colgroup>
            {COLUMNS.map((c, i) => (
                <col key={i} style={{ width: c.width }} />
            ))}
        </colgroup>
    )
}

function EncounterCard({
    encounter,
    session,
    onRename,
    onRemove,
}: {
    encounter: Encounter
    session: Session
    onRename: (name: string) => void
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
                <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                    <InlineName
                        value={encounter.name}
                        onCommit={onRename}
                        className="fw-bold"
                        style={{ fontSize: '1rem' }}
                    />
                    <button className="btn btn-sm btn-outline-danger flex-shrink-0" onClick={onRemove}>
                        Delete
                    </button>
                </div>

                <AssignmentHeader />
                <SortableContext
                    items={encounter.assignments.map((a) => assignmentId(a.id))}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="d-flex flex-column gap-2 mb-2">
                        {encounter.assignments.map((a) => (
                            <AssignmentGroup
                                key={a.id}
                                assignment={a}
                                session={session}
                                onUpdate={(id, input) => updateAssignment.mutate({ id, input })}
                                onRemove={(id) => removeAssignment.mutate(id)}
                                onAddChild={() => addAssignment.mutate(a.id)}
                            />
                        ))}
                    </div>
                </SortableContext>

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

function AssignmentHeader() {
    // Same handle strip and border as a card, just invisible, so the columns line up
    return (
        <div className="d-flex" style={{ border: '1px solid transparent' }}>
            <div className="flex-shrink-0" style={{ width: HANDLE_WIDTH }} />
            <div className="flex-grow-1 px-2">
                <table className="table table-sm table-borderless mb-0" style={tableStyle}>
                    <ColGroup />
                    <thead>
                        <tr>
                            {COLUMNS.map((c, i) => (
                                <th key={i}>{c.label}</th>
                            ))}
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
    )
}

/** One top-level assignment with its sub-rows, as a single sortable card.
 *  Only the strip on the left is a drag handle, so the controls inside need
 *  no pointer-event workarounds. */
function AssignmentGroup({
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
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
        useSortable({ id: assignmentId(assignment.id), animateLayoutChanges: noAnimateOnDrop })

    // While dragging, this card stays in the list as an empty dashed placeholder
    // that slides to where the group will land. The ghost under the pointer is
    // the DragOverlay in DragDropProvider.
    const hidden: CSSProperties | undefined = isDragging ? { visibility: 'hidden' } : undefined

    return (
        <div
            ref={setNodeRef}
            className="d-flex rounded"
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                border: isDragging ? '1px dashed #adb5bd' : GROUP_BORDER,
                backgroundColor: isDragging ? '#f1f3f5' : '#f8f9fa',
            }}
        >
            <div
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                className="d-flex align-items-center justify-content-center flex-shrink-0 text-secondary user-select-none"
                title="Drag to reorder"
                style={{ width: HANDLE_WIDTH, cursor: 'grab', touchAction: 'none', borderRight: GROUP_BORDER, ...hidden }}
            >
                <i className="fa-solid fa-grip-vertical" style={{ fontSize: '0.8rem' }} />
            </div>
            <div className="flex-grow-1 px-2 py-1" style={hidden}>
                <table className="table table-sm table-borderless align-middle mb-0" style={tableStyle}>
                    <ColGroup />
                    <tbody>
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
                    </tbody>
                </table>
            </div>
        </div>
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
            <td>
                {/* Bootstrap sizes the switch for a line of text and offsets it to
                    sit on the baseline. Strip those offsets and center it in the
                    cell so it lines up with the inputs. */}
                <div className="form-check form-switch d-flex justify-content-center p-0 m-0" style={{ minHeight: 0 }}>
                    <input
                        className="form-check-input m-0 flex-shrink-0"
                        type="checkbox"
                        role="switch"
                        checked={assignment.isEnabled}
                        onChange={(e) => handleChange({ isEnabled: e.target.checked })}
                        title={assignment.isEnabled ? 'Enabled' : 'Disabled — excluded from macro'}
                        style={{ width: '2.5em', height: '1.25em', cursor: 'pointer' }}
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

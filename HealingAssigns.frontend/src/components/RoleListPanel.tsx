import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    defaultAnimateLayoutChanges,
    type AnimateLayoutChanges,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Session, RoleList, RoleSlot } from '../api'
import * as api from '../api'
import { readableColor, isLightColor } from '../lib/color'
import { useReferences, getClassColor } from '../hooks/useReferences'
import { useDragDropContext } from './DragDropProvider'
import { slotId } from '../lib/dragIds'
import { SlotNumberBadge } from './SlotNumberBadge'

const ICON_CHOICES = ['🛡️', '⚔️', '💚', '✨', '🌙', '⭐', '💀', '🔨', '🏹', '🔮', '😇', '🐻', '❄️', '🔥', '🌿', '⚡', '💧', '🎯']

function IconPicker({ value, onChange }: { value: string | null; onChange: (icon: string | null) => void }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    return (
        <div className="position-relative flex-shrink-0" ref={ref}>
            <button
                className="btn btn-sm border-0 bg-transparent p-0 text-center"
                onClick={() => setOpen(!open)}
                title="Pick an icon"
                style={{ width: 32, fontSize: '1.1rem' }}
            >
                {value ?? <span className="text-secondary">—</span>}
            </button>
            {open && (
                <div
                    className="position-absolute z-3 mt-1 bg-white border rounded shadow-sm p-2"
                    style={{ width: 240 }}
                >
                    <div className="d-flex flex-wrap gap-1">
                        {ICON_CHOICES.map((e) => (
                            <button
                                key={e}
                                className="btn btn-sm btn-light p-0"
                                style={{ width: 34, height: 34, fontSize: '1.1rem' }}
                                onClick={() => { onChange(e); setOpen(false) }}
                            >
                                {e}
                            </button>
                        ))}
                        <button
                            className="btn btn-sm btn-light p-0 text-secondary"
                            style={{ width: 34, height: 34 }}
                            title="No icon"
                            onClick={() => { onChange(null); setOpen(false) }}
                        >
                            ✕
                        </button>
                    </div>
                    <input
                        className="form-control form-control-sm mt-2"
                        placeholder="…or type any emoji"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value || null)}
                    />
                </div>
            )}
        </div>
    )
}

function SlotBadge({ slot, ghost }: { slot: RoleSlot; ghost?: boolean }) {
    const { data: refs } = useReferences()
    const color = getClassColor(refs, slot.playerClassId)
    const light = isLightColor(color)
    return (
        <span
            className="badge rounded-pill px-2 py-1 text-start"
            style={{
                backgroundColor: light ? readableColor(color) : (color ?? '#6c757d'),
                color: '#fff',
                fontSize: '0.8rem',
                opacity: ghost ? 0.4 : 1,
            }}
        >
            {slot.playerName}
        </span>
    )
}

const noAnimateOnDrop: AnimateLayoutChanges = (args) =>
    args.isSorting || args.wasDragging ? false : defaultAnimateLayoutChanges(args)

function SortableSlot({
    slot,
    ghost,
    onVacate,
    onDeleteRow,
}: {
    slot: RoleSlot
    ghost?: boolean
    onVacate: () => void
    onDeleteRow: () => void
}) {
    const { isDraggingPlayer } = useDragDropContext()
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({ id: slotId(slot.id), animateLayoutChanges: noAnimateOnDrop })

    const highlight = isDraggingPlayer && isOver
    const filled = slot.playerId != null

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className="d-flex align-items-center gap-2"
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.3 : 1,
                cursor: 'grab',
            }}
        >
            {filled ? (
                <>
                    <div className="flex-grow-1" style={{ outline: highlight ? '2px solid #0d6efd' : undefined, borderRadius: 12 }}>
                        <SlotBadge slot={slot} ghost={ghost} />
                    </div>
                    <small className="text-secondary">{slot.playerClassName ?? ''}</small>
                    <button
                        className="btn btn-sm btn-outline-secondary py-0 px-1"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onVacate() }}
                        title="Remove player, keep the slot"
                        style={{ fontSize: '0.65rem' }}
                    >
                        ×
                    </button>
                </>
            ) : (
                <>
                    <div
                        className="flex-grow-1 d-flex align-items-center px-2"
                        style={{
                            height: 28,
                            border: '1px dashed',
                            borderColor: highlight ? '#0d6efd' : '#dee2e6',
                            borderRadius: 4,
                            backgroundColor: highlight ? 'rgba(13,110,253,0.05)' : undefined,
                            transition: 'border-color 0.15s, background-color 0.15s',
                        }}
                    >
                        <small className="text-secondary fst-italic">open</small>
                    </div>
                    <button
                        className="btn btn-sm btn-outline-danger py-0 px-1"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onDeleteRow() }}
                        title="Delete this slot"
                        style={{ fontSize: '0.65rem' }}
                    >
                        ×
                    </button>
                </>
            )}
        </div>
    )
}

function RoleListCard({
    list,
    onVacateSlot,
    onDeleteSlot,
    onAddSlot,
    onRemoveList,
    onUpdate,
}: {
    list: RoleList
    onVacateSlot: (id: number) => void
    onDeleteSlot: (id: number) => void
    onAddSlot: () => void
    onRemoveList: () => void
    onUpdate: (name: string, icon: string | null) => void
}) {
    const { playerActiveMap } = useDragDropContext()
    const lastOpen = [...list.slots].reverse().find((s) => s.playerId === null)

    return (
        <div className="card">
            <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-1 flex-grow-1" style={{ minWidth: 0 }}>
                        <IconPicker value={list.icon} onChange={(icon) => onUpdate(list.name, icon)} />
                        <input
                            className="form-control form-control-sm border-0 bg-transparent p-0 fw-semibold"
                            value={list.name}
                            onChange={(e) => onUpdate(e.target.value, list.icon)}
                            placeholder="List name"
                        />
                    </div>
                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                        <button
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center p-0"
                            onClick={onAddSlot}
                            title="Add slot"
                            style={{ width: 24, height: 24 }}
                        >
                            <i className="fa-solid fa-plus" style={{ fontSize: '0.6rem' }} />
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center p-0"
                            onClick={() => lastOpen && onDeleteSlot(lastOpen.id)}
                            title="Remove last open slot"
                            disabled={!lastOpen}
                            style={{ width: 24, height: 24 }}
                        >
                            <i className="fa-solid fa-minus" style={{ fontSize: '0.6rem' }} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={onRemoveList}>
                            Delete
                        </button>
                    </div>
                </div>

                <SortableContext
                    items={list.slots.map((s) => slotId(s.id))}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="mb-2">
                        {list.slots.map((slot, i) => (
                            <div key={slot.id} className="d-flex align-items-center gap-2 py-1">
                                <SlotNumberBadge n={i + 1} />
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                    <SortableSlot
                                        slot={slot}
                                        ghost={slot.playerId != null && playerActiveMap.get(slot.playerId) === false}
                                        onVacate={() => onVacateSlot(slot.id)}
                                        onDeleteRow={() => onDeleteSlot(slot.id)}
                                    />
                                </div>
                            </div>
                        ))}
                        {list.slots.length === 0 && (
                            <p className="text-secondary small fst-italic mb-0">No slots — add some with +</p>
                        )}
                    </div>
                </SortableContext>

            </div>
        </div>
    )
}

export function RoleListPanel({ session, onToggleRoster, rosterOpen }: { session: Session; onToggleRoster: () => void; rosterOpen: boolean }) {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['session', session.id] })

    const addList = useMutation({
        mutationFn: (args: { name: string; icon: string | null }) =>
            api.createRoleList(session.id, args.name, args.icon),
        onSuccess: invalidate,
    })

    const updateList = useMutation({
        mutationFn: (args: { id: number; name: string; icon: string | null }) =>
            api.updateRoleList(args.id, args.name, args.icon),
        onSuccess: invalidate,
    })

    const removeList = useMutation({
        mutationFn: (id: number) => api.deleteRoleList(id),
        onSuccess: invalidate,
    })

    const addSlot = useMutation({
        mutationFn: (roleListId: number) => api.addSlot(roleListId),
        onSuccess: invalidate,
    })

    const deleteSlot = useMutation({
        mutationFn: (id: number) => api.deleteSlot(id),
        onSuccess: invalidate,
    })

    const vacateSlot = useMutation({
        mutationFn: (id: number) => api.setSlotPlayer(id, null),
        onSuccess: invalidate,
    })

    const [newListName, setNewListName] = useState('')
    const [newListIcon, setNewListIcon] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)

    const handleAddList = () => {
        if (!newListName.trim()) return
        addList.mutate({ name: newListName.trim(), icon: newListIcon || null })
        setNewListName('')
        setNewListIcon('')
        setShowAddForm(false)
    }

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Role Lists</h5>
                <div className="d-flex gap-1">
                    <button
                        className={`btn btn-sm ${rosterOpen ? 'btn-secondary' : 'btn-outline-secondary'}`}
                        onClick={onToggleRoster}
                    >
                        <i className="fa-solid fa-users" />
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
                        + List
                    </button>
                </div>
            </div>

            {showAddForm && (
                <div className="card mb-3">
                    <div className="card-body p-2">
                        <div className="d-flex align-items-center gap-1">
                            <IconPicker value={newListIcon || null} onChange={(v) => setNewListIcon(v ?? '')} />
                            <input
                                className="form-control form-control-sm"
                                placeholder="List name"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
                                autoFocus
                            />
                            <button className="btn btn-primary btn-sm" onClick={handleAddList}>Add</button>
                        </div>
                    </div>
                </div>
            )}

            {session.roleLists.length === 0 && !showAddForm && (
                <p className="text-secondary small">No role lists yet.</p>
            )}

            <div className="d-flex flex-column gap-3">
                {session.roleLists.map((list) => (
                    <RoleListCard
                        key={list.id}
                        list={list}
                        onVacateSlot={(id) => vacateSlot.mutate(id)}
                        onDeleteSlot={(id) => deleteSlot.mutate(id)}
                        onAddSlot={() => addSlot.mutate(list.id)}
                        onRemoveList={() => removeList.mutate(list.id)}
                        onUpdate={(name, icon) => updateList.mutate({ id: list.id, name, icon })}
                    />
                ))}
            </div>
        </div>
    )
}

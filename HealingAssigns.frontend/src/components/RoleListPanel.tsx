import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    defaultAnimateLayoutChanges,
    type AnimateLayoutChanges,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Session, RoleList, RoleSlot } from '../api'
import * as api from '../api'
import { readableColor, isLightColor } from '../lib/color'
import { useReferences, getClassColor } from '../hooks/useReferences'
import { useDragDropContext } from './DragDropProvider'
import { slotId, emptySlotId } from '../lib/dragIds'

function SlotNumber({ n }: { n: number }) {
    return (
        <div
            className="d-flex align-items-center justify-content-center fw-bold"
            style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                backgroundColor: '#e9ecef',
                color: '#495057',
                fontSize: '0.75rem',
                flexShrink: 0,
                userSelect: 'none',
                fontFamily: 'monospace',
            }}
        >
            {n}
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
    onRemove,
}: {
    slot: RoleSlot
    ghost?: boolean
    onRemove: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: slotId(slot.id), animateLayoutChanges: noAnimateOnDrop })

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
            <div className="flex-grow-1">
                <SlotBadge slot={slot} ghost={ghost} />
            </div>
            <small className="text-secondary">{slot.playerClassName ?? ''}</small>
            <button
                className="btn btn-sm btn-outline-danger py-0 px-1"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onRemove() }}
                style={{ fontSize: '0.65rem' }}
            >
                ×
            </button>
        </div>
    )
}

function EmptySlot({ highlight }: { highlight: boolean }) {
    return (
        <div
            className="d-flex align-items-center"
            style={{
                height: 28,
                border: '1px dashed',
                borderColor: highlight ? '#0d6efd' : '#dee2e6',
                borderRadius: 4,
                backgroundColor: highlight ? 'rgba(13,110,253,0.05)' : undefined,
                transition: 'all 0.15s',
            }}
        />
    )
}

function RoleListCard({
    list,
    onRemoveSlot,
    onRemoveList,
    onUpdateIcon,
    onUpdateSlotCount,
}: {
    list: RoleList
    onRemoveSlot: (id: number) => void
    onRemoveList: () => void
    onUpdateIcon: (icon: string | null) => void
    onUpdateSlotCount: (count: number) => void
}) {
    const { hoverRoleListId, isDraggingPlayer, playerActiveMap } = useDragDropContext()
    const { setNodeRef } = useDroppable({ id: emptySlotId(list.id, 0) })
    const emptyCount = Math.max(0, list.slotCount - list.slots.length)
    const isHovered = isDraggingPlayer && hoverRoleListId === list.id && emptyCount > 0

    return (
        <div className="card" ref={emptyCount > 0 ? setNodeRef : undefined}>
            <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-1">
                        <input
                            className="form-control form-control-sm border-0 bg-transparent p-0 text-center"
                            value={list.icon ?? ''}
                            onChange={(e) => onUpdateIcon(e.target.value || null)}
                            placeholder="—"
                            style={{ width: 32, fontSize: '1.1rem' }}
                        />
                        <h6 className="mb-0 fw-semibold">{list.name}</h6>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                        <button
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center p-0"
                            onClick={() => onUpdateSlotCount(list.slotCount + 1)}
                            title="Add slot"
                            style={{ width: 24, height: 24 }}
                        >
                            <i className="fa-solid fa-plus" style={{ fontSize: '0.6rem' }} />
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center p-0"
                            onClick={() => onUpdateSlotCount(list.slotCount - 1)}
                            title="Remove empty slot"
                            disabled={emptyCount === 0}
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
                                <SlotNumber n={i + 1} />
                                <div className="flex-grow-1">
                                    <SortableSlot
                                        slot={slot}
                                        ghost={slot.playerId != null && playerActiveMap.get(slot.playerId) === false}
                                        onRemove={() => onRemoveSlot(slot.id)}
                                    />
                                </div>
                            </div>
                        ))}
                        {Array.from({ length: emptyCount }, (_, i) => (
                            <div key={`empty-${i}`} className="d-flex align-items-center gap-2 py-1">
                                <SlotNumber n={list.slots.length + i + 1} />
                                <div className="flex-grow-1">
                                    <EmptySlot highlight={i === 0 && isHovered} />
                                </div>
                            </div>
                        ))}
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

    const removeSlot = useMutation({
        mutationFn: (id: number) => api.deleteSlot(id),
        onSuccess: invalidate,
    })

    const updateSlotCount = useMutation({
        mutationFn: (args: { id: number; count: number }) =>
            api.updateSlotCount(args.id, args.count),
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
                        <div className="input-group input-group-sm">
                            <input
                                className="form-control text-center"
                                value={newListIcon}
                                onChange={(e) => setNewListIcon(e.target.value)}
                                placeholder="Icon"
                                style={{ maxWidth: 60 }}
                            />
                            <input
                                className="form-control"
                                placeholder="List name"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
                                autoFocus
                            />
                            <button className="btn btn-primary" onClick={handleAddList}>Add</button>
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
                        onRemoveSlot={(id) => removeSlot.mutate(id)}
                        onRemoveList={() => removeList.mutate(list.id)}
                        onUpdateIcon={(icon) => updateList.mutate({ id: list.id, name: list.name, icon })}
                        onUpdateSlotCount={(count) => updateSlotCount.mutate({ id: list.id, count })}
                    />
                ))}
            </div>
        </div>
    )
}

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
    defaultAnimateLayoutChanges,
    type AnimateLayoutChanges,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Session, RoleList, RoleSlot } from '../api'
import * as api from '../api'
import { readableColor, isLightColor } from '../lib/color'
import { WOW_CLASSES, getClassColor, getClassName } from '../lib/wowClasses'

export const ROLE_ICONS = [
    { value: '🩹', label: 'Healer' },
    { value: '🛡️', label: 'Tank' },
    { value: '⚔️', label: 'DPS' },
    { value: '🔇', label: 'Interrupt' },
    { value: '💀', label: 'Skull' },
    { value: '🎯', label: 'Target' },
    { value: '🔥', label: 'Fire' },
    { value: '❄️', label: 'Frost' },
]

// --- Small presentational components ---

function SlotBadge({ slot }: { slot: RoleSlot }) {
    const color = getClassColor(slot.playerClassId)
    const light = isLightColor(color)
    return (
        <span
            className="badge rounded-pill px-2 py-1 text-start"
            style={{
                backgroundColor: light ? readableColor(color) : (color ?? '#6c757d'),
                color: '#fff',
                fontSize: '0.8rem',
            }}
        >
            {slot.playerName}
        </span>
    )
}

function AddSlotForm({
    onAdd,
}: {
    onAdd: (name: string, playerClassId: number | null) => void
}) {
    const [name, setName] = useState('')
    const [cls, setCls] = useState('')

    const handleAdd = () => {
        if (!name.trim()) return
        onAdd(name.trim(), cls ? Number(cls) : null)
        setName('')
        setCls('')
    }

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
                value={cls}
                onChange={(e) => setCls(e.target.value)}
                style={{ maxWidth: 100 }}
            >
                <option value="">Class</option>
                {WOW_CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            <button className="btn btn-primary" onClick={handleAdd}>+</button>
        </div>
    )
}

// --- Drag-and-drop slot ---

const noAnimateOnDrop: AnimateLayoutChanges = (args) =>
    args.isSorting || args.wasDragging ? false : defaultAnimateLayoutChanges(args)

function SortableSlot({ slot, onRemove }: { slot: RoleSlot; onRemove: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: slot.id, animateLayoutChanges: noAnimateOnDrop })

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className="row align-items-center gx-2"
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.3 : 1,
                cursor: 'grab',
            }}
        >
            <div className="col">
                <SlotBadge slot={slot} />
            </div>
            <div className="col-auto">
                <small className="text-secondary">{getClassName(slot.playerClassId) ?? ''}</small>
            </div>
            <div className="col-auto">
                <button
                    className="btn btn-sm btn-outline-danger"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={onRemove}
                >
                    Delete
                </button>
            </div>
        </div>
    )
}

// --- Role list card with sortable slot list ---

function RoleListCard({
    list,
    onAddSlot,
    onRemoveSlot,
    onRemoveList,
    onUpdateIcon,
    onReorder,
}: {
    list: RoleList
    onAddSlot: (name: string, playerClassId: number | null) => void
    onRemoveSlot: (id: number) => void
    onRemoveList: () => void
    onUpdateIcon: (icon: string | null) => void
    onReorder: (slotIds: number[]) => void
}) {
    const [activeId, setActiveId] = useState<number | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    )

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null)
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = list.slots.findIndex((s) => s.id === active.id)
        const newIndex = list.slots.findIndex((s) => s.id === over.id)
        onReorder(arrayMove(list.slots.map((s) => s.id), oldIndex, newIndex))
    }

    const activeSlot = activeId ? list.slots.find((s) => s.id === activeId) : null

    return (
        <div className="card">
            <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-1">
                        <select
                            className="form-select form-select-sm border-0 bg-transparent p-0"
                            value={list.icon ?? ''}
                            onChange={(e) => onUpdateIcon(e.target.value || null)}
                            style={{ width: 36 }}
                        >
                            <option value="">—</option>
                            {ROLE_ICONS.map((icon) => (
                                <option key={icon.value} value={icon.value}>{icon.value}</option>
                            ))}
                        </select>
                        <h6 className="mb-0 fw-semibold">{list.name}</h6>
                    </div>
                    <button className="btn btn-sm btn-outline-danger" onClick={onRemoveList}>
                        Delete
                    </button>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={list.slots.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="mb-2">
                            {list.slots.map((slot, i) => (
                                <div key={slot.id} className="row align-items-center gx-2 py-1">
                                    <div
                                        className="col-auto text-secondary fw-bold text-end"
                                        style={{ width: 24, fontSize: '0.85rem', userSelect: 'none' }}
                                    >
                                        {i + 1}
                                    </div>
                                    <div className="col">
                                        <SortableSlot
                                            slot={slot}
                                            onRemove={() => onRemoveSlot(slot.id)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SortableContext>
                    <DragOverlay dropAnimation={null}>
                        {activeSlot && <SlotBadge slot={activeSlot} />}
                    </DragOverlay>
                </DndContext>

                <AddSlotForm onAdd={onAddSlot} />
            </div>
        </div>
    )
}

// --- Top-level panel with mutations ---

export function RoleListPanel({ session }: { session: Session }) {
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
        mutationFn: (args: { roleListId: number; playerName: string; playerClassId: number | null }) =>
            api.createSlot(args.roleListId, args.playerName, args.playerClassId),
        onSuccess: invalidate,
    })

    const removeSlot = useMutation({
        mutationFn: (id: number) => api.deleteSlot(id),
        onSuccess: invalidate,
    })

    const reorderSlots = useMutation({
        mutationFn: (args: { roleListId: number; slotIds: number[] }) =>
            api.reorderSlots(args.roleListId, args.slotIds),
        onSettled: invalidate,
    })

    const handleReorder = (roleListId: number, slotIds: number[]) => {
        queryClient.setQueryData<Session>(['session', session.id], (old) => {
            if (!old) return old
            return {
                ...old,
                roleLists: old.roleLists.map((rl) => {
                    if (rl.id !== roleListId) return rl
                    const slotMap = new Map(rl.slots.map((s) => [s.id, s]))
                    return { ...rl, slots: slotIds.map((id) => slotMap.get(id)!) }
                }),
            }
        })
        reorderSlots.mutate({ roleListId, slotIds })
    }

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
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
                    + List
                </button>
            </div>

            {showAddForm && (
                <div className="card mb-3">
                    <div className="card-body p-2">
                        <div className="input-group input-group-sm">
                            <select
                                className="form-select"
                                value={newListIcon}
                                onChange={(e) => setNewListIcon(e.target.value)}
                                style={{ maxWidth: 80 }}
                            >
                                <option value="">Icon</option>
                                {ROLE_ICONS.map((icon) => (
                                    <option key={icon.value} value={icon.value}>
                                        {icon.value} {icon.label}
                                    </option>
                                ))}
                            </select>
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
                        onAddSlot={(name, playerClassId) =>
                            addSlot.mutate({ roleListId: list.id, playerName: name, playerClassId })
                        }
                        onRemoveSlot={(id) => removeSlot.mutate(id)}
                        onRemoveList={() => removeList.mutate(list.id)}
                        onUpdateIcon={(icon) => updateList.mutate({ id: list.id, name: list.name, icon })}
                        onReorder={(slotIds) => handleReorder(list.id, slotIds)}
                    />
                ))}
            </div>
        </div>
    )
}

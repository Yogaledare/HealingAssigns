import { createContext, useContext, useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    DndContext,
    closestCenter,
    pointerWithin,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type CollisionDetection,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { Session, Player, RoleSlot } from '../api'
import * as api from '../api'
import { usePlayers } from '../hooks/usePlayers'
import { parseDragId } from '../lib/dragIds'
import { assignmentLine } from '../lib/macro'
import { isLightColor, readableColor } from '../lib/color'
import { SlotBadge } from './SlotBadge'
import { CLASS_LABEL_WIDTH } from '../lib/layout'

interface DragDropContextValue {
    playerActiveMap: Map<number, boolean>
    players: Player[]
    isDraggingPlayer: boolean
}

const DragDropContext = createContext<DragDropContextValue>({
    playerActiveMap: new Map(),
    players: [],
    isDraggingPlayer: false,
})

export function useDragDropContext() {
    return useContext(DragDropContext)
}

export function DragDropProvider({
    session,
    children,
}: {
    session: Session
    children: ReactNode
}) {
    const queryClient = useQueryClient()
    const { data: players = [] } = usePlayers()
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    )

    // Players drop by pointer position; slot sorting works on centers.
    const collisionDetection: CollisionDetection = (args) => {
        const active = parseDragId(args.active.id)
        if (active?.type === 'player') return pointerWithin(args)
        return closestCenter(args)
    }

    const invalidateSession = () => queryClient.invalidateQueries({ queryKey: ['session', session.id] })

    const reorderSlots = useMutation({
        mutationFn: (args: { roleListId: number; slotIds: number[] }) =>
            api.reorderSlots(args.roleListId, args.slotIds),
        onSettled: invalidateSession,
    })

    const setSlotPlayer = useMutation({
        mutationFn: (args: { slotId: number; playerId: number }) =>
            api.setSlotPlayer(args.slotId, args.playerId),
        onSuccess: invalidateSession,
    })

    const reorderAssignments = useMutation({
        mutationFn: (args: { encounterId: number; assignmentIds: number[] }) =>
            api.reorderAssignments(args.encounterId, args.assignmentIds),
        onSettled: invalidateSession,
    })

    const playerActiveMap = new Map(players.map(p => [p.id, p.isActive]))

    const findSlotInfo = (slotIdNum: number) => {
        for (const rl of session.roleLists) {
            const idx = rl.slots.findIndex(s => s.id === slotIdNum)
            if (idx >= 0) return { roleList: rl, slot: rl.slots[idx], index: idx }
        }
        return null
    }

    // Top-level assignments only: those are the sortable groups
    const findAssignmentInfo = (assignmentIdNum: number) => {
        for (const enc of session.encounters) {
            const idx = enc.assignments.findIndex(a => a.id === assignmentIdNum)
            if (idx >= 0) return { encounter: enc, assignment: enc.assignments[idx], index: idx }
        }
        return null
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id))
    }

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null)
        const { active, over } = event
        if (!over) return

        const activeParsed = parseDragId(active.id)
        const overParsed = parseDragId(over.id)
        if (!activeParsed || !overParsed) return

        if (activeParsed.type === 'assignment') {
            if (overParsed.type !== 'assignment' || active.id === over.id) return
            const activeInfo = findAssignmentInfo(activeParsed.id)
            const overInfo = findAssignmentInfo(overParsed.id)
            if (!activeInfo || !overInfo) return
            if (activeInfo.encounter.id !== overInfo.encounter.id) return

            const enc = activeInfo.encounter
            const newOrder = arrayMove(enc.assignments.map(a => a.id), activeInfo.index, overInfo.index)

            // Unlike slots, the group row itself moves; its sub-rows travel inside it
            queryClient.setQueryData<Session>(['session', session.id], (old) => {
                if (!old) return old
                return {
                    ...old,
                    encounters: old.encounters.map((e) => {
                        if (e.id !== enc.id) return e
                        const byId = new Map(e.assignments.map((a) => [a.id, a]))
                        if (newOrder.some((id) => !byId.has(id))) return e
                        return {
                            ...e,
                            assignments: newOrder.map((id, i) => ({ ...byId.get(id)!, sortOrder: i })),
                        }
                    }),
                }
            })
            reorderAssignments.mutate({ encounterId: enc.id, assignmentIds: newOrder })
            return
        }

        if (overParsed.type !== 'slot') return

        if (activeParsed.type === 'slot') {
            if (active.id === over.id) return
            const activeInfo = findSlotInfo(activeParsed.id)
            const overInfo = findSlotInfo(overParsed.id)
            if (!activeInfo || !overInfo) return
            if (activeInfo.roleList.id !== overInfo.roleList.id) return

            const rl = activeInfo.roleList
            const newOrder = arrayMove(rl.slots.map(s => s.id), activeInfo.index, overInfo.index)

            // Rungs stay put; only the occupants move between them
            queryClient.setQueryData<Session>(['session', session.id], (old) => {
                if (!old) return old
                return {
                    ...old,
                    roleLists: old.roleLists.map((r) => {
                        if (r.id !== rl.id) return r
                        const slotMap = new Map(r.slots.map((s) => [s.id, s]))
                        return {
                            ...r,
                            slots: r.slots.map((rung, k) => {
                                const src = slotMap.get(newOrder[k])!
                                return {
                                    ...rung,
                                    playerId: src.playerId,
                                    playerName: src.playerName,
                                    playerClassId: src.playerClassId,
                                    playerClassName: src.playerClassName,
                                }
                            }),
                        }
                    }),
                }
            })
            reorderSlots.mutate({ roleListId: rl.id, slotIds: newOrder })
            return
        }

        if (activeParsed.type === 'player') {
            setSlotPlayer.mutate({ slotId: overParsed.id, playerId: activeParsed.id })
        }
    }

    const activeItem = activeId ? parseDragId(activeId) : null
    const activePlayer = activeItem?.type === 'player'
        ? players.find(p => p.id === activeItem.id)
        : null
    const activeSlot = activeItem?.type === 'slot'
        ? findSlotInfo(activeItem.id)?.slot
        : null

    const activeAssignment = activeItem?.type === 'assignment'
        ? findAssignmentInfo(activeItem.id)?.assignment
        : null

    const isDraggingPlayer = activeItem?.type === 'player'

    return (
        <DragDropContext.Provider value={{ playerActiveMap, players, isDraggingPlayer }}>
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
            >
                {children}
                <DragOverlay dropAnimation={null}>
                    {activePlayer && <PlayerOverlay player={activePlayer} />}
                    {activeSlot && <SlotOverlay slot={activeSlot} />}
                    {activeAssignment && <AssignmentOverlay text={assignmentLine(activeAssignment, session)} />}
                </DragOverlay>
            </DndContext>
        </DragDropContext.Provider>
    )
}

function PlayerOverlay({ player }: { player: Player }) {
    const light = isLightColor(player.playerClassColor)
    return (
        <span
            className="badge rounded-pill px-2 py-1"
            style={{
                backgroundColor: light ? readableColor(player.playerClassColor) : player.playerClassColor,
                color: '#fff',
                fontSize: '0.75rem',
            }}
        >
            {player.name}
        </span>
    )
}

/** A lifted role-list row: the same token and class name as the row it came
 *  from, so it looks like the row content travelled with the pointer. */
function SlotOverlay({ slot }: { slot: RoleSlot }) {
    return (
        <div className="d-flex align-items-center gap-2" style={{ cursor: 'grabbing' }}>
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                {slot.playerName ? (
                    <SlotBadge slot={slot} />
                ) : (
                    <div
                        className="d-flex align-items-center px-2 bg-white"
                        style={{ height: 28, border: '1px dashed #ced4da', borderRadius: 6 }}
                    >
                        <small className="text-secondary fst-italic">open</small>
                    </div>
                )}
            </div>
            <small className="text-secondary text-end text-truncate flex-shrink-0" style={{ width: CLASS_LABEL_WIDTH }}>
                {slot.playerClassName ?? ''}
            </small>
            {/* Invisible twin of the row's × button, so the lifted token is exactly the row's width */}
            <button
                className="btn btn-sm btn-outline-secondary py-0 px-1"
                style={{ fontSize: '0.65rem', visibility: 'hidden' }}
                tabIndex={-1}
                aria-hidden
            >
                ×
            </button>
        </div>
    )
}

/** Ghost of the group being moved. DragOverlay sizes it to the card it came
 *  from, and it carries only the macro fragment, so no inputs or dropdowns are
 *  ever cloned into the overlay. */
function AssignmentOverlay({ text }: { text: string }) {
    return (
        <div
            className="d-flex align-items-center px-3 font-monospace small rounded h-100"
            style={{
                border: '1px dashed #6c757d',
                backgroundColor: 'rgba(248, 249, 250, 0.92)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                cursor: 'grabbing',
            }}
        >
            {text}
        </div>
    )
}

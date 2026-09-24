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
import type { Session, Player } from '../api'
import * as api from '../api'
import { usePlayers } from '../hooks/usePlayers'
import { parseDragId } from '../lib/dragIds'
import { isLightColor, readableColor } from '../lib/color'

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

    const playerActiveMap = new Map(players.map(p => [p.id, p.isActive]))

    const findSlotInfo = (slotIdNum: number) => {
        for (const rl of session.roleLists) {
            const idx = rl.slots.findIndex(s => s.id === slotIdNum)
            if (idx >= 0) return { roleList: rl, slot: rl.slots[idx], index: idx }
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
        if (!activeParsed || !overParsed || overParsed.type !== 'slot') return

        if (activeParsed.type === 'slot') {
            if (active.id === over.id) return
            const activeInfo = findSlotInfo(activeParsed.id)
            const overInfo = findSlotInfo(overParsed.id)
            if (!activeInfo || !overInfo) return
            if (activeInfo.roleList.id !== overInfo.roleList.id) return

            const rl = activeInfo.roleList
            const newOrder = arrayMove(rl.slots.map(s => s.id), activeInfo.index, overInfo.index)

            queryClient.setQueryData<Session>(['session', session.id], (old) => {
                if (!old) return old
                return {
                    ...old,
                    roleLists: old.roleLists.map((r) => {
                        if (r.id !== rl.id) return r
                        const slotMap = new Map(r.slots.map((s) => [s.id, s]))
                        return { ...r, slots: newOrder.map((id) => slotMap.get(id)!) }
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
                    {activeSlot && <SlotOverlay name={activeSlot.playerName ?? '(open)'} />}
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

function SlotOverlay({ name }: { name: string }) {
    return (
        <span className="badge rounded-pill px-2 py-1 bg-secondary" style={{ fontSize: '0.8rem' }}>
            {name}
        </span>
    )
}

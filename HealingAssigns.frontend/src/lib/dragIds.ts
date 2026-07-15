export type DragType = 'player' | 'slot' | 'empty'

export function playerId(id: number) { return `player-${id}` }
export function slotId(id: number) { return `slot-${id}` }
export function emptySlotId(roleListId: number, position: number) { return `empty-${roleListId}-${position}` }

export function parseDragId(raw: string | number): { type: DragType; id: number; extra?: number } | null {
    const s = String(raw)
    const simple = s.match(/^(player|slot)-(\d+)$/)
    if (simple) return { type: simple[1] as DragType, id: Number(simple[2]) }
    const empty = s.match(/^empty-(\d+)-(\d+)$/)
    if (empty) return { type: 'empty', id: Number(empty[1]), extra: Number(empty[2]) }
    return null
}

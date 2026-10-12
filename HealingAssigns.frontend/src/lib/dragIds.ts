export type DragType = 'player' | 'slot' | 'assignment'

export function playerId(id: number) { return `player-${id}` }
export function slotId(id: number) { return `slot-${id}` }
export function assignmentId(id: number) { return `assignment-${id}` }

export function parseDragId(raw: string | number): { type: DragType; id: number } | null {
    const m = String(raw).match(/^(player|slot|assignment)-(\d+)$/)
    if (m) return { type: m[1] as DragType, id: Number(m[2]) }
    return null
}

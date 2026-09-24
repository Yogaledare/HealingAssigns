export type DragType = 'player' | 'slot'

export function playerId(id: number) { return `player-${id}` }
export function slotId(id: number) { return `slot-${id}` }

export function parseDragId(raw: string | number): { type: DragType; id: number } | null {
    const m = String(raw).match(/^(player|slot)-(\d+)$/)
    if (m) return { type: m[1] as DragType, id: Number(m[2]) }
    return null
}

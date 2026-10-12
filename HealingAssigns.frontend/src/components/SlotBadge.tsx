import type { RoleSlot } from '../api'
import { useReferences, getClassColor } from '../hooks/useReferences'
import { readableColor, withAlpha } from '../lib/color'

/** The class-colored name token: the visual identity of a person, shared by
 *  role list rungs and the Currently column so they read as the same thing.
 *  Button-shaped and full width, so every rung in a list is the same size.
 *  `solid` is the thing you pick up and drag, so it carries a grip. `outline`
 *  is a reference to that person: same shape and color, tinted, no grip. */
export function SlotBadge({
    slot,
    ghost,
    title,
    variant = 'solid',
    height = 28,
}: {
    slot: RoleSlot
    ghost?: boolean
    title?: string
    variant?: 'solid' | 'outline'
    height?: number
}) {
    const { data: refs } = useReferences()
    // Pale classes (Priest, Rogue) get darkened so they carry white text, or read as text
    const base = readableColor(getClassColor(refs, slot.playerClassId)) ?? '#6c757d'
    const look = variant === 'solid'
        ? { backgroundColor: base, color: '#fff' }
        : { backgroundColor: withAlpha(base, 0.12), color: base, boxShadow: `inset 0 0 0 1px ${withAlpha(base, 0.7)}` }
    return (
        <div
            className="d-flex align-items-center gap-2 px-2 fw-semibold"
            title={title}
            style={{ ...look, height, borderRadius: 6, fontSize: '0.8rem', lineHeight: 1, opacity: ghost ? 0.4 : 1 }}
        >
            {variant === 'solid' && (
                <i className="fa-solid fa-grip-vertical" style={{ opacity: 0.55, fontSize: '0.7rem' }} />
            )}
            <span className="text-truncate" style={{ minWidth: 0 }}>{slot.playerName}</span>
        </div>
    )
}

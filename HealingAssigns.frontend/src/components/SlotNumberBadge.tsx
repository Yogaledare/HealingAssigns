/** Circled position number — the visual identity of a slot, shared by role
 *  lists and assignment references so they read as the same thing. */

// Colored by position, not by list: every #1 is blue, every #2 green, and so
// on, in every role list. All dark enough for white text.
const POSITION_COLORS = [
    '#0d6efd', // 1 blue
    '#198754', // 2 green
    '#d63384', // 3 pink
    '#fd5e14', // 4 orange
    '#6f42c1', // 5 purple
    '#0aa2c0', // 6 cyan
    '#dc3545', // 7 red
    '#148f69', // 8 teal
    '#6610f2', // 9 indigo
    '#795548', // 10 brown
    '#c98a04', // 11 amber
    '#37474f', // 12 slate
    '#7b1fa2', // 13 violet
    '#2e7d32', // 14 forest
]

export function SlotNumberBadge({ n, size = 24 }: { n: number; size?: number }) {
    const color = POSITION_COLORS[(((n - 1) % POSITION_COLORS.length) + POSITION_COLORS.length) % POSITION_COLORS.length]
    return (
        <span
            className="d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0"
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: color,
                color: '#fff',
                fontSize: size * 0.55,
                userSelect: 'none',
                fontFamily: 'monospace',
                lineHeight: 1,
            }}
        >
            {n}
        </span>
    )
}

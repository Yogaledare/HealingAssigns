import { useState, useRef, useEffect } from 'react'
import type { RoleList, RoleSlot } from '../api'
import { readableColor } from '../lib/color'
import { useReferences, getClassColor } from '../hooks/useReferences'
import { SlotNumberBadge } from './SlotNumberBadge'

export function findSlot(roleLists: RoleList[], slotId: number | null): { slot: RoleSlot; list: RoleList; pos: number; listIndex: number } | null {
    if (slotId == null) return null
    for (let li = 0; li < roleLists.length; li++) {
        const idx = roleLists[li].slots.findIndex((s) => s.id === slotId)
        if (idx >= 0) return { slot: roleLists[li].slots[idx], list: roleLists[li], pos: idx + 1, listIndex: li }
    }
    return null
}

function IdentityLabel({ list, pos, badgeSize = 20 }: { list: RoleList; pos: number; badgeSize?: number }) {
    return (
        <span className="d-inline-flex align-items-center gap-1">
            <span
                className="d-inline-flex justify-content-center flex-shrink-0"
                style={{ width: badgeSize + 4 }}
            >
                {list.icon ?? ''}
            </span>
            <SlotNumberBadge n={pos} size={badgeSize} />
            <span>{list.name}</span>
        </span>
    )
}

/** Shows who currently occupies a slot — the resolved person, not the assignment. */
export function SlotOccupant({ roleLists, slotId }: { roleLists: RoleList[]; slotId: number | null }) {
    const { data: refs } = useReferences()
    const info = findSlot(roleLists, slotId)
    if (!info) return <span className="text-secondary">—</span>
    if (!info.slot.playerName) return <span className="text-secondary fst-italic">open</span>
    return (
        <span
            className="fw-semibold"
            style={{ color: readableColor(getClassColor(refs, info.slot.playerClassId)) }}
        >
            {info.slot.playerName}
        </span>
    )
}

export function SlotSelect({
    roleLists,
    value,
    onChange,
    allowNone,
    placeholder = '—',
}: {
    roleLists: RoleList[]
    value: number | null
    onChange: (value: number | null) => void
    allowNone?: boolean
    placeholder?: string
}) {
    const { data: refs } = useReferences()
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

    const selected = findSlot(roleLists, value)

    const select = (v: number | null) => {
        onChange(v)
        setOpen(false)
    }

    return (
        <div className="position-relative" ref={ref}>
            <button
                className="btn btn-outline-secondary btn-sm w-100 text-start"
                onClick={() => setOpen(!open)}
            >
                {selected
                    ? <IdentityLabel list={selected.list} pos={selected.pos} />
                    : placeholder}
            </button>

            {open && (
                <div
                    className="position-absolute z-3 mt-1 bg-white border rounded shadow-sm overflow-auto"
                    style={{ maxHeight: 240, minWidth: 220 }}
                >
                    {allowNone && (
                        <button className="dropdown-item" onClick={() => select(null)}>—</button>
                    )}
                    {roleLists.map((list) => (
                        <div key={list.id}>
                            <h6 className="dropdown-header">
                                {list.icon && <span className="me-1">{list.icon}</span>}
                                {list.name}
                            </h6>
                            {list.slots.length === 0 && (
                                <span className="dropdown-item-text text-secondary fst-italic small">
                                    (no slots)
                                </span>
                            )}
                            {list.slots.map((slot, i) => (
                                <button
                                    key={slot.id}
                                    className={`dropdown-item small ${value === slot.id ? 'active' : ''}`}
                                    onClick={() => select(slot.id)}
                                >
                                    <IdentityLabel list={list} pos={i + 1} badgeSize={18} />{' '}
                                    {slot.playerName ? (
                                        <span style={{
                                            color: value === slot.id ? undefined : readableColor(getClassColor(refs, slot.playerClassId)),
                                            opacity: 0.6,
                                        }}>
                                            ({slot.playerName})
                                        </span>
                                    ) : (
                                        <span className="fst-italic" style={{ opacity: 0.45 }}>(open)</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

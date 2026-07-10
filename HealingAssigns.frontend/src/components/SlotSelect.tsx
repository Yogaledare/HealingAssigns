import { useState, useRef, useEffect } from 'react'
import type { RoleList } from '../api'
import { readableColor } from '../lib/color'
import { getClassColor } from '../lib/wowClasses'

function encodeSlot(roleListId: number, position: number) {
    return `${roleListId}:${position}`
}

export function decodeSlot(value: string): { roleListId: number; position: number } | null {
    if (!value) return null
    const [listId, pos] = value.split(':')
    return { roleListId: Number(listId), position: Number(pos) }
}

export function SlotSelect({
    roleLists,
    value,
    onChange,
    allowNone,
}: {
    roleLists: RoleList[]
    value: string
    onChange: (value: string) => void
    allowNone?: boolean
}) {
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

    const selected = (() => {
        const decoded = decodeSlot(value)
        if (!decoded) return null
        const list = roleLists.find((r) => r.id === decoded.roleListId)
        const slot = list?.slots[decoded.position - 1] ?? null
        return slot ? { slot, icon: list?.icon ?? null, position: decoded.position } : null
    })()

    const select = (v: string) => {
        onChange(v)
        setOpen(false)
    }

    return (
        <div className="position-relative" ref={ref}>
            <button
                className="btn btn-outline-secondary btn-sm w-100 text-start"
                onClick={() => setOpen(!open)}
            >
                {selected ? (
                    <>
                        {selected.icon ?? ''}
                        {selected.icon ? ' ' : ''}
                        #{selected.position}{' '}
                        <span style={{ color: readableColor(getClassColor(selected.slot.playerClassId)), opacity: 0.7 }}>
                            ({selected.slot.playerName})
                        </span>
                    </>
                ) : '—'}
            </button>

            {open && (
                <div
                    className="position-absolute z-3 mt-1 bg-white border rounded shadow-sm overflow-auto"
                    style={{ maxHeight: 240, minWidth: 180 }}
                >
                    {allowNone && (
                        <button className="dropdown-item" onClick={() => select('')}>—</button>
                    )}
                    {roleLists.map((list) => (
                        <div key={list.id}>
                            <h6 className="dropdown-header">
                                {list.icon && <span className="me-1">{list.icon}</span>}
                                {list.name}
                            </h6>
                            {list.slots.length === 0 && (
                                <span className="dropdown-item-text text-secondary fst-italic small">
                                    (empty)
                                </span>
                            )}
                            {list.slots.map((slot, i) => {
                                const encoded = encodeSlot(list.id, i + 1)
                                const isActive = value === encoded
                                return (
                                    <button
                                        key={slot.id}
                                        className={`dropdown-item small ${isActive ? 'active' : ''}`}
                                        onClick={() => select(encoded)}
                                    >
                                        {list.icon ?? ''}{list.icon ? ' ' : ''}#{i + 1}{' '}
                                        <span style={{
                                            color: isActive ? undefined : readableColor(getClassColor(slot.playerClassId)),
                                            opacity: 0.7,
                                        }}>
                                            ({slot.playerName})
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

import { useRef, useState, type CSSProperties } from 'react'

/** A name you edit in place. Reads as text until you click it; then it is a
 *  field. The draft stays local and is committed on Enter or when focus leaves,
 *  so a keystroke is not a save. Escape throws the draft away. */
export function InlineName({
    value,
    onCommit,
    className,
    style,
    title = 'Click to rename',
}: {
    value: string
    onCommit: (name: string) => void
    className?: string
    style?: CSSProperties
    title?: string
}) {
    const [draft, setDraft] = useState<string | null>(null)
    const cancelled = useRef(false)

    const finish = () => {
        if (cancelled.current) {
            cancelled.current = false
        } else if (draft !== null) {
            const name = draft.trim()
            if (name && name !== value) onCommit(name)
        }
        setDraft(null)
    }

    return (
        <input
            className={`form-control border-0 bg-transparent p-0 ${className ?? ''}`}
            style={style}
            title={title}
            value={draft ?? value}
            onFocus={() => setDraft(value)}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={finish}
            onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') {
                    cancelled.current = true
                    e.currentTarget.blur()
                }
            }}
        />
    )
}

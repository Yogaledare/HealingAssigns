import type { Assignment, Encounter, Session } from '../api'
import { findSlot } from '../components/SlotSelect'

function partFor(a: Assignment, session: Session): string {
    const name = a.slotId != null ? (findSlot(session.roleLists, a.slotId)?.slot.playerName ?? '?') : null
    if (name && a.description) return `${name} (${a.description})`
    return name ?? a.description ?? '?'
}

/** One top-level group as it appears in the macro, e.g. `{star} Viddovich: shamandria`. */
export function assignmentLine(a: Assignment, session: Session): string {
    const marker = a.symbolName ? `{${a.symbolName.toLowerCase()}} ` : ''
    const kids = a.children.filter((c) => c.isEnabled).map((c) => partFor(c, session)).join('+')
    const head = partFor(a, session)
    return kids ? `${marker}${head}: ${kids}` : `${marker}${head}`
}

export function buildMacro(encounter: Encounter, session: Session): string {
    const lines = encounter.assignments
        .filter((a) => a.isEnabled)
        .map((a) => assignmentLine(a, session))
    return `/raid ${encounter.name}: ${lines.join(' | ')}`
}

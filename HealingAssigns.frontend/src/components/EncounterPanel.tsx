import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Session, Encounter, Assignment } from '../api'
import * as api from '../api'

const RAID_SYMBOLS = [
  { name: 'Star', emoji: '⭐' },
  { name: 'Circle', emoji: '🟠' },
  { name: 'Diamond', emoji: '🔶' },
  { name: 'Triangle', emoji: '🔺' },
  { name: 'Moon', emoji: '🌙' },
  { name: 'Square', emoji: '🟦' },
  { name: 'Cross', emoji: '❌' },
  { name: 'Skull', emoji: '💀' },
]

function encodeSlot(roleListId: number, position: number) {
  return `${roleListId}:${position}`
}

function decodeSlot(value: string): { roleListId: number; position: number } | null {
  if (!value) return null
  const [listId, pos] = value.split(':')
  return { roleListId: Number(listId), position: Number(pos) }
}

function SlotSelect({
  roleLists,
  value,
  onChange,
  allowNone,
}: {
  roleLists: api.RoleList[]
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
            <span style={{ color: selected.slot.classColor ?? undefined, opacity: 0.7 }}>
              ({selected.slot.playerName})
            </span>
          </>
        ) : '—'}
      </button>
      {open && (
        <div className="position-absolute z-3 mt-1 bg-white border rounded shadow-sm overflow-auto" style={{ maxHeight: 240, minWidth: 180 }}>
          {allowNone && (
            <button className="dropdown-item" onClick={() => select('')}>—</button>
          )}
          {roleLists.map((list) => (
            <div key={list.id}>
              <h6 className="dropdown-header">
                {list.icon && <span className="me-1">{list.icon}</span>}{list.name}
              </h6>
              {list.slots.length === 0 && (
                <span className="dropdown-item-text text-secondary fst-italic small">(empty)</span>
              )}
              {list.slots.map((slot, i) => (
                <button
                  key={slot.id}
                  className={`dropdown-item small ${value === encodeSlot(list.id, i + 1) ? 'active' : ''}`}
                  onClick={() => select(encodeSlot(list.id, i + 1))}
                >
                  {list.icon ?? ''}{list.icon ? ' ' : ''}#{i + 1}{' '}
                  <span style={{ color: value === encodeSlot(list.id, i + 1) ? undefined : (slot.classColor ?? undefined), opacity: 0.7 }}>
                    ({slot.playerName})
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function EncounterPanel({ session }: { session: Session }) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['session', session.id] })

  const addEncounter = useMutation({
    mutationFn: (name: string) => api.createEncounter(session.id, name),
    onSuccess: invalidate,
  })

  const removeEncounter = useMutation({
    mutationFn: (id: number) => api.deleteEncounter(id),
    onSuccess: invalidate,
  })

  const handleAdd = () => {
    const name = prompt('Encounter name (e.g. "Attumen", "Moroes", "Trash - General")')
    if (name) addEncounter.mutate(name)
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Encounters</h5>
        <button className="btn btn-primary btn-sm" onClick={handleAdd}>+ Encounter</button>
      </div>

      {session.encounters.length === 0 && (
        <p className="text-secondary text-center py-5">
          No encounters yet. Add one to start assigning.
        </p>
      )}

      <div className="d-flex flex-column gap-3">
        {session.encounters.map((encounter) => (
          <EncounterCard
            key={encounter.id}
            encounter={encounter}
            session={session}
            onRemove={() => removeEncounter.mutate(encounter.id)}
          />
        ))}
      </div>
    </div>
  )
}

function EncounterCard({
  encounter,
  session,
  onRemove,
}: {
  encounter: Encounter
  session: Session
  onRemove: () => void
}) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['session', session.id] })

  const firstSlot = session.roleLists.find((r) => r.slots.length > 0)

  const addAssignment = useMutation({
    mutationFn: () =>
      api.createAssignment(
        encounter.id,
        RAID_SYMBOLS[0].name,
        null,
        firstSlot?.id ?? session.roleLists[0]?.id ?? 0,
        1,
        null,
        null,
      ),
    onSuccess: invalidate,
  })

  const updateAssignment = useMutation({
    mutationFn: (a: Assignment) =>
      api.updateAssignment(a.id, a.symbol, a.description,
        a.assigneeRoleListId, a.assigneePosition, a.targetRoleListId, a.targetPosition),
    onSuccess: invalidate,
  })

  const removeAssignment = useMutation({
    mutationFn: (id: number) => api.deleteAssignment(id),
    onSuccess: invalidate,
  })

  const canAdd = session.roleLists.length > 0
  const macroText = buildMacro(encounter, session)

  return (
    <div className="card">
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="card-title mb-0 fw-bold">{encounter.name}</h6>
          <button className="btn btn-link btn-sm text-danger text-decoration-none p-0" onClick={onRemove}>Delete</button>
        </div>

        <table className="table table-sm table-borderless align-middle mb-1">
          <thead>
            <tr>
              <th className="col-2">Symbol</th>
              <th className="col-2">Desc</th>
              <th className="col-3">Assignee</th>
              <th className="col-3">Target</th>
              <th className="col-auto"></th>
            </tr>
          </thead>
          <tbody>
            {encounter.assignments.map((a) => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                session={session}
                onUpdate={(updated) => updateAssignment.mutate(updated)}
                onRemove={() => removeAssignment.mutate(a.id)}
              />
            ))}
          </tbody>
        </table>

        {canAdd && (
          <button
            className="btn btn-outline-secondary btn-sm w-100"
            onClick={() => addAssignment.mutate()}
            disabled={addAssignment.isPending}
          >+ Add row</button>
        )}

        {encounter.assignments.length > 0 && (
          <MacroOutput text={macroText} />
        )}
      </div>
    </div>
  )
}

function AssignmentRow({
  assignment,
  session,
  onUpdate,
  onRemove,
}: {
  assignment: Assignment
  session: Session
  onUpdate: (a: Assignment) => void
  onRemove: () => void
}) {
  const handleChange = (patch: Partial<Assignment>) => {
    onUpdate({ ...assignment, ...patch })
  }

  const assigneeValue = encodeSlot(assignment.assigneeRoleListId, assignment.assigneePosition)
  const targetValue = assignment.targetRoleListId != null && assignment.targetPosition != null
    ? encodeSlot(assignment.targetRoleListId, assignment.targetPosition)
    : ''

  return (
    <tr>
      <td>
        <select
          className="form-select form-select-sm"
          value={assignment.symbol}
          onChange={(e) => handleChange({ symbol: e.target.value })}
        >
          {RAID_SYMBOLS.map((s) => (
            <option key={s.name} value={s.name}>{s.emoji} {s.name}</option>
          ))}
        </select>
      </td>
      <td>
        <input
          className="form-control form-control-sm"
          value={assignment.description ?? ''}
          placeholder="—"
          onChange={(e) => handleChange({ description: e.target.value || null })}
        />
      </td>
      <td>
        <SlotSelect
          roleLists={session.roleLists}
          value={assigneeValue}
          onChange={(v) => {
            const slot = decodeSlot(v)
            if (slot) handleChange({ assigneeRoleListId: slot.roleListId, assigneePosition: slot.position })
          }}
        />
      </td>
      <td>
        <SlotSelect
          roleLists={session.roleLists}
          value={targetValue}
          allowNone
          onChange={(v) => {
            const slot = decodeSlot(v)
            if (slot) {
              handleChange({ targetRoleListId: slot.roleListId, targetPosition: slot.position })
            } else {
              handleChange({ targetRoleListId: null, targetPosition: null })
            }
          }}
        />
      </td>
      <td className="text-center">
        <button className="btn btn-link btn-sm text-danger text-decoration-none p-0" onClick={onRemove}>&times;</button>
      </td>
    </tr>
  )
}

function MacroOutput({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const tooLong = text.length > 255

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-3">
      <div className="d-flex align-items-center justify-content-between mb-1">
        <small className="fw-semibold">
          Macro ({text.length}/255)
          {tooLong && <span className="text-danger ms-1">Too long!</span>}
        </small>
        <button className="btn btn-link btn-sm text-decoration-none p-0" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className={`bg-light border rounded p-2 small mb-0 ${tooLong ? 'border-danger' : ''}`} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {text}
      </pre>
    </div>
  )
}

function buildMacro(encounter: Encounter, session: Session): string {
  const lines = encounter.assignments.map((a) => {
    const symbol = RAID_SYMBOLS.find((s) => s.name === a.symbol)
    const marker = symbol ? `{${symbol.name.toLowerCase()}}` : a.symbol
    const assigneeList = session.roleLists.find((r) => r.id === a.assigneeRoleListId)
    const assignee = assigneeList?.slots[a.assigneePosition - 1]?.playerName ?? '?'
    let targetStr = ''
    if (a.targetRoleListId != null && a.targetPosition != null) {
      const targetList = session.roleLists.find((r) => r.id === a.targetRoleListId)
      const target = targetList?.slots[a.targetPosition - 1]?.playerName ?? '?'
      targetStr = ` -> ${target}`
    }
    const desc = a.description ? ` ${a.description}` : ''
    return `${marker} ${assignee}${targetStr}${desc}`
  })
  return `/raid ${encounter.name}: ${lines.join(' | ')}`
}

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Session } from '../api'
import * as api from '../api'

const WOW_CLASSES = [
  { name: 'Druid', color: '#FF7C0A' },
  { name: 'Hunter', color: '#AAD372' },
  { name: 'Mage', color: '#3FC7EB' },
  { name: 'Paladin', color: '#F48CBA' },
  { name: 'Priest', color: '#FFFFFF' },
  { name: 'Rogue', color: '#FFF468' },
  { name: 'Shaman', color: '#0070DD' },
  { name: 'Warlock', color: '#8788EE' },
  { name: 'Warrior', color: '#C69B6D' },
]

export const ROLE_ICONS = [
  { value: '🩹', label: 'Healer' },
  { value: '🛡️', label: 'Tank' },
  { value: '⚔️', label: 'DPS' },
  { value: '🔇', label: 'Interrupt' },
  { value: '💀', label: 'Skull' },
  { value: '🎯', label: 'Target' },
  { value: '🔥', label: 'Fire' },
  { value: '❄️', label: 'Frost' },
]

export function RoleListPanel({ session }: { session: Session }) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['session', session.id] })

  const addList = useMutation({
    mutationFn: (args: { name: string; icon: string | null }) =>
      api.createRoleList(session.id, args.name, args.icon),
    onSuccess: invalidate,
  })

  const updateList = useMutation({
    mutationFn: (args: { id: number; name: string; icon: string | null }) =>
      api.updateRoleList(args.id, args.name, args.icon),
    onSuccess: invalidate,
  })

  const removeList = useMutation({
    mutationFn: (id: number) => api.deleteRoleList(id),
    onSuccess: invalidate,
  })

  const addSlot = useMutation({
    mutationFn: (args: { roleListId: number; playerName: string; className?: string; classColor?: string }) =>
      api.createSlot(args.roleListId, args.playerName, args.className, args.classColor),
    onSuccess: invalidate,
  })

  const removeSlot = useMutation({
    mutationFn: (id: number) => api.deleteSlot(id),
    onSuccess: invalidate,
  })

  const reorderSlots = useMutation({
    mutationFn: (args: { roleListId: number; slotIds: number[] }) =>
      api.reorderSlots(args.roleListId, args.slotIds),
    onSuccess: invalidate,
  })

  const [newListName, setNewListName] = useState('')
  const [newListIcon, setNewListIcon] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddList = () => {
    if (!newListName.trim()) return
    addList.mutate({ name: newListName.trim(), icon: newListIcon || null })
    setNewListName('')
    setNewListIcon('')
    setShowAddForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-lg">Role Lists</h2>
        <button className="btn btn-primary btn-xs" onClick={() => setShowAddForm(!showAddForm)}>+ List</button>
      </div>

      {showAddForm && (
        <div className="card bg-base-200 p-3 mb-3">
          <div className="flex gap-1">
            <select
              className="select select-xs select-bordered w-16"
              value={newListIcon}
              onChange={(e) => setNewListIcon(e.target.value)}
            >
              <option value="">Icon</option>
              {ROLE_ICONS.map((icon) => (
                <option key={icon.value} value={icon.value}>{icon.value} {icon.label}</option>
              ))}
            </select>
            <input
              className="input input-xs input-bordered flex-1"
              placeholder="List name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
              autoFocus
            />
            <button className="btn btn-xs btn-primary" onClick={handleAddList}>Add</button>
          </div>
        </div>
      )}

      {session.roleLists.length === 0 && !showAddForm && (
        <p className="text-base-content/50 text-sm">No role lists yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {session.roleLists.map((list) => (
          <RoleListCard
            key={list.id}
            list={list}
            onAddSlot={(playerName, className, classColor) =>
              addSlot.mutate({ roleListId: list.id, playerName, className, classColor })
            }
            onRemoveSlot={(id) => removeSlot.mutate(id)}
            onRemoveList={() => removeList.mutate(list.id)}
            onUpdateIcon={(icon) => updateList.mutate({ id: list.id, name: list.name, icon })}
            onReorder={(slotIds) => reorderSlots.mutate({ roleListId: list.id, slotIds })}
          />
        ))}
      </div>
    </div>
  )
}

function RoleListCard({
  list,
  onAddSlot,
  onRemoveSlot,
  onRemoveList,
  onUpdateIcon,
  onReorder,
}: {
  list: api.RoleList
  onAddSlot: (playerName: string, className?: string, classColor?: string) => void
  onRemoveSlot: (id: number) => void
  onRemoveList: () => void
  onUpdateIcon: (icon: string | null) => void
  onReorder: (slotIds: number[]) => void
}) {
  const [newName, setNewName] = useState('')
  const [newClass, setNewClass] = useState('')
  const dragIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const handleAdd = () => {
    if (!newName.trim()) return
    const cls = WOW_CLASSES.find((c) => c.name === newClass)
    onAddSlot(newName.trim(), cls?.name, cls?.color)
    setNewName('')
    setNewClass('')
  }

  const handleDragStart = (i: number) => {
    dragIdx.current = i
  }

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    setDragOverIdx(i)
  }

  const handleDrop = (i: number) => {
    const from = dragIdx.current
    if (from === null || from === i) {
      dragIdx.current = null
      setDragOverIdx(null)
      return
    }
    const ids = list.slots.map((s) => s.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(i, 0, moved)
    onReorder(ids)
    dragIdx.current = null
    setDragOverIdx(null)
  }

  const handleDragEnd = () => {
    dragIdx.current = null
    setDragOverIdx(null)
  }

  return (
    <div className="card bg-base-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <select
            className="select select-xs w-12 bg-transparent border-none p-0 text-base"
            value={list.icon ?? ''}
            onChange={(e) => onUpdateIcon(e.target.value || null)}
          >
            <option value="">—</option>
            {ROLE_ICONS.map((icon) => (
              <option key={icon.value} value={icon.value}>{icon.value}</option>
            ))}
          </select>
          <h3 className="font-semibold text-sm">{list.name}</h3>
        </div>
        <button className="btn btn-ghost btn-xs text-error" onClick={onRemoveList}>×</button>
      </div>

      <ol className="flex flex-col gap-0 mb-2">
        {list.slots.map((slot, i) => (
          <li
            key={slot.id}
            className={`flex items-center gap-2 text-sm py-1 px-1 rounded cursor-grab active:cursor-grabbing ${
              dragOverIdx === i ? 'border-t-2 border-primary' : 'border-t-2 border-transparent'
            }`}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
          >
            <span className="text-base-content/40 w-4 text-right select-none">{i + 1}.</span>
            <span
              className="font-medium flex-1"
              style={{ color: slot.classColor ?? undefined }}
            >
              {slot.playerName}
            </span>
            {slot.className && (
              <span className="text-xs text-base-content/40">{slot.className}</span>
            )}
            <button className="btn btn-ghost btn-xs text-error opacity-50 hover:opacity-100" onClick={() => onRemoveSlot(slot.id)}>
              ×
            </button>
          </li>
        ))}
      </ol>

      <div className="flex gap-1">
        <input
          className="input input-xs input-bordered flex-1"
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <select
          className="select select-xs select-bordered w-24"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
        >
          <option value="">Class</option>
          {WOW_CLASSES.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <button className="btn btn-xs btn-primary" onClick={handleAdd}>+</button>
      </div>
    </div>
  )
}

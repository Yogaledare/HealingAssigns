import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Session } from '../api'
import * as api from '../api'
import { readableColor } from '../lib/color'
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  Text,
  TextField,
} from '@radix-ui/themes'

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

const ROLE_ICONS = [
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
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Heading size="3">Role Lists</Heading>
        <Button size="1" onClick={() => setShowAddForm(!showAddForm)}>+ List</Button>
      </Flex>

      {showAddForm && (
        <Card>
          <Flex gap="2">
            <select
              value={newListIcon}
              onChange={(e) => setNewListIcon(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-6)', width: 80 }}
            >
              <option value="">Icon</option>
              {ROLE_ICONS.map((icon) => (
                <option key={icon.value} value={icon.value}>{icon.value} {icon.label}</option>
              ))}
            </select>
            <Box flexGrow="1">
              <TextField.Root
                size="1"
                placeholder="List name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
                autoFocus
              />
            </Box>
            <Button size="1" onClick={handleAddList}>Add</Button>
          </Flex>
        </Card>
      )}

      {session.roleLists.length === 0 && !showAddForm && (
        <Text color="gray">No role lists yet.</Text>
      )}

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
    </Flex>
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

  const handleDragStart = (i: number) => { dragIdx.current = i }
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIdx(i) }
  const handleDrop = (i: number) => {
    const from = dragIdx.current
    if (from === null || from === i) { dragIdx.current = null; setDragOverIdx(null); return }
    const ids = list.slots.map((s) => s.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(i, 0, moved)
    onReorder(ids)
    dragIdx.current = null
    setDragOverIdx(null)
  }
  const handleDragEnd = () => { dragIdx.current = null; setDragOverIdx(null) }

  return (
    <Card>
      <Flex justify="between" align="center" mb="2">
        <Flex align="center" gap="1">
          <select
            value={list.icon ?? ''}
            onChange={(e) => onUpdateIcon(e.target.value || null)}
            style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 14, cursor: 'pointer', width: 32 }}
          >
            <option value="">—</option>
            {ROLE_ICONS.map((icon) => (
              <option key={icon.value} value={icon.value}>{icon.value}</option>
            ))}
          </select>
          <Heading size="2">{list.name}</Heading>
        </Flex>
        <IconButton variant="ghost" color="gray" size="1" onClick={onRemoveList}>×</IconButton>
      </Flex>

      <Flex direction="column" gap="0" mb="2">
        {list.slots.map((slot, i) => (
          <Flex
            key={slot.id}
            align="center"
            gap="2"
            py="1"
            px="1"
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            style={{
              cursor: 'grab',
              borderRadius: 'var(--radius-1)',
              borderTop: dragOverIdx === i ? '2px solid var(--accent-9)' : '2px solid transparent',
            }}
          >
            <Text size="1" color="gray" style={{ width: 20, textAlign: 'right', userSelect: 'none' }}>{i + 1}.</Text>
            <Text size="2" weight="medium" style={{ flex: 1, color: readableColor(slot.classColor), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {slot.playerName}
            </Text>
            {slot.className && <Text size="1" color="gray">{slot.className}</Text>}
            <IconButton variant="ghost" color="gray" size="1" onClick={() => onRemoveSlot(slot.id)}>×</IconButton>
          </Flex>
        ))}
      </Flex>

      <Flex gap="2" align="stretch">
        <Box flexGrow="1">
          <TextField.Root
            size="1"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </Box>
        <select
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-6)', width: 90 }}
        >
          <option value="">Class</option>
          {WOW_CLASSES.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <Button size="1" onClick={handleAdd}>+</Button>
      </Flex>
    </Card>
  )
}

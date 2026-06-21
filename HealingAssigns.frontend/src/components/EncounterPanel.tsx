import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Session, Encounter, Assignment } from '../api'
import * as api from '../api'
import { readableColor } from '../lib/color'
import {
  Box,
  Button,
  Card,
  Code,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  Separator,
  Table,
  Text,
  TextField,
} from '@radix-ui/themes'

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
  const selected = (() => {
    const decoded = decodeSlot(value)
    if (!decoded) return null
    const list = roleLists.find((r) => r.id === decoded.roleListId)
    const slot = list?.slots[decoded.position - 1] ?? null
    return slot ? { slot, icon: list?.icon ?? null, position: decoded.position } : null
  })()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="outline" color="gray" size="1" style={{ width: '100%', justifyContent: 'flex-start', fontWeight: 'normal' }}>
          {selected ? (
            <>
              {selected.icon ?? ''}
              {selected.icon ? ' ' : ''}
              #{selected.position}{' '}
              <Text size="1" color="gray" style={{ color: readableColor(selected.slot.classColor) }}>
                ({selected.slot.playerName})
              </Text>
            </>
          ) : (
            <Text color="gray">—</Text>
          )}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {allowNone && (
          <DropdownMenu.Item onSelect={() => onChange('')}>—</DropdownMenu.Item>
        )}
        {roleLists.map((list) => (
          <DropdownMenu.Group key={list.id}>
            <DropdownMenu.Label>
              {list.icon && <>{list.icon} </>}{list.name}
            </DropdownMenu.Label>
            {list.slots.length === 0 && (
              <DropdownMenu.Item disabled>(empty)</DropdownMenu.Item>
            )}
            {list.slots.map((slot, i) => (
              <DropdownMenu.Item
                key={slot.id}
                onSelect={() => onChange(encodeSlot(list.id, i + 1))}
              >
                {list.icon ?? ''}{list.icon ? ' ' : ''}#{i + 1}{' '}
                <Text size="1" color="gray" style={{ color: readableColor(slot.classColor) }}>
                  ({slot.playerName})
                </Text>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Group>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
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
    <Flex direction="column" gap="4">
      <Flex justify="between" align="center">
        <Heading size="4">Encounters</Heading>
        <Button onClick={handleAdd}>+ Encounter</Button>
      </Flex>

      {session.encounters.length === 0 && (
        <Text color="gray" align="center" my="9">
          No encounters yet. Add one to start assigning.
        </Text>
      )}

      {session.encounters.map((encounter) => (
        <EncounterCard
          key={encounter.id}
          encounter={encounter}
          session={session}
          onRemove={() => removeEncounter.mutate(encounter.id)}
        />
      ))}
    </Flex>
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
    <Card>
      <Flex justify="between" align="center" mb="3">
        <Heading size="3">{encounter.name}</Heading>
        <Button variant="ghost" color="red" size="1" onClick={onRemove}>Delete</Button>
      </Flex>

      <Table.Root style={{ tableLayout: 'fixed' }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell width="120px">Symbol</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Desc</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell width="25%">Assignee</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell width="25%">Target</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell width="40px"></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {encounter.assignments.map((a) => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              session={session}
              onUpdate={(updated) => updateAssignment.mutate(updated)}
              onRemove={() => removeAssignment.mutate(a.id)}
            />
          ))}
        </Table.Body>
      </Table.Root>

      {canAdd && (
        <Button
          variant="ghost"
          size="1"
          style={{ width: '100%' }}
          mt="2"
          onClick={() => addAssignment.mutate()}
          disabled={addAssignment.isPending}
        >
          + Add row
        </Button>
      )}

      {encounter.assignments.length > 0 && (
        <MacroOutput text={macroText} />
      )}
    </Card>
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
    <Table.Row>
      <Table.Cell>
        <select
          value={assignment.symbol}
          onChange={(e) => handleChange({ symbol: e.target.value })}
          style={{ padding: '4px 8px', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-6)', verticalAlign: 'middle' }}
        >
          {RAID_SYMBOLS.map((s) => (
            <option key={s.name} value={s.name}>{s.emoji} {s.name}</option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell>
        <TextField.Root
          size="1"
          value={assignment.description ?? ''}
          placeholder="—"
          onChange={(e) => handleChange({ description: e.target.value || null })}
        />
      </Table.Cell>
      <Table.Cell>
        <SlotSelect
          roleLists={session.roleLists}
          value={assigneeValue}
          onChange={(v) => {
            const slot = decodeSlot(v)
            if (slot) handleChange({ assigneeRoleListId: slot.roleListId, assigneePosition: slot.position })
          }}
        />
      </Table.Cell>
      <Table.Cell>
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
      </Table.Cell>
      <Table.Cell align="center">
        <IconButton variant="ghost" color="red" size="1" onClick={onRemove}>
          ×
        </IconButton>
      </Table.Cell>
    </Table.Row>
  )
}

function MacroOutput({ text }: { text: string }) {
  const tooLong = text.length > 255

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
  }

  return (
    <Box mt="3">
      <Separator size="4" mb="3" />
      <Flex justify="between" align="center" mb="2">
        <Text size="1" color="gray">
          Macro ({text.length}/255)
          {tooLong && <Text color="red" ml="1">Too long!</Text>}
        </Text>
        <Button variant="ghost" size="1" onClick={handleCopy}>Copy</Button>
      </Flex>
      <Code size="1" style={{ display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-all', padding: 'var(--space-2)', outline: tooLong ? '2px solid var(--red-9)' : undefined }}>
        {text}
      </Code>
    </Box>
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

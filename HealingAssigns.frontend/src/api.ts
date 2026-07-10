const API_URL = import.meta.env.VITE_API_URL

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`${options?.method ?? 'GET'} ${path} failed: ${res.status}`)
  return res
}

// Types matching backend contracts
export interface SessionSummary {
  id: number
  name: string
  createdAt: string
}

export interface Session {
  id: number
  name: string
  createdAt: string
  roleLists: RoleList[]
  encounters: Encounter[]
}

export interface RoleList {
  id: number
  name: string
  icon: string | null
  sortOrder: number
  slots: RoleSlot[]
}

export interface RoleSlot {
  id: number
  playerName: string
  className: string | null
  classColor: string | null
  sortOrder: number
}

export interface Encounter {
  id: number
  name: string
  sortOrder: number
  assignments: Assignment[]
}

export interface Assignment {
  id: number
  symbolId: number | null
  description: string | null
  assigneeRoleListId: number
  assigneePosition: number
  targetRoleListId: number | null
  targetPosition: number | null
  sortOrder: number
}

export interface UserInfo {
  email: string
  name: string
  picture: string
}

// Auth
export async function getMe(): Promise<UserInfo> {
  const res = await apiFetch('/me')
  return res.json()
}

// Sessions
export async function getSessions(): Promise<SessionSummary[]> {
  const res = await apiFetch('/sessions')
  return res.json()
}

export async function getSession(id: number): Promise<Session> {
  const res = await apiFetch(`/sessions/${id}`)
  return res.json()
}

export async function createSession(name: string): Promise<SessionSummary> {
  const res = await apiFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  return res.json()
}

export async function updateSession(id: number, name: string): Promise<SessionSummary> {
  const res = await apiFetch(`/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
  return res.json()
}

// Role Lists
export async function createRoleList(sessionId: number, name: string, icon: string | null): Promise<RoleList> {
  const res = await apiFetch(`/sessions/${sessionId}/rolelists`, {
    method: 'POST',
    body: JSON.stringify({ name, icon }),
  })
  return res.json()
}

export async function updateRoleList(id: number, name: string, icon: string | null): Promise<RoleList> {
  const res = await apiFetch(`/rolelists/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, icon }),
  })
  return res.json()
}

export async function deleteRoleList(id: number): Promise<void> {
  await apiFetch(`/rolelists/${id}`, { method: 'DELETE' })
}

// Slots
export async function createSlot(
  roleListId: number,
  playerName: string,
  className?: string,
  classColor?: string,
): Promise<RoleSlot> {
  const res = await apiFetch(`/rolelists/${roleListId}/slots`, {
    method: 'POST',
    body: JSON.stringify({ playerName, className: className ?? null, classColor: classColor ?? null }),
  })
  return res.json()
}

export async function deleteSlot(id: number): Promise<void> {
  await apiFetch(`/slots/${id}`, { method: 'DELETE' })
}

export async function reorderSlots(roleListId: number, slotIds: number[]): Promise<void> {
  await apiFetch(`/rolelists/${roleListId}/slots/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ slotIds }),
  })
}

// Encounters
export async function createEncounter(sessionId: number, name: string): Promise<Encounter> {
  const res = await apiFetch(`/sessions/${sessionId}/encounters`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  return res.json()
}

export async function updateEncounter(id: number, name: string): Promise<Encounter> {
  const res = await apiFetch(`/encounters/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
  return res.json()
}

export async function deleteEncounter(id: number): Promise<void> {
  await apiFetch(`/encounters/${id}`, { method: 'DELETE' })
}

// Assignments
export async function createAssignment(
  encounterId: number,
  symbolId: number | null,
  description: string | null,
  assigneeRoleListId: number,
  assigneePosition: number,
  targetRoleListId: number | null,
  targetPosition: number | null,
): Promise<Assignment> {
  const res = await apiFetch(`/encounters/${encounterId}/assignments`, {
    method: 'POST',
    body: JSON.stringify({ symbolId, description, assigneeRoleListId, assigneePosition, targetRoleListId, targetPosition }),
  })
  return res.json()
}

export async function updateAssignment(
  id: number,
  symbolId: number | null,
  description: string | null,
  assigneeRoleListId: number,
  assigneePosition: number,
  targetRoleListId: number | null,
  targetPosition: number | null,
): Promise<Assignment> {
  const res = await apiFetch(`/assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ symbolId, description, assigneeRoleListId, assigneePosition, targetRoleListId, targetPosition }),
  })
  return res.json()
}

export async function deleteAssignment(id: number): Promise<void> {
  await apiFetch(`/assignments/${id}`, { method: 'DELETE' })
}

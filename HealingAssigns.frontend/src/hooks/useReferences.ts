import { useQuery } from '@tanstack/react-query'
import * as api from '../api'
import type { References } from '../api'

export function useReferences() {
  return useQuery({
    queryKey: ['references'],
    queryFn: api.getReferences,
    staleTime: Infinity,
  })
}

export function getClassColor(refs: References | undefined, playerClassId: number | null): string | null {
  if (!playerClassId || !refs) return null
  return refs.playerClasses.find((c) => c.id === playerClassId)?.color ?? null
}

export function getClassName(refs: References | undefined, playerClassId: number | null): string | null {
  if (!playerClassId || !refs) return null
  return refs.playerClasses.find((c) => c.id === playerClassId)?.name ?? null
}


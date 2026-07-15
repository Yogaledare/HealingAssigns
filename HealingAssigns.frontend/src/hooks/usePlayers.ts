import { useQuery } from '@tanstack/react-query'
import * as api from '../api'

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: api.getPlayers,
  })
}

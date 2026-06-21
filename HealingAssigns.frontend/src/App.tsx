import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './auth'
import * as api from './api'
import { RoleListPanel } from './components/RoleListPanel'
import { EncounterPanel } from './components/EncounterPanel'
import { Box, Button, Card, Flex, Heading, Link, Separator, Text } from '@radix-ui/themes'

function App() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: api.getSessions,
  })

  const { data: session } = useQuery({
    queryKey: ['session', selectedSessionId],
    queryFn: () => api.getSession(selectedSessionId!),
    enabled: selectedSessionId !== null,
  })

  const createSession = useMutation({
    mutationFn: (name: string) => api.createSession(name),
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setSelectedSessionId(s.id)
    },
  })

  const handleNewSession = () => {
    const name = prompt('Session name (e.g. "Karazhan Week 3")')
    if (name) createSession.mutate(name)
  }

  if (!user) return null

  if (!selectedSessionId) {
    return (
      <Box maxWidth="560px" mx="auto" p="5">
        <Flex justify="between" align="center" mb="5">
          <Heading size="5">Healing Assigns</Heading>
          <Flex align="center" gap="3">
            <Text size="2" color="gray">{user.email}</Text>
            <Link size="2" href="#" onClick={(e) => { e.preventDefault(); logout() }}>Sign out</Link>
          </Flex>
        </Flex>

        <Button mb="4" onClick={handleNewSession}>New Session</Button>

        <Flex direction="column" gap="2">
          {sessions?.map((s) => (
            <Card key={s.id} asChild>
              <button onClick={() => setSelectedSessionId(s.id)} style={{ cursor: 'pointer', textAlign: 'left' }}>
                <Flex justify="between" align="center">
                  <Text weight="medium">{s.name}</Text>
                  <Text size="2" color="gray">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </Text>
                </Flex>
              </button>
            </Card>
          ))}
          {sessions?.length === 0 && (
            <Text color="gray" align="center" my="9">
              No sessions yet. Create one to get started.
            </Text>
          )}
        </Flex>
      </Box>
    )
  }

  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Flex align="center" justify="between" px="4" py="2">
        <Flex align="center" gap="2">
          <Link size="2" href="#" onClick={(e) => { e.preventDefault(); setSelectedSessionId(null) }}>
            ← Sessions
          </Link>
          <Text size="2" color="gray">/</Text>
          <Text size="2" weight="medium">{session?.name}</Text>
        </Flex>
        <Flex align="center" gap="3">
          <Text size="2" color="gray">{user.email}</Text>
          <Link size="2" href="#" onClick={(e) => { e.preventDefault(); logout() }}>Sign out</Link>
        </Flex>
      </Flex>

      <Separator size="4" />

      {/* Two-panel layout */}
      <Flex flexGrow="1" style={{ overflow: 'hidden' }}>
        <Box flexGrow="1" p="4" style={{ overflowY: 'auto' }}>
          {session && <EncounterPanel session={session} />}
        </Box>

        <Separator orientation="vertical" size="4" />

        <Box width="340px" flexShrink="0" p="4" style={{ overflowY: 'auto' }}>
          {session && <RoleListPanel session={session} />}
        </Box>
      </Flex>
    </Flex>
  )
}

export default App

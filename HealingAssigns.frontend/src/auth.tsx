import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { setAuthToken } from './api'
import { Dialog, Flex, Heading, Text } from '@radix-ui/themes'

interface AuthState {
  token: string
  email: string
  name: string
  picture: string
}

interface AuthContextType {
  user: AuthState | null
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({ user: null, logout: () => {} })

export function useAuth() {
  return useContext(AuthContext)
}

function parseJwt(token: string): Record<string, string> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState | null>(null)

  const handleLogin = useCallback((response: CredentialResponse) => {
    if (!response.credential) return
    const token = response.credential
    const claims = parseJwt(token)
    setAuthToken(token)
    setUser({
      token,
      email: claims.email,
      name: claims.name,
      picture: claims.picture,
    })
  }, [])

  const logout = useCallback(() => {
    setAuthToken(null)
    setUser(null)
  }, [])

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AuthContext.Provider value={{ user, logout }}>
        {children}
      </AuthContext.Provider>
      <Dialog.Root open={!user}>
        <Dialog.Content maxWidth="360px">
          <Flex direction="column" align="center" gap="3">
            <Heading size="5">Healing Assigns</Heading>
            <Text color="gray">Sign in to manage raid assignments</Text>
            <GoogleLogin onSuccess={handleLogin} />
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </GoogleOAuthProvider>
  )
}

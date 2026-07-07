import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { setAuthToken } from './api'

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
      {!user && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="card shadow-lg p-4 text-center">
            <h1 className="h3 mb-2">Healing Assigns</h1>
            <p className="text-secondary mb-4">Sign in to manage raid assignments</p>
            <div className="d-flex justify-content-center">
              <GoogleLogin onSuccess={handleLogin} />
            </div>
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  )
}

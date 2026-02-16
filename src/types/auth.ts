export interface User {
  id: string
  email: string
  created_at: string
  email_confirmed_at?: string
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_at?: number
  user: User
}

export interface AuthContextType {
  // Account authentication
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any | null }>
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signInWithGoogle: () => Promise<{ error: any | null }>
  resetPassword: (email: string) => Promise<{ error: any | null }>
  updatePassword: (password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
}

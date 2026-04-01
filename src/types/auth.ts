export interface School {
  school_id: string
  school_name: string
}

export type AppRole = 'school_admin' | 'registrar' | 'moderator' | 'teacher' | 'student'

export type ProfileStatus = 'pending' | 'approved' | 'rejected'

export interface UserProfile {
  profile_id: string
  first_name: string
  last_name: string
  email: string
  role: AppRole
  status: ProfileStatus
  school_id: string
  school_name: string
}

export interface User {
  id: string
  email: string
  created_at: string
  email_confirmed_at?: string
  user_metadata?: {
    first_name?: string
    last_name?: string
    school_id?: string
    school_name?: string
    role?: AppRole
  }
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
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, metadata: { first_name: string; last_name: string; school_id: string }) => Promise<{ error: any | null }>
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  resetPassword: (email: string) => Promise<{ error: any | null }>
  updatePassword: (password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  getSchools: () => Promise<{ data: School[] | null; error: any | null }>
  refreshProfile: () => Promise<void>
}
export interface School {
  school_id: string
  school_name: string
}

export type AppRole = 'registrar' | 'teacher' | 'cashier' | 'student' | 'super_admin'

export type ProfileStatus = 'pending' | 'approved' | 'rejected'

export interface UserProfile {
  id: string
  role: AppRole
  first_name: string
  last_name: string
  student_type: string | null
  year_level: string | null
  school_id: string | null
  section_id: string | null
  created_at: string
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
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  resetPassword: (email: string) => Promise<{ error: any | null }>
  updatePassword: (password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  refreshProfile: (userId?: string) => Promise<void>
  listSchoolUsers: (role?: AppRole, search?: string) => Promise<{ data: UserProfile[] | null; error: any | null }>
  listUsers: () => Promise<{ data: User[] | null; error: any | null }>
  createUser: (email: string, password: string, metadata: any) => Promise<{ data: any | null; error: any | null }>
  updateUser: (id: string, updates: { email?: string; password?: string; user_metadata?: any }) => Promise<{ data: any | null; error: any | null }>
  updateUserName: (id: string, firstName: string, lastName: string) => Promise<{ data: any | null; error: any | null }>
  updateUserRole: (id: string, role: AppRole) => Promise<{ data: any | null; error: any | null }>
}
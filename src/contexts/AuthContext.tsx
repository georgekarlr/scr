import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { AuthContextType, User, Session, School, UserProfile } from '../types/auth'
import { userService } from '../services/userService'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('AuthProvider rendering')
  // Account authentication state
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    console.log('Fetching initial session...')
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session received:', session)
      
      if (session) {
        setSession(session)
        setUser(session.user)
        refreshProfile(session.user.id)
      } else {
        setSession(null)
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    }).catch(async err => {
      console.error('Error getting session:', err)
      setSession(null)
      setUser(null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth change event:', event, session)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session) {
        refreshProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Account authentication methods
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (data?.user) {
      await refreshProfile(data.user.id)
    }
    return { error }
  }


  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const listSchoolUsers = async (role?: AppRole, search?: string) => {
    return userService.listSchoolUsers(role, search)
  }

  const listUsers = async () => {
    return userService.listUsers()
  }

  const createUser = async (email: string, password: string, metadata: any) => {
    return userService.createUser(email, password, metadata)
  }

  const updateUser = async (id: string, updates: { email?: string; password?: string; user_metadata?: any }) => {
    return userService.updateUser(id, updates)
  }

  const updateUserName = async (id: string, firstName: string, lastName: string) => {
    return userService.updateUserName(id, firstName, lastName)
  }

  const updateUserRole = async (id: string, role: any) => {
    return userService.updateUserRole(id, role)
  }

  const refreshProfile = async (userId?: string) => {
    const currentUserId = userId || user?.id
    if (!currentUserId) {
      console.log('No user ID available for refreshProfile')
      return
    }

    try {
      console.log('Fetching profile for user:', currentUserId)
      const { data, error } = await supabase
        .rpc('get_my_profile')
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return
      }
      
      console.log('Profile fetched successfully:', data)
      setProfile(data as UserProfile)
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      setProfile(null)
    }
  }

  const value = {
    // Account authentication
    user,
    profile,
    session,
    loading,
    signIn,
    resetPassword,
    updatePassword,
    signOut,
    listSchoolUsers,
    listUsers,
    createUser,
    updateUser,
    updateUserName,
    updateUserRole,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
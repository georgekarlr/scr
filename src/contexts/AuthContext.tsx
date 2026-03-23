import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContextType, User, Session, School, UserProfile } from '../types/auth'
import { offlineSync } from '../utils/offlineSync'

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
        // Cache session for offline use
        await offlineSync.cacheData('auth_session_current', session)
        refreshProfile()
      } else {
        // Try to load session from cache if network session is null
        const cachedSession = await offlineSync.getCachedData('auth_session_current')
        if (cachedSession) {
          console.log('Loaded session from cache:', cachedSession)
          setSession(cachedSession)
          setUser(cachedSession.user)
          refreshProfile()
        } else {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      }
      setLoading(false)
    }).catch(async err => {
      console.error('Error getting session:', err)
      
      // Try to load session from cache on error
      const cachedSession = await offlineSync.getCachedData('auth_session_current')
      if (cachedSession) {
        console.log('Recovered session from cache after error:', cachedSession)
        setSession(cachedSession)
        setUser(cachedSession.user)
        refreshProfile()
      } else {
        setSession(null)
        setUser(null)
      }
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
        // Cache session for offline use
        await offlineSync.cacheData('auth_session_current', session)
        refreshProfile()
      } else if (event === 'SIGNED_OUT') {
        // Clear cached session on sign out
        // Note: we don't have a specific clearCache method in offlineSync, 
        // but we can set it to null or use cacheData with null
        await offlineSync.cacheData('auth_session_current', null)
        await offlineSync.cacheData('user_profile_current', null)
        setProfile(null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Account authentication methods
  const signUp = async (email: string, password: string, metadata: { first_name: string; last_name: string; school_id: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,      },
    })
    return { error }
  }

  const signInWithGoogleIdToken = async (token: string, nonce?: string) => {
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token,
      nonce,
    })
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

  const getSchools = async () => {
    const { data, error } = await supabase.rpc('get_schools_for_signup')
    return { data: data as School[] | null, error }
  }

  const refreshProfile = async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_profile')
      
      if (error) {
        console.error('Error fetching profile:', error)
        
        // Try to load from cache if offline or network error
        const cachedProfile = await offlineSync.getCachedData('user_profile_current')
        if (cachedProfile) {
          console.log('Loaded profile from cache:', cachedProfile)
          setProfile(cachedProfile)
          return
        }
        
        setProfile(null)
        return
      }
      
      console.log('Profile fetched:', data)
      let profileData: UserProfile | null = null
      
      // data from get_my_profile is returned as an array of one object
      if (Array.isArray(data) && data.length > 0) {
        profileData = data[0] as UserProfile
      } else if (data && !Array.isArray(data)) {
        profileData = data as UserProfile
      }
      
      if (profileData) {
        setProfile(profileData)
        // Cache the profile for offline use
        await offlineSync.cacheData('user_profile_current', profileData)
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      
      // Try to load from cache on unexpected error
      const cachedProfile = await offlineSync.getCachedData('user_profile_current')
      if (cachedProfile) {
        setProfile(cachedProfile)
      } else {
        setProfile(null)
      }
    }
  }

  const value = {
    // Account authentication
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGoogleIdToken,
    resetPassword,
    updatePassword,
    signOut,
    getSchools,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
import { supabase, supabaseAdmin } from '../lib/supabase'
import { User, UserProfile } from '../types/auth'

export const userService = {
  async listSchoolUsers(role?: string, search?: string) {
    try {
      const { data, error } = await supabase.rpc('get_my_school_users', {
        filter_role: role || null,
        search_term: search || null
      })
      console.log('School users fetched:', data)
      if (error) {
        console.error('Error fetching school users:', error)
        return { data: null, error }
      }
      return { data: data as UserProfile[], error: null }
    } catch (err) {
      console.error('Unexpected error fetching school users:', err)
      return { data: null, error: err }
    }
  },

  async listUsers() {
    if (!supabaseAdmin) {
      console.error('Admin client not initialized - check VITE_SUPABASE_SERVICE_ROLE_KEY')
      return { 
        data: null, 
        error: new Error('Staff management is currently unavailable. Please contact the administrator to configure the Service Role Key.') 
      }
    }
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) return { data: null, error }
    
    // Map to our User type
    const mappedUsers: User[] = users.map(u => ({
      id: u.id,
      email: u.email || '',
      created_at: u.created_at,
      email_confirmed_at: u.email_confirmed_at,
      user_metadata: u.user_metadata as any
    }))
    
    return { data: mappedUsers, error: null }
  },

  async createUser(email: string, password: string, metadata: any) {
    if (!supabaseAdmin) {
      return { 
        data: null, 
        error: new Error('User creation is currently unavailable. Please configure the Service Role Key.') 
      }
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: true
    })
    return { data, error }
  },

  async updateUser(id: string, updates: { email?: string; password?: string; user_metadata?: any }) {
    if (!supabaseAdmin) {
      return { 
        data: null, 
        error: new Error('User update is currently unavailable. Please configure the Service Role Key.') 
      }
    }
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updates)
    return { data, error }
  },

  async updateUserName(id: string, firstName: string, lastName: string) {
    const { data, error } = await supabase.rpc('update_user_name', {
      target_user_id: id,
      new_first_name: firstName,
      new_last_name: lastName
    })
    return { data, error }
  },

  async updateUserRole(id: string, role: string) {
    console.log('Updating user role:', id, role)
    const { data, error } = await supabase.rpc('update_user_role', {
      target_user_id: id,
      new_role: role
    })
    console.log(error)
    return { data, error }
  }
}

import { supabase } from '../lib/supabase'
import { Room } from '../types/room'

export const roomService = {
  async createRoom(name: string, building: string | null = null, maxCapacity: number = 40) {
    try {
      const { data, error } = await supabase.rpc('create_room', {
        p_name: name,
        p_building: building,
        p_max_capacity: maxCapacity
      })
      if (error) return { data: null, error }
      return { data: data[0] as Room, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async getRooms(searchTerm: string | null = null) {
    try {
      const { data, error } = await supabase.rpc('get_rooms', {
        search_term: searchTerm
      })
      if (error) return { data: null, error }
      return { data: data as Room[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async updateRoom(id: string, name: string, building: string | null = null, maxCapacity: number = 40) {
    try {
      const { data, error } = await supabase.rpc('update_room', {
        p_room_id: id,
        p_name: name,
        p_building: building,
        p_max_capacity: maxCapacity
      })
      if (error) return { data: null, error }
      return { data: data[0] as Room, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async deleteRoom(id: string) {
    try {
      const { data, error } = await supabase.rpc('delete_room', {
        p_room_id: id
      })
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}

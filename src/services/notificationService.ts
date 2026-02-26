import { supabase } from '../lib/supabase';
import { GetNotificationsResponse } from '../types/notification';

export const notificationService = {
  /**
   * Get unread notifications count for the current user
   */
  async getUnreadCount(): Promise<number> {
    const { data, error } = await supabase.rpc('c_get_unread_count');

    if (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }

    // RPC returns int; ensure number type
    return (data as number) ?? 0;
  },

  /**
   * Get notifications list (paginated)
   */
  async getNotifications(limit_count: number = 20, offset_count: number = 0): Promise<GetNotificationsResponse> {
    const { data, error } = await supabase.rpc('c_get_notifications', {
      limit_count,
      offset_count,
    });

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return (data as GetNotificationsResponse) ?? [];
  },

  /**
   * Mark one notification as read. If no id provided, mark all as read.
   */
  async markRead(notification_id?: string): Promise<void> {
    const { error } = await supabase.rpc('c_mark_notification_read', {
      notification_id: notification_id ?? null,
    });

    if (error) {
      console.error('Error marking notification(s) read:', error);
      throw error;
    }
  },
  /**
   * Mark a tab (notifications or messages) as checked
   */
  async markTabChecked(tab_name: 'notifications' | 'messages'): Promise<void> {
    const { error } = await supabase.rpc('c_mark_tab_checked', {
      tab_name,
    });

    if (error) {
      console.error(`Error marking ${tab_name} tab checked:`, error);
      throw error;
    }
  },
};

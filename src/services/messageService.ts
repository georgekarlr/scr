import { supabase } from '../lib/supabase';
import { Conversation, ChatMessage, StartChatResponse, SendMessageResponse } from '../types/message';

export const messageService = {
  /**
   * Fetches the total number of unread messages for the current user.
   */
  async getUnreadMessagesCount(): Promise<number> {
    const { data, error } = await supabase.rpc('c_get_unread_messages_count');

    if (error) {
      console.error('Error fetching unread messages count:', error);
      throw error;
    }

    return (data || 0) as number;
  },

  /**
   * Fetches the list of conversations for the current user.
   * @param limit_count Maximum number of conversations to return.
   * @param offset_count Number of conversations to skip.
   */
  async getConversations(
    limit_count: number = 20,
    offset_count: number = 0
  ): Promise<Conversation[]> {
    const { data, error } = await supabase.rpc('c_get_conversations', {
      limit_count,
      offset_count,
    });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    return (data || []) as Conversation[];
  },

  /**
   * Fetches messages for a specific conversation.
   * @param target_conversation_id The ID of the conversation.
   * @param limit_count Maximum number of messages to return.
   * @param offset_count Number of messages to skip.
   */
  async getMessages(
    target_conversation_id: string,
    limit_count: number = 50,
    offset_count: number = 0
  ): Promise<ChatMessage[]> {
    const { data, error } = await supabase.rpc('c_get_messages', {
      target_conversation_id,
      limit_count,
      offset_count,
    });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return (data || []) as ChatMessage[];
  },

  /**
   * Starts a chat with another user or returns the existing one.
   * @param target_user_id The ID of the user to start a chat with.
   */
  async startChat(target_user_id: string): Promise<StartChatResponse> {
    const { data, error } = await supabase.rpc('c_start_chat', {
      target_user_id,
    });

    if (error) {
      console.error('Error starting chat:', error);
      throw error;
    }

    return data as StartChatResponse;
  },

  /**
   * Sends a message to a conversation.
   */
  async sendMessage(
    p_conversation_id: string,
    p_content: string,
    p_shared_set_id?: string
  ): Promise<SendMessageResponse> {
    const { data, error } = await supabase.rpc('c_send_message', {
      p_conversation_id,
      p_content,
      p_shared_set_id,
    });

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return data as SendMessageResponse;
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

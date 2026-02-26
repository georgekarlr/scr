import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ConversationList from '../components/messages/ConversationList';
import NewMessageModal from '../components/messages/NewMessageModal';
import { useToast } from '../contexts/ToastContext';
import { messageService } from '../services/messageService';
import { supabase } from '../lib/supabase';
import { SearchUserResult } from '../types/study';
import { Conversation } from '../types/message';

const MessagesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [initialConvId, setInitialConvId] = useState<string | null>(location.state?.conversationId || null);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    const markMessagesChecked = async () => {
      try {
        await messageService.markTabChecked('messages');
      } catch (error) {
        console.error('Failed to mark messages as checked:', error);
      }
    };
    markMessagesChecked();
  }, []);

  const handleSelectUser = async (user: SearchUserResult) => {
    try {
      setIsNewMessageModalOpen(false);
      const res = await messageService.startChat(user.id);
      
      // Update initialConvId to trigger selection in ConversationList
      setInitialConvId(res.conversation_id);
      
      // Increment refreshKey to force ConversationList to reload conversations
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to start chat:', error);
      showToast('Failed to start chat', 'error');
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    navigate(`/messages/${conversation.id}`);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] lg:h-screen overflow-hidden bg-white lg:rounded-3xl lg:border lg:border-gray-100 lg:shadow-sm">
      {/* Sidebar - Conversation List */}
      <div className="w-full flex-shrink-0">
        <ConversationList
          onSelectConversation={handleSelectConversation}
          activeConversationId={null}
          initialConversationId={initialConvId}
          onNewMessage={() => setIsNewMessageModalOpen(true)}
          refreshKey={refreshKey}
        />
      </div>

      <NewMessageModal
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
};

export default MessagesPage;

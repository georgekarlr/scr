import React, { useEffect, useState } from 'react';
import { Search, MessageSquarePlus } from 'lucide-react';
import { messageService } from '../../services/messageService';
import { Conversation } from '../../types/message';
import ConversationItem from './ConversationItem';
import { useToast } from '../../contexts/ToastContext';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  activeConversationId: string | null;
  initialConversationId?: string | null;
  onNewMessage?: () => void;
  refreshKey?: number;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  activeConversationId,
  initialConversationId,
  onNewMessage,
  refreshKey = 0,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchConversations = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const data = await messageService.getConversations();
        setConversations(data);
        
        // Handle initial conversation selection
        if (initialConversationId && data.length > 0) {
          const initial = data.find(c => c.id === initialConversationId);
          if (initial && window.innerWidth >= 768) {
            onSelectConversation(initial);
          }
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        if (showLoading) showToast('Failed to load conversations', 'error');
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchConversations();

    // Set up polling interval to refresh data every 2 seconds
    const interval = setInterval(() => {
      fetchConversations(false);
    }, 2000);

    return () => clearInterval(interval);
  }, [showToast, initialConversationId, refreshKey, onSelectConversation]);

  const filteredConversations = conversations.filter((c) =>
    c.other_user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white lg:border-r border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <button 
            onClick={onNewMessage}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="New Message"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center animate-pulse">
                <div className="h-12 w-12 bg-gray-100 rounded-full" />
                <div className="ml-4 flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={activeConversationId === conversation.id}
              onClick={() => onSelectConversation(conversation)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Search className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-bold">No conversations found</h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery ? "Try searching for someone else" : "Start a new chat with your study buddies!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;

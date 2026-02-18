import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Loader2, MessageSquare } from 'lucide-react';
import { Conversation, ChatMessage } from '../types/message';
import { messageService } from '../services/messageService';
import MessageBubble from '../components/messages/MessageBubble';
import { useToast } from '../contexts/ToastContext';

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();

      // Set up polling interval to refresh data every 2 seconds
      const interval = setInterval(() => {
        fetchConversation(false);
        fetchMessages(false);
      }, 2000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const conversations = await messageService.getConversations();
      const found = conversations.find(c => c.id === conversationId);
      if (found) {
        setConversation(found);
      } else if (showLoading) {
        showToast('Conversation not found', 'error');
        navigate('/messages');
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchMessages = async (showLoading = true) => {
    if (!conversationId) return;
    try {
      if (showLoading) setLoadingMessages(true);
      const data = await messageService.getMessages(conversationId);
      setMessages([...data].reverse());
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      if (showLoading) showToast('Failed to load messages', 'error');
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !newMessage.trim() || sending) return;

    try {
      setSending(true);
      const sentMessage = await messageService.sendMessage(conversationId, newMessage.trim());
      setNewMessage('');
      
      const newChatMessage: ChatMessage = {
        id: sentMessage.id,
        content: sentMessage.content,
        created_at: sentMessage.created_at,
        sender_id: sentMessage.sender.id,
        is_mine: sentMessage.is_mine,
        shared_set: null
      };
      
      setMessages(prev => [...prev, newChatMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading && !conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
        <p className="text-sm text-gray-500 font-medium">Loading chat...</p>
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50/30 overflow-hidden relative lg:h-screen">
      {/* Chat Header */}
      <div className="sticky top-0 z-20 p-4 border-b border-gray-100 bg-white/80 backdrop-blur-md flex items-center shrink-0 shadow-sm">
        <button
          onClick={() => navigate('/messages')}
          className="p-2 mr-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        {conversation.other_user.avatar_url ? (
          <img
            src={conversation.other_user.avatar_url}
            alt={conversation.other_user.username}
            className="h-10 w-10 rounded-full object-cover mr-3 flex-shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3 flex-shrink-0">
            {conversation.other_user.username[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{conversation.other_user.username}</h3>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${conversation.other_user.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
            <p className={`text-xs font-medium ${conversation.other_user.is_online ? 'text-green-500' : 'text-gray-400'}`}>
              {conversation.other_user.is_online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
        {loadingMessages ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
            <p className="text-sm text-gray-500 font-medium">Loading messages...</p>
          </div>
        ) : messages.length > 0 ? (
          <>
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
              <MessageSquare className="h-8 w-8 text-blue-100" />
            </div>
            <h3 className="text-gray-900 font-bold">No messages yet</h3>
            <p className="text-sm text-gray-500">Send a message to start the conversation!</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 z-20 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 shrink-0">
        <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;

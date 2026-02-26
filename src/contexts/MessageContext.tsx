import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { messageService } from '../services/messageService';
import { useAuth } from './AuthContext';

interface MessageContextType {
  unreadMessagesCount: number;
  refreshUnreadMessagesCount: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const { user } = useAuth();

  const refreshUnreadMessagesCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await messageService.getUnreadMessagesCount();
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Failed to refresh unread messages count:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshUnreadMessagesCount();
      const interval = setInterval(refreshUnreadMessagesCount, 60000);
      return () => clearInterval(interval);
    } else {
      setUnreadMessagesCount(0);
    }
  }, [user, refreshUnreadMessagesCount]);

  return (
    <MessageContext.Provider value={{ unreadMessagesCount, refreshUnreadMessagesCount }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

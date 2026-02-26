import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Clock, MessageSquare, Heart, UserPlus, Trash2, CheckCheck } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationItem } from '../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../contexts/ToastContext';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { markAsRead, refreshUnreadCount } = useNotifications();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(50);
      setNotifications(data);
      
      // Mark notifications tab as checked
      await notificationService.markTabChecked('notifications');
      
      // Also refresh the global count when we open the page
      refreshUnreadCount();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      showToast('Failed to mark notification as read', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      showToast('Failed to mark all as read', 'error');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">Stay updated with your latest activity</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse flex items-center p-4 bg-white rounded-xl border border-gray-100">
              <div className="h-10 w-10 bg-gray-200 rounded-full mr-4" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start p-4 bg-white rounded-2xl border transition-all hover:border-blue-100 cursor-pointer ${
                notification.is_read ? 'border-gray-100' : 'border-blue-200 shadow-sm bg-blue-50/30'
              }`}
              onClick={() => {
                if (!notification.is_read) handleMarkAsRead(notification.id);
                if (notification.type === 'message' && notification.entity_id) {
                  if (window.innerWidth < 768) {
                    navigate(`/messages/${notification.entity_id}`);
                  } else {
                    navigate('/messages', { state: { conversationId: notification.entity_id } });
                  }
                }
              }}
            >
              <div className="relative mr-4">
                {notification.sender?.avatar_url ? (
                  <img
                    src={notification.sender.avatar_url}
                    alt={notification.sender.username || 'User'}
                    className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                    {(notification.sender?.username?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                  {getIcon(notification.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                  {notification.message}
                </p>
                <div className="flex items-center mt-1 space-x-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {!notification.is_read && (
                <div className="ml-3 self-center">
                  <div className="h-2.5 w-2.5 bg-blue-600 rounded-full shadow-sm shadow-blue-200" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-50 mb-4">
            <Bell className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No notifications yet</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
            We'll let you know when something important happens!
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

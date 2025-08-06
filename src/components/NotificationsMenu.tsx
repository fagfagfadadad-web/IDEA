import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Clock, MessageSquare, AlertTriangle, DollarSign, FileText, X } from 'lucide-react';
import { Button } from 'components';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../hooks/useNotifications';
import { useToast } from '../context/ToastContext';

interface NotificationsDropdownProps {
  onClose?: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ onClose }) => {
  const { data: notifications, isLoading, refetch } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
      case 'proposal_message':
        return <MessageSquare size={16} className="text-blue-500" />;
      case 'order_created':
      case 'order_completed':
        return <FileText size={16} className="text-green-500" />;
      case 'payment_released':
        return <DollarSign size={16} className="text-green-500" />;
      case 'dispute_created':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'proposal_accepted':
        return <CheckCheck size={16} className="text-green-500" />;
      case 'work_delivered':
        return <Check size={16} className="text-blue-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50';
    
    switch (type) {
      case 'message':
      case 'proposal_message':
        return 'bg-blue-50 border-l-4 border-blue-500';
      case 'order_created':
      case 'order_completed':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'payment_released':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'dispute_created':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'proposal_accepted':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'work_delivered':
        return 'bg-blue-50 border-l-4 border-blue-500';
      default:
        return 'bg-indigo-50 border-l-4 border-indigo-500';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      console.log('Notification clicked:', notification.id, 'Read status:', notification.read);
      
      // Mark as read first if it's unread
      if (!notification.read) {
        console.log('Marking notification as read...');
        await markAsRead.mutateAsync(notification.id);
        showSuccessToast('Notification marked as read');
        refetch(); // Refresh notifications
      }
      
      // Then navigate
      if (notification.type === 'message' && notification.data?.order_id) {
        window.location.href = `/orders/${notification.data.order_id}`;
      } else if (notification.type === 'proposal_message' && notification.data?.proposal_id) {
        window.location.href = `/proposals/${notification.data.proposal_id}`;
      } else if (notification.type === 'proposal_accepted' && notification.data?.proposal_id) {
        window.location.href = `/proposals/${notification.data.proposal_id}`;
      } else if (notification.data?.order_id) {
        window.location.href = `/orders/${notification.data.order_id}`;
      }
      
      if (onClose) onClose();
    } catch (error) {
      console.error('Error handling notification click:', error);
      showErrorToast('Error processing notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read...');
      
      if (unreadCount === 0) {
        showSuccessToast('All notifications are already read');
        return;
      }

      await markAllAsRead.mutateAsync();
      refetch(); // Refresh notifications
      showSuccessToast('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showErrorToast('Error marking notifications as read');
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Loading notifications...</p>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">No notifications</h3>
        <p className="text-gray-600 text-sm">
          You're all caught up! New notifications will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      {/* Header with Mark All as Read */}
      {unreadCount > 0 && (
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-pink-50">
          <Button
            onClick={handleMarkAllAsRead}
            className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
            disabled={markAllAsRead.isLoading}
          >
            <CheckCheck size={16} />
            {markAllAsRead.isLoading ? 'Marking...' : `Mark all ${unreadCount} as read`}
          </Button>
        </div>
      )}
      
      {/* Notifications list */}
      <div className="divide-y divide-gray-200">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
              getNotificationBgColor(notification.type, notification.read)
            } ${!notification.read ? 'hover:shadow-sm' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm font-medium ${
                    !notification.read ? 'text-gray-900' : 'text-gray-700'
                  } line-clamp-1`}>
                    {notification.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.read && (
                      <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"></div>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                </div>
                
                <p className={`text-sm mt-1 ${
                  !notification.read ? 'text-gray-700' : 'text-gray-600'
                } line-clamp-2`}>
                  {notification.content}
                </p>
                
                {!notification.read && (
                  <div className="mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(notification);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <Check size={12} />
                      Mark as read
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

// Keep the old component for backward compatibility
export const NotificationsMenu: React.FC = () => {
  return <NotificationsDropdown />;
};
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from 'components';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../hooks/useNotifications';
import { useToast } from '../context/ToastContext';

export const NotificationsMenu = () => {
  const { data: notifications, isLoading, refetch } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const { success, error: showError } = useToast();
  const [showMenu, setShowMenu] = useState(false);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleNotificationClick = async (notification: any) => {
    try {
      console.log('Notification clicked:', notification.id, 'Read status:', notification.read);
      
      // Mark as read first if it's unread
      if (!notification.read) {
        console.log('Marking notification as read...');
        await markAsRead.mutateAsync(notification.id);
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
      
      setShowMenu(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
      showError('Error processing notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read...');
      
      if (unreadCount === 0) {
        showError('All notifications are already read');
        return;
      }

      await markAllAsRead.mutateAsync();
      refetch(); // Refresh notifications
      success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showError('Error marking notifications as read');
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowMenu(!showMenu)}
        className="relative bg-transparent border-none text-gray-400 hover:text-blue-400 p-2"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20 max-h-96 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading notifications...</p>
              </div>
            ) : notifications?.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-400">No notifications</p>
              </div>
            ) : (
              <>
                {/* Header with Mark All as Read button */}
                {unreadCount > 0 && (
                  <div className="p-3 border-b border-gray-600">
                    <Button
                      onClick={handleMarkAllAsRead}
                      className="w-full bg-transparent border-none text-blue-400 hover:text-blue-300 text-sm py-2"
                      disabled={markAllAsRead.isLoading}
                    >
                      {markAllAsRead.isLoading ? 'Marking...' : `Mark all as read (${unreadCount})`}
                    </Button>
                  </div>
                )}
                
                {/* Notifications list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications?.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                        !notification.read ? 'bg-gray-750 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm flex-1 ${
                            !notification.read ? 'text-white font-medium' : 'text-gray-300'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
import { useState, useEffect } from 'react';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  data?: any;
  read: boolean;
  created_at: string;
};

export const useNotifications = (userId?: string) => {
  const [data, setData] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isLoggedIn = useGetIsLoggedIn();

  useEffect(() => {
    fetchNotifications();
  }, [userId, isLoggedIn]);

  // Real-time subscription for notifications
  useEffect(() => {
    if (!userId || !isLoggedIn) {
      console.log('🔔 useNotifications: Skipping subscription setup - no userId or not logged in');
      return;
    }

    console.log('🔔 Setting up real-time notifications subscription for user:', userId);
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 Real-time notification update:', payload);
          // Immediate refresh when real-time update occurs
          setTimeout(() => {
            fetchNotifications();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 Cleaning up notifications subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, isLoggedIn]);
  
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      if (!isLoggedIn || !userId) {
        console.log('🔔 useNotifications: Not logged in or no userId, clearing notifications');
        setData([]);
        setIsLoading(false);
        return;
      }

      console.log('🔔 useNotifications: Fetching notifications for user:', userId);

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('🔔 useNotifications: Fetched notifications:', {
        total: notifications?.length || 0,
        unread: notifications?.filter(n => !n.read).length || 0,
        latestNotification: notifications?.[0]?.title || 'None'
      });

      setData(notifications || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchNotifications
  };
};

export const useMarkNotificationAsRead = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (notificationId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return notificationId;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutateAsync,
    isLoading
  };
};

export const useMarkAllNotificationsAsRead = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const mutateAsync = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        throw new Error('Please log in first');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      return [];
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutateAsync,
    isLoading
  };
};

export const useSendEmailNotification = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = (notificationId: string) => {
    setIsLoading(true);
    // This would be implemented with an edge function or external service
    setTimeout(() => {
      console.log('Email notification would be sent for:', notificationId);
      setIsLoading(false);
    }, 1000);
  };

  return {
    mutate,
    isLoading
  };
};

export const useProcessNewNotifications = () => {
  const { data: notifications } = useNotifications();
  const sendEmail = useSendEmailNotification();
  
  useEffect(() => {
    if (!notifications) return;
    
    // Find new unread notifications that need email sending
    const newNotifications = notifications.filter(notification => 
      !notification.read && 
      notification.data?.recipient_email && 
      notification.data?.send_email && 
      !notification.data?.email_sent
    );
    
    if (newNotifications.length > 0) {
      console.log('Found new notifications requiring emails:', newNotifications.length);
      
      // Process each notification
      newNotifications.forEach(notification => {
        sendEmail.mutate(notification.id);
      });
    }
  }, [notifications, sendEmail]);
  
  return { processingEmails: sendEmail.isLoading };
};
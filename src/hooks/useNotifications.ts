import { useState, useEffect } from 'react';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

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

export const useNotifications = () => {
  const [data, setData] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();

  useEffect(() => {
    fetchNotifications();
  }, [address, isLoggedIn]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      if (!isLoggedIn || !address) {
        setData([]);
        setIsLoading(false);
        return;
      }

      // Get current user by wallet address
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .maybeSingle();

      if (!user) {
        console.log('User profile not found, no notifications available');
        setData([]);
        setError(null);
        return;
      }

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
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
  const { success, error: showError } = useToast();

  const mutateAsync = async (notificationId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      success('Notification marked as read');
      return notificationId;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showError('Failed to mark notification as read.');
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
  const { address } = useGetAccount();
  const { success, error: showError } = useToast();

  const mutateAsync = async () => {
    setIsLoading(true);
    try {
      if (!address) {
        throw new Error('Please connect your wallet first');
      }

      // Get current user by wallet address
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .maybeSingle();

      if (!user) {
        throw new Error('User not found. Please complete your profile first.');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      success('All notifications marked as read');
      return [];
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showError('Failed to mark all notifications as read.');
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
import { useState, useEffect } from 'react';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { supabase } from '../lib/supabase';

import { useAuth } from '../context/AuthContext';
import { sendNotification } from './useOrders';

export type Message = {
  id: string;
  content: string;
  created_at: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  sender: {
    id: string;
    username: string;
    avatar_url?: string;
  };
};

export const useMessages = (orderId?: string) => {
  const [data, setData] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();

  useEffect(() => {
    if (!orderId || !isLoggedIn || !user) {
      setData([]);
      setIsLoading(false);
      return;
    }

    fetchMessages();
  }, [orderId, isLoggedIn, user]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setData(messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchMessages
  };
};

export const useSendMessage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const mutateAsync = async ({
    orderId,
    sellerId,
    gigId,
    content,
    attachments = [],
  }: {
    orderId: string;
    sellerId?: string;
    gigId?: string;
    content: string;
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
  }) => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        throw new Error('Please connect your wallet first');
      }

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          order_id: orderId,
          sender_id: user.id,
          content,
          attachments: attachments || [],
          seller_id: sellerId,
          gig_id: gigId
        })
        .select(`
          *,
          sender:users!messages_sender_id_fkey(
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .single();

      if (error) throw error;

      // Send email notification to the recipient if they have email notifications enabled
      try {
        // Get order details to determine the recipient
        const { data: orderDetails } = await supabase
          .from('orders')
          .select(`
            id,
            client_id,
            gig:gigs(
              id,
              title,
              provider_id,
              provider:users(id, username, email, email_notifications_enabled)
            ),
            client:users!orders_client_id_fkey(id, username, email, email_notifications_enabled)
          `)
          .eq('id', orderId)
          .single();

        if (orderDetails) {
          // Determine recipient (if sender is client, notify provider and vice versa)
          const isClientSender = orderDetails.client_id === user.id;
          const recipient = isClientSender ? 
            (Array.isArray(orderDetails.gig) ? (orderDetails.gig as any)[0]?.provider : (orderDetails.gig as any)?.provider) : 
            orderDetails.client;
          
          if (recipient?.email && recipient?.email_notifications_enabled) {
            // Prepare structured data for email template
            const templateData = {
              senderName: user.username || user.full_name || 'A user',
              gigTitle: (Array.isArray(orderDetails.gig) ? (orderDetails.gig as any)[0]?.title : (orderDetails.gig as any)?.title) || 'Custom Project',
              messagePreview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
              orderId: orderId
            };
            
            await sendNotification({
              user_id: recipient.id,
              type: 'message_received',
              title: `New message - ${templateData.gigTitle}`,
              content: `You have received a new message: ${templateData.messagePreview}`,
              data: templateData,
              sendEmail: true,
              userEmail: recipient.email
            });
          } else {
          }
        }
      } catch (notificationError) {
        console.error('Error sending message notification:', notificationError);
        // Don't fail the message sending if notification fails
      }

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
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
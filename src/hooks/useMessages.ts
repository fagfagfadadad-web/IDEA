import { useState, useEffect } from 'react';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { supabase } from '../lib/supabase';

import { useAuth } from '../context/AuthContext';

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
            avatar_url
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
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

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
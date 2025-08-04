import { useState, useEffect } from 'react';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { supabase } from '../lib/supabase';

export const sendNotification = async ({ user_id, type, title, content, data }: {
  user_id: string;
  type: string;
  title: string;
  content: string;
  data?: any;
}) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        content,
        data: data || {},
        read: false
      });

    if (error) throw error;
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const useOrders = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();

  useEffect(() => {
    fetchOrders();
  }, [address, isLoggedIn]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      if (!isLoggedIn || !address) {
        setData([]);
        return;
      }

      // Get current user by wallet address
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .maybeSingle();

      if (!user) {
        setData([]);
        return;
      }

      // First, get gig IDs where user is provider
      const { data: userGigs } = await supabase
        .from('gigs')
        .select('id')
        .eq('provider_id', user.id);

      const gigIds = userGigs?.map(gig => gig.id) || [];

      // Fetch orders for current user (as client or provider)
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          gig:gigs(
            title,
            provider:users!gigs_provider_id_fkey(username, avatar_url)
          ),
          client:users!orders_client_id_fkey(username, avatar_url),
          reviews(*)
        `)
        .or(`client_id.eq.${user.id}${gigIds.length > 0 ? `,gig_id.in.(${gigIds.join(',')})` : ''}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchOrders
  };
};

export const useCreateOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useGetAccount();

  const mutateAsync = async (orderData: { 
    gig_id: string; 
    amount: number;
    requirements?: any;
    deadline?: string;
    payment_token?: string;
  }) => {
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

      // Get gig details for provider address
      const { data: gig } = await supabase
        .from('gigs')
        .select('provider:users!gigs_provider_id_fkey(wallet_address)')
        .eq('id', orderData.gig_id)
        .single();

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          gig_id: orderData.gig_id,
          client_id: user.id,
          amount: orderData.amount,
          requirements: orderData.requirements || {},
          deadline: orderData.deadline,
          payment_token: orderData.payment_token || 'EGLD',
          status: 'pending_approval',
          payment_status: 'pending',
          work_status: 'pending',
          client_address: address,
          provider_address: gig?.provider[0]?.wallet_address || ''
        })
        .select(`
          *,
          gig:gigs(title),
          client:users!orders_client_id_fkey(username, email)
        `)
        .single();

      if (error) throw error;

      console.log('Order created successfully:', order);
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
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

export const useOrderById = (orderId: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        
        const { data: order, error } = await supabase
          .from('orders')
          .select(`
            *,
            gig:gigs(
              title,
              provider:users!gigs_provider_id_fkey(id, username, avatar_url, full_name)
            ),
            client:users!orders_client_id_fkey(id, username, avatar_url, full_name),
            reviews(*)
          `)
          .eq('id', orderId)
          .single();

        if (error) throw error;

        setData(order);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return {
    data,
    isLoading,
    error
  };
};

export const useUpdateOrderStatus = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async ({ orderId, status, amount }: { orderId: string; status: string; amount?: number }) => {
    setIsLoading(true);
    try {
      const updateData: any = { 
        status,
        status_updated_at: new Date().toISOString()
      };
      
      if (amount !== undefined) {
        updateData.amount = amount;
      }

      const { data: order, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      console.log('Order status updated successfully:', order);
      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
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